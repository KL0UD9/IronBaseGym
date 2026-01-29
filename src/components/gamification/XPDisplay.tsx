import { useGamification } from '@/contexts/GamificationContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPDisplayProps {
  compact?: boolean;
  className?: string;
}

export function XPDisplay({ compact = false, className }: XPDisplayProps) {
  const { stats, currentLevel, nextLevel, xpProgress, recentXPGain } = useGamification();

  if (!stats || !currentLevel) return null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
          <Sparkles className="h-3 w-3" />
          Lv.{stats.current_level}
        </Badge>
        <span className="text-xs text-muted-foreground">{stats.current_xp} XP</span>
        
        {/* XP Gain Animation */}
        {recentXPGain && (
          <span className="text-xs font-bold text-green-500 animate-fade-in flex items-center gap-1">
            <Zap className="h-3 w-3" />
            +{recentXPGain.amount} XP
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 p-4 rounded-lg bg-card border border-border", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{stats.current_level}</span>
          </div>
          <div>
            <p className="font-semibold">{currentLevel.title}</p>
            <p className="text-xs text-muted-foreground">{stats.current_xp} XP Total</p>
          </div>
        </div>
        
        {nextLevel && (
          <Badge variant="outline" className="text-xs">
            Next: {nextLevel.title}
          </Badge>
        )}
      </div>

      {nextLevel && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentLevel.xp_required} XP</span>
            <span>{nextLevel.xp_required} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {nextLevel.xp_required - stats.current_xp} XP to level {nextLevel.level_num}
          </p>
        </div>
      )}

      {/* XP Gain Animation */}
      {recentXPGain && (
        <div className="text-center py-2 animate-fade-in">
          <span className="text-sm font-bold text-green-500 flex items-center justify-center gap-1">
            <Zap className="h-4 w-4" />
            +{recentXPGain.amount} XP ({recentXPGain.source})
          </span>
        </div>
      )}
    </div>
  );
}
