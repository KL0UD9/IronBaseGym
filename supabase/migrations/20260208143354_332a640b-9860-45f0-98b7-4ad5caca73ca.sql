-- Fix 1: Recreate trainer_locations view with security_invoker and reduced precision
-- This restricts access to authenticated users and rounds coordinates to ~1km precision

DROP VIEW IF EXISTS public.trainer_locations;

CREATE VIEW public.trainer_locations
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  -- Round coordinates to 2 decimal places (~1.1km precision) for privacy
  ROUND(p.lat::numeric, 2)::double precision as lat,
  ROUND(p.lng::numeric, 2)::double precision as lng
FROM public.profiles p
WHERE p.role = 'trainer'::app_role 
  AND p.lat IS NOT NULL 
  AND p.lng IS NOT NULL;

-- Grant access only to authenticated users
REVOKE ALL ON public.trainer_locations FROM anon;
REVOKE ALL ON public.trainer_locations FROM public;
GRANT SELECT ON public.trainer_locations TO authenticated;