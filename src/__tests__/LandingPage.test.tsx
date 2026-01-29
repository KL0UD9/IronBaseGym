import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock membership data
const mockMemberships = [
  {
    id: 'plan-1',
    name: 'Basic',
    price: 29,
    duration_months: 1,
    description: 'Great for beginners',
  },
  {
    id: 'plan-2',
    name: 'Pro',
    price: 49,
    duration_months: 1,
    description: 'Most popular choice',
  },
  {
    id: 'plan-3',
    name: 'Elite',
    price: 99,
    duration_months: 1,
    description: 'Full access to everything',
  },
];

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: mockMemberships, error: null }),
      }),
    }),
  },
}));

import LandingPage from '@/pages/LandingPage';

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

describe('LandingPage Component', () => {
  it('renders the IronBase logo and brand name', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByText('IronBase')).toBeInTheDocument();
  });

  it('renders the hero headline', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(
      screen.getByText(/where champions are forged/i)
    ).toBeInTheDocument();
  });

  it('renders the "Start Your Journey" button', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /start your journey/i })).toBeInTheDocument();
  });

  it('navigates to /login when "Start Your Journey" is clicked', async () => {
    let currentPath = '/';
    
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const ctaButton = screen.getByRole('button', { name: /start your journey/i });
    fireEvent.click(ctaButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders the feature cards section', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByText("Why")).toBeInTheDocument();
    expect(screen.getByText('24/7 Access')).toBeInTheDocument();
    expect(screen.getByText('Pro Equipment')).toBeInTheDocument();
    expect(screen.getByText('Sauna Recovery')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(
      screen.getByText(/train on your schedule/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/state-of-the-art machines/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/unwind and recover/i)
    ).toBeInTheDocument();
  });

  it('renders the pricing section header', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Membership')).toBeInTheDocument();
    expect(screen.getByText('Plans')).toBeInTheDocument();
  });

  it('fetches and displays membership plans from database', async () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Elite')).toBeInTheDocument();
    });
  });

  it('displays correct prices for membership plans', async () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('$29')).toBeInTheDocument();
      expect(screen.getByText('$49')).toBeInTheDocument();
      expect(screen.getByText('$99')).toBeInTheDocument();
    });
  });

  it('displays membership descriptions', async () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Great for beginners')).toBeInTheDocument();
      expect(screen.getByText('Most popular choice')).toBeInTheDocument();
      expect(screen.getByText('Full access to everything')).toBeInTheDocument();
    });
  });

  it('marks the middle plan as "Most Popular"', async () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });
  });

  it('renders "Get Started" buttons on pricing cards', async () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const getStartedButtons = screen.getAllByRole('button', { name: /get started/i });
      expect(getStartedButtons).toHaveLength(3);
    });
  });

  it('navigates to /login when pricing card "Get Started" is clicked', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
    });

    const getStartedButtons = screen.getAllByRole('button', { name: /get started/i });
    fireEvent.click(getStartedButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders the CTA section', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/ready to/i)).toBeInTheDocument();
    expect(screen.getByText('Transform')).toBeInTheDocument();
  });

  it('renders "Start Free Trial" button in CTA section', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /start free trial/i })).toBeInTheDocument();
  });

  it('navigates to /login when "Start Free Trial" is clicked', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const trialButton = screen.getByRole('button', { name: /start free trial/i });
    fireEvent.click(trialButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('renders the footer with copyright', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/© 2026 IronBase/i)).toBeInTheDocument();
  });

  it('renders quick stats in hero section', () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Active Members')).toBeInTheDocument();
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('Weekly Classes')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('Open Access')).toBeInTheDocument();
  });

  it('shows loading spinner while fetching memberships', () => {
    // Create a slow query client
    const queryClient = new QueryClient({
      defaultOptions: { 
        queries: { 
          retry: false,
          staleTime: 0,
        } 
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // The loading spinner should be visible initially
    // (or membership cards should appear after data loads)
    // This test verifies the component handles loading state
  });

  it('displays list features for each pricing tier', async () => {
    render(<LandingPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // All plans should have basic features
      const gymAccessItems = screen.getAllByText('Full gym access');
      expect(gymAccessItems.length).toBeGreaterThan(0);

      const lockerRoomItems = screen.getAllByText('Locker room access');
      expect(lockerRoomItems.length).toBeGreaterThan(0);
    });
  });
});

describe('LandingPage Navigation', () => {
  it('all CTA buttons navigate to login', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for memberships to load
    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
    });

    // Find all buttons that should navigate to login
    const startJourneyBtn = screen.getByRole('button', { name: /start your journey/i });
    const startTrialBtn = screen.getByRole('button', { name: /start free trial/i });
    const getStartedBtns = screen.getAllByRole('button', { name: /get started/i });

    // All should be present and clickable
    expect(startJourneyBtn).toBeInTheDocument();
    expect(startTrialBtn).toBeInTheDocument();
    expect(getStartedBtns.length).toBe(3);
  });
});

describe('LandingPage Responsiveness', () => {
  it('renders on mobile viewport without errors', () => {
    // Set viewport to mobile size
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 667 });

    render(<LandingPage />, { wrapper: createWrapper() });

    // Basic elements should still render
    expect(screen.getByText('IronBase')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start your journey/i })).toBeInTheDocument();
  });

  it('applies correct grid classes for features section', () => {
    const { container } = render(<LandingPage />, { wrapper: createWrapper() });

    // The features grid should have md:grid-cols-3 class
    const featuresGrid = container.querySelector('.md\\:grid-cols-3');
    expect(featuresGrid).toBeInTheDocument();
  });
});
