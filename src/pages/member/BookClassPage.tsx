import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Check } from 'lucide-react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClassWithBookings {
  id: string; name: string; start_time: string; duration_min: number; capacity: number; description: string | null;
  trainer: { full_name: string } | null; bookings: Array<{ id: string; user_id: string }>;
}

export default function BookClassPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 14);
    const { data, error } = await supabase.from('classes')
      .select(`id, name, start_time, duration_min, capacity, description, trainer:profiles!classes_trainer_id_fkey(full_name), bookings (id, user_id)`)
      .gte('start_time', new Date().toISOString()).lt('start_time', weekEnd.toISOString())
      .order('start_time', { ascending: true });
    if (error) console.error('Error fetching classes:', error);
    else setClasses((data as ClassWithBookings[]) || []);
    setLoading(false);
  };

  const handleBookClass = async (classId: string) => {
    if (!user) { toast.error(t('bookClass.signInToBook')); return; }
    setBookingInProgress(classId);
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return;
    const isFull = classItem.bookings.length >= classItem.capacity;
    const { error } = await supabase.from('bookings').insert({ user_id: user.id, class_id: classId, status: isFull ? 'waitlist' : 'confirmed' });
    if (error) {
      if (error.code === '23505') toast.error(t('bookClass.alreadyBooked'));
      else { toast.error(t('bookClass.failedToBook')); console.error(error); }
    } else {
      toast.success(isFull ? t('bookClass.addedToWaitlist') : t('bookClass.classBooked'));
      fetchClasses();
    }
    setBookingInProgress(null);
  };

  const isUserBooked = (c: ClassWithBookings) => c.bookings.some(b => b.user_id === user?.id);
  const getAvailableSpots = (c: ClassWithBookings) => Math.max(0, c.capacity - c.bookings.length);

  const groupedClasses = classes.reduce((acc, classItem) => {
    const dateKey = format(new Date(classItem.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(classItem);
    return acc;
  }, {} as Record<string, ClassWithBookings[]>);

  return (
    <MemberLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('bookClass.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{t('bookClass.subtitle')}</p>
        </div>
        {Object.entries(groupedClasses).map(([dateKey, dayClasses]) => {
          const date = new Date(dateKey);
          return (
            <Card key={dateKey} className="glass-card">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className={cn("flex items-center gap-2 text-lg md:text-2xl", isToday(date) && "text-primary")}>
                  <Calendar className="h-5 w-5" />
                  {isToday(date) ? t('common.today') : format(date, 'EEEE, MMMM d')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                  {dayClasses.map((classItem) => {
                    const availableSpots = getAvailableSpots(classItem);
                    const isFull = availableSpots === 0;
                    const isBooked = isUserBooked(classItem);
                    return (
                      <div key={classItem.id} className={cn("p-4 rounded-xl border transition-all", isBooked ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:border-primary/30")}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">{classItem.name}</h3>
                          {isBooked && (<div className="flex items-center gap-1 text-primary text-xs font-medium"><Check className="h-4 w-4" />{t('bookClass.booked')}</div>)}
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{format(new Date(classItem.start_time), 'h:mm a')} • {classItem.duration_min} {t('common.min')}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" />{t('bookClass.spotsLeft', { count: availableSpots })}</div>
                          {classItem.trainer && (<p className="text-sm text-primary">{t('common.with')} {classItem.trainer.full_name}</p>)}
                        </div>
                        {!isBooked && (
                          <Button onClick={() => handleBookClass(classItem.id)} disabled={bookingInProgress === classItem.id} variant={isFull ? 'outline' : 'default'} className="w-full">
                            {bookingInProgress === classItem.id ? t('bookClass.booking') : isFull ? t('bookClass.joinWaitlist') : t('bookClass.bookClass')}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {classes.length === 0 && !loading && (
          <Card className="glass-card"><CardContent className="py-8 md:py-12 text-center"><p className="text-muted-foreground text-sm md:text-base">{t('bookClass.noClasses')}</p></CardContent></Card>
        )}
      </div>
    </MemberLayout>
  );
}
