-- Create foods table for nutrition data
CREATE TABLE public.foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,2) NOT NULL DEFAULT 0,
  fat NUMERIC(6,2) NOT NULL DEFAULT 0,
  serving_size TEXT NOT NULL DEFAULT '100g',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily food logs table
CREATE TABLE public.daily_food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL DEFAULT 'snack',
  servings NUMERIC(4,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_daily_food_logs_user_date ON public.daily_food_logs(user_id, date);
CREATE INDEX idx_foods_name ON public.foods USING gin(to_tsvector('english', name));

-- Enable RLS
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_food_logs ENABLE ROW LEVEL SECURITY;

-- Foods policies (anyone can view, admins can manage)
CREATE POLICY "Anyone can view foods"
ON public.foods FOR SELECT
USING (true);

CREATE POLICY "Admins can manage foods"
ON public.foods FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Daily food logs policies
CREATE POLICY "Users can view their own food logs"
ON public.daily_food_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own food logs"
ON public.daily_food_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own food logs"
ON public.daily_food_logs FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own food logs"
ON public.daily_food_logs FOR DELETE
USING (user_id = auth.uid());

-- Seed 50 common foods
INSERT INTO public.foods (name, calories, protein, carbs, fat, serving_size, category) VALUES
-- Proteins
('Chicken Breast (grilled)', 165, 31.0, 0, 3.6, '100g', 'protein'),
('Salmon (baked)', 208, 20.0, 0, 13.0, '100g', 'protein'),
('Eggs (whole)', 155, 13.0, 1.1, 11.0, '100g (2 eggs)', 'protein'),
('Egg Whites', 52, 11.0, 0.7, 0.2, '100g', 'protein'),
('Ground Beef (lean)', 250, 26.0, 0, 15.0, '100g', 'protein'),
('Turkey Breast', 135, 30.0, 0, 1.0, '100g', 'protein'),
('Tuna (canned)', 116, 26.0, 0, 0.8, '100g', 'protein'),
('Shrimp', 99, 24.0, 0.2, 0.3, '100g', 'protein'),
('Whey Protein Powder', 120, 24.0, 3.0, 1.5, '1 scoop (30g)', 'protein'),
('Greek Yogurt (plain)', 100, 17.0, 6.0, 0.7, '170g', 'protein'),
('Cottage Cheese', 98, 11.0, 3.4, 4.3, '100g', 'protein'),
('Tofu (firm)', 144, 17.0, 3.0, 8.0, '100g', 'protein'),

-- Carbs
('White Rice (cooked)', 130, 2.7, 28.0, 0.3, '100g', 'carbs'),
('Brown Rice (cooked)', 112, 2.6, 24.0, 0.9, '100g', 'carbs'),
('Oatmeal (cooked)', 68, 2.4, 12.0, 1.4, '100g', 'carbs'),
('Sweet Potato', 86, 1.6, 20.0, 0.1, '100g', 'carbs'),
('Quinoa (cooked)', 120, 4.4, 21.0, 1.9, '100g', 'carbs'),
('Whole Wheat Bread', 247, 13.0, 41.0, 4.2, '100g (3 slices)', 'carbs'),
('Pasta (cooked)', 131, 5.0, 25.0, 1.1, '100g', 'carbs'),
('Banana', 89, 1.1, 23.0, 0.3, '1 medium (118g)', 'carbs'),
('Apple', 52, 0.3, 14.0, 0.2, '1 medium (182g)', 'carbs'),
('Potato (baked)', 93, 2.5, 21.0, 0.1, '100g', 'carbs'),
('Corn', 86, 3.2, 19.0, 1.2, '100g', 'carbs'),
('Bagel', 250, 10.0, 48.0, 1.5, '1 bagel (98g)', 'carbs'),

-- Fats
('Avocado', 160, 2.0, 9.0, 15.0, '100g', 'fats'),
('Almonds', 579, 21.0, 22.0, 50.0, '100g', 'fats'),
('Peanut Butter', 588, 25.0, 20.0, 50.0, '100g', 'fats'),
('Olive Oil', 884, 0, 0, 100.0, '100ml', 'fats'),
('Walnuts', 654, 15.0, 14.0, 65.0, '100g', 'fats'),
('Chia Seeds', 486, 17.0, 42.0, 31.0, '100g', 'fats'),
('Coconut Oil', 862, 0, 0, 100.0, '100ml', 'fats'),
('Cheese (cheddar)', 403, 25.0, 1.3, 33.0, '100g', 'fats'),
('Butter', 717, 0.9, 0.1, 81.0, '100g', 'fats'),

-- Dairy & Beverages
('Milk (whole)', 61, 3.2, 4.8, 3.3, '100ml', 'dairy'),
('Milk (skim)', 34, 3.4, 5.0, 0.1, '100ml', 'dairy'),
('Almond Milk (unsweetened)', 13, 0.4, 0.3, 1.1, '100ml', 'dairy'),
('Orange Juice', 45, 0.7, 10.0, 0.2, '100ml', 'beverages'),
('Protein Shake (premade)', 160, 30.0, 5.0, 2.5, '1 bottle (330ml)', 'beverages'),

-- Vegetables
('Broccoli', 34, 2.8, 7.0, 0.4, '100g', 'vegetables'),
('Spinach', 23, 2.9, 3.6, 0.4, '100g', 'vegetables'),
('Kale', 49, 4.3, 9.0, 0.9, '100g', 'vegetables'),
('Carrots', 41, 0.9, 10.0, 0.2, '100g', 'vegetables'),
('Bell Pepper', 31, 1.0, 6.0, 0.3, '100g', 'vegetables'),
('Cucumber', 15, 0.7, 3.6, 0.1, '100g', 'vegetables'),
('Tomato', 18, 0.9, 3.9, 0.2, '100g', 'vegetables'),

-- Mixed/Meals
('Protein Bar', 200, 20.0, 22.0, 7.0, '1 bar (60g)', 'snacks'),
('Granola', 489, 15.0, 64.0, 20.0, '100g', 'snacks'),
('Mixed Nuts', 607, 20.0, 21.0, 54.0, '100g', 'snacks'),
('Rice Cakes', 35, 0.8, 7.3, 0.3, '1 cake (9g)', 'snacks'),
('Dark Chocolate (70%)', 598, 8.0, 46.0, 43.0, '100g', 'snacks');