import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MemberLayoutProps {
  children: ReactNode;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      {!isMobile && <Sidebar />}
      
      <main className="flex-1 overflow-auto">
        <div className="container py-6 px-4 md:py-8 md:px-6 max-w-7xl pb-20 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile && <BottomTabBar />}
    </div>
  );
}
