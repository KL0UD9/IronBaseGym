import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, ArrowRight, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  status: string;
  max_participants: number;
  participant_count?: number;
}

interface TournamentCardProps {
  tournament: Tournament;
  onView: (id: string) => void;
  onJoin?: (id: string) => void;
  isJoined?: boolean;
  isJoining?: boolean;
}

export function TournamentCard({ 
  tournament, 
  onView, 
  onJoin,
  isJoined,
  isJoining
}: TournamentCardProps) {
  const { t } = useTranslation();
  
  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-muted text-muted-foreground border-muted',
  };

  const participantCount = tournament.participant_count || 0;
  const isFull = participantCount >= tournament.max_participants;
  const canJoin = tournament.status === 'upcoming' && !isFull && !isJoined;

  return (
    <Card className="glass-card hover:border-primary/30 transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Swords className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{tournament.name}</CardTitle>
              <CardDescription className="line-clamp-1">
                {tournament.description || t('arena.noDescription')}
              </CardDescription>
            </div>
          </div>
          <Badge className={cn('capitalize', statusColors[tournament.status])}>
            {t(`arena.status.${tournament.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(tournament.start_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {participantCount}/{tournament.max_participants}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span>{Math.log2(tournament.max_participants)} {t('arena.rounds.plural')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {canJoin && onJoin && (
            <Button 
              variant="default" 
              className="flex-1 gap-2"
              onClick={() => onJoin(tournament.id)}
              disabled={isJoining}
            >
              <Users className="h-4 w-4" />
              {t('arena.join')}
            </Button>
          )}
          {isJoined && (
            <Badge variant="secondary" className="py-1.5">
              {t('arena.joined')}
            </Badge>
          )}
          <Button 
            variant={canJoin ? 'outline' : 'default'}
            className="flex-1 gap-2 group-hover:gap-3 transition-all"
            onClick={() => onView(tournament.id)}
          >
            {t('arena.viewBracket')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
