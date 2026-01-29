-- Add latitude and longitude columns to profiles table for trainer locations
ALTER TABLE public.profiles 
ADD COLUMN lat DOUBLE PRECISION,
ADD COLUMN lng DOUBLE PRECISION;

-- Add index for geolocation queries
CREATE INDEX idx_profiles_location ON public.profiles (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;