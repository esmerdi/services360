-- =============================================
-- Services 360 - Reset Admin Password RPC
-- =============================================
-- Provides a secure RPC to reset the admin user password.
-- Requires: pgcrypto extension for crypt() and gen_salt()
-- Usage: SELECT public.reset_admin_password('admin@services360.com', 'new_password');

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  -- Drop possible previous signatures to avoid parameter-name conflicts
  DROP FUNCTION IF EXISTS public.reset_admin_password(text, text);
  DROP FUNCTION IF EXISTS public.reset_admin_password(text);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.reset_admin_password(
  p_target_email text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_found_email text;
BEGIN
  -- Validate input early
  IF p_new_password IS NULL OR p_new_password = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Password cannot be empty'
    );
  END IF;

  -- Validate password length (minimum 6 characters)
  IF char_length(p_new_password) < 6 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Password must be at least 6 characters'
    );
  END IF;

  -- Update exactly one user (if it exists) and capture whether it matched
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(
    p_new_password,
    extensions.gen_salt('bf')
  )
  WHERE email = p_target_email
  RETURNING email INTO v_found_email;

  IF v_found_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password updated successfully'
  );
END;
$$;

-- Grant execute permission to authenticated users (optional, restrict as needed)
-- GRANT EXECUTE ON FUNCTION public.reset_admin_password(text) TO authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- Usage example:
-- SELECT public.reset_admin_password('admin@services360.com', 'admin123');
-- Returns: {"success": true, "message": "Password updated successfully"}
-- ──────────────────────────────────────────────────────────────────────────────
