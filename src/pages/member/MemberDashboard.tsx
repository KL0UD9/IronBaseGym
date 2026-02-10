import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CreditCard, Dumbbell, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckInHeatmap } from '@/components/CheckInHeatmap';
import { XPDisplay } from '@/components/gamification/XPDisplay';

interface BookingWithClass {
  id: string;
  status: string;
  class: { id: string; name: string; start_time: string; duration_min: number; trainer: { full_name: string } | null; };
}

interface MembershipInfo {
  status: string;
  end_date: string;
  membership: { name: string; price: number; };
}

export default function MemberDashboard() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [upcomingClasses, setUpcomingClasses] = useState<BookingWithClass[]>([]);
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`id, status, class:classes (id, name, start_time, duration_min, trainer:profiles!classes_trainer_id_fkey(full_name))`)
      .eq('user_id', user!.id).eq('status', 'confirmed')
      .gte('class.start_time', new Date().toISOString())
      .order('created_at', { ascending: true }).limit(5);
    setUpcomingClasses((bookings || []).filter(b => b.class !== null) as BookingWithClass[]);

    const { data: membership } = await supabase
      .from('user_memberships')
      .select(`status, end_date, membership:memberships (name, price)`)
      .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (membership) setMembershipInfo(membership as unknown as MembershipInfo);
    setLoading(false);
  };

  return (
    <MemberLayout>
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {t('memberDashboard.welcomeBack', { name: profile?.full_name?.split(' ')[0] || t('common.user') })}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{t('memberDashboard.fitnessOverview')}</p>
          </div>
          <XPDisplay compact className="self-start md:self-auto" />
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t('memberDashboard.myMembership')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membershipInfo ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{membershipInfo.membership.name}</span>
                    <StatusBadge status={membershipInfo.status as 'active' | 'expired' | 'pending'} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{t('memberDashboard.validUntil', { date: format(new Date(membershipInfo.end_date), 'MMMM d, yyyy') })}</p>
                    <p className="mt-1">{t('memberDashboard.perMonth', { price: `$${membershipInfo.membership.price}` })}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">{t('memberDashboard.noActiveMembership')}</p>
                  <Button variant="outline">{t('memberDashboard.viewPlans')}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                {t('memberDashboard.quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-3" variant="outline" onClick={() => navigate('/dashboard/book')}>
                <Calendar className="h-5 w-5" />{t('memberDashboard.bookAClass')}
              </Button>
              <Button className="w-full justify-start gap-3" variant="outline" onClick={() => navigate('/dashboard/classes')}>
                <Dumbbell className="h-5 w-5" />{t('memberDashboard.viewMyClasses')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <CheckInHeatmap />

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('memberDashboard.upcomingClasses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-4">
                {upcomingClasses.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <p className="font-medium">{booking.class.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.class.start_time), 'EEEE, MMMM d')} {t('common.at')} {format(new Date(booking.class.start_time), 'h:mm a')}
                      </p>
                      {booking.class.trainer && (
                        <p className="text-sm text-primary mt-1">{t('common.with')} {booking.class.trainer.full_name}</p>
                      )}
                    </div>
                    <StatusBadge status={booking.status as 'confirmed' | 'cancelled' | 'waitlist'} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t('memberDashboard.noUpcomingClasses')}</p>
                <Button onClick={() => navigate('/dashboard/book')}>{t('memberDashboard.bookFirstClass')}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
