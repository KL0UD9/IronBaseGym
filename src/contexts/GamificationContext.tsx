import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Level {
  id: string;
  level_num: number;
  xp_required: number;
  title: string;
}

interface UserStats {
  id: string;
  user_id: string;
  current_xp: number;
  current_level: number;
  total_xp_earned: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements: Achievement;
}

interface GamificationContextType {
  stats: UserStats | null;
  levels: Level[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  currentLevel: Level | null;
  nextLevel: Level | null;
  xpToNextLevel: number;
  xpProgress: number;
  isLoading: boolean;
  awardXP: (amount: number, source: string) => Promise<void>;
  showLevelUpModal: boolean;
  setShowLevelUpModal: (show: boolean) => void;
  newLevel: Level | null;
  recentXPGain: { amount: number; source: string } | null;
  checkAchievements: (type: string, value: number) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// XP Rewards configuration
export const XP_REWARDS = {
  VIDEO_COMPLETED: 50,
  PURCHASE_MADE: 100,
  POST_CREATED: 10,
} as const;

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevel, setNewLevel] = useState<Level | null>(null);
  const [recentXPGain, setRecentXPGain] = useState<{ amount: number; source: string } | null>(null);

  // Fetch levels
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level_num', { ascending: true });
      if (error) throw error;
      return data as Level[];
    },
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no stats exist, create them
      if (!data) {
        const { data: newStats, error: insertError } = await supabase
          .from('user_stats')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newStats as UserStats;
      }
      
      return data as UserStats;
    },
    enabled: !!user,
  });

  // Fetch all achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('condition_value', { ascending: true });
      if (error) throw error;
      return data as Achievement[];
    },
  });

  // Fetch user achievements
  const { data: userAchievements = [] } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });

  // Calculate level info
  const currentLevel = levels.find(l => l.level_num === (stats?.current_level || 1)) || null;
  const nextLevel = levels.find(l => l.level_num === (stats?.current_level || 1) + 1) || null;
  const xpToNextLevel = nextLevel ? nextLevel.xp_required - (stats?.current_xp || 0) : 0;
  const xpProgress = nextLevel && currentLevel
    ? ((stats?.current_xp || 0) - currentLevel.xp_required) / (nextLevel.xp_required - currentLevel.xp_required) * 100
    : 100;

  // Award XP mutation
  const awardXP = useCallback(async (amount: number, source: string) => {
    if (!user || !stats) return;

    const newXP = stats.current_xp + amount;
    const newTotalXP = stats.total_xp_earned + amount;
    
    // Calculate new level
    let newLevelNum = stats.current_level;
    const sortedLevels = [...levels].sort((a, b) => b.level_num - a.level_num);
    
    for (const level of sortedLevels) {
      if (newXP >= level.xp_required) {
        newLevelNum = level.level_num;
        break;
      }
    }

    const { error } = await supabase
      .from('user_stats')
      .update({
        current_xp: newXP,
        current_level: newLevelNum,
        total_xp_earned: newTotalXP,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error awarding XP:', error);
      return;
    }

    // Show XP gain notification
    setRecentXPGain({ amount, source });
    setTimeout(() => setRecentXPGain(null), 3000);

    // Check for level up
    if (newLevelNum > stats.current_level) {
      const leveledUp = levels.find(l => l.level_num === newLevelNum);
      if (leveledUp) {
        setNewLevel(leveledUp);
        setShowLevelUpModal(true);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['user-stats', user.id] });
  }, [user, stats, levels, queryClient]);

  // Check and unlock achievements
  const checkAchievements = useCallback(async (type: string, value: number) => {
    if (!user) return;

    const unlockedIds = userAchievements.map(ua => ua.achievement_id);
    const eligibleAchievements = achievements.filter(
      a => a.condition_type === type && 
           a.condition_value <= value && 
           !unlockedIds.includes(a.id)
    );

    for (const achievement of eligibleAchievements) {
      const { error } = await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: achievement.id });

      if (!error && achievement.xp_reward > 0) {
        await awardXP(achievement.xp_reward, `Achievement: ${achievement.name}`);
      }
    }

    if (eligibleAchievements.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', user.id] });
    }
  }, [user, achievements, userAchievements, awardXP, queryClient]);

  return (
    <GamificationContext.Provider
      value={{
        stats,
        levels,
        achievements,
        userAchievements,
        currentLevel,
        nextLevel,
        xpToNextLevel,
        xpProgress,
        isLoading: statsLoading,
        awardXP,
        showLevelUpModal,
        setShowLevelUpModal,
        newLevel,
        recentXPGain,
        checkAchievements,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
