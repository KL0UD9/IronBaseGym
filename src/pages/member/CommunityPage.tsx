import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  likes: { user_id: string }[];
}

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');

  // Fetch posts with profiles and likes
  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          likes (user_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Post[];
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPost('');
      toast({ title: t('community.toast.postCreated'), description: t('community.toast.postCreatedDesc') });
    },
    onError: () => {
      toast({ title: t('community.toast.error'), description: t('community.toast.errorDesc'), variant: 'destructive' });
    }
  });

  // Toggle like mutation
  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      const existingLike = posts?.find(p => p.id === postId)?.likes.find(l => l.user_id === user?.id);
      
      if (existingLike) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user!.id, post_id: postId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  // Subscribe to realtime updates
  supabase
    .channel('posts-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    })
    .subscribe();

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    createPost.mutate(newPost.trim());
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
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
                        <AvatarImage src={post.profiles.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(post.profiles.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{post.profiles.full_name}</p>
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
                        onClick={() => toggleLike.mutate(post.id)}
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
