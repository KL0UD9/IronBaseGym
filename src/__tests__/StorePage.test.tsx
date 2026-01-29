import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { ProductCard } from '@/components/store/ProductCard';
import { CartButton } from '@/components/store/CartButton';
import { ShoppingCartSidebar } from '@/components/store/ShoppingCartSidebar';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: '1' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: { full_name: 'Test User' },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CartProvider>{children}</CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockProduct = {
  id: 'product-1',
  name: 'Test Protein Powder',
  description: 'High quality whey protein',
  price: 49.99,
  image_url: null,
  stock_count: 10,
  category: 'supplements',
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Protein Powder')).toBeInTheDocument();
    expect(screen.getByText('High quality whey protein')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
    expect(screen.getByText('supplements')).toBeInTheDocument();
  });

  it('adds item to cart when Add to Cart button is clicked', async () => {
    render(<ProductCard product={mockProduct} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    // Check localStorage was updated
    await waitFor(() => {
      const cartData = JSON.parse(localStorage.getItem('gym-merch-cart') || '[]');
      expect(cartData).toHaveLength(1);
      expect(cartData[0].id).toBe('product-1');
      expect(cartData[0].quantity).toBe(1);
    });
  });

  it('shows out of stock badge when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock_count: 0 };
    render(<ProductCard product={outOfStockProduct} />, { wrapper: createWrapper() });

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  it('disables Add to Cart when max quantity is reached', async () => {
    const limitedProduct = { ...mockProduct, stock_count: 1 };
    render(<ProductCard product={limitedProduct} />, { wrapper: createWrapper() });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /max in cart/i })).toBeDisabled();
    });
  });
});

describe('CartButton Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders cart button with zero items initially', () => {
    render(<CartButton />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // No badge should show when cart is empty
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows item count badge when items are in cart', () => {
    // Pre-populate localStorage with cart items
    localStorage.setItem(
      'gym-merch-cart',
      JSON.stringify([{ ...mockProduct, quantity: 3 }])
    );

    render(<CartButton />, { wrapper: createWrapper() });

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows 9+ when more than 9 items in cart', () => {
    localStorage.setItem(
      'gym-merch-cart',
      JSON.stringify([{ ...mockProduct, quantity: 15 }])
    );

    render(<CartButton />, { wrapper: createWrapper() });

    expect(screen.getByText('9+')).toBeInTheDocument();
  });
});

describe('ShoppingCartSidebar Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Helper component to control cart state
  const CartTester = () => {
    const { setIsCartOpen, addToCart } = useCart();
    return (
      <div>
        <button onClick={() => setIsCartOpen(true)}>Open Cart</button>
        <button
          onClick={() =>
            addToCart({
              id: 'product-1',
              name: 'Test Product',
              price: 29.99,
              image_url: null,
              stock_count: 10,
            })
          }
        >
          Add Item
        </button>
        <ShoppingCartSidebar />
      </div>
    );
  };

  it('shows empty cart message when no items', async () => {
    render(<CartTester />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Open Cart'));

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  it('displays cart items with correct information', async () => {
    render(<CartTester />, { wrapper: createWrapper() });

    // Add item to cart
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Open Cart'));

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });

  it('updates quantity when plus/minus buttons are clicked', async () => {
    render(<CartTester />, { wrapper: createWrapper() });

    // Add item and open cart
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Open Cart'));

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click plus button to increase quantity
    const plusButton = screen.getByRole('button', { name: '' }); // Plus icon button
    const buttons = screen.getAllByRole('button');
    const plusBtn = buttons.find((btn) => btn.querySelector('svg.lucide-plus'));

    if (plusBtn) {
      fireEvent.click(plusBtn);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    }
  });

  it('removes item when trash button is clicked', async () => {
    render(<CartTester />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Open Cart'));

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Find and click trash button
    const buttons = screen.getAllByRole('button');
    const trashBtn = buttons.find((btn) => btn.querySelector('svg.lucide-trash-2'));

    if (trashBtn) {
      fireEvent.click(trashBtn);
      await waitFor(() => {
        expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      });
    }
  });

  it('shows checkout button and calculates total correctly', async () => {
    render(<CartTester />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Add Item')); // Add twice
    fireEvent.click(screen.getByText('Open Cart'));

    await waitFor(() => {
      // Total should show (2 * $29.99)
      expect(screen.getByText('$59.98')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
    });
  });

  it('opens checkout modal when checkout button is clicked', async () => {
    render(<CartTester />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Open Cart'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /checkout/i }));

    await waitFor(() => {
      // Checkout modal should appear
      expect(screen.getByText('Confirm Order')).toBeInTheDocument();
    });
  });
});

describe('Cart Context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const CartTestComponent = () => {
    const { items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice } =
      useCart();

    return (
      <div>
        <p data-testid="total-items">{totalItems}</p>
        <p data-testid="total-price">{totalPrice.toFixed(2)}</p>
        <p data-testid="item-count">{items.length}</p>
        <button
          onClick={() =>
            addToCart({
              id: 'test-1',
              name: 'Test',
              price: 10,
              image_url: null,
              stock_count: 5,
            })
          }
        >
          Add
        </button>
        <button onClick={() => updateQuantity('test-1', 3)}>Set Qty 3</button>
        <button onClick={() => removeFromCart('test-1')}>Remove</button>
        <button onClick={() => clearCart()}>Clear</button>
      </div>
    );
  };

  it('calculates totalItems and totalPrice correctly', async () => {
    render(<CartTestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(screen.getByTestId('total-price').textContent).toBe('0.00');

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('1');
      expect(screen.getByTestId('total-price').textContent).toBe('10.00');
    });

    fireEvent.click(screen.getByText('Set Qty 3'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('3');
      expect(screen.getByTestId('total-price').textContent).toBe('30.00');
    });
  });

  it('clears all items when clearCart is called', async () => {
    render(<CartTestComponent />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('2');
    });

    fireEvent.click(screen.getByText('Clear'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('0');
      expect(screen.getByTestId('item-count').textContent).toBe('0');
    });
  });
});
