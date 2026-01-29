-- Fix the overly permissive INSERT policy for referral_earnings
-- Only allow inserts via the security definer function, not directly
DROP POLICY IF EXISTS "System can create referral earnings" ON public.referral_earnings;

-- Create a more restrictive policy - only admins can insert directly
-- The process_referral function uses SECURITY DEFINER so it bypasses RLS
CREATE POLICY "Admins can insert referral earnings"
ON public.referral_earnings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));