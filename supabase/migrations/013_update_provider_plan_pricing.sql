-- =============================================
-- 013 - Provider plan launch pricing and limits
-- FREE: no expiration, 10 requests per 30-day period
-- PRO: 7.99 USD / month
-- =============================================

UPDATE public.plans
SET
  price = 0.00,
  features = jsonb_build_object(
    'no_expiration', true,
    'request_window_days', 30,
    'max_requests_per_month', 10,
    'featured_in_search', false,
    'profile_boost', false,
    'priority_support', false,
    'instant_notifications', true
  )
WHERE name = 'FREE';

UPDATE public.plans
SET
  price = 7.99,
  features = jsonb_build_object(
    'max_requests_per_month', -1,
    'featured_in_search', true,
    'profile_boost', true,
    'priority_support', true,
    'instant_notifications', true
  )
WHERE name = 'PRO';
