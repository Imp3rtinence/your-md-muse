
-- Restrict lat/lng from being readable by regular users; only service_role and SECURITY DEFINER functions need them
REVOKE SELECT (lat, lng, location_updated_at) ON public.profiles FROM authenticated;
REVOKE SELECT (lat, lng, location_updated_at) ON public.profiles FROM anon;
