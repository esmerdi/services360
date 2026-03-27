-- =============================================
-- 013 - Provider plan launch pricing and limits
-- FREE (trial): 15 days, 10 requests/month
-- PRO: 7.99 USD / month
-- =============================================

UPDATE public.plans
SET
  price = 0.00,
  features = jsonb_build_object(
    'trial_days', 15,
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
