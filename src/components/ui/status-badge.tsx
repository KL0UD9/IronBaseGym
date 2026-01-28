import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'expired' | 'pending' | 'confirmed' | 'cancelled' | 'waitlist';
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'status-active'
  },
  expired: {
    label: 'Expired',
    className: 'status-expired'
  },
  pending: {
    label: 'Pending',
    className: 'status-pending'
  },
  confirmed: {
    label: 'Confirmed',
    className: 'status-active'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'status-expired'
  },
  waitlist: {
    label: 'Waitlist',
    className: 'status-pending'
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
