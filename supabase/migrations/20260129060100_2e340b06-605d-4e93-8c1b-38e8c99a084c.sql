-- =============================================
-- GAMIFICATION RPG SYSTEM
-- =============================================

-- Levels table: defines XP required for each level
CREATE TABLE public.levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_num INTEGER NOT NULL UNIQUE,
  xp_required INTEGER NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User stats: tracks player progress
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Achievements definition table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition_type TEXT NOT NULL, -- 'first_workout', 'big_spender', 'social_butterfly', etc.
  condition_value INTEGER NOT NULL DEFAULT 1, -- threshold value
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User achievements: junction table for unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Levels: anyone can view
CREATE POLICY "Anyone can view levels" ON public.levels FOR SELECT USING (true);

-- User stats: users can view/manage their own
CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own stats" ON public.user_stats FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE USING (user_id = auth.uid());

-- Achievements: anyone can view
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User achievements: users can view/earn their own
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can earn achievements" ON public.user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at on user_stats
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed level data (RPG-style progression)
INSERT INTO public.levels (level_num, xp_required, title) VALUES
  (1, 0, 'Rookie'),
  (2, 100, 'Beginner'),
  (3, 250, 'Apprentice'),
  (4, 500, 'Enthusiast'),
  (5, 800, 'Dedicated'),
  (6, 1200, 'Committed'),
  (7, 1700, 'Warrior'),
  (8, 2300, 'Champion'),
  (9, 3000, 'Elite'),
  (10, 4000, 'Legend');

-- Seed achievements
INSERT INTO public.achievements (name, description, icon, condition_type, condition_value, xp_reward) VALUES
  ('First Workout', 'Complete your first workout video', '🏋️', 'videos_completed', 1, 25),
  ('Dedicated Learner', 'Complete 10 workout videos', '📚', 'videos_completed', 10, 100),
  ('First Purchase', 'Buy your first item from the store', '🛒', 'purchases_made', 1, 25),
  ('Big Spender', 'Make 5 purchases from the store', '💎', 'purchases_made', 5, 150),
  ('Social Butterfly', 'Create your first community post', '🦋', 'posts_created', 1, 25),
  ('Community Leader', 'Create 10 community posts', '👑', 'posts_created', 10, 100),
  ('Rising Star', 'Reach level 5', '⭐', 'level_reached', 5, 50),
  ('Legendary', 'Reach level 10', '🏆', 'level_reached', 10, 200);