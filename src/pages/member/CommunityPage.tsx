import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification, XP_REWARDS } from '@/contexts/GamificationContext';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  likes: { user_id: string }[];
}

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const { awardXP, checkAchievements } = useGamification();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const likeLockRef = useRef<Set<string>>(new Set());

  // Fetch posts with author info (using view that doesn't expose user_ids)
  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: async () => {
      // Get posts from the secure view
      const { data: postsData, error: postsError } = await supabase
        .from('posts_with_author')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      // Get likes separately (user needs to see their own like status)
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id, user_id');
      
      if (likesError) throw likesError;
      
      // Combine posts with their likes
      return postsData.map(post => ({
        ...post,
        likes: likesData?.filter(like => like.post_id === post.id) || []
      })) as Post[];
    }
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('posts')
        .insert({ user_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPost('');
      toast({ title: t('community.toast.postCreated'), description: t('community.toast.postCreatedDesc') });
      
      // Award XP for posting
      await awardXP(XP_REWARDS.POST_CREATED, 'Community Post');
      
      // Check post-related achievements
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      
      if (count) {
        await checkAchievements('posts_created', count);
      }
    },
    onError: () => {
      toast({ title: t('community.toast.error'), description: t('community.toast.errorDesc'), variant: 'destructive' });
    }
  });

  // Toggle like mutation with optimistic updates
  const toggleLike = useMutation({
    mutationFn: async ({ postId, isCurrentlyLiked }: { postId: string; isCurrentlyLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
        return { action: 'unliked' as const };
      }

      // Like
      const { error } = await supabase
        .from('likes')
        .upsert(
          { user_id: user.id, post_id: postId },
          { onConflict: 'user_id,post_id', ignoreDuplicates: true }
        );
      if (error) throw error;
      return { action: 'liked' as const };
    },
    onMutate: async ({ postId, isCurrentlyLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['community-posts'] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(['community-posts']);

      // Optimistically update the cache
      queryClient.setQueryData<Post[]>(['community-posts'], (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: isCurrentlyLiked
                  ? post.likes.filter((l) => l.user_id !== user?.id)
                  : [...post.likes, { user_id: user!.id }],
              }
            : post
        ) ?? []
      );

      return { previousPosts };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['community-posts'], context.previousPosts);
      }
      toast({
        title: t('community.toast.error'),
        description: t('community.toast.errorDesc'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Refetch to ensure server state is synced
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);


  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    createPost.mutate(newPost.trim());
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const handleToggleLike = (postId: string, isCurrentlyLiked: boolean) => {
    // Guard against double-triggered clicks
    if (likeLockRef.current.has(postId)) return;
    likeLockRef.current.add(postId);

    toggleLike.mutate(
      { postId, isCurrentlyLiked },
      {
        onSettled: () => {
          likeLockRef.current.delete(postId);
        },
      }
    );
  };


  return (
    <MemberLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{t('community.title')}</h1>
          <p className="text-muted-foreground">{t('community.subtitle')}</p>
        </div>

        {/* Create Post Card */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(profile?.full_name || '')}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder={t('community.createPost.placeholder')}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!newPost.trim() || createPost.isPending}
                  className="gap-2"
                >
                  {createPost.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t('community.createPost.button')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts?.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">{t('community.noPosts')}</p>
              <p className="text-muted-foreground">{t('community.beFirst')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts?.map((post) => {
              const isLiked = post.likes.some(l => l.user_id === user?.id);
              const likeCount = post.likes.length;

              return (
                <Card key={post.id} className="glass-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author_avatar || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(post.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{post.author_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post.id, isLiked)}
                        disabled={toggleLike.isPending && toggleLike.variables?.postId === post.id}
                        className={`gap-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
