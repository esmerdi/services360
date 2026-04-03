-- =============================================
-- Services 360 - Email service queue
-- =============================================
-- Placeholder for email sending via Supabase or external service.

CREATE OR REPLACE FUNCTION public.send_email(
  p_to text,
  p_subject text,
  p_html_body text,
  p_text_body text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NOTE: This is a placeholder. In production, you would:
  -- 1. Use Supabase Realtime + external email service (Resend, SendGrid)
  -- 2. Or use Supabase Edge Functions to call email API
  -- 3. Or use triggers to queue emails in a table read by a background job
  
  -- For now, log the email intent to a table for debugging
  INSERT INTO public.email_logs (
    recipient, subject, html_body, text_body, status
  ) VALUES (
    p_to, p_subject, p_html_body, p_text_body, 'queued'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email queued for delivery',
    'recipient', p_to
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_email(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- =============================================
-- Fallback: Email logs table for auditing
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT,
  text_body TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
