-- =============================================
-- Allow providers to reopen accepted requests safely
-- =============================================

CREATE OR REPLACE FUNCTION public.provider_reopen_request(
  p_request_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_id UUID := auth.uid();
  v_request_id UUID;
BEGIN
  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = v_provider_id
      AND u.role = 'provider'
  ) THEN
    RAISE EXCEPTION 'Only providers can reopen requests';
  END IF;

  UPDATE public.service_requests sr
  SET provider_id = NULL,
      status = 'pending'
  WHERE sr.id = p_request_id
    AND sr.provider_id = v_provider_id
    AND sr.status = 'accepted'
  RETURNING sr.id INTO v_request_id;

  IF v_request_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_message IS NOT NULL AND length(trim(p_message)) > 0 THEN
    INSERT INTO public.messages (request_id, sender_id, content)
    VALUES (v_request_id, v_provider_id, p_message);
  END IF;

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.provider_reopen_request(UUID, TEXT) TO authenticated;
