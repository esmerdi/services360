-- =============================================
-- 014 - Enforce FREE plan request quota by 30-day cycle
-- FREE: 10 requests per 30-day period (no expiration)
-- PRO: unlimited requests
-- =============================================

CREATE OR REPLACE FUNCTION public.get_provider_request_quota(p_provider_id UUID)
RETURNS TABLE (
  plan_name TEXT,
  max_requests INT,
  request_window_days INT,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  used_requests INT,
  remaining_requests INT,
  is_limited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name TEXT;
  v_plan_features JSONB;
  v_max_requests INT;
  v_request_window_days INT;
  v_subscription_start TIMESTAMPTZ;
  v_cycle_number INT;
BEGIN
  SELECT p.name, p.features, COALESCE(s.start_date, NOW())
  INTO v_plan_name, v_plan_features, v_subscription_start
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = p_provider_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_plan_name IS NULL THEN
    SELECT p.name, p.features, NOW()
    INTO v_plan_name, v_plan_features, v_subscription_start
    FROM public.plans p
    WHERE p.name = 'FREE'
    LIMIT 1;
  END IF;

  IF v_plan_name IS NULL THEN
    RAISE EXCEPTION 'No plan configuration found for provider %', p_provider_id;
  END IF;

  v_max_requests := COALESCE((v_plan_features ->> 'max_requests_per_month')::INT, -1);
  v_request_window_days := GREATEST(COALESCE((v_plan_features ->> 'request_window_days')::INT, 30), 1);

  IF v_max_requests = -1 THEN
    RETURN QUERY
    SELECT
      v_plan_name,
      v_max_requests,
      v_request_window_days,
      NULL::TIMESTAMPTZ,
      NULL::TIMESTAMPTZ,
      0,
      -1,
      FALSE;
    RETURN;
  END IF;

  v_cycle_number := FLOOR(EXTRACT(EPOCH FROM (NOW() - v_subscription_start)) / (v_request_window_days * 86400))::INT;
  IF v_cycle_number < 0 THEN
    v_cycle_number := 0;
  END IF;

  window_start := v_subscription_start + make_interval(days => v_cycle_number * v_request_window_days);
  window_end := window_start + make_interval(days => v_request_window_days);

  SELECT COUNT(*)::INT
  INTO used_requests
  FROM public.service_requests sr
  WHERE sr.provider_id = p_provider_id
    AND sr.status IN ('accepted', 'in_progress', 'completed', 'cancelled')
    AND sr.created_at >= window_start
    AND sr.created_at < window_end;

  plan_name := v_plan_name;
  max_requests := v_max_requests;
  request_window_days := v_request_window_days;
  remaining_requests := GREATEST(v_max_requests - used_requests, 0);
  is_limited := TRUE;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_provider_request_quota(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_provider_request_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quota_record RECORD;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.provider_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.provider_id IS NOT NULL AND OLD.provider_id = NEW.provider_id THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('accepted', 'in_progress', 'completed', 'cancelled') THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO quota_record
  FROM public.get_provider_request_quota(NEW.provider_id);

  IF quota_record.max_requests <> -1
     AND quota_record.used_requests >= quota_record.max_requests THEN
    RAISE EXCEPTION
      'FREE plan request quota reached for this 30-day period. Upgrade to PRO or wait until %.',
      to_char(quota_record.window_end, 'YYYY-MM-DD HH24:MI:SS TZ')
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_provider_request_quota ON public.service_requests;
CREATE TRIGGER trg_enforce_provider_request_quota
  BEFORE UPDATE OF provider_id, status ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_provider_request_quota();
