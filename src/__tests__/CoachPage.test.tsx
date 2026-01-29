import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Track messages for assertions
let mockMessages: any[] = [];
const mockInsert = vi.fn();

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockMessages, error: null }),
        }),
      }),
      insert: (data: any) => {
        mockInsert(data);
        mockMessages.push({
          id: `msg-${Date.now()}`,
          ...data,
          created_at: new Date().toISOString(),
        });
        return Promise.resolve({ error: null });
      },
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

import CoachPage from '@/pages/member/CoachPage';

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

describe('CoachPage Component', () => {
  beforeEach(() => {
    mockMessages = [];
    mockInsert.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the AI Coach header and description', () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument();
    expect(screen.getByText('Your personal training assistant')).toBeInTheDocument();
  });

  it('shows empty state message when no chat history', async () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Start a Conversation')).toBeInTheDocument();
      expect(
        screen.getByText(/ask me about workouts, nutrition, or your fitness goals/i)
      ).toBeInTheDocument();
    });
  });

  it('renders the message input field', () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...');
    expect(input).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const sendButton = screen.getByRole('button', { name: '' }); // Send icon button
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has content', () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...');
    fireEvent.change(input, { target: { value: 'How should I warm up?' } });

    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find((btn) => btn.querySelector('svg.lucide-send'));

    expect(sendButton).not.toBeDisabled();
  });

  it('user message appears immediately after sending', async () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...');
    fireEvent.change(input, { target: { value: 'What exercises for abs?' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content: 'What exercises for abs?',
        role: 'user',
      });
    });
  });

  it('shows typing indicator after user sends a message', async () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...');
    fireEvent.change(input, { target: { value: 'Help me build muscle' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    // The typing indicator should appear (three bouncing dots)
    await waitFor(() => {
      const bouncingDots = document.querySelectorAll('.animate-bounce');
      expect(bouncingDots.length).toBe(3);
    });
  });

  it('clears input field after sending message', async () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input.value).toBe('Test message');

    const form = input.closest('form')!;
    fireEvent.submit(form);

    // Run the mutation
    await vi.advanceTimersByTimeAsync(100);

    // After the 2 second delay and AI response
    await vi.advanceTimersByTimeAsync(2100);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('displays previous messages from chat history', async () => {
    mockMessages = [
      {
        id: 'msg-1',
        user_id: 'test-user-id',
        content: 'How do I lose weight?',
        role: 'user',
        created_at: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        user_id: 'test-user-id',
        content: "That's a great goal! Keep pushing! 💪",
        role: 'assistant',
        created_at: new Date().toISOString(),
      },
    ];

    render(<CoachPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('How do I lose weight?')).toBeInTheDocument();
      expect(screen.getByText("That's a great goal! Keep pushing! 💪")).toBeInTheDocument();
    });
  });

  it('user messages appear on the right side', async () => {
    mockMessages = [
      {
        id: 'msg-1',
        user_id: 'test-user-id',
        content: 'User message here',
        role: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    render(<CoachPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const messageContainer = screen.getByText('User message here').parentElement?.parentElement;
      expect(messageContainer).toHaveClass('justify-end');
    });
  });

  it('assistant messages appear on the left side', async () => {
    mockMessages = [
      {
        id: 'msg-1',
        user_id: 'test-user-id',
        content: 'AI response here',
        role: 'assistant',
        created_at: new Date().toISOString(),
      },
    ];

    render(<CoachPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const messageContainer = screen.getByText('AI response here').parentElement?.parentElement;
      expect(messageContainer).toHaveClass('justify-start');
    });
  });

  it('user messages have primary background color', async () => {
    mockMessages = [
      {
        id: 'msg-1',
        user_id: 'test-user-id',
        content: 'User styled message',
        role: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    render(<CoachPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const messageBubble = screen.getByText('User styled message');
      expect(messageBubble).toHaveClass('bg-primary');
      expect(messageBubble).toHaveClass('text-primary-foreground');
    });
  });

  it('assistant messages have muted background color', async () => {
    mockMessages = [
      {
        id: 'msg-1',
        user_id: 'test-user-id',
        content: 'AI styled message',
        role: 'assistant',
        created_at: new Date().toISOString(),
      },
    ];

    render(<CoachPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const messageBubble = screen.getByText('AI styled message');
      expect(messageBubble).toHaveClass('bg-muted');
      expect(messageBubble).toHaveClass('text-foreground');
    });
  });

  it('does not submit empty or whitespace-only messages', async () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...');
    const form = input.closest('form')!;

    // Try empty
    fireEvent.submit(form);
    expect(mockInsert).not.toHaveBeenCalled();

    // Try whitespace only
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('disables input while message is being sent', async () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Sending...' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    // Input should be disabled while pending
    await waitFor(() => {
      expect(input).toBeDisabled();
    });
  });
});

describe('CoachPage Message Flow', () => {
  beforeEach(() => {
    mockMessages = [];
    mockInsert.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends both user and AI messages in sequence', async () => {
    render(<CoachPage />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText('Ask your coach anything...');
    fireEvent.change(input, { target: { value: 'Test conversation' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    // First call should be user message
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content: 'Test conversation',
        role: 'user',
      });
    });

    // Advance timer past the 2 second delay
    await vi.advanceTimersByTimeAsync(2100);

    // Second call should be AI response
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content: "That's a great goal! Keep pushing! 💪",
        role: 'assistant',
      });
    });
  });
});
