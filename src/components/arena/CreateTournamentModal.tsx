import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateTournamentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTournamentModal({ open, onOpenChange }: CreateTournamentModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [maxParticipants, setMaxParticipants] = useState('8');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !startDate) throw new Error('Missing required fields');
      
      const participantCount = parseInt(maxParticipants);
      
      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name,
          description: description || null,
          start_date: startDate.toISOString(),
          max_participants: participantCount,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (tournamentError) throw tournamentError;

      // Create empty match slots for the bracket
      const totalRounds = Math.log2(participantCount);
      const matchInserts = [];
      
      for (let round = 1; round <= totalRounds; round++) {
        const matchesInRound = participantCount / Math.pow(2, round);
        for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
          matchInserts.push({
            tournament_id: tournament.id,
            round_number: round,
            match_number: matchNum,
          });
        }
      }

      const { error: matchError } = await supabase
        .from('matches')
        .insert(matchInserts);
      
      if (matchError) throw matchError;
      
      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success(t('arena.tournamentCreated'));
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('arena.errorCreating'));
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartDate(undefined);
    setMaxParticipants('8');
  };

  const isValid = name.trim() && startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t('arena.createTournament')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('arena.tournamentName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('arena.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('arena.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('arena.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('arena.startDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : t('arena.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>{t('arena.bracketSize')}</Label>
            <Select value={maxParticipants} onValueChange={setMaxParticipants}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 {t('arena.participants')} (2 {t('arena.rounds.plural')})</SelectItem>
                <SelectItem value="8">8 {t('arena.participants')} (3 {t('arena.rounds.plural')})</SelectItem>
                <SelectItem value="16">16 {t('arena.participants')} (4 {t('arena.rounds.plural')})</SelectItem>
                <SelectItem value="32">32 {t('arena.participants')} (5 {t('arena.rounds.plural')})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('arena.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
