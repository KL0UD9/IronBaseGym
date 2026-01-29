-- Add referral columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for referral code lookups
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  name_part TEXT;
  random_part TEXT;
BEGIN
  -- Extract first name or use 'USER' if empty
  name_part := UPPER(COALESCE(NULLIF(SPLIT_PART(NEW.full_name, ' ', 1), ''), 'GYM'));
  name_part := SUBSTRING(name_part FROM 1 FOR 6);
  
  -- Generate random 3-digit number
  random_part := LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  
  -- Combine to create code
  code := 'GYM-' || name_part || '-' || random_part;
  
  -- Ensure uniqueness by appending more random chars if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = code) LOOP
    random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    code := 'GYM-' || name_part || '-' || random_part;
  END LOOP;
  
  NEW.referral_code := code;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate referral code on profile creation
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_referral_code();

-- Generate referral codes for existing profiles that don't have one
UPDATE public.profiles 
SET referral_code = 'GYM-' || UPPER(SUBSTRING(COALESCE(NULLIF(full_name, ''), 'USER') FROM 1 FOR 4)) || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE referral_code IS NULL;

-- Create referral_earnings table
CREATE TABLE public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  credited_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Create indexes
CREATE INDEX idx_referral_earnings_referrer ON public.referral_earnings(referrer_id);
CREATE INDEX idx_referral_earnings_status ON public.referral_earnings(status);

-- Enable RLS
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- Referral earnings policies
CREATE POLICY "Users can view their own referral earnings"
ON public.referral_earnings FOR SELECT
USING (referrer_id = auth.uid());

CREATE POLICY "System can create referral earnings"
ON public.referral_earnings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage referral earnings"
ON public.referral_earnings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to process referral on signup
CREATE OR REPLACE FUNCTION public.process_referral(referrer_code TEXT, new_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id UUID;
BEGIN
  -- Find the referrer by code
  SELECT id INTO referrer_id 
  FROM profiles 
  WHERE referral_code = referrer_code;
  
  IF referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Don't allow self-referral
  IF referrer_id = new_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Update the new user's referred_by
  UPDATE profiles 
  SET referred_by = referrer_id 
  WHERE id = new_user_id;
  
  -- Create earning record for the referrer
  INSERT INTO referral_earnings (referrer_id, referred_id, amount, status)
  VALUES (referrer_id, new_user_id, 10.00, 'credited')
  ON CONFLICT (referred_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;