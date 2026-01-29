import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { TrainerMap } from '@/components/map/TrainerMap';
import { TrainerDrawer } from '@/components/map/TrainerDrawer';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Users } from 'lucide-react';
import { haversineDistance } from '@/lib/haversine';

interface Trainer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lat: number;
  lng: number;
}

// Mocked user location (NYC area)
const USER_LOCATION = { lat: 40.7128, lng: -74.006 };
const FILTER_RADIUS_KM = 5;

export default function TrainerMapPage() {
  const { t } = useTranslation();
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);

  const { data: trainers = [], isLoading } = useQuery({
    queryKey: ['trainers-with-location'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, lat, lng')
        .eq('role', 'trainer')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) throw error;
      return data as Trainer[];
    },
  });

  const filteredCount = useMemo(() => {
    if (!filterEnabled) return trainers.length;
    
    return trainers.filter((trainer) => {
      const distance = haversineDistance(
        USER_LOCATION.lat,
        USER_LOCATION.lng,
        trainer.lat,
        trainer.lng
      );
      return distance <= FILTER_RADIUS_KM;
    }).length;
  }, [trainers, filterEnabled]);

  const handleTrainerClick = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setDrawerOpen(true);
  };

  const selectedDistance = selectedTrainer
    ? haversineDistance(
        USER_LOCATION.lat,
        USER_LOCATION.lng,
        selectedTrainer.lat,
        selectedTrainer.lng
      )
    : undefined;

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                {t('map.title')}
              </h1>
              <p className="text-muted-foreground text-sm">{t('map.subtitle')}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {filteredCount} {t('map.trainersFound')}
              </Badge>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="radius-filter"
                  checked={filterEnabled}
                  onCheckedChange={setFilterEnabled}
                />
                <Label htmlFor="radius-filter" className="text-sm whitespace-nowrap">
                  {t('map.within5km')}
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <TrainerMap
            trainers={trainers}
            userLocation={USER_LOCATION}
            filterRadius={filterEnabled ? FILTER_RADIUS_KM : null}
            onTrainerClick={handleTrainerClick}
          />
        </div>

        {/* Trainer Drawer */}
        <TrainerDrawer
          trainer={selectedTrainer}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          distance={selectedDistance}
        />
      </div>
    </MemberLayout>
  );
}
