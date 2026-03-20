-- =============================================
-- Services 360 - Admin User Bootstrap
-- Promotes a known account to admin if it exists.
-- =============================================

DO $$
DECLARE
  v_admin_email CONSTANT text := 'admin@services360.com';
  v_admin_name  CONSTANT text := 'Administrador';
  v_auth_id uuid;
BEGIN
  -- In Supabase Cloud, auth users are usually created from Dashboard/Auth API.
  -- This migration only promotes/syncs the account if it already exists.
  SELECT id
  INTO v_auth_id
  FROM auth.users
  WHERE email = v_admin_email
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE NOTICE 'Admin bootstrap skipped: % does not exist in auth.users yet.', v_admin_email;
    RETURN;
  END IF;

  INSERT INTO public.users (id, email, role, full_name)
  VALUES (v_auth_id, v_admin_email, 'admin', v_admin_name)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = 'admin',
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);

  RAISE NOTICE 'Admin bootstrap applied for %.', v_admin_email;
END
$$;
