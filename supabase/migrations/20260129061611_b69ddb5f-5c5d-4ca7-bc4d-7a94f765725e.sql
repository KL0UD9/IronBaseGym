-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  max_participants INTEGER NOT NULL DEFAULT 8 CHECK (max_participants IN (4, 8, 16, 32)),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament participants table
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seed_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player_1_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player_2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, round_number, match_number)
);

-- Create predictions table for betting UI
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_winner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- Create indexes
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX idx_matches_round ON public.matches(tournament_id, round_number);
CREATE INDEX idx_predictions_match ON public.predictions(match_id);
CREATE INDEX idx_predictions_user ON public.predictions(user_id);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments"
ON public.tournaments FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tournaments"
ON public.tournaments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tournament participants policies
CREATE POLICY "Anyone can view participants"
ON public.tournament_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join tournaments"
ON public.tournament_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage participants"
ON public.tournament_participants FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Matches policies
CREATE POLICY "Anyone can view matches"
ON public.matches FOR SELECT
USING (true);

CREATE POLICY "Admins can manage matches"
ON public.matches FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Predictions policies
CREATE POLICY "Users can view their own predictions"
ON public.predictions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own predictions"
ON public.predictions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own predictions"
ON public.predictions FOR UPDATE
USING (user_id = auth.uid());

-- Admins can view all predictions
CREATE POLICY "Admins can view all predictions"
ON public.predictions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger for tournaments
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();