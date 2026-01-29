import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Coffee, Sun, Moon, Cookie } from 'lucide-react';

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

interface FoodLogListProps {
  logs: FoodLog[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const mealIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <Sun className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
  snack: <Cookie className="h-4 w-4" />,
};

const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

export function FoodLogList({ logs, onDelete, isDeleting }: FoodLogListProps) {
  const { t } = useTranslation();

  // Group logs by meal type
  const groupedLogs = mealOrder.reduce((acc, meal) => {
    acc[meal] = logs.filter((log) => log.meal_type === meal);
    return acc;
  }, {} as Record<string, FoodLog[]>);

  const getMealCalories = (mealLogs: FoodLog[]) => {
    return mealLogs.reduce((sum, log) => sum + log.foods.calories * log.servings, 0);
  };

  if (logs.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Cookie className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('nutrition.noLogsToday')}</p>
          <p className="text-sm mt-1">{t('nutrition.startLogging')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('nutrition.todaysLog')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {mealOrder.map((meal) => {
              const mealLogs = groupedLogs[meal];
              if (mealLogs.length === 0) return null;

              return (
                <div key={meal}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {mealIcons[meal]}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium capitalize">{t(`nutrition.meals.${meal}`)}</h4>
                      <p className="text-xs text-muted-foreground">
                        {getMealCalories(mealLogs)} kcal
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 ml-10">
                    {mealLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{log.foods.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{log.servings}x {log.foods.serving_size}</span>
                            <span>•</span>
                            <span>{Math.round(log.foods.calories * log.servings)} kcal</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            P: {(log.foods.protein * log.servings).toFixed(0)}g
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={() => onDelete(log.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
