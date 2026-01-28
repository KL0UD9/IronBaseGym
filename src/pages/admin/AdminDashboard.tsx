import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/kpi-card';
import { Users, DollarSign, UserCheck, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClassWithTrainer {
  id: string;
  name: string;
  start_time: string;
  duration_min: number;
  capacity: number;
  trainer: { full_name: string } | null;
}

export default function AdminDashboard() {
  const [activeMembers, setActiveMembers] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [weeklyClasses, setWeeklyClasses] = useState<ClassWithTrainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active members count
      const { count: membersCount } = await supabase
        .from('user_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setActiveMembers(membersCount || 0);

      // Calculate monthly revenue
      const { data: activeMemberships } = await supabase
        .from('user_memberships')
        .select(`
          membership:memberships(price)
        `)
        .eq('status', 'active');

      const revenue = activeMemberships?.reduce((sum, um) => {
        const membershipData = um.membership as { price: number } | null;
        return sum + (membershipData?.price || 0);
      }, 0) || 0;
      setMonthlyRevenue(revenue);

      // Today's bookings as check-ins proxy
      const today = new Date().toISOString().split('T')[0];
      const { count: checkInsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('created_at', today);

      setTodayCheckIns(checkInsCount || 0);

      // Fetch this week's classes
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 7);

      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          start_time,
          duration_min,
          capacity,
          trainer:profiles!classes_trainer_id_fkey(full_name)
        `)
        .gte('start_time', weekStart.toISOString())
        .lt('start_time', weekEnd.toISOString())
        .order('start_time', { ascending: true });

      setWeeklyClasses((classes as ClassWithTrainer[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    return {
      date,
      label: format(date, 'EEE'),
      fullDate: format(date, 'MMM d'),
      isToday: isToday(date)
    };
  });

  const getClassesForDay = (date: Date) => {
    return weeklyClasses.filter(c => {
      const classDate = new Date(c.start_time);
      return classDate.toDateString() === date.toDateString();
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground mt-1">Welcome to your gym management dashboard</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Active Members"
            value={activeMembers}
            icon={Users}
            trend={{ value: 12, positive: true }}
          />
          <KPICard
            title="Monthly Revenue"
            value={`$${monthlyRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 8, positive: true }}
          />
          <KPICard
            title="Today's Check-ins"
            value={todayCheckIns}
            icon={UserCheck}
          />
          <KPICard
            title="Classes This Week"
            value={weeklyClasses.length}
            icon={Calendar}
          />
        </div>

        {/* Weekly Calendar */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => (
                <div key={day.label} className="space-y-3">
                  <div className={cn(
                    "text-center p-2 rounded-lg",
                    day.isToday && "bg-primary/10 border border-primary/30"
                  )}>
                    <p className={cn(
                      "text-sm font-medium",
                      day.isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                      {day.label}
                    </p>
                    <p className={cn(
                      "text-xs",
                      day.isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                      {day.fullDate}
                    </p>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {getClassesForDay(day.date).map((classItem) => (
                      <div
                        key={classItem.id}
                        className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-medium truncate">{classItem.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(classItem.start_time), 'h:mm a')}
                        </p>
                      </div>
                    ))}
                    {getClassesForDay(day.date).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No classes
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
