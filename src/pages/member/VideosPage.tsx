import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification, XP_REWARDS } from '@/contexts/GamificationContext';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { VideoCard } from '@/components/videos/VideoCard';
import { VideoPlayerModal } from '@/components/videos/VideoPlayerModal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  videos: Video[];
}

interface WatchHistory {
  video_id: string;
  progress_seconds: number;
  completed: boolean;
}

export default function VideosPage() {
  const { user } = useAuth();
  const { awardXP, checkAchievements } = useGamification();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Fetch categories with videos
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['video-categories'],
    queryFn: async () => {
      const { data: cats, error: catsError } = await supabase
        .from('video_categories')
        .select('*')
        .order('sort_order');

      if (catsError) throw catsError;

      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*');

      if (videosError) throw videosError;

      return cats.map((cat) => ({
        ...cat,
        videos: videos.filter((v) => v.category_id === cat.id),
      })) as Category[];
    },
  });

  // Fetch watch history
  const { data: watchHistory } = useQuery({
    queryKey: ['watch-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watch_history')
        .select('video_id, progress_seconds, completed')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data as WatchHistory[];
    },
    enabled: !!user,
  });

  // Update watch progress mutation
  const updateProgress = useMutation({
    mutationFn: async ({
      videoId,
      progress,
      duration,
    }: {
      videoId: string;
      progress: number;
      duration: number;
    }) => {
      const completed = progress / duration >= 0.9;

      const { error } = await supabase.from('watch_history').upsert(
        {
          user_id: user!.id,
          video_id: videoId,
          progress_seconds: Math.floor(progress),
          completed,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,video_id' }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history', user?.id] });
    },
  });

  const getVideoProgress = (videoId: string) => {
    const history = watchHistory?.find((h) => h.video_id === videoId);
    return history?.progress_seconds || 0;
  };

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleProgressUpdate = (progress: number, duration: number) => {
    if (selectedVideo && user) {
      updateProgress.mutate({
        videoId: selectedVideo.id,
        progress,
        duration,
      });
    }
  };

  // Handle video completion for XP award
  const handleVideoComplete = useCallback(async () => {
    if (!user) return;
    
    // Award XP for completing video
    await awardXP(XP_REWARDS.VIDEO_COMPLETED, 'Video Completed');
    
    // Check video-related achievements
    const { count } = await supabase
      .from('watch_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true);
    
    if (count) {
      await checkAchievements('videos_completed', count);
    }
  }, [user, awardXP, checkAchievements]);

  // Get "Continue Watching" videos (started but not completed)
  const continueWatching = watchHistory
    ?.filter((h) => h.progress_seconds > 0 && !h.completed)
    .map((h) => {
      const allVideos = categories?.flatMap((c) => c.videos) || [];
      return allVideos.find((v) => v.id === h.video_id);
    })
    .filter(Boolean) as Video[] | undefined;

  return (
    <MemberLayout>
      <div className="space-y-8 animate-fade-in -mx-4 md:-mx-6">
        {/* Hero Header */}
        <div className="relative h-[300px] md:h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920"
            alt="Workout Library"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Film className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">On-Demand</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-2">Workout Library</h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Premium fitness content. Train anytime, anywhere.
            </p>
          </div>
        </div>

        {/* Continue Watching Row */}
        {continueWatching && continueWatching.length > 0 && (
          <CategoryRow
            title="Continue Watching"
            videos={continueWatching}
            watchHistory={watchHistory || []}
            onPlay={handlePlayVideo}
          />
        )}

        {/* Loading State */}
        {loadingCategories ? (
          <div className="space-y-8 px-4 md:px-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-40 w-64 rounded-lg flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          categories?.map((category) => (
            <CategoryRow
              key={category.id}
              title={category.name}
              description={category.description}
              videos={category.videos}
              watchHistory={watchHistory || []}
              onPlay={handlePlayVideo}
            />
          ))
        )}
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
        initialProgress={selectedVideo ? getVideoProgress(selectedVideo.id) : 0}
        onProgressUpdate={handleProgressUpdate}
        onVideoComplete={handleVideoComplete}
      />
    </MemberLayout>
  );
}

// Category Row Component with horizontal scroll
function CategoryRow({
  title,
  description,
  videos,
  watchHistory,
  onPlay,
}: {
  title: string;
  description?: string | null;
  videos: Video[];
  watchHistory: WatchHistory[];
  onPlay: (video: Video) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [videos]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getProgress = (videoId: string, duration: number) => {
    const history = watchHistory.find((h) => h.video_id === videoId);
    if (!history || history.progress_seconds === 0) return 0;
    return (history.progress_seconds / duration) * 100;
  };

  if (videos.length === 0) return null;

  return (
    <div className="relative group/row px-4 md:px-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {/* Scroll Buttons */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 translate-y-2 z-20 h-full w-12 rounded-none bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 translate-y-2 z-20 h-full w-12 rounded-none bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mb-4"
        onScroll={checkScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            progress={getProgress(video.id, video.duration_seconds)}
            onClick={() => onPlay(video)}
          />
        ))}
      </div>
    </div>
  );
}
