-- =============================================
-- Services 360 - Payment Webhooks Log Table
-- =============================================
-- Audit trail for all payment provider webhooks (Hotmart, Stripe, etc.)
-- Essential for replay detection and debugging failed payments.

CREATE TABLE public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('hotmart', 'stripe')),
  event_type TEXT NOT NULL, -- hotmart: 'purchase', 'chargeback', etc. | stripe: 'charge.succeeded', etc.
  external_id TEXT NOT NULL, -- Hotmart transactionId or Stripe eventId
  user_email TEXT, -- Extracted from webhook payload for auditing
  payload JSONB NOT NULL, -- Full webhook payload for debugging
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_webhook_per_provider UNIQUE (provider, external_id)
);

CREATE INDEX idx_payment_webhooks_provider ON public.payment_webhooks(provider);
CREATE INDEX idx_payment_webhooks_processed ON public.payment_webhooks(processed);
CREATE INDEX idx_payment_webhooks_created ON public.payment_webhooks(created_at DESC);
CREATE INDEX idx_payment_webhooks_user_email ON public.payment_webhooks(user_email);

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Only admin and service role can read webhooks
CREATE POLICY "Admin can view payment webhooks"
  ON public.payment_webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert
CREATE POLICY "Service role logs webhooks"
  ON public.payment_webhooks FOR INSERT
  WITH CHECK (true);

-- Service role can update 
CREATE POLICY "Service role processes webhooks"
  ON public.payment_webhooks FOR UPDATE
  USING (true);

-- =============================================
-- RPC: Log incoming webhook (provider-agnostic)
-- =============================================
CREATE OR REPLACE FUNCTION public.log_payment_webhook(
  p_provider TEXT,
  p_event_type TEXT,
  p_external_id TEXT,
  p_user_email TEXT,
  p_payload JSONB
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  -- Validate inputs
  IF p_provider IS NULL OR p_event_type IS NULL OR p_external_id IS NULL OR p_payload IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Missing required parameters');
  END IF;

  -- Insert webhook log (ON CONFLICT prevents duplicates from replay attacks)
  INSERT INTO public.payment_webhooks (
    provider, event_type, external_id, user_email, payload
  ) VALUES (
    p_provider, p_event_type, p_external_id, p_user_email, p_payload
  )
  ON CONFLICT (provider, external_id) DO UPDATE
  SET processed_at = now()
  RETURNING id INTO v_webhook_id;

  RETURN jsonb_build_object(
    'success', true,
    'webhook_id', v_webhook_id,
    'message', 'Webhook logged'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_payment_webhook(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- =============================================
-- RPC: Verify and process webhook
-- =============================================
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_webhook_id UUID,
  p_signature_verified BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook payment_webhooks;
  v_user_id UUID;
BEGIN
  -- Fetch webhook
  SELECT * FROM public.payment_webhooks
  WHERE id = p_webhook_id INTO v_webhook;

  IF v_webhook IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Webhook not found');
  END IF;

  -- Mark signature as verified
  UPDATE public.payment_webhooks
  SET signature_verified = p_signature_verified,
      processed_at = CASE WHEN p_signature_verified THEN now() ELSE processed_at END
  WHERE id = p_webhook_id;

  -- If signature verification failed, stop here
  IF NOT p_signature_verified THEN
    RETURN jsonb_build_object('success', false, 'message', 'Signature verification failed');
  END IF;

  -- Extract user_id from webhook payload (assumes user_email is in payload)
  SELECT id FROM auth.users 
  WHERE email = v_webhook.user_email INTO v_user_id;

  IF v_user_id IS NULL THEN
    UPDATE public.payment_webhooks
    SET error_message = 'User not found for email: ' || v_webhook.user_email
    WHERE id = p_webhook_id;
    RETURN jsonb_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Mark webhook as processed
  UPDATE public.payment_webhooks
  SET processed = true, processed_at = now()
  WHERE id = p_webhook_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Webhook processed successfully',
    'user_id', v_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_payment_webhook(UUID, BOOLEAN) TO service_role;
