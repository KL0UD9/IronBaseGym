import { useEffect, useState } from 'react';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface BookingWithClass {
  id: string;
  status: string;
  class: {
    id: string;
    name: string;
    start_time: string;
    duration_min: number;
    trainer: { full_name: string } | null;
  };
}

export default function MyClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        class:classes (
          id,
          name,
          start_time,
          duration_min,
          trainer:profiles!classes_trainer_id_fkey(full_name)
        )
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      const validBookings = (data || []).filter(b => b.class !== null) as BookingWithClass[];
      setBookings(validBookings);
    }
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to cancel booking');
    } else {
      toast.success('Booking cancelled');
      fetchBookings();
    }
  };

  const upcomingBookings = bookings.filter(
    b => b.status !== 'cancelled' && new Date(b.class.start_time) > new Date()
  );

  const pastBookings = bookings.filter(
    b => b.status === 'cancelled' || new Date(b.class.start_time) <= new Date()
  );

  return (
    <MemberLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage your class bookings</p>
        </div>

        {/* Upcoming Classes */}
        <Card className="glass-card">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-2xl">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingBookings.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 border border-border gap-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{booking.class.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(booking.class.start_time), 'EEEE, MMMM d')} at{' '}
                        {format(new Date(booking.class.start_time), 'h:mm a')}
                      </div>
                      {booking.class.trainer && (
                        <p className="text-sm text-primary mt-1">
                          with {booking.class.trainer.full_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={booking.status as 'confirmed' | 'cancelled' | 'waitlist'} />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4 text-sm md:text-base">No upcoming classes</p>
                <Button onClick={() => navigate('/dashboard/book')}>Book a Class</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past/Cancelled Classes */}
        {pastBookings.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-2xl text-muted-foreground">
                <Calendar className="h-5 w-5" />
                Past & Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-3">
                {pastBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50 gap-3 opacity-60"
                  >
                    <div>
                      <p className="font-medium">{booking.class.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.class.start_time), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <StatusBadge status={booking.status as 'confirmed' | 'cancelled' | 'waitlist'} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MemberLayout>
  );
}
