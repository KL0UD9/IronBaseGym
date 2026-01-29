import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

interface CheckInData {
  date: string;
  count: number;
}

export function CheckInHeatmap() {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCheckIns();
    }
  }, [user]);

  const fetchCheckIns = async () => {
    const oneYearAgo = subDays(new Date(), 365);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('user_id', user!.id)
      .eq('status', 'confirmed')
      .gte('created_at', oneYearAgo.toISOString());

    if (error) {
      console.error('Error fetching check-ins:', error);
      setLoading(false);
      return;
    }

    // Count check-ins per day
    const countMap = new Map<string, number>();
    (data || []).forEach((booking) => {
      const dateKey = format(new Date(booking.created_at), 'yyyy-MM-dd');
      countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
    });

    setCheckIns(countMap);
    setTotalCheckIns(data?.length || 0);
    setLoading(false);
  };

  // Generate the last 52 weeks of days
  const generateCalendarDays = () => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 364), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: today });
    return days;
  };

  const days = generateCalendarDays();

  // Group days into weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    if (count === 1) return 'bg-primary/30';
    if (count === 2) return 'bg-primary/50';
    if (count === 3) return 'bg-primary/70';
    return 'bg-primary';
  };

  const monthLabels = () => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = '';
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      const month = format(firstDayOfWeek, 'MMM');
      
      if (month !== lastMonth) {
        labels.push({ month, index: weekIndex });
        lastMonth = month;
      }
    });
    
    return labels;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Check-In Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading activity...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Check-In Activity
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {totalCheckIns} check-ins this year
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels().map(({ month, index }) => (
              <div
                key={`${month}-${index}`}
                className="text-xs text-muted-foreground"
                style={{ 
                  marginLeft: index === 0 ? 0 : undefined,
                  position: 'absolute',
                  left: `calc(2rem + ${index * 13}px)`
                }}
              >
                {month}
              </div>
            ))}
          </div>
          
          <div className="flex gap-1 mt-6">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {dayLabels.map((day, i) => (
                <div 
                  key={day} 
                  className="h-[11px] text-[10px] text-muted-foreground flex items-center"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const count = checkIns.get(dateKey) || 0;
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={dateKey}
                        className={`
                          w-[11px] h-[11px] rounded-sm cursor-pointer
                          ${getIntensityClass(count)}
                          ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''}
                          hover:ring-1 hover:ring-foreground/50
                          transition-all duration-150
                        `}
                        title={`${format(day, 'MMM d, yyyy')}: ${count} check-in${count !== 1 ? 's' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[3px]">
              <div className="w-[11px] h-[11px] rounded-sm bg-muted/30" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/30" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/70" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
