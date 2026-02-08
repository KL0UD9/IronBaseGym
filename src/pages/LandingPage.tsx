import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dumbbell, Clock, Wrench, Flame, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: Clock,
      title: t('landing.features.access.title'),
      description: t('landing.features.access.description')
    },
    {
      icon: Wrench,
      title: t('landing.features.equipment.title'),
      description: t('landing.features.equipment.description')
    },
    {
      icon: Flame,
      title: t('landing.features.sauna.title'),
      description: t('landing.features.sauna.description')
    }
  ];

  const { data: memberships, isLoading } = useQuery({
    queryKey: ['memberships-landing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Language & Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 container mx-auto px-6 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 neon-glow">
              <Dumbbell className="h-16 w-16 text-primary" />
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 animate-fade-in">
            <span className="gradient-text">{t('landing.hero.headline')}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in">
            {t('landing.hero.subheadline')}
          </p>

          {/* Neon CTA Button */}
          <div className="animate-fade-in">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="group relative text-lg px-12 py-7 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                boxShadow: '0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.1)'
              }}
            >
              <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
              {t('landing.hero.cta')}
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 text-muted-foreground animate-fade-in">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">500+</p>
              <p className="text-sm">{t('landing.stats.activeMembers')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">50+</p>
              <p className="text-sm">{t('landing.stats.weeklyClasses')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">24/7</p>
              <p className="text-sm">{t('landing.stats.openAccess')}</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-dark">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.features.title')} <span className="gradient-text">{t('landing.features.titleHighlight')}</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <div 
                key={feature.title}
                className="glass-card p-8 text-center hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.pricing.title')} <span className="gradient-text">{t('landing.pricing.titleHighlight')}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
              {memberships?.map((plan, index) => {
                const isPopular = index === Math.floor((memberships.length - 1) / 2) || memberships.length === 1;
                return (
                  <div 
                    key={plan.id}
                    className={`glass-card p-8 relative transition-all duration-300 hover:-translate-y-2 flex flex-col ${
                      isPopular ? 'border-primary/50 neon-glow' : ''
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                          {t('landing.pricing.mostPopular')}
                        </span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-4xl font-bold mb-2">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.duration_months === 1 ? t('landing.pricing.perMonth').replace('/', '') : `${plan.duration_months} ${t('landing.pricing.perMonths')}`}
                      </span>
                    </p>
                    {plan.description && (
                      <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                    )}
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {t('landing.pricing.features.gymAccess')}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {t('landing.pricing.features.lockerRoom')}
                      </li>
                      {index >= 1 && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          {t('landing.pricing.features.groupClasses')}
                        </li>
                      )}
                      {index >= 2 && (
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          {t('landing.pricing.features.personalTraining')}
                        </li>
                      )}
                    </ul>
                    <Button 
                      className="w-full mt-auto" 
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => navigate('/login')}
                    >
                      {t('landing.pricing.getStarted')}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-dark">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('landing.cta.title')} <span className="gradient-text">{t('landing.cta.titleHighlight')}</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/login')}
            className="text-lg px-10 py-6"
          >
            {t('landing.hero.ctaTrial')}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              <span className="font-bold gradient-text">{t('brand.name')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('landing.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
