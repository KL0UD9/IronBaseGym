import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  Share2, 
  Sparkles,
  UserPlus,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ReferralEarning {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  referred: {
    full_name: string;
  };
}

export default function ReferralPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  // Fetch user's referral code from profile
  const { data: userProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile-referral', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch referral earnings
  const { data: earnings = [], isLoading: loadingEarnings } = useQuery({
    queryKey: ['referral-earnings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('referral_earnings')
        .select(`
          id,
          amount,
          status,
          created_at,
          referred:referred_id (
            full_name
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ReferralEarning[];
    },
    enabled: !!user,
  });

  const referralCode = userProfile?.referral_code || '';
  const referralLink = `${window.location.origin}/login?ref=${referralCode}`;
  
  const totalEarned = earnings
    .filter(e => e.status === 'credited')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  const totalReferrals = earnings.length;
  const pendingEarnings = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t(`referral.${type}Copied`));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('referral.copyError'));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('referral.shareTitle'),
          text: t('referral.shareText'),
          url: referralLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy(referralLink, 'link');
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" />
            {t('referral.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('referral.subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('referral.totalEarned')}</p>
                  <p className="text-2xl font-bold text-green-500">${totalEarned.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('referral.friendsReferred')}</p>
                  <p className="text-2xl font-bold">{totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('referral.pending')}</p>
                  <p className="text-2xl font-bold text-amber-500">${pendingEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {t('referral.yourCode')}
            </CardTitle>
            <CardDescription>{t('referral.codeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  value={referralCode}
                  readOnly
                  className="text-center text-xl font-mono font-bold tracking-wider bg-background pr-12"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => handleCopy(referralCode, 'code')}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Referral Link */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('referral.shareLink')}</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="text-sm bg-background min-w-0"
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleCopy(referralLink, 'link')} variant="outline" className="gap-2 shrink-0 flex-1 sm:flex-none">
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('referral.copyLink')}</span>
                    <span className="sm:hidden">{t('referral.copyLink')}</span>
                  </Button>
                  <Button onClick={handleShare} className="gap-2 shrink-0 flex-1 sm:flex-none">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('referral.share')}</span>
                    <span className="sm:hidden">{t('referral.share')}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-6 p-4 rounded-lg bg-background/50 border">
              <h4 className="font-medium mb-3">{t('referral.howItWorks')}</h4>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <span>{t('referral.step1')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                  <span>{t('referral.step2')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                  <span>{t('referral.step3')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('referral.peopleReferred')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEarnings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : earnings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('referral.noReferrals')}</p>
                <p className="text-sm mt-1">{t('referral.startSharing')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('referral.friend')}</TableHead>
                    <TableHead>{t('referral.date')}</TableHead>
                    <TableHead>{t('referral.reward')}</TableHead>
                    <TableHead>{t('referral.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="font-medium">
                        {earning.referred?.full_name || t('referral.anonymous')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(earning.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium text-green-500">
                        +${Number(earning.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={earning.status === 'credited' ? 'default' : 'secondary'}
                          className={earning.status === 'credited' ? 'bg-green-500/10 text-green-500' : ''}
                        >
                          {t(`referral.statuses.${earning.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
