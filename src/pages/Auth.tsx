import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const REFERRAL_CODE_PATTERN = /^GYM-[A-Z0-9]{2,6}-\d{3,4}$/;

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, navigate]);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null);
      return;
    }

    setCheckingReferral(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle();
    
    setCheckingReferral(false);
    setReferralValid(!!data && !error);
  };

  const handleReferralCodeChange = (value: string) => {
    // Trim and limit length for security
    const upperValue = value.toUpperCase().trim().slice(0, 20);
    setReferralCode(upperValue);
    
    // Validate format before checking database
    if (upperValue.length >= 8) {
      if (REFERRAL_CODE_PATTERN.test(upperValue)) {
        validateReferralCode(upperValue);
      } else {
        setReferralValid(false);
      }
    } else {
      setReferralValid(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
      if (!signupName.trim()) {
        toast.error('Please enter your full name');
        return;
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error, data } = await signUp(signupEmail, signupPassword, signupName);
    
    if (error) {
      setIsLoading(false);
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in.');
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Process referral if valid code was entered and format is correct
    if (referralCode && referralValid && data?.user && REFERRAL_CODE_PATTERN.test(referralCode)) {
      try {
        const { data: result, error: refError } = await supabase.rpc('process_referral', {
          referrer_code: referralCode.trim(),
          new_user_id: data.user.id,
        });
        
        if (result && !refError) {
          toast.success(t('referral.appliedSuccess'));
        }
      } catch {
        // Referral failed but signup succeeded - don't block
        console.error('Referral processing failed');
      }
    }

    setIsLoading(false);
    toast.success('Account created successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <Card className="w-full max-w-md glass-card relative z-10 animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 rounded-2xl bg-primary/10 w-fit">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold gradient-text">IronBase</CardTitle>
            <CardDescription className="mt-2">
              Gym Management System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue={searchParams.get('ref') ? 'signup' : 'login'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                
                {/* Referral Code Field */}
                <div className="space-y-2">
                  <Label htmlFor="referral-code" className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    {t('referral.referralCode')} <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="referral-code"
                      type="text"
                      placeholder="GYM-XXXX-000"
                      value={referralCode}
                      onChange={(e) => handleReferralCodeChange(e.target.value)}
                      className="font-mono uppercase"
                    />
                    {checkingReferral && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!checkingReferral && referralValid === true && (
                      <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500/10 text-green-500 text-xs">
                        {t('referral.valid')}
                      </Badge>
                    )}
                    {!checkingReferral && referralValid === false && (
                      <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive/10 text-destructive text-xs">
                        {t('referral.invalid')}
                      </Badge>
                    )}
                  </div>
                  {referralValid && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      {t('referral.bonusMessage')}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
