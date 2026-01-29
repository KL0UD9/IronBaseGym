import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import '@/lib/i18n';
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MembersPage from "./pages/admin/MembersPage";
import ClassesPage from "./pages/admin/ClassesPage";
import BillingPage from "./pages/admin/BillingPage";
import SettingsPage from "./pages/admin/SettingsPage";
import OrdersPage from "./pages/admin/OrdersPage";
import CheckInPage from "./pages/CheckIn";
import MemberDashboard from "./pages/member/MemberDashboard";
import BookClassPage from "./pages/member/BookClassPage";
import MyClassesPage from "./pages/member/MyClassesPage";
import StorePage from "./pages/member/StorePage";
import CommunityPage from "./pages/member/CommunityPage";
import CoachPage from "./pages/member/CoachPage";
import VideosPage from "./pages/member/VideosPage";
import TrainerMapPage from "./pages/member/TrainerMapPage";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'trainer' | 'member' }) {
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();

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

  if (requiredRole && profile?.role !== requiredRole) {
    if (profile?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/check-in" element={<CheckInPage />} />
      
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
