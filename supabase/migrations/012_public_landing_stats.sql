-- =============================================
-- 012 - Public landing stats RPC
-- Provides safe aggregate metrics for public landing cards
-- =============================================

CREATE OR REPLACE FUNCTION public.public_landing_stats()
RETURNS TABLE (
  total_clients BIGINT,
  total_providers BIGINT,
  total_categories BIGINT,
  total_cities BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.users WHERE role = 'client') AS total_clients,
    (SELECT COUNT(*) FROM public.users WHERE role = 'provider') AS total_providers,
    (SELECT COUNT(*) FROM public.categories) AS total_categories,
    (
      SELECT COUNT(DISTINCT l.address)
      FROM public.locations l
      WHERE l.address IS NOT NULL AND btrim(l.address) <> ''
    ) AS total_cities;
$$;

REVOKE ALL ON FUNCTION public.public_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_landing_stats() TO anon, authenticated;
