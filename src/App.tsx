import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "next-themes";
import '@/lib/i18n';
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GamificationProvider } from "@/contexts/GamificationContext";

// Eagerly load landing page for fast initial render
import LandingPage from "./pages/LandingPage";

// Lazy load all other pages for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const MembersPage = lazy(() => import("./pages/admin/MembersPage"));
const ClassesPage = lazy(() => import("./pages/admin/ClassesPage"));
const BillingPage = lazy(() => import("./pages/admin/BillingPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const OrdersPage = lazy(() => import("./pages/admin/OrdersPage"));
const CheckInPage = lazy(() => import("./pages/CheckIn"));
const MemberDashboard = lazy(() => import("./pages/member/MemberDashboard"));
const BookClassPage = lazy(() => import("./pages/member/BookClassPage"));
const MyClassesPage = lazy(() => import("./pages/member/MyClassesPage"));
const StorePage = lazy(() => import("./pages/member/StorePage"));
const CommunityPage = lazy(() => import("./pages/member/CommunityPage"));
const CoachPage = lazy(() => import("./pages/member/CoachPage"));
const VideosPage = lazy(() => import("./pages/member/VideosPage"));
const TrainerMapPage = lazy(() => import("./pages/member/TrainerMapPage"));
const ProfilePage = lazy(() => import("./pages/member/ProfilePage"));
const NutritionPage = lazy(() => import("./pages/member/NutritionPage"));
const ArenaPage = lazy(() => import("./pages/member/ArenaPage"));
const ReferralPage = lazy(() => import("./pages/member/ReferralPage"));
const LevelUpModal = lazy(() => import("@/components/gamification/LevelUpModal").then(m => ({ default: m.LevelUpModal })));
const CommandSearch = lazy(() => import("@/components/CommandSearch").then(m => ({ default: m.CommandSearch })));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'trainer' | 'member' }) {
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();

  // Show loading while auth or profile is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for profile to be loaded before checking roles
  // This prevents premature redirects when profile hasn't loaded yet
  if (requiredRole && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requiredRole && profile) {
    // Admin can access admin routes, trainers can access trainer routes
    if (requiredRole === 'admin' && profile.role !== 'admin') {
      // Non-admins trying to access admin routes
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'trainer' && profile.role !== 'trainer' && profile.role !== 'admin') {
      // Only trainers and admins can access trainer routes
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'member' && profile.role === 'admin') {
      // Admins trying to access member-only routes go to admin dashboard
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/check-in" element={<CheckInPage />} />
      
      {/* Legacy /member/* redirects to /dashboard/* */}
      <Route path="/member/community" element={<Navigate to="/dashboard/community" replace />} />
      <Route path="/member/coach" element={<Navigate to="/dashboard/coach" replace />} />
      <Route path="/member/*" element={<Navigate to="/dashboard" replace />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/members" element={
        <ProtectedRoute requiredRole="admin">
          <MembersPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/classes" element={
        <ProtectedRoute requiredRole="admin">
          <ClassesPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/billing" element={
        <ProtectedRoute requiredRole="admin">
          <BillingPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute requiredRole="admin">
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute requiredRole="admin">
          <OrdersPage />
        </ProtectedRoute>
      } />

      {/* Member Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MemberDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/classes" element={
        <ProtectedRoute>
          <MyClassesPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/book" element={
        <ProtectedRoute>
          <BookClassPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/store" element={
        <ProtectedRoute>
          <StorePage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/community" element={
        <ProtectedRoute>
          <CommunityPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/coach" element={
        <ProtectedRoute>
          <CoachPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/videos" element={
        <ProtectedRoute>
          <VideosPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/map" element={
        <ProtectedRoute>
          <TrainerMapPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/nutrition" element={
        <ProtectedRoute>
          <NutritionPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/arena" element={
        <ProtectedRoute>
          <ArenaPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/referrals" element={
        <ProtectedRoute>
          <ReferralPage />
        </ProtectedRoute>
      } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <GamificationProvider>
              <CartProvider>
                <AppRoutes />
                <LevelUpModal />
                <CommandSearch />
              </CartProvider>
            </GamificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
