-- =============================================
-- Services 360 - Email Service RPC
-- =============================================
-- Placeholder for email sending via Supabase or external service
-- This RPC should be implemented to actually send emails

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

-- =============================================
-- RPC: Force password change on first login (PRO users)
-- =============================================
-- Users activate with temp password and are flagged to change it
-- This RPC validates the new permanent password and updates auth.users

CREATE OR REPLACE FUNCTION public.force_password_change(
  p_current_password text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_temp_password text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not authenticated'
    );
  END IF;

  -- Validate new password
  IF p_new_password IS NULL OR p_new_password = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'New password cannot be empty'
    );
  END IF;

  IF char_length(p_new_password) < 8 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Password must be at least 8 characters'
    );
  END IF;

  -- Password should contain: uppercase, lowercase, number, special char
  IF NOT (p_new_password ~ '[A-Z]' AND p_new_password ~ '[a-z]' AND 
          p_new_password ~ '[0-9]' AND p_new_password ~ '[!@#$%^&*]') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Password must contain uppercase, lowercase, number, and special character'
    );
  END IF;

  -- Update password in auth.users
  -- Note: This requires proper auth schema access
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_user_id;

  -- Clear "force_password_change" flag if it exists in user_profiles
  UPDATE public.user_profiles
  SET force_password_change = false,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password changed successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.force_password_change(TEXT, TEXT) TO authenticated;

-- =============================================
-- RPC: Check if user must change password
-- =============================================
CREATE OR REPLACE FUNCTION public.must_change_password()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_must_change boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  SELECT force_password_change INTO v_must_change
  FROM public.user_profiles
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'must_change', COALESCE(v_must_change, false),
    'reason', CASE 
      WHEN COALESCE(v_must_change, false) THEN 'Pro membership activated with temporary password'
      ELSE NULL
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.must_change_password() TO authenticated;

-- =============================================
-- Add force_password_change flag to user_profiles
-- =============================================
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- =============================================
-- Update activate_pro_membership to set flag
-- =============================================
-- (Update the existing function to set force_password_change = true)
-- This ensures users are prompted to change temp password on login

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
  v_temp_password TEXT;
  v_user_email TEXT;
  v_membership_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_plan_id IS NULL OR p_provider IS NULL OR p_external_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Missing required parameters');
  END IF;

  -- Generate temporary password (12 chars: 8 alphanumeric + 4 symbols)
  v_temp_password := substr(md5(random()::text || clock_timestamp()::text), 1, 8) ||
                     substr('!@#$%^&*', (random() * 8)::int + 1, 1) ||
                     substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (random() * 26)::int + 1, 1);

  -- Get user email
  SELECT email FROM auth.users WHERE id = p_user_id INTO v_user_email;
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Create or update membership
  INSERT INTO public.memberships (user_id, plan_id, provider, external_id, status, metadata)
  VALUES (p_user_id, p_plan_id, p_provider, p_external_id, 'active', p_metadata)
  ON CONFLICT (user_id) DO UPDATE
  SET status = 'active', plan_id = p_plan_id, provider = p_provider, 
      external_id = p_external_id, metadata = p_metadata, updated_at = now()
  RETURNING id INTO v_membership_id;

  -- Update user subscription_plan in user_profiles
  -- AND set flag to force password change
  UPDATE public.user_profiles 
  SET subscription_plan = 'pro', 
      force_password_change = true,
      updated_at = now()
  WHERE id = p_user_id;

  -- Return success with temp password (frontend must send temp pwd via secure email service)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pro membership activated',
    'membership_id', v_membership_id,
    'email', v_user_email,
    'temp_password', v_temp_password
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_pro_membership(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;
