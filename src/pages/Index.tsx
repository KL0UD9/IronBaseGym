import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, Calendar, CreditCard, ArrowRight, Check } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Track memberships, check-ins, and member profiles with ease.'
  },
  {
    icon: Calendar,
    title: 'Class Scheduling',
    description: 'Create and manage classes with trainer assignments and capacity limits.'
  },
  {
    icon: CreditCard,
    title: 'Membership Tiers',
    description: 'Flexible membership plans from Bronze to Platinum.'
  }
];

const plans = [
  { name: 'Bronze', price: '$29.99', features: ['Gym access', 'Locker room'] },
  { name: 'Silver', price: '$49.99', features: ['Gym access', '5 classes/month', 'Locker room'] },
  { name: 'Gold', price: '$79.99', features: ['Unlimited access', 'Unlimited classes', 'Personal locker'], popular: true },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 animate-fade-in">
              <div className="p-4 rounded-2xl bg-primary/10 neon-glow">
                <Dumbbell className="h-12 w-12 text-primary" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
              <span className="gradient-text">IronBase</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl animate-fade-in">
              The modern gym management platform. Streamline memberships, schedule classes, and grow your fitness business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="gap-2 text-lg px-8"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/check-in')}
                className="gap-2 text-lg px-8"
              >
                Quick Check-In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-gradient-dark">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Everything you need to run your gym
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={feature.title}
                className="glass-card p-8 text-center hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Membership Plans
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Choose the perfect plan for your fitness journey
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`glass-card p-8 relative ${plan.popular ? 'border-primary/50 neon-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold mb-6">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              <span className="font-bold gradient-text">IronBase</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 IronBase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
