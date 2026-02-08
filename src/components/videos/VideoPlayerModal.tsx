import { useEffect, useRef, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  SkipBack,
  SkipForward,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
}

interface VideoPlayerModalProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProgress: number;
  onProgressUpdate: (progress: number, duration: number) => void;
  onVideoComplete?: () => void;
}

// Helper to extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function VideoPlayerModal({
  video,
  open,
  onOpenChange,
  initialProgress,
  onProgressUpdate,
  onVideoComplete,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const hasAwardedXP = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check if video URL is YouTube
  const youtubeVideoId = useMemo(() => {
    return video?.url ? getYouTubeVideoId(video.url) : null;
  }, [video?.url]);

  const isYouTube = !!youtubeVideoId;

  // YouTube embed URL with autoplay and controls
  const youtubeEmbedUrl = useMemo(() => {
    if (!youtubeVideoId) return null;
    const startTime = Math.floor(initialProgress);

    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      start: String(startTime),
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    });

    // Best practice when embedding 3rd-party players
    if (typeof window !== 'undefined') {
      params.set('origin', window.location.origin);
    }

    return `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?${params.toString()}`;
  }, [youtubeVideoId, initialProgress]);

  // Initialize video when opened (non-YouTube only)
  useEffect(() => {
    if (open && video && !isYouTube) {
      if (videoRef.current) {
        videoRef.current.currentTime = initialProgress;
        setCurrentTime(initialProgress);
        setIsLoading(true);
        hasAwardedXP.current = false;

        // Start progress tracking interval
        progressInterval.current = setInterval(() => {
          if (videoRef.current && !videoRef.current.paused) {
            const progress = videoRef.current.currentTime;
            const videoDuration = videoRef.current.duration;
            onProgressUpdate(progress, videoDuration);
            
            // Award XP when 90% complete (and hasn't been awarded yet)
            if (!hasAwardedXP.current && progress / videoDuration >= 0.9) {
              hasAwardedXP.current = true;
              onVideoComplete?.();
            }
          }
        }, 5000); // Save every 5 seconds
      }
    }

    // For YouTube videos, mark as complete after a reasonable watch time
    if (open && video && isYouTube) {
      setIsLoading(false);
      hasAwardedXP.current = false;
      
      // Award XP after watching for 90% of video duration
      const watchDuration = (video.duration_seconds || 300) * 0.9 * 1000;
      progressInterval.current = setTimeout(() => {
        if (!hasAwardedXP.current) {
          hasAwardedXP.current = true;
          onVideoComplete?.();
          onProgressUpdate(video.duration_seconds, video.duration_seconds);
        }
      }, Math.min(watchDuration, 300000)); // Max 5 minutes
    }

    return () => {
      if (progressInterval.current) {
        if (isYouTube) {
          clearTimeout(progressInterval.current);
        } else {
          clearInterval(progressInterval.current);
        }
      }
    };
  }, [open, video, isYouTube]);

  // Handle controls visibility (non-YouTube only)
  useEffect(() => {
    if (isYouTube) return; // YouTube has its own controls

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    if (open) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [open, isPlaying, isYouTube]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + seconds, duration)
      );
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    // Save final progress (non-YouTube only)
    if (!isYouTube && videoRef.current) {
      onProgressUpdate(videoRef.current.currentTime, duration);
    }
    setIsPlaying(false);
    onOpenChange(false);
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black border-none [&>button]:hidden"
        ref={containerRef}
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{video.title}</DialogTitle>
        </VisuallyHidden>
        
        {/* YouTube Embed */}
        {isYouTube ? (
          <div className="relative w-full h-full flex flex-col">
            {/* Top Bar for YouTube */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <h2 className="text-white text-xl font-semibold">{video.title}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {/* YouTube iframe */}
            <iframe
              src={youtubeEmbedUrl || undefined}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>
        ) : (
          /* Native Video Player */
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={togglePlay}
          >
            {/* Video Element */}
            <video
              ref={videoRef}
              src={video.url}
              className="w-full h-full object-contain"
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onLoadedMetadata={() => {
                setDuration(videoRef.current?.duration || 0);
                setIsLoading(false);
              }}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onEnded={() => {
                setIsPlaying(false);
                onProgressUpdate(duration, duration);
                if (!hasAwardedXP.current) {
                  hasAwardedXP.current = true;
                  onVideoComplete?.();
                }
              }}
              poster={video.thumbnail_url || undefined}
            />

            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-16 w-16 text-white animate-spin" />
              </div>
            )}

            {/* Center Play Button (when paused) */}
            {!isPlaying && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="p-6 rounded-full bg-white/20 backdrop-blur-sm">
                  <Play className="h-16 w-16 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Controls Overlay */}
            <div
              className={cn(
                'absolute inset-0 flex flex-col justify-between transition-opacity duration-300 pointer-events-none',
                showControls ? 'opacity-100' : 'opacity-0'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                <h2 className="text-white text-xl font-semibold">{video.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleClose}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Bottom Controls */}
              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto space-y-3">
                {/* Progress Bar */}
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 fill-white" />
                      )}
                    </Button>

                    {/* Skip Buttons */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => skip(-10)}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => skip(10)}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>

                    {/* Volume */}
                    <div className="flex items-center gap-2 group">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={toggleMute}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>
                      <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300">
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={1}
                          step={0.1}
                          onValueChange={handleVolumeChange}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <span className="text-white text-sm ml-2">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Fullscreen */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize className="h-5 w-5" />
                      ) : (
                        <Maximize className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
