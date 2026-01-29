import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  UserCheck, 
  Dumbbell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Settings,
  Package,
  ShoppingBag,
  MessageSquare,
  Film,
  Bot,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin, profile } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const adminNavItems = [
    { label: t('nav.admin.dashboard'), icon: LayoutDashboard, path: '/admin' },
    { label: t('nav.admin.members'), icon: Users, path: '/admin/members' },
    { label: t('nav.admin.classes'), icon: Calendar, path: '/admin/classes' },
    { label: t('nav.admin.billing'), icon: Receipt, path: '/admin/billing' },
    { label: t('nav.admin.orders'), icon: Package, path: '/admin/orders' },
    { label: t('nav.admin.memberships'), icon: CreditCard, path: '/admin/memberships' },
    { label: t('nav.admin.checkIn'), icon: UserCheck, path: '/check-in' },
    { label: t('nav.admin.settings'), icon: Settings, path: '/admin/settings' },
  ];

  const memberNavItems = [
    { label: t('nav.member.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { label: t('nav.member.myClasses'), icon: Calendar, path: '/dashboard/classes' },
    { label: t('nav.member.bookClass'), icon: Dumbbell, path: '/dashboard/book' },
    { label: t('nav.member.videos'), icon: Film, path: '/dashboard/videos' },
    { label: t('map.title'), icon: Map, path: '/dashboard/map' },
    { label: t('nav.member.store'), icon: ShoppingBag, path: '/dashboard/store' },
    { label: t('nav.member.community'), icon: MessageSquare, path: '/dashboard/community' },
    { label: t('nav.member.coach'), icon: Bot, path: '/dashboard/coach' },
  ];

  const navItems = isAdmin ? adminNavItems : memberNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className={cn(
      "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">{t('brand.name')}</span>
          </div>
        )}
        {collapsed && <Dumbbell className="h-8 w-8 text-primary mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Language Toggle */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <LanguageToggle />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent",
                isActive && "bg-primary/10 text-primary border border-primary/20"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <span className={cn("font-medium", isActive && "text-primary")}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="mb-4 px-3">
            <p className="font-medium truncate">{profile.full_name || t('common.user')}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('common.signOut')}</span>}
        </Button>
      </div>
    </aside>
  );
}
