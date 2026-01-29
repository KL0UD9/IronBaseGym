import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Loader2, Apple, Beef, Wheat, Droplet } from 'lucide-react';

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

interface FoodSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFood: (food: Food, mealType: string, servings: number) => void;
}

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

const categoryIcons: Record<string, React.ReactNode> = {
  protein: <Beef className="h-4 w-4 text-red-500" />,
  carbs: <Wheat className="h-4 w-4 text-amber-500" />,
  fats: <Droplet className="h-4 w-4 text-yellow-500" />,
  vegetables: <Apple className="h-4 w-4 text-green-500" />,
  dairy: <Droplet className="h-4 w-4 text-blue-500" />,
  default: <Apple className="h-4 w-4 text-muted-foreground" />,
};

export function FoodSearchModal({ open, onOpenChange, onAddFood }: FoodSearchModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealType, setMealType] = useState('snack');
  const [servings, setServings] = useState('1');

  // Search foods
  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['foods-search', search],
    queryFn: async () => {
      let query = supabase
        .from('foods')
        .select('*')
        .order('name');
      
      if (search.length >= 2) {
        query = query.ilike('name', `%${search}%`);
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Food[];
    },
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedFood(null);
      setServings('1');
    }
  }, [open]);

  const handleAdd = () => {
    if (selectedFood) {
      onAddFood(selectedFood, mealType, parseFloat(servings) || 1);
      setSelectedFood(null);
      setServings('1');
    }
  };

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || categoryIcons.default;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('nutrition.searchFood')}
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('nutrition.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Food List */}
        <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : foods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('nutrition.noFoodsFound')}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedFood?.id === food.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="shrink-0">{getCategoryIcon(food.category)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.serving_size} • {food.calories} kcal
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <Badge variant="outline" className="text-xs">
                      P: {food.protein}g
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Selected Food Details */}
        {selectedFood && (
          <div className="p-4 bg-muted/30 rounded-lg space-y-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{selectedFood.name}</p>
                <p className="text-sm text-muted-foreground">{selectedFood.serving_size}</p>
              </div>
              <p className="text-xl font-bold text-primary">
                {Math.round(selectedFood.calories * (parseFloat(servings) || 1))} kcal
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 bg-background rounded">
                <p className="font-medium">{(selectedFood.protein * (parseFloat(servings) || 1)).toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">{t('nutrition.macros.protein')}</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="font-medium">{(selectedFood.carbs * (parseFloat(servings) || 1)).toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">{t('nutrition.macros.carbs')}</p>
              </div>
              <div className="p-2 bg-background rounded">
                <p className="font-medium">{(selectedFood.fat * (parseFloat(servings) || 1)).toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">{t('nutrition.macros.fat')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t('nutrition.mealType')}
                </label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`nutrition.meals.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t('nutrition.servings')}
                </label>
                <Input
                  type="number"
                  min="0.25"
                  max="10"
                  step="0.25"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleAdd} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {t('nutrition.addFood')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
