-- =============================================
-- Services 360 - Row Level Security Policies
-- Run AFTER 001_schema.sql
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions         ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS POLICIES
-- =============================================
-- All authenticated users can read basic user info
CREATE POLICY "users_select_all" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Only admins can delete users
CREATE POLICY "users_delete_admin" ON public.users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Admins can update any user (role changes, etc.)
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- =============================================
-- CATEGORIES POLICIES (publicly readable)
-- =============================================
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_manage_admin" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- SERVICES POLICIES (publicly readable)
-- =============================================
CREATE POLICY "services_select_all" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "services_manage_admin" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- PROVIDER SERVICES POLICIES
-- =============================================
CREATE POLICY "provider_services_select_all" ON public.provider_services
  FOR SELECT USING (true);

CREATE POLICY "provider_services_manage_own" ON public.provider_services
  FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "provider_services_admin" ON public.provider_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- LOCATIONS POLICIES
-- =============================================
CREATE POLICY "locations_select_authenticated" ON public.locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "locations_manage_own" ON public.locations
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- SERVICE REQUESTS POLICIES
-- =============================================
CREATE POLICY "requests_select" ON public.service_requests
  FOR SELECT USING (
    auth.uid() = client_id
    OR auth.uid() = provider_id
    OR status = 'pending'
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "requests_insert_client" ON public.service_requests
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'client')
  );

CREATE POLICY "requests_update_participants" ON public.service_requests
  FOR UPDATE USING (
    auth.uid() = client_id
    OR auth.uid() = provider_id
    OR (
      status = 'pending' AND
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'provider')
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "requests_delete_admin" ON public.service_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- REQUEST STATUS HISTORY POLICIES
-- =============================================
CREATE POLICY "history_select_participants" ON public.request_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_id
        AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "history_insert_participants" ON public.request_status_history
  FOR INSERT WITH CHECK (
    auth.uid() = changed_by AND
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_id
        AND (sr.client_id = auth.uid() OR sr.provider_id = auth.uid())
    )
  );

-- =============================================
-- RATINGS POLICIES
-- =============================================
CREATE POLICY "ratings_select_all" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "ratings_insert_client" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = request_id
        AND sr.client_id = auth.uid()
        AND sr.status = 'completed'
    )
  );

-- =============================================
-- PLANS POLICIES (publicly readable)
-- =============================================
CREATE POLICY "plans_select_all" ON public.plans
  FOR SELECT USING (true);

CREATE POLICY "plans_manage_admin" ON public.plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- SUBSCRIPTIONS POLICIES
-- =============================================
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "subscriptions_manage_admin" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
