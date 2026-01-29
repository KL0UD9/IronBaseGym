# IronBase Architecture Documentation

> **Version**: 1.0  
> **Last Updated**: January 2026  
> **Stack**: React 18 + TypeScript + Vite + Supabase + TailwindCSS

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
6. [Authentication System](#authentication-system)
7. [Cart Context & E-Commerce](#cart-context--e-commerce)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Key Components](#key-components)
10. [API Patterns](#api-patterns)

---

## Overview

IronBase is a comprehensive gym management platform built as a single-page application (SPA). It provides:

- **Member Portal**: Class booking, check-in tracking, merchandise store, community feed, AI coach, and on-demand workout videos
- **Admin Dashboard**: Member management, class scheduling, billing analytics, order fulfillment, and settings
- **Public Pages**: Landing page with marketing content and authentication

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | UI library with hooks |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Fast dev server & bundling |
| Styling | TailwindCSS + shadcn/ui | Utility-first CSS with pre-built components |
| State Management | TanStack Query | Server state caching & synchronization |
| Routing | React Router v6 | Client-side routing |
| Backend | Supabase (Lovable Cloud) | PostgreSQL + Auth + Edge Functions |
| i18n | react-i18next | Multi-language support (EN/ES) |

---

## Project Structure

```
src/
├── components/
│   ├── layout/           # DashboardLayout, MemberLayout, Sidebar, BottomTabBar
│   ├── store/            # ProductCard, ShoppingCartSidebar, CheckoutModal, CartButton
│   ├── videos/           # VideoCard, VideoPlayerModal
│   └── ui/               # shadcn/ui components (button, card, dialog, etc.)
├── contexts/
│   ├── AuthContext.tsx   # Authentication state & methods
│   └── CartContext.tsx   # Shopping cart state & persistence
├── hooks/
│   ├── use-mobile.tsx    # Mobile detection hook
│   └── use-toast.ts      # Toast notification hook
├── integrations/
│   └── supabase/
│       ├── client.ts     # Supabase client instance (auto-generated)
│       └── types.ts      # Database types (auto-generated)
├── lib/
│   ├── i18n.ts           # i18next configuration
│   └── utils.ts          # Utility functions (cn, etc.)
├── locales/
│   ├── en.json           # English translations
│   └── es.json           # Spanish translations
├── pages/
│   ├── admin/            # Admin dashboard pages
│   ├── member/           # Member dashboard pages
│   ├── Auth.tsx          # Login/signup page
│   ├── CheckIn.tsx       # Front desk check-in
│   ├── Index.tsx         # Redirect logic
│   ├── LandingPage.tsx   # Public marketing page
│   └── NotFound.tsx      # 404 page
└── App.tsx               # Root component with routing
```

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   auth.users     │────▶│    profiles      │────▶│   user_roles     │
│   (Supabase)     │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │
         │                        ├──────────────────────────────────┐
         │                        │                                  │
         ▼                        ▼                                  ▼
┌──────────────────┐     ┌──────────────────┐              ┌──────────────────┐
│ user_memberships │     │    bookings      │              │   chat_messages  │
└──────────────────┘     └──────────────────┘              └──────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│   memberships    │     │     classes      │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     orders       │────▶│   order_items    │────▶│    products      │
└──────────────────┘     └──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│      posts       │────▶│      likes       │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ video_categories │────▶│     videos       │────▶│  watch_history   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Table Definitions

#### `profiles`
Stores user profile information linked to Supabase Auth.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | - | Primary key, references `auth.users(id)` |
| `full_name` | text | No | `''` | User's display name |
| `role` | app_role | No | `'member'` | User role enum: admin, trainer, member |
| `avatar_url` | text | Yes | - | Profile picture URL |
| `created_at` | timestamptz | No | `now()` | Account creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

#### `user_roles`
Separate table for role management (security best practice).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | References user |
| `role` | app_role | No | - | Role assignment |
| `created_at` | timestamptz | No | `now()` | Assignment timestamp |

#### `memberships`
Defines available membership plans.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Plan name (e.g., "Monthly Premium") |
| `description` | text | Yes | - | Plan details |
| `price` | numeric | No | - | Price in dollars |
| `duration_months` | integer | No | `1` | Subscription length |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

#### `user_memberships`
Tracks which users have which memberships.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Member reference |
| `membership_id` | uuid | No | - | Plan reference |
| `status` | text | No | `'active'` | active, expired, pending |
| `start_date` | date | No | `CURRENT_DATE` | Subscription start |
| `end_date` | date | No | - | Subscription end |
| `created_at` | timestamptz | No | `now()` | Record creation |

#### `classes`
Gym class schedule.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Class name |
| `description` | text | Yes | - | Class details |
| `trainer_id` | uuid | Yes | - | Instructor reference |
| `start_time` | timestamptz | No | - | Scheduled time |
| `duration_min` | integer | No | `60` | Duration in minutes |
| `capacity` | integer | No | `20` | Max participants |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

#### `bookings`
Class reservations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Member reference |
| `class_id` | uuid | No | - | Class reference |
| `status` | text | No | `'confirmed'` | confirmed, cancelled |
| `created_at` | timestamptz | No | `now()` | Booking timestamp |

#### `products`
Merchandise catalog.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Product name |
| `description` | text | Yes | - | Product details |
| `price` | numeric | No | - | Price in dollars |
| `image_url` | text | Yes | - | Product image URL |
| `category` | text | Yes | `'general'` | Product category |
| `stock_count` | integer | No | `0` | Available inventory |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update |

#### `orders`
Customer orders.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Customer reference |
| `total` | numeric | No | - | Order total |
| `status` | text | No | `'pending'` | pending, confirmed, shipped, delivered |
| `created_at` | timestamptz | No | `now()` | Order timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update |

#### `order_items`
Line items within orders.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `order_id` | uuid | No | - | Order reference |
| `product_id` | uuid | No | - | Product reference |
| `quantity` | integer | No | - | Quantity ordered |
| `price_at_purchase` | numeric | No | - | Price snapshot |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

#### `posts`
Community feed posts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | Author reference |
| `content` | text | No | - | Post content |
| `image_url` | text | Yes | - | Attached image |
| `created_at` | timestamptz | No | `now()` | Post timestamp |

#### `likes`
Post likes/reactions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | User who liked |
| `post_id` | uuid | No | - | Post reference |
| `created_at` | timestamptz | No | `now()` | Like timestamp |

#### `chat_messages`
AI Coach conversation history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | User reference |
| `content` | text | No | - | Message content |
| `role` | text | No | `'user'` | user or assistant |
| `created_at` | timestamptz | No | `now()` | Message timestamp |

#### `video_categories`
Workout video categories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | - | Category name |
| `description` | text | Yes | - | Category description |
| `sort_order` | integer | Yes | `0` | Display order |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

#### `videos`
On-demand workout videos.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `category_id` | uuid | No | - | Category reference |
| `title` | text | No | - | Video title |
| `description` | text | Yes | - | Video description |
| `url` | text | No | - | Video file URL |
| `thumbnail_url` | text | Yes | - | Preview image |
| `duration_seconds` | integer | No | `0` | Video length |
| `created_at` | timestamptz | No | `now()` | Upload timestamp |

#### `watch_history`
User video progress tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | - | User reference |
| `video_id` | uuid | No | - | Video reference |
| `progress_seconds` | integer | No | `0` | Playback position |
| `completed` | boolean | No | `false` | Watched 90%+ |
| `last_watched_at` | timestamptz | No | `now()` | Last view time |
| `created_at` | timestamptz | No | `now()` | First view time |

---

## Row-Level Security (RLS) Policies

All tables have RLS enabled. Policies use the `has_role()` security definer function to prevent recursive policy checks.

### Security Definer Function

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### Policy Summary by Table

#### `profiles`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own profile | SELECT | `auth.uid() = id` |
| Users can update their own profile | UPDATE | `auth.uid() = id` |
| Users can insert their own profile | INSERT | `auth.uid() = id` |
| Admins can view all profiles | SELECT | `has_role(auth.uid(), 'admin')` |
| Trainers can view all profiles | SELECT | `has_role(auth.uid(), 'trainer')` |

#### `user_roles`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own roles | SELECT | `user_id = auth.uid()` |
| Admins can manage all roles | ALL | `has_role(auth.uid(), 'admin')` |

#### `memberships`
| Policy | Command | Expression |
|--------|---------|------------|
| Anyone can view memberships | SELECT | `true` |
| Only admins can manage memberships | ALL | `has_role(auth.uid(), 'admin')` |

#### `user_memberships`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own membership | SELECT | `user_id = auth.uid()` |
| Admins can view all user memberships | SELECT | `has_role(auth.uid(), 'admin')` |
| Admins can manage user memberships | ALL | `has_role(auth.uid(), 'admin')` |

#### `classes`
| Policy | Command | Expression |
|--------|---------|------------|
| Anyone can view classes | SELECT | `true` |
| Admins can manage classes | ALL | `has_role(auth.uid(), 'admin')` |
| Trainers can manage their classes | UPDATE | `trainer_id = auth.uid()` |

#### `bookings`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own bookings | SELECT | `user_id = auth.uid()` |
| Users can create their own bookings | INSERT | `user_id = auth.uid()` |
| Users can update their own bookings | UPDATE | `user_id = auth.uid()` |
| Admins can view all bookings | SELECT | `has_role(auth.uid(), 'admin')` |
| Trainers can view bookings for their classes | SELECT | EXISTS subquery on classes |

#### `products`
| Policy | Command | Expression |
|--------|---------|------------|
| Anyone can view products | SELECT | `true` |
| Admins can manage products | ALL | `has_role(auth.uid(), 'admin')` |

#### `orders`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own orders | SELECT | `user_id = auth.uid()` |
| Users can create their own orders | INSERT | `user_id = auth.uid()` |
| Admins can view all orders | SELECT | `has_role(auth.uid(), 'admin')` |
| Admins can update orders | UPDATE | `has_role(auth.uid(), 'admin')` |

#### `order_items`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own order items | SELECT | EXISTS subquery on orders |
| Users can create order items for their orders | INSERT | EXISTS subquery on orders |
| Admins can view all order items | SELECT | `has_role(auth.uid(), 'admin')` |

#### `posts`
| Policy | Command | Expression |
|--------|---------|------------|
| Anyone can view posts | SELECT | `true` |
| Users can create their own posts | INSERT | `auth.uid() = user_id` |
| Users can update their own posts | UPDATE | `auth.uid() = user_id` |
| Users can delete their own posts | DELETE | `auth.uid() = user_id` |

#### `likes`
| Policy | Command | Expression |
|--------|---------|------------|
| Anyone can view likes | SELECT | `true` |
| Users can create their own likes | INSERT | `auth.uid() = user_id` |
| Users can delete their own likes | DELETE | `auth.uid() = user_id` |

#### `chat_messages`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own messages | SELECT | `auth.uid() = user_id` |
| Users can create their own messages | INSERT | `auth.uid() = user_id` |

#### `video_categories` & `videos`
| Policy | Command | Expression |
|--------|---------|------------|
| Anyone can view | SELECT | `true` |
| Admins can manage | ALL | `has_role(auth.uid(), 'admin')` |

#### `watch_history`
| Policy | Command | Expression |
|--------|---------|------------|
| Users can view their own watch history | SELECT | `auth.uid() = user_id` |
| Users can create their own watch history | INSERT | `auth.uid() = user_id` |
| Users can update their own watch history | UPDATE | `auth.uid() = user_id` |

---

## Authentication System

### AuthContext (`src/contexts/AuthContext.tsx`)

The authentication system is built on Supabase Auth with a React Context wrapper.

#### State

```typescript
interface AuthContextType {
  user: User | null;              // Supabase User object
  session: Session | null;        // Supabase Session
  profile: Profile | null;        // App-specific profile data
  loading: boolean;               // Auth state loading
  signUp: (email, password, fullName) => Promise<{ error }>;
  signIn: (email, password) => Promise<{ error }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;               // Derived from profile.role
  isTrainer: boolean;             // Derived from profile.role
  isMember: boolean;              // Derived from profile.role
}
```

#### Authentication Flow

```
┌─────────────────┐
│  App Loads      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  supabase.auth.getSession() │
│  + onAuthStateChange()      │
└────────────┬────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌────────┐      ┌──────────┐
│ No User │      │ Has User │
└────┬───┘      └────┬─────┘
     │               │
     ▼               ▼
┌─────────┐   ┌───────────────┐
│ Show    │   │ fetchProfile() │
│ Login   │   └───────┬───────┘
└─────────┘           │
                      ▼
              ┌───────────────┐
              │ Set profile   │
              │ state         │
              └───────────────┘
```

#### Key Implementation Details

1. **Session Persistence**: Supabase handles session tokens automatically via cookies
2. **Profile Sync**: Profile is fetched after auth state changes using `setTimeout(..., 0)` to avoid race conditions
3. **Auto-confirm**: Email signups are auto-confirmed in development (configured in Supabase)
4. **Role Derivation**: `isAdmin`, `isTrainer`, `isMember` are computed from `profile.role`

#### Database Trigger for New Users

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'member');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;
```

This trigger automatically creates:
- A `profiles` record with default `member` role
- A `user_roles` record for RLS policy checks

---

## Cart Context & E-Commerce

### CartContext (`src/contexts/CartContext.tsx`)

The shopping cart uses React Context with localStorage persistence.

#### State

```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock_count: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product) => void;
  removeFromCart: (productId) => void;
  updateQuantity: (productId, quantity) => void;
  clearCart: () => void;
  totalItems: number;              // Sum of all quantities
  totalPrice: number;              // Sum of price * quantity
  isCartOpen: boolean;             // Sidebar visibility
  setIsCartOpen: (open) => void;
}
```

#### Persistence

```typescript
const CART_STORAGE_KEY = 'gym-merch-cart';

// Load from localStorage on mount
const [items, setItems] = useState<CartItem[]>(() => {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
});

// Sync to localStorage on changes
useEffect(() => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}, [items]);
```

#### Add to Cart Logic

```typescript
const addToCart = (product) => {
  setItems((prev) => {
    const existing = prev.find((item) => item.id === product.id);
    if (existing) {
      // Don't exceed stock
      if (existing.quantity >= product.stock_count) return prev;
      return prev.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }
    return [...prev, { ...product, quantity: 1 }];
  });
  setIsCartOpen(true); // Auto-open sidebar
};
```

#### Checkout Flow

```
┌──────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Cart Sidebar │────▶│ Checkout Modal  │────▶│ Order Created  │
│              │     │                 │     │                │
│ - Items list │     │ - Confirm total │     │ - Insert order │
│ - Quantities │     │ - Place order   │     │ - Insert items │
│ - Total      │     │                 │     │ - Update stock │
└──────────────┘     └─────────────────┘     └────────────────┘
```

#### Stock Management

On checkout, the system:
1. Creates an `orders` record with total
2. Creates `order_items` for each cart item
3. Decrements `products.stock_count` for each item
4. Clears the cart

---

## Internationalization (i18n)

### Configuration (`src/lib/i18n.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: localStorage.getItem('language') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
```

### Language Toggle

The `LanguageToggle` component switches between 🇺🇸 and 🇪🇸:

```typescript
const toggleLanguage = () => {
  const newLang = i18n.language === 'en' ? 'es' : 'en';
  i18n.changeLanguage(newLang);
  localStorage.setItem('language', newLang);
};
```

### Translation Structure

```json
{
  "landing": { ... },
  "auth": { ... },
  "nav": {
    "admin": { ... },
    "member": { ... }
  },
  "store": { ... },
  "community": { ... },
  "coach": { ... },
  "videos": { ... },
  "admin": { ... },
  "common": { ... }
}
```

---

## Key Components

### Protected Routes

```typescript
function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/auth" />;
  
  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect based on actual role
    if (profile?.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/dashboard" />;
  }

  return children;
}
```

### Layout Components

- **DashboardLayout**: Admin sidebar + main content area
- **MemberLayout**: Member sidebar + bottom tab bar (mobile)
- **Sidebar**: Collapsible navigation with role-based items

### Video Player

The `VideoPlayerModal` component provides:
- Full-screen video playback
- Custom controls (play, pause, seek, volume, fullscreen)
- Progress tracking (saves every 5 seconds)
- Resume from last position

---

## API Patterns

### Query Pattern (TanStack Query)

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
});
```

### Mutation Pattern

```typescript
const mutation = useMutation({
  mutationFn: async (newOrder) => {
    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    toast({ title: 'Order placed!' });
  },
});
```

### Real-time Subscriptions

```typescript
useEffect(() => {
  const channel = supabase
    .channel('posts-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'posts' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

These are auto-configured by Lovable Cloud and should not be modified manually.

---

## Security Considerations

1. **Never store roles in localStorage** - Always fetch from database
2. **Use `has_role()` function** - Prevents RLS recursion
3. **Separate `user_roles` table** - Defense against privilege escalation
4. **Stock validation** - Check stock before allowing cart additions
5. **Price snapshot** - Store `price_at_purchase` to prevent price manipulation

---

## Development Notes

### Adding a New Table

1. Create migration via Lovable's database tool
2. Add RLS policies (always enable RLS)
3. Types auto-generate in `src/integrations/supabase/types.ts`
4. Create React Query hooks for data fetching

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Wrap with `ProtectedRoute` if auth required
4. Add navigation item to Sidebar

### Adding Translations

1. Add keys to `src/locales/en.json`
2. Add translations to `src/locales/es.json`
3. Use `t('key.path')` in components
