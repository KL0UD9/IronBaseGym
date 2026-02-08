-- Fix: Remove insecure INSERT policy on referral_earnings
-- The process_referral() SECURITY DEFINER function already handles insertions securely

-- Drop the insecure policy that allows any user to insert referral earnings
DROP POLICY IF EXISTS "System can create referral earnings" ON public.referral_earnings;

-- Note: The admin policies already exist and allow admins to manage referral earnings
-- The process_referral() function (SECURITY DEFINER) will handle legitimate insertions
-- No new INSERT policy is needed for regular users - they should never directly insert