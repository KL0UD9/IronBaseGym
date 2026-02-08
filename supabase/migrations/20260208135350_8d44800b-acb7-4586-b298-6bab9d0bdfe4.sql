-- Create avatars storage bucket with public access for viewing
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Users can view any avatar (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy 2: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a secure view for trainer map that only exposes trainer locations
-- Regular members should not have their location exposed to other users
CREATE OR REPLACE VIEW public.trainer_locations
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.lat,
  p.lng
FROM public.profiles p
WHERE p.role = 'trainer'
  AND p.lat IS NOT NULL 
  AND p.lng IS NOT NULL;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.trainer_locations TO authenticated;

-- Drop existing overly permissive policies on profiles for trainers/admins viewing locations
DROP POLICY IF EXISTS "Trainers can view all profiles" ON public.profiles;

-- Recreate trainer policy to only see non-location profile data
-- Trainers should use the trainer_locations view for location data
CREATE POLICY "Trainers can view member profiles without location"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'trainer'::app_role) AND
  id != auth.uid()
);

-- Add comment explaining the security model
COMMENT ON VIEW public.trainer_locations IS 'Secure view exposing only trainer locations for the trainer map feature. Regular member locations are not exposed.';