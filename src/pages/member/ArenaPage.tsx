import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { TournamentCard } from '@/components/arena/TournamentCard';
import { TournamentBracket } from '@/components/arena/TournamentBracket';
import { CreateTournamentModal } from '@/components/arena/CreateTournamentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Swords, Trophy, Plus, ArrowLeft, Users, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  status: string;
  max_participants: number;
}

export default function ArenaPage() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch tournaments
  const { data: tournaments = [], isLoading: loadingTournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data as Tournament[];
    },
  });

  // Fetch participant counts
  const { data: participantCounts = {} } = useQuery({
    queryKey: ['tournament-participant-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('tournament_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(p => {
        counts[p.tournament_id] = (counts[p.tournament_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch user's joined tournaments
  const { data: userJoinedTournaments = [] } = useQuery({
    queryKey: ['user-tournaments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('tournament_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(p => p.tournament_id);
    },
    enabled: !!user,
  });

  // Fetch selected tournament details
  const { data: selectedTournament, isLoading: loadingTournament } = useQuery({
    queryKey: ['tournament', selectedTournamentId],
    queryFn: async () => {
      if (!selectedTournamentId) return null;
      
      // Fetch tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', selectedTournamentId)
        .single();
      
      if (tournamentError) throw tournamentError;

      // Fetch matches with player info
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          round_number,
          match_number,
          player_1_id,
          player_2_id,
          winner_id,
          scheduled_at,
          completed_at
        `)
        .eq('tournament_id', selectedTournamentId)
        .order('round_number')
        .order('match_number');
      
      if (matchesError) throw matchesError;

      // Fetch player profiles for all unique player IDs
      const playerIds = new Set<string>();
      matches.forEach(m => {
        if (m.player_1_id) playerIds.add(m.player_1_id);
        if (m.player_2_id) playerIds.add(m.player_2_id);
        if (m.winner_id) playerIds.add(m.winner_id);
      });

      let players: Record<string, { id: string; full_name: string }> = {};
      if (playerIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(playerIds));
        
        if (profilesData) {
          profilesData.forEach(p => {
            players[p.id] = p;
          });
        }
      }

      // Enrich matches with player data
      const enrichedMatches = matches.map(m => ({
        ...m,
        player_1: m.player_1_id ? players[m.player_1_id] : null,
        player_2: m.player_2_id ? players[m.player_2_id] : null,
        winner: m.winner_id ? players[m.winner_id] : null,
      }));

      // Fetch user predictions
      let predictions: Array<{ match_id: string; predicted_winner_id: string }> = [];
      if (user) {
        const { data: predictionsData } = await supabase
          .from('predictions')
          .select('match_id, predicted_winner_id')
          .eq('user_id', user.id)
          .in('match_id', matches.map(m => m.id));
        
        if (predictionsData) {
          predictions = predictionsData;
        }
      }

      return {
        ...tournament,
        matches: enrichedMatches,
        predictions,
      };
    },
    enabled: !!selectedTournamentId,
  });

  // Join tournament mutation
  const joinMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get current participant count for seed number
      const { count } = await supabase
        .from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);
      
      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          seed_number: (count || 0) + 1,
        });
      
      if (error) throw error;

      // If this fills a match slot in round 1, update the match
      const seedNumber = (count || 0) + 1;
      const matchNumber = Math.ceil(seedNumber / 2);
      const isPlayer1 = seedNumber % 2 === 1;

      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('round_number', 1)
        .eq('match_number', matchNumber)
        .maybeSingle();

      if (match) {
        const updateField = isPlayer1 ? 'player_1_id' : 'player_2_id';
        await supabase
          .from('matches')
          .update({ [updateField]: user.id })
          .eq('id', match.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['user-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-participant-counts'] });
      toast.success(t('arena.joinedTournament'));
    },
    onError: () => {
      toast.error(t('arena.errorJoining'));
    },
  });

  // Start tournament mutation (admin only)
  const startMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'active' })
        .eq('id', tournamentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', selectedTournamentId] });
      toast.success(t('arena.tournamentStarted'));
    },
  });

  const tournamentsWithCounts = tournaments.map(t => ({
    ...t,
    participant_count: participantCounts[t.id] || 0,
  }));

  const upcomingTournaments = tournamentsWithCounts.filter(t => t.status === 'upcoming');
  const activeTournaments = tournamentsWithCounts.filter(t => t.status === 'active');
  const completedTournaments = tournamentsWithCounts.filter(t => t.status === 'completed');

  // Tournament detail view
  if (selectedTournamentId && selectedTournament) {
    return (
      <MemberLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedTournamentId(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Trophy className="h-7 w-7 text-primary" />
                  {selectedTournament.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={
                    selectedTournament.status === 'active' 
                      ? 'bg-green-500/10 text-green-500' 
                      : selectedTournament.status === 'completed'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-blue-500/10 text-blue-500'
                  }>
                    {t(`arena.status.${selectedTournament.status}`)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedTournament.max_participants} {t('arena.participants')}
                  </span>
                </div>
              </div>
            </div>
            {isAdmin && selectedTournament.status === 'upcoming' && (
              <Button onClick={() => startMutation.mutate(selectedTournamentId)} className="gap-2">
                <Swords className="h-4 w-4" />
                {t('arena.startTournament')}
              </Button>
            )}
          </div>

          {/* Bracket */}
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5" />
                {t('arena.bracket')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTournament ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TournamentBracket
                  tournamentId={selectedTournamentId}
                  matches={selectedTournament.matches}
                  predictions={selectedTournament.predictions}
                  maxParticipants={selectedTournament.max_participants}
                  status={selectedTournament.status}
                />
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                  <span>{t('arena.winner')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span>{t('arena.yourPrediction')}</span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30" />
                    <span>{t('arena.clickToSetWinner')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MemberLayout>
    );
  }

  // Tournament list view
  return (
    <MemberLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Swords className="h-7 w-7 text-primary" />
              {t('arena.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('arena.subtitle')}</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('arena.createTournament')}
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="py-4 text-center">
              <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{tournaments.length}</p>
              <p className="text-xs text-muted-foreground">{t('arena.totalTournaments')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4 text-center">
              <Swords className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{activeTournaments.length}</p>
              <p className="text-xs text-muted-foreground">{t('arena.activeTournaments')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4 text-center">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{userJoinedTournaments.length}</p>
              <p className="text-xs text-muted-foreground">{t('arena.yourTournaments')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4 text-center">
              <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">{t('arena.predictions')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tournament Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Swords className="h-4 w-4" />
              {t('arena.status.active')} ({activeTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Users className="h-4 w-4" />
              {t('arena.status.upcoming')} ({upcomingTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Trophy className="h-4 w-4" />
              {t('arena.status.completed')} ({completedTournaments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeTournaments.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('arena.noActiveTournaments')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onView={setSelectedTournamentId}
                    isJoined={userJoinedTournaments.includes(tournament.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingTournaments.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('arena.noUpcomingTournaments')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onView={setSelectedTournamentId}
                    onJoin={(id) => joinMutation.mutate(id)}
                    isJoined={userJoinedTournaments.includes(tournament.id)}
                    isJoining={joinMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedTournaments.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('arena.noCompletedTournaments')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onView={setSelectedTournamentId}
                    isJoined={userJoinedTournaments.includes(tournament.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Tournament Modal */}
        <CreateTournamentModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </MemberLayout>
  );
}
