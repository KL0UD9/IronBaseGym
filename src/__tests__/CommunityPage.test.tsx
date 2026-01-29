import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data
const mockPosts = [
  {
    id: 'post-1',
    content: 'Just crushed leg day! 💪',
    image_url: null,
    created_at: new Date().toISOString(),
    user_id: 'user-1',
    profiles: {
      id: 'user-1',
      full_name: 'John Doe',
      avatar_url: null,
    },
    likes: [{ user_id: 'user-2' }],
  },
  {
    id: 'post-2',
    content: 'New personal record on bench press!',
    image_url: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user_id: 'user-2',
    profiles: {
      id: 'user-2',
      full_name: 'Jane Smith',
      avatar_url: null,
    },
    likes: [],
  },
];

let mockPostsData = [...mockPosts];

// Mock Supabase with mutation tracking
const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        order: () => Promise.resolve({ data: mockPostsData, error: null }),
      }),
      insert: (data: any) => {
        mockInsert(data);
        if (table === 'posts') {
          mockPostsData = [
            {
              id: `post-${Date.now()}`,
              ...data,
              created_at: new Date().toISOString(),
              profiles: { id: data.user_id, full_name: 'Test User', avatar_url: null },
              likes: [],
            },
            ...mockPostsData,
          ];
        }
        return Promise.resolve({ error: null });
      },
      delete: () => ({
        eq: () => ({
          eq: () => {
            mockDelete();
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }),
    channel: () => ({
      on: () => ({
        on: () => ({
          subscribe: () => ({}),
        }),
      }),
    }),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: { full_name: 'Test User', avatar_url: null },
    loading: false,
  }),
}));

// Mock MemberLayout
vi.mock('@/components/layout/MemberLayout', () => ({
  MemberLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import CommunityPage from '@/pages/member/CommunityPage';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CommunityPage Component', () => {
  beforeEach(() => {
    mockPostsData = [...mockPosts];
    mockInsert.mockClear();
    mockDelete.mockClear();
  });

  it('renders the Community header and description', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Connect with fellow gym members')).toBeInTheDocument();
  });

  it('displays posts from the feed', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Just crushed leg day! 💪')).toBeInTheDocument();
      expect(screen.getByText('New personal record on bench press!')).toBeInTheDocument();
    });
  });

  it('renders post author names correctly', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows the correct like count for each post', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // First post has 1 like, second has 0
      const likeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg.lucide-heart')
      );
      expect(likeButtons.length).toBeGreaterThanOrEqual(2);
      
      // Check that at least one button shows "1" for the like count
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('renders the post creation textarea', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(
      /what's on your mind/i
    );
    expect(textarea).toBeInTheDocument();
  });

  it('enables Post button only when textarea has content', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(/what's on your mind/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    // Initially disabled
    expect(postButton).toBeDisabled();

    // Type something
    fireEvent.change(textarea, { target: { value: 'My new post content' } });

    // Now enabled
    expect(postButton).not.toBeDisabled();
  });

  it('clears textarea after submitting a post', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(/what's on your mind/i) as HTMLTextAreaElement;
    const postButton = screen.getByRole('button', { name: /post/i });

    // Type content
    fireEvent.change(textarea, { target: { value: 'Testing post submission' } });
    expect(textarea.value).toBe('Testing post submission');

    // Submit
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content: 'Testing post submission',
      });
    });

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('does not submit empty posts', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    const form = screen.getByRole('button', { name: /post/i }).closest('form')!;
    
    // Try to submit with empty content
    fireEvent.submit(form);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('toggles like when heart button is clicked', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Just crushed leg day! 💪')).toBeInTheDocument();
    });

    // Find like buttons
    const likeButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('svg.lucide-heart')
    );

    expect(likeButtons.length).toBeGreaterThan(0);

    // Click the first like button
    fireEvent.click(likeButtons[0]);

    // The mutation should be called (either insert or delete depending on current state)
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('shows user avatar placeholder with initials', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Look for avatar fallbacks with initials
      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
    });
  });

  it('shows relative timestamps for posts', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // formatDistanceToNow should produce something like "less than a minute ago" or similar
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });
});

describe('Community Post Interactions', () => {
  beforeEach(() => {
    mockPostsData = [...mockPosts];
    mockInsert.mockClear();
  });

  it('submits form on Enter key in textarea (with button click)', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(/what's on your mind/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    fireEvent.change(textarea, { target: { value: 'Keyboard submission test' } });
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content: 'Keyboard submission test',
      });
    });
  });

  it('trims whitespace from post content', async () => {
    render(<CommunityPage />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(/what's on your mind/i);
    const postButton = screen.getByRole('button', { name: /post/i });

    fireEvent.change(textarea, { target: { value: '   Trimmed content   ' } });
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content: 'Trimmed content',
      });
    });
  });
});
