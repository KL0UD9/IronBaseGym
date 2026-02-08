# 🏋️ IronBase - Gym Management SaaS

A modern, full-featured gym management system built with cutting-edge web technologies. IronBase provides comprehensive tools for gym owners, trainers, and members to manage memberships, classes, nutrition, gamification, and more.

![IronBase](https://img.shields.io/badge/IronBase-Gym%20Management-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat-square&logo=supabase)

---

## 📋 Table of Contents

- [Technology Stack](#-technology-stack)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Demo Accounts](#-demo-accounts)
- [Project Navigation](#-project-navigation)
- [Architecture](#-architecture)
- [Available Scripts](#-available-scripts)

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Description |
|------------|---------|-------------|
| **React** | 18.3.1 | Component-based UI library for building interactive interfaces |
| **TypeScript** | 5.x | Typed superset of JavaScript for enhanced developer experience |
| **Vite** | Latest | Next-generation frontend build tool with lightning-fast HMR |
| **Tailwind CSS** | 3.x | Utility-first CSS framework for rapid UI development |
| **shadcn/ui** | Latest | Beautiful, accessible React components built on Radix UI |

### State Management & Data Fetching

| Technology | Version | Description |
|------------|---------|-------------|
| **TanStack Query** | 5.83.0 | Powerful data synchronization and caching library |
| **React Context** | Built-in | Native React state management for auth and cart contexts |

### Routing & Navigation

| Technology | Version | Description |
|------------|---------|-------------|
| **React Router DOM** | 6.30.1 | Declarative routing for React applications |

### UI Components & Styling

| Technology | Version | Description |
|------------|---------|-------------|
| **Radix UI** | Various | Unstyled, accessible component primitives |
| **Lucide React** | 0.462.0 | Beautiful, consistent icon library |
| **Tailwind Animate** | 1.0.7 | Animation utilities for Tailwind CSS |
| **class-variance-authority** | 0.7.1 | Type-safe component variant management |
| **clsx** | 2.1.1 | Utility for constructing className strings |
| **tailwind-merge** | 2.6.0 | Merge Tailwind classes without conflicts |

### Forms & Validation

| Technology | Version | Description |
|------------|---------|-------------|
| **React Hook Form** | 7.61.1 | Performant, flexible forms with easy validation |
| **Zod** | 3.25.76 | TypeScript-first schema validation |
| **@hookform/resolvers** | 3.10.0 | Validation resolvers for React Hook Form |

### Backend & Database

| Technology | Version | Description |
|------------|---------|-------------|
| **Supabase** | 2.93.2 | Open-source Firebase alternative with PostgreSQL |
| **PostgreSQL** | 14+ | Powerful, open-source relational database |
| **Row Level Security** | - | Fine-grained access control at database level |
| **Edge Functions** | Deno | Serverless functions for custom backend logic |

### Internationalization

| Technology | Version | Description |
|------------|---------|-------------|
| **i18next** | 25.8.0 | Internationalization framework |
| **react-i18next** | 16.5.4 | React bindings for i18next |

### Data Visualization & Maps

| Technology | Version | Description |
|------------|---------|-------------|
| **Recharts** | 2.15.4 | Composable charting library for React |
| **Leaflet** | 1.9.4 | Interactive maps library |
| **React Leaflet** | 4.2.1 | React components for Leaflet maps |

### Additional Libraries

| Technology | Version | Description |
|------------|---------|-------------|
| **date-fns** | 3.6.0 | Modern JavaScript date utility library |
| **Sonner** | 1.7.4 | Beautiful toast notifications |
| **canvas-confetti** | 1.9.4 | Confetti animations for celebrations |
| **react-markdown** | 10.1.0 | Markdown renderer for React |
| **Embla Carousel** | 8.6.0 | Lightweight carousel library |
| **Vaul** | 0.9.9 | Drawer component for React |
| **next-themes** | 0.3.0 | Theme management (light/dark mode) |

### Testing

| Technology | Version | Description |
|------------|---------|-------------|
| **Vitest** | Latest | Fast unit testing framework |
| **Testing Library** | Latest | Simple testing utilities for React |

---

## ✨ Features

### 👤 For Members
- **Dashboard** - Personal fitness overview with stats and progress
- **Class Booking** - Browse and book fitness classes
- **My Classes** - View upcoming and past class bookings
- **Video Library** - Access workout videos by category
- **Nutrition Tracker** - Log meals and track macros with visual charts
- **AI Coach** - Get personalized fitness advice from AI
- **Community Feed** - Share posts and interact with other members
- **Gamification** - Earn XP, unlock achievements, level up
- **Arena** - Join tournaments and compete with others
- **Referral Program** - Invite friends and earn rewards
- **Trainer Map** - Find trainers near your location
- **Store** - Purchase gym merchandise and supplements
- **Profile** - Manage personal information and avatar

### 👨‍🏫 For Trainers
- All member features
- View bookings for assigned classes
- Location sharing on trainer map

### 🔐 For Admins
- **Admin Dashboard** - KPI overview with charts and metrics
- **Members Management** - View and manage all gym members
- **Classes Management** - Create, edit, and delete classes
- **Billing** - Manage memberships and subscriptions
- **Orders** - View and process store orders
- **Check-In Kiosk** - Member check-in interface
- **Settings** - Configure gym settings

### 🌍 Multi-language Support
- English 🇺🇸
- Spanish 🇪🇸
- Japanese 🇯🇵
- Chinese 🇨🇳

### 🎨 Theme Support
- Light mode ☀️
- Dark mode 🌙

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

---

## 🔑 Demo Accounts

Use these test accounts to explore different user roles:

### Login Credentials

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN ACCOUNT                                                  │
│  Email:    kloud@test.com                                       │
│  Password: 1234567890                                           │
│  Access:   Full admin dashboard, members, classes, billing,     │
│            orders, check-in kiosk, settings                     │
├─────────────────────────────────────────────────────────────────┤
│  TRAINER ACCOUNT                                                │
│  Email:    trainer1@test.com                                    │
│  Password: 1234567890                                           │
│  Access:   All member features + view class bookings,           │
│            appear on trainer map                                │
├─────────────────────────────────────────────────────────────────┤
│  MEMBER ACCOUNT                                                 │
│  Email:    member1@test.com                                     │
│  Password: 1234567890                                           │
│  Access:   Dashboard, classes, videos, nutrition, AI coach,     │
│            community, store, arena, referrals, profile          │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Reference Table

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | `kloud@test.com` | `1234567890` |
| 🏋️ Trainer | `trainer1@test.com` | `1234567890` |
| 👤 Member | `member1@test.com` | `1234567890` |

> **Note**: All accounts share the same password for easy testing: `1234567890`

---

## 🗺 Project Navigation

### Landing Page (`/`)
The public homepage showcasing gym features. Click **"Start Your Journey"** or use the header buttons to sign in or sign up.

### Authentication (`/login`)
- **Sign In Tab**: Enter email and password
- **Sign Up Tab**: Create a new account (optional referral code)

### Member Dashboard (`/dashboard`)
After logging in as a member, you'll see the sidebar navigation:

| Menu Item | Route | Description |
|-----------|-------|-------------|
| Dashboard | `/dashboard` | Overview with stats, level progress, achievements |
| My Classes | `/dashboard/classes` | Your booked classes |
| Book Class | `/dashboard/book` | Browse and book available classes |
| Videos | `/dashboard/videos` | Workout video library |
| Nutrition | `/dashboard/nutrition` | Food logging and macro tracking |
| Arena | `/dashboard/arena` | Tournaments and competitions |
| Referrals | `/dashboard/referrals` | Your referral code and earnings |
| Trainer Map | `/dashboard/map` | Find nearby trainers |
| Store | `/dashboard/store` | Shop for merchandise |
| Community | `/dashboard/community` | Social feed and posts |
| AI Coach | `/dashboard/coach` | Chat with AI fitness coach |
| Profile | `/dashboard/profile` | Edit your profile and avatar |

### Admin Dashboard (`/admin`)
After logging in as an admin:

| Menu Item | Route | Description |
|-----------|-------|-------------|
| Dashboard | `/admin` | KPIs, revenue charts, member stats |
| Members | `/admin/members` | All registered members |
| Classes | `/admin/classes` | Manage class schedule |
| Billing | `/admin/billing` | Membership plans and subscriptions |
| Orders | `/admin/orders` | Store order management |
| Check-In | `/check-in` | Member check-in kiosk |
| Settings | `/admin/settings` | Gym configuration |

### Quick Tips for Testing

1. **Test the Store Flow**
   - Go to Store → Add items to cart → Checkout

2. **Test Class Booking**
   - Go to Book Class → Select a class → Confirm booking

3. **Test Nutrition Tracking**
   - Go to Nutrition → Click "+ Add Food" → Search and log food

4. **Test AI Coach**
   - Go to AI Coach → Type a fitness question → Get AI response

5. **Test Community**
   - Go to Community → Create a post → Like other posts

6. **Test Gamification**
   - Complete activities to earn XP → Watch for level-up modal

7. **Change Language**
   - Use the language dropdown in the sidebar

8. **Toggle Theme**
   - Click the sun/moon icon in the sidebar

---

## 🏗 Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── layout/         # Layout components (Sidebar, DashboardLayout)
│   ├── arena/          # Tournament-related components
│   ├── coach/          # AI coach components
│   ├── gamification/   # XP, levels, achievements
│   ├── map/            # Trainer map components
│   ├── nutrition/      # Food logging components
│   ├── profile/        # Profile editing components
│   ├── store/          # E-commerce components
│   └── videos/         # Video player components
├── contexts/           # React context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── CartContext.tsx # Shopping cart state
│   └── GamificationContext.tsx # XP and level state
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── locales/            # Translation files (en, es, ja, zh)
├── pages/              # Page components
│   ├── admin/          # Admin-only pages
│   └── member/         # Member pages
└── __tests__/          # Test files

supabase/
└── functions/          # Edge functions
    ├── ai-coach/       # AI coach endpoint
    └── seed-data/      # Database seeding
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |

---

## 📄 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture details
- **[USER_GUIDE.md](./USER_GUIDE.md)** - End-user documentation

---

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (admin, trainer, member)
- Secure authentication via Supabase Auth
- Environment variables for sensitive configuration

---

## 📱 Responsive Design

IronBase is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktop monitors

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Lovable](https://lovable.dev) - AI-powered development platform
- [shadcn/ui](https://ui.shadcn.com) - Beautiful component library
- [Supabase](https://supabase.com) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) - Styling framework

---

<p align="center">
  Made with ❤️ using <a href="https://lovable.dev">Lovable</a>
</p>
