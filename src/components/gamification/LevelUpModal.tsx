import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGamification } from '@/contexts/GamificationContext';
import { Sparkles, Trophy, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LevelUpModal() {
  const { showLevelUpModal, setShowLevelUpModal, newLevel } = useGamification();
  const { t } = useTranslation();
  const hasPlayedConfetti = useRef(false);

  useEffect(() => {
    if (showLevelUpModal && !hasPlayedConfetti.current) {
      hasPlayedConfetti.current = true;
      
      // Epic confetti explosion
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Create confetti from both sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showLevelUpModal]);

  const handleClose = () => {
    hasPlayedConfetti.current = false;
    setShowLevelUpModal(false);
  };

  if (!newLevel) return null;

  return (
    <Dialog open={showLevelUpModal} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-none bg-gradient-to-br from-primary/20 via-background to-accent/20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="relative text-center py-8 space-y-6">
          {/* Level Badge */}
          <div className="relative inline-block">
            <div className="absolute inset-0 animate-ping">
              <div className="w-32 h-32 rounded-full bg-primary/30" />
            </div>
            <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/50 animate-scale-in">
              <div className="text-center">
                <Trophy className="h-10 w-10 text-white mx-auto mb-1" />
                <span className="text-4xl font-black text-white">{newLevel.level_num}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              <h2 className="text-3xl font-black bg-gradient-to-r from-primary via-yellow-500 to-primary bg-clip-text text-transparent">
                {t('gamification.levelUp.title')}
              </h2>
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-xl text-muted-foreground">
              {t('gamification.levelUp.reached')} <span className="font-bold text-foreground">{newLevel.title}</span>
            </p>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[...Array(Math.min(newLevel.level_num, 5))].map((_, i) => (
              <Star 
                key={i} 
                className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-fade-in" 
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* XP Info */}
          <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              {t('gamification.levelUp.keepGoing')}
            </p>
          </div>

          {/* Continue Button */}
          <Button 
            onClick={handleClose} 
            size="lg" 
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-bold shadow-lg"
          >
            {t('gamification.levelUp.continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
