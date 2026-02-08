import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification, XP_REWARDS } from '@/contexts/GamificationContext';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { MacroDonutChart } from '@/components/nutrition/MacroDonutChart';
import { FoodSearchModal } from '@/components/nutrition/FoodSearchModal';
import { FoodLogList } from '@/components/nutrition/FoodLogList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Target, Flame, TrendingUp, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
  category: string;
}

interface FoodLog {
  id: string;
  food_id: string;
  meal_type: string;
  servings: number;
  foods: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving_size: string;
  };
}

const DEFAULT_CALORIE_GOAL = 2000;

export default function NutritionPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { awardXP } = useGamification();
  const queryClient = useQueryClient();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(() => {
    const saved = localStorage.getItem('calorieGoal');
    return saved ? parseInt(saved) : DEFAULT_CALORIE_GOAL;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(calorieGoal.toString());

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's food logs
  const { data: foodLogs = [], isLoading } = useQuery({
    queryKey: ['food-logs', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('daily_food_logs')
        .select(`
          id,
          food_id,
          meal_type,
          servings,
          foods (
            name,
            calories,
            protein,
            carbs,
            fat,
            serving_size
          )
        `)
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FoodLog[];
    },
    enabled: !!user,
  });

  // Add food log mutation
  const addFoodMutation = useMutation({
    mutationFn: async ({ food, mealType, servings }: { food: Food; mealType: string; servings: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('daily_food_logs').insert({
        user_id: user.id,
        food_id: food.id,
        date: today,
        meal_type: mealType,
        servings: servings,
      });

      if (error) throw error;
      return { food, servings };
    },
    onSuccess: async ({ food, servings }) => {
      queryClient.invalidateQueries({ queryKey: ['food-logs', user?.id, today] });
      toast.success(t('nutrition.foodAdded'), {
        description: `${food.name} (+${Math.round(food.calories * servings)} kcal)`,
      });
    },
    onError: () => {
      toast.error(t('nutrition.errorAdding'));
    },
  });

  // Delete food log mutation
  const deleteFoodMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('daily_food_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs', user?.id, today] });
      toast.success(t('nutrition.foodRemoved'));
    },
    onError: () => {
      toast.error(t('nutrition.errorRemoving'));
    },
  });

  // Calculate totals
  const totals = foodLogs.reduce(
    (acc, log) => {
      const multiplier = log.servings;
      return {
        calories: acc.calories + log.foods.calories * multiplier,
        protein: acc.protein + log.foods.protein * multiplier,
        carbs: acc.carbs + log.foods.carbs * multiplier,
        fat: acc.fat + log.foods.fat * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddFood = (food: Food, mealType: string, servings: number) => {
    addFoodMutation.mutate({ food, mealType, servings });
  };

  const handleSaveGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (newGoal >= 1000 && newGoal <= 10000) {
      setCalorieGoal(newGoal);
      localStorage.setItem('calorieGoal', newGoal.toString());
      setIsEditingGoal(false);
      toast.success(t('nutrition.goalUpdated'));
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Flame className="h-7 w-7 text-orange-500" />
              {t('nutrition.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('nutrition.subtitle')}</p>
          </div>
          <Button onClick={() => setIsSearchOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('nutrition.logFood')}
          </Button>
        </div>

        {/* Calorie Goal Card */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('nutrition.dailyGoal')}</p>
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={tempGoal}
                        onChange={(e) => setTempGoal(e.target.value)}
                        className="w-24 h-8"
                        min="1000"
                        max="10000"
                      />
                      <Button size="sm" onClick={handleSaveGoal}>
                        {t('common.save')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingGoal(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xl font-bold">{calorieGoal} kcal</p>
                  )}
                </div>
              </div>
              {!isEditingGoal && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setTempGoal(calorieGoal.toString());
                    setIsEditingGoal(true);
                  }}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Macro Chart */}
          <MacroDonutChart
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
            calories={Math.round(totals.calories)}
            calorieGoal={calorieGoal}
          />

          {/* Food Log */}
          <FoodLogList
            logs={foodLogs}
            onDelete={(id) => deleteFoodMutation.mutate(id)}
            isDeleting={deleteFoodMutation.isPending}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="py-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{foodLogs.length}</p>
              <p className="text-xs text-muted-foreground">{t('nutrition.foodsLogged')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-4 text-center">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{Math.round(totals.calories)}</p>
              <p className="text-xs text-muted-foreground">{t('nutrition.totalCalories')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card overflow-hidden">
            <CardContent className="py-4 text-center min-w-0">
              <div className="h-6 w-6 mx-auto mb-2 rounded-full bg-chart-1/20 flex items-center justify-center text-xs font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
                P
              </div>
              <p className="text-xl sm:text-2xl font-bold truncate">{totals.protein.toFixed(0)}g</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('nutrition.macros.protein')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card overflow-hidden">
            <CardContent className="py-4 text-center min-w-0">
              <div className="h-6 w-6 mx-auto mb-2 rounded-full bg-chart-2/20 flex items-center justify-center text-xs font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
                C
              </div>
              <p className="text-xl sm:text-2xl font-bold truncate">{totals.carbs.toFixed(0)}g</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('nutrition.macros.carbs')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Food Search Modal */}
        <FoodSearchModal
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          onAddFood={handleAddFood}
        />
      </div>
    </MemberLayout>
  );
}
