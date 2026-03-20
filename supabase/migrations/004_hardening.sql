-- =============================================
-- Services 360 - Security and consistency hardening
-- Run AFTER 003_functions.sql
-- =============================================

-- =============================================
-- Replace broad policies with explicit WITH CHECK constraints
-- =============================================
DROP POLICY IF EXISTS "categories_manage_admin" ON public.categories;
CREATE POLICY "categories_manage_admin" ON public.categories
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "services_manage_admin" ON public.services;
CREATE POLICY "services_manage_admin" ON public.services
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "provider_services_manage_own" ON public.provider_services;
CREATE POLICY "provider_services_manage_own" ON public.provider_services
  FOR ALL
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "provider_services_admin" ON public.provider_services;
CREATE POLICY "provider_services_admin" ON public.provider_services
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "locations_manage_own" ON public.locations;
CREATE POLICY "locations_manage_own" ON public.locations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "plans_manage_admin" ON public.plans;
CREATE POLICY "plans_manage_admin" ON public.plans
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "subscriptions_manage_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_manage_admin" ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_admin" ON public.users;
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- =============================================
-- Tighten request update behavior
-- Providers can only accept compatible pending requests.
-- Clients/providers can only update requests they already participate in.
-- =============================================
DROP POLICY IF EXISTS "requests_update_participants" ON public.service_requests;

CREATE POLICY "requests_accept_provider" ON public.service_requests
  FOR UPDATE
  USING (
    status = 'pending'
    AND provider_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'provider'
    )
    AND EXISTS (
      SELECT 1
      FROM public.provider_services ps
      WHERE ps.provider_id = auth.uid()
        AND ps.service_id = service_id
    )
  )
  WITH CHECK (
    provider_id = auth.uid()
    AND status IN ('accepted', 'cancelled')
  );

CREATE POLICY "requests_update_participants" ON public.service_requests
  FOR UPDATE
  USING (
    auth.uid() = client_id
    OR auth.uid() = provider_id
  )
  WITH CHECK (
    auth.uid() = client_id
    OR auth.uid() = provider_id
  );

CREATE POLICY "requests_update_admin" ON public.service_requests
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- Log initial pending status when a request is created
-- =============================================
CREATE OR REPLACE FUNCTION public.log_initial_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.request_status_history (request_id, status, changed_by)
  VALUES (NEW.id, NEW.status, NEW.client_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_request_initial_status ON public.service_requests;
CREATE TRIGGER trg_request_initial_status
  AFTER INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_initial_request_status();

-- =============================================
-- Make realtime publication additions idempotent
-- =============================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;