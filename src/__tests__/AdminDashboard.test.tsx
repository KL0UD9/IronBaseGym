import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPICard } from '@/components/ui/kpi-card';
import { Users, DollarSign, UserCheck, Calendar } from 'lucide-react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => Promise.resolve({ count: 5, data: [], error: null }),
        }),
        gte: () => ({
          lt: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-user-id' },
    profile: { full_name: 'Admin User', role: 'admin' },
    loading: false,
    role: 'admin',
  }),
}));

// Mock DashboardLayout
vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('KPICard Component', () => {
  it('renders title correctly', () => {
    render(
      <KPICard title="Active Members" value={150} icon={Users} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Active Members')).toBeInTheDocument();
  });

  it('renders numeric value correctly', () => {
    render(
      <KPICard title="Total Users" value={250} icon={Users} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('renders string value correctly (for formatted values)', () => {
    render(
      <KPICard title="Monthly Revenue" value="$12,500" icon={DollarSign} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('$12,500')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <KPICard
        title="Check-ins"
        value={42}
        subtitle="Today's activity"
        icon={UserCheck}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Today's activity")).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(
      <KPICard title="Classes" value={15} icon={Calendar} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText("Today's activity")).not.toBeInTheDocument();
  });

  it('renders positive trend indicator correctly', () => {
    render(
      <KPICard
        title="Growth"
        value={100}
        icon={Users}
        trend={{ value: 12, positive: true }}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('renders negative trend indicator correctly', () => {
    render(
      <KPICard
        title="Decline"
        value={50}
        icon={Users}
        trend={{ value: 8, positive: false }}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('applies correct styling for positive trend', () => {
    render(
      <KPICard
        title="Positive"
        value={100}
        icon={Users}
        trend={{ value: 15, positive: true }}
      />,
      { wrapper: createWrapper() }
    );

    const trendContainer = screen.getByText('15%').parentElement;
    expect(trendContainer).toHaveClass('bg-success/20');
    expect(trendContainer).toHaveClass('text-success');
  });

  it('applies correct styling for negative trend', () => {
    render(
      <KPICard
        title="Negative"
        value={100}
        icon={Users}
        trend={{ value: 5, positive: false }}
      />,
      { wrapper: createWrapper() }
    );

    const trendContainer = screen.getByText('5%').parentElement;
    expect(trendContainer).toHaveClass('bg-destructive/20');
    expect(trendContainer).toHaveClass('text-destructive');
  });

  it('renders without trend when not provided', () => {
    render(
      <KPICard title="No Trend" value={75} icon={Users} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(
      <KPICard title="With Icon" value={100} icon={Users} />,
      { wrapper: createWrapper() }
    );

    // The icon should be rendered in an SVG
    const svg = document.querySelector('svg.lucide-users');
    expect(svg).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <KPICard
        title="Custom Class"
        value={100}
        icon={Users}
        className="custom-test-class"
      />,
      { wrapper: createWrapper() }
    );

    expect(container.querySelector('.custom-test-class')).toBeInTheDocument();
  });

  it('applies glass-card styling', () => {
    const { container } = render(
      <KPICard title="Glass Card" value={100} icon={Users} />,
      { wrapper: createWrapper() }
    );

    expect(container.querySelector('.glass-card')).toBeInTheDocument();
  });
});

describe('AdminDashboard KPI Cards Integration', () => {
  it('renders multiple KPI cards with different props', () => {
    render(
      <div>
        <KPICard
          title="Active Members"
          value={150}
          icon={Users}
          trend={{ value: 12, positive: true }}
        />
        <KPICard
          title="Monthly Revenue"
          value="$8,500"
          icon={DollarSign}
          trend={{ value: 8, positive: true }}
        />
        <KPICard title="Today's Check-ins" value={42} icon={UserCheck} />
        <KPICard title="Classes This Week" value={28} icon={Calendar} />
      </div>,
      { wrapper: createWrapper() }
    );

    // All titles should render
    expect(screen.getByText('Active Members')).toBeInTheDocument();
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    expect(screen.getByText("Today's Check-ins")).toBeInTheDocument();
    expect(screen.getByText('Classes This Week')).toBeInTheDocument();

    // All values should render
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('$8,500')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    render(
      <KPICard title="Empty Metric" value={0} icon={Users} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles large numbers correctly', () => {
    render(
      <KPICard title="Large Number" value={999999} icon={Users} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('999999')).toBeInTheDocument();
  });

  it('handles formatted currency strings', () => {
    render(
      <KPICard title="Revenue" value="$1,234,567.89" icon={DollarSign} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
  });

  it('handles trend with decimal percentages', () => {
    render(
      <KPICard
        title="Precise Growth"
        value={100}
        icon={Users}
        trend={{ value: 12.5, positive: true }}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });
});
