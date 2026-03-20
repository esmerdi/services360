-- =============================================
-- Services 360 - Database Functions
-- Run AFTER 001_schema.sql
-- =============================================

-- =============================================
-- Haversine distance function (returns km)
-- =============================================
CREATE OR REPLACE FUNCTION public.haversine_distance(
  lat1 FLOAT, lon1 FLOAT,
  lat2 FLOAT, lon2 FLOAT
)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R     FLOAT := 6371;
  dlat  FLOAT;
  dlon  FLOAT;
  a     FLOAT;
  c     FLOAT;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) ^ 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ^ 2;
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  RETURN R * c;
END;
$$;

-- =============================================
-- Get nearby pending service requests for a provider
-- Filtered by the services the provider offers
-- =============================================
CREATE OR REPLACE FUNCTION public.get_nearby_requests(
  provider_lat  FLOAT,
  provider_lon  FLOAT,
  p_provider_id UUID,
  radius_km     FLOAT DEFAULT 15
)
RETURNS TABLE (
  id          UUID,
  client_id   UUID,
  service_id  UUID,
  status      TEXT,
  description TEXT,
  price       DECIMAL,
  latitude    DECIMAL,
  longitude   DECIMAL,
  address     TEXT,
  created_at  TIMESTAMPTZ,
  distance_km FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id,
    sr.client_id,
    sr.service_id,
    sr.status,
    sr.description,
    sr.price,
    sr.latitude,
    sr.longitude,
    sr.address,
    sr.created_at,
    public.haversine_distance(
      provider_lat, provider_lon,
      sr.latitude::FLOAT, sr.longitude::FLOAT
    ) AS distance_km
  FROM public.service_requests sr
  WHERE
    sr.status = 'pending'
    AND sr.latitude IS NOT NULL
    AND sr.longitude IS NOT NULL
    AND sr.service_id IN (
      SELECT ps.service_id
      FROM public.provider_services ps
      WHERE ps.provider_id = p_provider_id
    )
    AND public.haversine_distance(
      provider_lat, provider_lon,
      sr.latitude::FLOAT, sr.longitude::FLOAT
    ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$;

-- =============================================
-- Auto-insert status history when request status changes
-- =============================================
CREATE OR REPLACE FUNCTION public.log_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.request_status_history (request_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_request_status_change ON public.service_requests;
CREATE TRIGGER trg_request_status_change
  AFTER UPDATE OF status ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_request_status_change();

-- =============================================
-- Update locations.updated_at automatically
-- =============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_locations_updated_at ON public.locations;
CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- Enable Realtime on service_requests table
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
