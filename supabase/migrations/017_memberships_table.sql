-- =============================================
-- Services 360 - Subscription billing metadata
-- =============================================
-- Extends the existing subscriptions model with payment-provider data.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN ('hotmart', 'stripe', 'manual')),
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_external_id
  ON public.subscriptions(provider, external_id)
  WHERE external_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_subscriptions_updated_at();

DROP FUNCTION IF EXISTS public.activate_pro_membership(UUID, UUID, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.activate_pro_membership(
  p_user_id UUID,
  p_plan_id UUID,
  p_provider TEXT,
  p_external_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_subscription_id UUID;
  v_end_date TIMESTAMPTZ;
  v_plan_name TEXT;
BEGIN
  IF p_user_id IS NULL OR p_plan_id IS NULL OR p_provider IS NULL OR p_external_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Missing required parameters');
  END IF;

  SELECT au.email, p.name
  INTO v_user_email, v_plan_name
  FROM auth.users au
  JOIN public.plans p ON p.id = p_plan_id
  WHERE au.id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not found');
  END IF;

  UPDATE public.subscriptions
  SET status = 'cancelled',
      end_date = COALESCE(end_date, now()),
      updated_at = now()
  WHERE user_id = p_user_id
    AND status IN ('active', 'trial');

  v_end_date := CASE
    WHEN v_plan_name = 'FREE' THEN now() + interval '30 days'
    ELSE now() + interval '1 month'
  END;

  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    end_date,
    provider,
    external_id,
    metadata,
    updated_at
  ) VALUES (
    p_user_id,
    p_plan_id,
    'active',
    now(),
    v_end_date,
    p_provider,
    p_external_id,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  )
  RETURNING id INTO v_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pro membership activated',
    'subscription_id', v_subscription_id,
    'email', v_user_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_pro_membership(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;
