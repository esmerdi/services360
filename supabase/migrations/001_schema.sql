-- =============================================
-- Services 360 - Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- Synced with auth.users via trigger
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'client'
                CHECK (role IN ('admin', 'client', 'provider')),
  full_name   TEXT,
  phone       TEXT,
  is_available BOOLEAN DEFAULT FALSE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-create user profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- CATEGORIES TABLE (hierarchical)
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROVIDER SERVICES (junction table)
-- =============================================
CREATE TABLE IF NOT EXISTS public.provider_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider_id, service_id)
);

-- =============================================
-- LOCATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  latitude    DECIMAL(10, 8) NOT NULL,
  longitude   DECIMAL(11, 8) NOT NULL,
  address     TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICE REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  service_id  UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  description TEXT,
  price       DECIMAL(10, 2),
  latitude    DECIMAL(10, 8),
  longitude   DECIMAL(11, 8),
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REQUEST STATUS HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.request_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  changed_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RATINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID UNIQUE NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL CHECK (name IN ('FREE', 'PRO')),
  price      DECIMAL(10, 2) NOT NULL DEFAULT 0,
  features   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id    UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'cancelled', 'trial')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USEFUL INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_service_requests_client    ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider  ON public.service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status    ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON public.provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user            ON public.ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user         ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent          ON public.categories(parent_id);
