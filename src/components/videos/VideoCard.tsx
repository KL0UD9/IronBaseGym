import { Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
}

interface VideoCardProps {
  video: Video;
  progress: number; // 0-100
  onClick: () => void;
}

export function VideoCard({ video, progress, onClick }: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasProgress = progress > 0 && progress < 90;

  return (
    <div
      className="group relative flex-shrink-0 w-[280px] md:w-[320px] cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={cn(
          "w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5",
          video.thumbnail_url && "hidden absolute inset-0"
        )}>
          <Play className="h-12 w-12 text-primary/50" />
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-medium flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(video.duration_seconds)}
        </div>

        {/* Progress Bar (Netflix-style) */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
        )}
      </div>
    </div>
  );
}
