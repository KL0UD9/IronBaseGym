import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

export function CheckInHeatmap() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  useEffect(() => { if (user) fetchCheckIns(); }, [user]);

  const fetchCheckIns = async () => {
    const oneYearAgo = subDays(new Date(), 365);
    const { data, error } = await supabase.from('bookings').select('created_at').eq('user_id', user!.id).eq('status', 'confirmed').gte('created_at', oneYearAgo.toISOString());
    if (error) { console.error('Error fetching check-ins:', error); setLoading(false); return; }
    const countMap = new Map<string, number>();
    (data || []).forEach((booking) => { const dateKey = format(new Date(booking.created_at), 'yyyy-MM-dd'); countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1); });
    setCheckIns(countMap); setTotalCheckIns(data?.length || 0); setLoading(false);
  };

  const generateCalendarDays = () => {
    const today = new Date();
    return eachDayOfInterval({ start: startOfWeek(subDays(today, 364), { weekStartsOn: 0 }), end: today });
  };

  const days = generateCalendarDays();
  const weeks: Date[][] = []; let currentWeek: Date[] = [];
  days.forEach((day) => { currentWeek.push(day); if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; } });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/30'; if (count === 1) return 'bg-primary/30';
    if (count === 2) return 'bg-primary/50'; if (count === 3) return 'bg-primary/70'; return 'bg-primary';
  };

  const monthLabels = () => {
    const labels: { month: string; index: number }[] = []; let lastMonth = '';
    weeks.forEach((week, weekIndex) => { const month = format(week[0], 'MMM'); if (month !== lastMonth) { labels.push({ month, index: weekIndex }); lastMonth = month; } });
    return labels;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) return (
    <Card className="glass-card">
      <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-primary" />{t('heatmap.title')}</CardTitle></CardHeader>
      <CardContent><div className="h-32 flex items-center justify-center"><div className="animate-pulse text-muted-foreground">{t('heatmap.loadingActivity')}</div></div></CardContent>
    </Card>
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />{t('heatmap.title')}
          <span className="ml-auto text-sm font-normal text-muted-foreground">{t('heatmap.checkInsThisYear', { count: totalCheckIns })}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex mb-1 ml-8">
            {monthLabels().map(({ month, index }) => (
              <div key={`${month}-${index}`} className="text-xs text-muted-foreground" style={{ position: 'absolute', left: `calc(2rem + ${index * 13}px)` }}>{month}</div>
            ))}
          </div>
          <div className="flex gap-1 mt-6">
            <div className="flex flex-col gap-[3px] mr-1">
              {dayLabels.map((day, i) => (<div key={day} className="h-[11px] text-[10px] text-muted-foreground flex items-center" style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>{day}</div>))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd'); const count = checkIns.get(dateKey) || 0;
                    return (<div key={dateKey} className={`w-[11px] h-[11px] rounded-sm cursor-pointer ${getIntensityClass(count)} ${isSameDay(day, new Date()) ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''} hover:ring-1 hover:ring-foreground/50 transition-all duration-150`} title={`${format(day, 'MMM d, yyyy')}: ${count}`} />);
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>{t('common.less')}</span>
            <div className="flex gap-[3px]">
              <div className="w-[11px] h-[11px] rounded-sm bg-muted/30" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/30" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/70" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary" />
            </div>
            <span>{t('common.more')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
