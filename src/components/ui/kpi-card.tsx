import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className }: KPICardProps) {
  return (
    <div className={cn(
      "glass-card p-6 transition-all duration-300 hover:border-primary/30 overflow-hidden relative",
      className
    )}>
      <div className="space-y-2 pr-12">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.positive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-2 right-4 p-3 rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
