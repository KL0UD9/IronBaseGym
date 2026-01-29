import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, User, Target } from 'lucide-react';
import { toast } from 'sonner';

interface Player {
  id: string;
  full_name: string;
}

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player_1_id: string | null;
  player_2_id: string | null;
  winner_id: string | null;
  player_1?: Player | null;
  player_2?: Player | null;
  winner?: Player | null;
}

interface Prediction {
  match_id: string;
  predicted_winner_id: string;
}

interface TournamentBracketProps {
  tournamentId: string;
  matches: Match[];
  predictions: Prediction[];
  maxParticipants: number;
  status: string;
}

export function TournamentBracket({ 
  tournamentId, 
  matches, 
  predictions, 
  maxParticipants, 
  status 
}: TournamentBracketProps) {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Calculate rounds from max participants
  const totalRounds = Math.log2(maxParticipants);
  
  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped: Record<number, Match[]> = {};
    for (let i = 1; i <= totalRounds; i++) {
      grouped[i] = matches
        .filter(m => m.round_number === i)
        .sort((a, b) => a.match_number - b.match_number);
    }
    return grouped;
  }, [matches, totalRounds]);

  // Set winner mutation (admin only)
  const setWinnerMutation = useMutation({
    mutationFn: async ({ matchId, winnerId, roundNumber, matchNumber }: { 
      matchId: string; 
      winnerId: string; 
      roundNumber: number;
      matchNumber: number;
    }) => {
      // Update current match winner
      const { error } = await supabase
        .from('matches')
        .update({ 
          winner_id: winnerId,
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);
      
      if (error) throw error;

      // Move winner to next round if not final
      if (roundNumber < totalRounds) {
        const nextRound = roundNumber + 1;
        const nextMatchNumber = Math.ceil(matchNumber / 2);
        const isPlayer1 = matchNumber % 2 === 1;

        // Find or update the next match
        const { data: nextMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('round_number', nextRound)
          .eq('match_number', nextMatchNumber)
          .maybeSingle();

        if (nextMatch) {
          const updateField = isPlayer1 ? 'player_1_id' : 'player_2_id';
          await supabase
            .from('matches')
            .update({ [updateField]: winnerId })
            .eq('id', nextMatch.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success(t('arena.winnerSet'));
    },
    onError: () => {
      toast.error(t('arena.errorSettingWinner'));
    },
  });

  // Predict winner mutation
  const predictMutation = useMutation({
    mutationFn: async ({ matchId, predictedWinnerId }: { matchId: string; predictedWinnerId: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('predictions')
        .upsert({
          user_id: user.id,
          match_id: matchId,
          predicted_winner_id: predictedWinnerId,
        }, {
          onConflict: 'user_id,match_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      toast.success(t('arena.predictionSaved'));
    },
    onError: () => {
      toast.error(t('arena.errorSavingPrediction'));
    },
  });

  const getUserPrediction = (matchId: string) => {
    return predictions.find(p => p.match_id === matchId);
  };

  const getRoundName = (round: number): string => {
    if (round === totalRounds) return t('arena.rounds.final');
    if (round === totalRounds - 1) return t('arena.rounds.semiFinal');
    if (round === totalRounds - 2) return t('arena.rounds.quarterFinal');
    return `${t('arena.round')} ${round}`;
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max p-4">
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((roundNum) => {
          const roundMatches = matchesByRound[roundNum] || [];
          const matchHeight = 120;
          const gapMultiplier = Math.pow(2, roundNum - 1);
          
          return (
            <div key={roundNum} className="flex flex-col">
              {/* Round Header */}
              <div className="text-center mb-4">
                <Badge variant={roundNum === totalRounds ? 'default' : 'secondary'} className="gap-1">
                  {roundNum === totalRounds && <Trophy className="h-3 w-3" />}
                  {getRoundName(roundNum)}
                </Badge>
              </div>
              
              {/* Matches */}
              <div 
                className="flex flex-col justify-around flex-1"
                style={{ gap: `${(gapMultiplier - 1) * matchHeight}px` }}
              >
                {roundMatches.map((match, matchIdx) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isAdmin={isAdmin}
                    isFinal={roundNum === totalRounds}
                    tournamentStatus={status}
                    userPrediction={getUserPrediction(match.id)}
                    onSetWinner={(winnerId) => setWinnerMutation.mutate({
                      matchId: match.id,
                      winnerId,
                      roundNumber: match.round_number,
                      matchNumber: match.match_number,
                    })}
                    onPredict={(predictedWinnerId) => predictMutation.mutate({
                      matchId: match.id,
                      predictedWinnerId,
                    })}
                    isSettingWinner={setWinnerMutation.isPending}
                    isPredicting={predictMutation.isPending}
                  />
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Champion Display */}
        <div className="flex flex-col items-center justify-center min-w-[200px]">
          <div className="text-center mb-4">
            <Badge className="gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
              <Crown className="h-3 w-3" />
              {t('arena.champion')}
            </Badge>
          </div>
          <ChampionSlot matches={matchesByRound[totalRounds] || []} />
        </div>
      </div>
      
      {/* SVG Lines connecting brackets */}
      <BracketLines 
        matchesByRound={matchesByRound} 
        totalRounds={totalRounds} 
        maxParticipants={maxParticipants}
      />
    </div>
  );
}

// Match Card Component
interface MatchCardProps {
  match: Match;
  isAdmin: boolean;
  isFinal: boolean;
  tournamentStatus: string;
  userPrediction?: Prediction;
  onSetWinner: (winnerId: string) => void;
  onPredict: (predictedWinnerId: string) => void;
  isSettingWinner: boolean;
  isPredicting: boolean;
}

function MatchCard({ 
  match, 
  isAdmin, 
  isFinal, 
  tournamentStatus,
  userPrediction,
  onSetWinner, 
  onPredict,
  isSettingWinner,
  isPredicting,
}: MatchCardProps) {
  const { t } = useTranslation();
  const [showPredictOptions, setShowPredictOptions] = useState(false);
  
  const isCompleted = !!match.winner_id;
  const canPredict = !isCompleted && match.player_1_id && match.player_2_id && tournamentStatus === 'active';
  const canSetWinner = isAdmin && !isCompleted && match.player_1_id && match.player_2_id;

  const PlayerSlot = ({ player, playerId, isWinner }: { 
    player?: Player | null; 
    playerId: string | null;
    isWinner: boolean;
  }) => (
    <div 
      className={cn(
        "flex items-center gap-2 p-2 rounded transition-all",
        isWinner && "bg-green-500/20 border border-green-500/30",
        !isWinner && isCompleted && "opacity-50",
        canSetWinner && playerId && "cursor-pointer hover:bg-primary/10 hover:border-primary/30 border border-transparent"
      )}
      onClick={() => {
        if (canSetWinner && playerId) {
          onSetWinner(playerId);
        }
      }}
    >
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs",
        isWinner ? "bg-green-500 text-white" : "bg-muted"
      )}>
        {isWinner ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
      </div>
      <span className={cn(
        "text-sm font-medium flex-1 truncate",
        isWinner && "text-green-600 dark:text-green-400"
      )}>
        {player?.full_name || (playerId ? 'Loading...' : t('arena.tbd'))}
      </span>
      {userPrediction?.predicted_winner_id === playerId && (
        <span title={t('arena.yourPrediction')}>
          <Target className="h-3 w-3 text-primary" />
        </span>
      )}
    </div>
  );

  return (
    <div className={cn(
      "w-[220px] bg-card border rounded-lg overflow-hidden shadow-sm",
      isFinal && "border-primary/50 bg-primary/5",
      isCompleted && "border-green-500/30"
    )}>
      <PlayerSlot 
        player={match.player_1} 
        playerId={match.player_1_id}
        isWinner={match.winner_id === match.player_1_id}
      />
      <div className="border-t border-dashed" />
      <PlayerSlot 
        player={match.player_2} 
        playerId={match.player_2_id}
        isWinner={match.winner_id === match.player_2_id}
      />
      
      {/* Predict Button */}
      {canPredict && !isAdmin && (
        <div className="p-2 border-t bg-muted/30">
          {showPredictOptions ? (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs h-7"
                onClick={() => {
                  onPredict(match.player_1_id!);
                  setShowPredictOptions(false);
                }}
                disabled={isPredicting}
              >
                {match.player_1?.full_name?.split(' ')[0] || 'P1'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs h-7"
                onClick={() => {
                  onPredict(match.player_2_id!);
                  setShowPredictOptions(false);
                }}
                disabled={isPredicting}
              >
                {match.player_2?.full_name?.split(' ')[0] || 'P2'}
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full text-xs h-7 gap-1"
              onClick={() => setShowPredictOptions(true)}
            >
              <Target className="h-3 w-3" />
              {userPrediction ? t('arena.changePrediction') : t('arena.predictWinner')}
            </Button>
          )}
        </div>
      )}
      
      {/* Admin hint */}
      {canSetWinner && (
        <div className="px-2 py-1 bg-amber-500/10 text-center">
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {t('arena.clickToSetWinner')}
          </span>
        </div>
      )}
    </div>
  );
}

// Champion Slot Component
function ChampionSlot({ matches }: { matches: Match[] }) {
  const { t } = useTranslation();
  const finalMatch = matches[0];
  const champion = finalMatch?.winner;

  if (!champion) {
    return (
      <div className="w-[180px] h-[100px] border-2 border-dashed border-yellow-500/30 rounded-lg flex items-center justify-center bg-gradient-to-br from-yellow-500/5 to-amber-500/10">
        <div className="text-center text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500/50" />
          <p className="text-sm">{t('arena.awaitingChampion')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[180px] p-4 border-2 border-yellow-500 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/20 text-center animate-pulse-slow">
      <Trophy className="h-10 w-10 mx-auto mb-2 text-yellow-500" />
      <p className="font-bold text-lg">{champion.full_name}</p>
      <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
        {t('arena.champion')}
      </Badge>
    </div>
  );
}

// SVG Bracket Lines Component
function BracketLines({ 
  matchesByRound, 
  totalRounds,
  maxParticipants 
}: { 
  matchesByRound: Record<number, Match[]>;
  totalRounds: number;
  maxParticipants: number;
}) {
  // This is a simplified version - in a production app you'd calculate exact positions
  // For now, we'll use CSS pseudo-elements in the parent layout
  return null;
}
