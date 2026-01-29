import { useGamification } from '@/contexts/GamificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function TrophyCase() {
  const { achievements, userAchievements, stats } = useGamification();
  const { t } = useTranslation();

  const unlockedIds = userAchievements.map(ua => ua.achievement_id);
  
  const unlockedAchievements = achievements.filter(a => unlockedIds.includes(a.id));
  const lockedAchievements = achievements.filter(a => !unlockedIds.includes(a.id));

  const getUnlockDate = (achievementId: string) => {
    const ua = userAchievements.find(u => u.achievement_id === achievementId);
    return ua ? formatDistanceToNow(new Date(ua.unlocked_at), { addSuffix: true }) : null;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('gamification.trophyCase.title')}
          <Badge variant="secondary" className="ml-auto">
            {unlockedAchievements.length}/{achievements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {t('gamification.trophyCase.unlocked')}
            </h4>
            <div className="grid gap-3">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 animate-fade-in"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      {t('gamification.trophyCase.unlockedAt')} {getUnlockDate(achievement.id)}
                    </p>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
                    +{achievement.xp_reward} XP
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('gamification.trophyCase.locked')}
            </h4>
            <div className="grid gap-3">
              {lockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border opacity-60"
                >
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-2xl grayscale">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    +{achievement.xp_reward} XP
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {achievements.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('gamification.trophyCase.empty')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
