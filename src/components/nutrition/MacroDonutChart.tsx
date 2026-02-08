import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface MacroDonutChartProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  calorieGoal: number;
}

const COLORS = {
  protein: 'hsl(var(--chart-1))',
  carbs: 'hsl(var(--chart-2))',
  fat: 'hsl(var(--chart-3))',
};

export function MacroDonutChart({ protein, carbs, fat, calories, calorieGoal }: MacroDonutChartProps) {
  const { t } = useTranslation();
  
  const data = [
    { name: t('nutrition.macros.protein'), value: protein, color: COLORS.protein },
    { name: t('nutrition.macros.carbs'), value: carbs, color: COLORS.carbs },
    { name: t('nutrition.macros.fat'), value: fat, color: COLORS.fat },
  ];

  const total = protein + carbs + fat;
  const remaining = Math.max(0, calorieGoal - calories);
  const percentUsed = Math.min(100, (calories / calorieGoal) * 100);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{t('nutrition.todaysMacros')}</span>
          <span className={`text-sm font-normal ${calories > calorieGoal ? 'text-destructive' : 'text-muted-foreground'}`}>
            {calories} / {calorieGoal} kcal
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="w-full md:w-1/2 h-[200px] relative">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}g`, '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {t('nutrition.noDataYet')}
              </div>
            )}
            
            {/* Center text */}
            {total > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold">{total.toFixed(0)}g</p>
                  <p className="text-xs text-muted-foreground">{t('nutrition.total')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="w-full md:w-1/2 space-y-4">
            {/* Calorie Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('nutrition.caloriesRemaining')}</span>
                <span className={remaining === 0 ? 'text-destructive font-medium' : 'text-green-500 font-medium'}>
                  {remaining} kcal
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    percentUsed > 100 ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Macro breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 sm:p-3 rounded-lg bg-chart-1/10 border border-chart-1/20 min-w-0">
                <p className="text-sm sm:text-lg font-bold truncate" style={{ color: COLORS.protein }}>{protein.toFixed(0)}g</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('nutrition.macros.protein')}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-chart-2/10 border border-chart-2/20 min-w-0">
                <p className="text-sm sm:text-lg font-bold truncate" style={{ color: COLORS.carbs }}>{carbs.toFixed(0)}g</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('nutrition.macros.carbs')}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-chart-3/10 border border-chart-3/20 min-w-0">
                <p className="text-sm sm:text-lg font-bold truncate" style={{ color: COLORS.fat }}>{fat.toFixed(0)}g</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('nutrition.macros.fat')}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
