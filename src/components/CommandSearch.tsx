import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  User,
  ShoppingBag,
  Film,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Map,
  Bot,
  Settings,
  Users,
  Receipt,
  Package,
  UserCheck,
  CreditCard,
  Apple,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'trainer' | 'product' | 'video' | 'post' | 'page';
  path: string;
  icon: React.ReactNode;
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search trainers
  const { data: trainers = [] } = useQuery({
    queryKey: ['search-trainers', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'trainer')
        .ilike('full_name', `%${query}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });

  // Search products
  const { data: products = [] } = useQuery({
    queryKey: ['search-products', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });

  // Search videos
  const { data: videos = [] } = useQuery({
    queryKey: ['search-videos', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, description')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });

  // Search posts
  const { data: posts = [] } = useQuery({
    queryKey: ['search-posts', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, user_id')
        .ilike('content', `%${query}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });

  // Navigation pages
  const memberPages = [
    { id: 'dashboard', title: t('nav.member.dashboard'), path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'classes', title: t('nav.member.myClasses'), path: '/dashboard/classes', icon: <Calendar className="h-4 w-4" /> },
    { id: 'book', title: t('nav.member.bookClass'), path: '/dashboard/book', icon: <Dumbbell className="h-4 w-4" /> },
    { id: 'videos', title: t('nav.member.videos'), path: '/dashboard/videos', icon: <Film className="h-4 w-4" /> },
    { id: 'nutrition', title: t('nav.member.nutrition'), path: '/dashboard/nutrition', icon: <Apple className="h-4 w-4" /> },
    { id: 'map', title: t('map.title'), path: '/dashboard/map', icon: <Map className="h-4 w-4" /> },
    { id: 'store', title: t('nav.member.store'), path: '/dashboard/store', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'community', title: t('nav.member.community'), path: '/dashboard/community', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'coach', title: t('nav.member.coach'), path: '/dashboard/coach', icon: <Bot className="h-4 w-4" /> },
    { id: 'profile', title: t('nav.member.profile'), path: '/dashboard/profile', icon: <User className="h-4 w-4" /> },
  ];

  const adminPages = [
    { id: 'admin-dashboard', title: t('nav.admin.dashboard'), path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'admin-members', title: t('nav.admin.members'), path: '/admin/members', icon: <Users className="h-4 w-4" /> },
    { id: 'admin-classes', title: t('nav.admin.classes'), path: '/admin/classes', icon: <Calendar className="h-4 w-4" /> },
    { id: 'admin-billing', title: t('nav.admin.billing'), path: '/admin/billing', icon: <Receipt className="h-4 w-4" /> },
    { id: 'admin-orders', title: t('nav.admin.orders'), path: '/admin/orders', icon: <Package className="h-4 w-4" /> },
    { id: 'admin-memberships', title: t('nav.admin.memberships'), path: '/admin/memberships', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'admin-checkin', title: t('nav.admin.checkIn'), path: '/check-in', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'admin-settings', title: t('nav.admin.settings'), path: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const pages = isAdmin ? adminPages : memberPages;

  const filteredPages = query.length >= 1
    ? pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    : pages;

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  }, [navigate]);

  const hasResults = trainers.length > 0 || products.length > 0 || videos.length > 0 || posts.length > 0 || filteredPages.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t('commandSearch.placeholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length >= 2 && !hasResults && (
          <CommandEmpty>{t('commandSearch.noResults')}</CommandEmpty>
        )}

        {/* Pages */}
        {filteredPages.length > 0 && (
          <CommandGroup heading={t('commandSearch.categories.pages')}>
            {filteredPages.map((page) => (
              <CommandItem
                key={page.id}
                value={page.title}
                onSelect={() => handleSelect(page.path)}
                className="flex items-center gap-3 cursor-pointer"
              >
                {page.icon}
                <span>{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Trainers */}
        {trainers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('commandSearch.categories.trainers')}>
              {trainers.map((trainer) => (
                <CommandItem
                  key={trainer.id}
                  value={trainer.full_name}
                  onSelect={() => handleSelect('/dashboard/map')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-medium">{trainer.full_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">Trainer</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Products */}
        {products.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('commandSearch.categories.products')}>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect('/dashboard/store')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4 text-orange-500" />
                  <div>
                    <span className="font-medium">{product.name}</span>
                    {product.category && (
                      <span className="text-xs text-muted-foreground ml-2 capitalize">{product.category}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('commandSearch.categories.videos')}>
              {videos.map((video) => (
                <CommandItem
                  key={video.id}
                  value={video.title}
                  onSelect={() => handleSelect('/dashboard/videos')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Film className="h-4 w-4 text-blue-500" />
                  <div>
                    <span className="font-medium">{video.title}</span>
                    {video.description && (
                      <span className="text-xs text-muted-foreground ml-2 line-clamp-1">
                        {video.description.slice(0, 40)}...
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('commandSearch.categories.posts')}>
              {posts.map((post) => (
                <CommandItem
                  key={post.id}
                  value={post.content}
                  onSelect={() => handleSelect('/dashboard/community')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="line-clamp-1">{post.content.slice(0, 60)}...</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
