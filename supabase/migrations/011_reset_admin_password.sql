-- =============================================
-- Services 360 - Reset Admin Password RPC
-- =============================================
-- Provides a secure RPC to reset the admin user password.
-- Usage: SELECT public.reset_admin_password('new_password');

DO $$
BEGIN
  -- Drop the function if it already exists to avoid conflicts
  DROP FUNCTION IF EXISTS public.reset_admin_password(text);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.reset_admin_password(new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_message text;
BEGIN
  -- Validate password is not empty
  IF new_password IS NULL OR new_password = '' THEN
    RETURN json_build_object('success', false, 'message', 'Password cannot be empty');
  END IF;

  -- Validate password length (minimum 6 characters)
  IF LENGTH(new_password) < 6 THEN
    RETURN json_build_object('success', false, 'message', 'Password must be at least 6 characters');
  END IF;

  -- Update the admin user's password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE email = 'admin@services360.com';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    v_message := 'Admin user (admin@services360.com) not found';
    RETURN json_build_object('success', false, 'message', v_message);
  END IF;

  v_message := 'Admin password updated successfully';
  RETURN json_build_object('success', true, 'message', v_message);
END;
$$;

-- Grant execute permission to authenticated users (optional, restrict as needed)
-- GRANT EXECUTE ON FUNCTION public.reset_admin_password(text) TO authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- Usage example:
-- SELECT public.reset_admin_password('admin123');
-- Returns: {"success": true, "message": "Admin password updated successfully"}
-- ──────────────────────────────────────────────────────────────────────────────
