import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { TrainerMap } from '@/components/map/TrainerMap';
import { TrainerDrawer } from '@/components/map/TrainerDrawer';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Users, MapPinOff } from 'lucide-react';
import { haversineDistance } from '@/lib/haversine';
import { useGeolocation } from '@/hooks/useGeolocation';

interface Trainer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lat: number;
  lng: number;
}

const FILTER_RADIUS_KM = 5;

export default function TrainerMapPage() {
  const { t } = useTranslation();
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);
  
  // Use real browser geolocation
  const { lat, lng, error: geoError, loading: geoLoading } = useGeolocation();
  const userLocation = { lat, lng };

  const { data: trainers = [], isLoading } = useQuery({
    queryKey: ['trainers-with-location'],
    queryFn: async () => {
      // Security: Use the trainer_locations view which only exposes trainer locations
      // This prevents regular member location data from being exposed
      const { data, error } = await supabase
        .from('trainer_locations')
        .select('id, full_name, avatar_url, lat, lng');

      if (error) throw error;
      return data as Trainer[];
    },
  });

  const filteredCount = useMemo(() => {
    if (!filterEnabled) return trainers.length;
    
    return trainers.filter((trainer) => {
      const distance = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        trainer.lat,
        trainer.lng
      );
      return distance <= FILTER_RADIUS_KM;
    }).length;
  }, [trainers, filterEnabled, userLocation]);

  const handleTrainerClick = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setDrawerOpen(true);
  };

  const selectedDistance = selectedTrainer
    ? haversineDistance(
        userLocation.lat,
        userLocation.lng,
        selectedTrainer.lat,
        selectedTrainer.lng
      )
    : undefined;

  if (isLoading || geoLoading) {
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
          
          {/* Geolocation Warning */}
          {geoError && (
            <Alert variant="default" className="mt-2">
              <MapPinOff className="h-4 w-4" />
              <AlertDescription className="text-sm">{geoError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <TrainerMap
            trainers={trainers}
            userLocation={userLocation}
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
