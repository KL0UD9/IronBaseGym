import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Calendar, MessageSquare, Bot, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const memberNavItems = [
    { label: t('nav.member.home'), icon: LayoutDashboard, path: '/dashboard' },
    { label: t('nav.member.myClasses').split(' ')[0], icon: Calendar, path: '/dashboard/classes' },
    { label: t('nav.member.community'), icon: MessageSquare, path: '/dashboard/community' },
    { label: t('nav.member.coach'), icon: Bot, path: '/dashboard/coach' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {memberNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
                "min-w-[64px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive transition-all min-w-[64px]"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs font-medium">{t('common.logout')}</span>
        </button>
      </div>
    </nav>
  );
}
