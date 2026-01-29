-- Create video_categories table
CREATE TABLE public.video_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.video_categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watch_history table
CREATE TABLE public.watch_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_categories (anyone can view)
CREATE POLICY "Anyone can view video categories"
ON public.video_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage video categories"
ON public.video_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for videos (anyone can view)
CREATE POLICY "Anyone can view videos"
ON public.videos FOR SELECT
USING (true);

CREATE POLICY "Admins can manage videos"
ON public.videos FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for watch_history (users can manage their own)
CREATE POLICY "Users can view their own watch history"
ON public.watch_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watch history"
ON public.watch_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch history"
ON public.watch_history FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_videos_category_id ON public.videos(category_id);
CREATE INDEX idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX idx_watch_history_video_id ON public.watch_history(video_id);

-- Insert sample categories
INSERT INTO public.video_categories (name, description, sort_order) VALUES
('HIIT', 'High-intensity interval training for maximum calorie burn', 1),
('Yoga', 'Mind-body connection and flexibility training', 2),
('Strength', 'Build muscle and increase power', 3),
('Cardio', 'Heart-pumping endurance workouts', 4),
('Recovery', 'Stretching and mobility sessions', 5);

-- Insert sample videos with placeholder URLs
INSERT INTO public.videos (category_id, title, description, url, thumbnail_url, duration_seconds)
SELECT 
  c.id,
  v.title,
  v.description,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  v.thumbnail,
  v.duration
FROM public.video_categories c
CROSS JOIN (
  VALUES
    ('HIIT', '20-Min Fat Burner', 'Intense full-body workout', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=640', 1200),
    ('HIIT', 'Tabata Challenge', 'Classic 4-minute intervals', 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=640', 960),
    ('HIIT', 'Core Crusher', 'Abs-focused HIIT session', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=640', 900),
    ('Yoga', 'Morning Flow', 'Energizing sunrise practice', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=640', 1800),
    ('Yoga', 'Power Yoga', 'Strength-building yoga', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=640', 2400),
    ('Yoga', 'Bedtime Stretch', 'Relaxing evening routine', 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=640', 1200),
    ('Strength', 'Upper Body Blast', 'Arms, chest, and back', 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=640', 2100),
    ('Strength', 'Leg Day', 'Lower body strength', 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=640', 2400),
    ('Strength', 'Full Body Dumbbell', 'Complete strength workout', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=640', 2700),
    ('Cardio', 'Dance Cardio', 'Fun dance workout', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=640', 1800),
    ('Cardio', 'Boxing Basics', 'Punch your way to fitness', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=640', 1500),
    ('Cardio', 'Jump Rope Jam', 'Classic cardio reimagined', 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=640', 900),
    ('Recovery', 'Deep Stretch', 'Full body flexibility', 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=640', 1800),
    ('Recovery', 'Foam Rolling', 'Self-massage techniques', 'https://images.unsplash.com/photo-1570655652364-2e0a67455ac6?w=640', 1200),
    ('Recovery', 'Meditation', 'Guided mindfulness', 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=640', 600)
) AS v(cat_name, title, description, thumbnail, duration)
WHERE c.name = v.cat_name;