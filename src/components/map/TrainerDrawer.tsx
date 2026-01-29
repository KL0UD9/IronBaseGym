import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar } from 'lucide-react';

interface Trainer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lat: number;
  lng: number;
}

interface TrainerDrawerProps {
  trainer: Trainer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distance?: number;
}

export function TrainerDrawer({ trainer, open, onOpenChange, distance }: TrainerDrawerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!trainer) return null;

  const initials = trainer.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleBookNow = () => {
    onOpenChange(false);
    navigate('/dashboard/book');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20 border-4 border-primary">
              <AvatarImage src={trainer.avatar_url || undefined} alt={trainer.full_name} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <DrawerTitle className="text-2xl">{trainer.full_name}</DrawerTitle>
          <DrawerDescription className="flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4" />
            {distance !== undefined ? (
              <span>{distance.toFixed(1)} km {t('map.away')}</span>
            ) : (
              <span>{t('map.trainerLocation')}</span>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('map.trainerDescription')}
            </p>
          </div>
        </div>

        <DrawerFooter className="gap-2">
          <Button onClick={handleBookNow} size="lg" className="w-full">
            <Calendar className="mr-2 h-5 w-5" />
            {t('map.bookNow')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" size="lg">
              {t('common.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
