import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Trainer { id: string; full_name: string; }
interface ClassItem { id: string; name: string; start_time: string; duration_min: number; capacity: number; description: string | null; trainer: { full_name: string } | null; }

export default function ClassesPage() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [capacity, setCapacity] = useState('20');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);
    const { data: classesData } = await supabase.from('classes')
      .select(`id, name, start_time, duration_min, capacity, description, trainer:profiles!classes_trainer_id_fkey(full_name)`)
      .gte('start_time', weekStart.toISOString()).lt('start_time', weekEnd.toISOString())
      .order('start_time', { ascending: true });
    setClasses((classesData as ClassItem[]) || []);
    const { data: trainersData } = await supabase.from('profiles').select('id, full_name').eq('role', 'trainer');
    setTrainers(trainersData || []);
    setLoading(false);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !startTime) { toast.error(t('common.error')); return; }
    const [hours, minutes] = startTime.split(':');
    const classDateTime = new Date(selectedDate);
    classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const { error } = await supabase.from('classes').insert({ name: className, trainer_id: trainerId || null, start_time: classDateTime.toISOString(), duration_min: parseInt(duration), capacity: parseInt(capacity) });
    if (error) { toast.error(t('common.error')); console.error(error); }
    else { toast.success(t('common.success')); setIsDialogOpen(false); resetForm(); fetchData(); }
  };

  const resetForm = () => { setClassName(''); setTrainerId(''); setStartTime(''); setDuration('60'); setCapacity('20'); setSelectedDate(null); };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    return { date, label: format(date, 'EEE'), fullDate: format(date, 'MMM d'), isToday: isToday(date) };
  });

  const getClassesForDay = (date: Date) => classes.filter(c => new Date(c.start_time).toDateString() === date.toDateString());
  const openDialogForDate = (date: Date) => { setSelectedDate(date); setIsDialogOpen(true); };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.classes.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('admin.classes.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />{t('admin.classes.createClass')}</Button></DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle>{t('admin.classes.createNewClass')}</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-2"><Label>{t('admin.classes.className')}</Label><Input placeholder={t('admin.classes.classNamePlaceholder')} value={className} onChange={(e) => setClassName(e.target.value)} required /></div>
                <div className="space-y-2">
                  <Label>{t('admin.classes.trainer')}</Label>
                  <Select value={trainerId} onValueChange={setTrainerId}>
                    <SelectTrigger><SelectValue placeholder={t('admin.classes.selectTrainer')} /></SelectTrigger>
                    <SelectContent>{trainers.map((tr) => (<SelectItem key={tr.id} value={tr.id}>{tr.full_name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t('admin.classes.date')}</Label><Input type="date" value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''} onChange={(e) => setSelectedDate(new Date(e.target.value))} required /></div>
                  <div className="space-y-2"><Label>{t('admin.classes.startTime')}</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t('admin.classes.duration')}</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="15" max="180" /></div>
                  <div className="space-y-2"><Label>{t('admin.classes.capacity')}</Label><Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" max="100" /></div>
                </div>
                <Button type="submit" className="w-full">{t('admin.classes.createClass')}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />{t('admin.classes.thisWeek')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => (
                <div key={day.label} className="space-y-3">
                  <div onClick={() => openDialogForDate(day.date)} className={cn("text-center p-3 rounded-lg cursor-pointer transition-all hover:bg-primary/10", day.isToday && "bg-primary/10 border border-primary/30")}>
                    <p className={cn("text-sm font-medium", day.isToday ? "text-primary" : "text-muted-foreground")}>{day.label}</p>
                    <p className={cn("text-lg font-bold", day.isToday ? "text-primary" : "text-foreground")}>{format(day.date, 'd')}</p>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {getClassesForDay(day.date).map((classItem) => (
                      <div key={classItem.id} className="p-3 rounded-lg bg-gradient-card border border-primary/10 hover:border-primary/30 transition-all">
                        <p className="font-medium text-sm">{classItem.name}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{format(new Date(classItem.start_time), 'h:mm a')}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{classItem.capacity} {t('admin.classes.spots')}</div>
                        </div>
                        {classItem.trainer && <p className="mt-2 text-xs text-primary">{classItem.trainer.full_name}</p>}
                      </div>
                    ))}
                    {getClassesForDay(day.date).length === 0 && (
                      <button onClick={() => openDialogForDate(day.date)} className="w-full h-full min-h-[100px] flex items-center justify-center rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary"><Plus className="h-5 w-5" /></button>
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
