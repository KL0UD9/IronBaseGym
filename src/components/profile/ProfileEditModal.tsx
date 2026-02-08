import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      let finalAvatarUrl = avatarUrl;
      
      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
        
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // Continue without avatar update if upload fails
        } else {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          finalAvatarUrl = urlData.publicUrl;
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: finalAvatarUrl || null,
        })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: t('profile.edit.success'),
        description: t('profile.edit.successDescription'),
      });
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: t('profile.edit.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Security: Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t('profile.edit.fileTooLarge'),
          description: t('profile.edit.maxFileSize'),
          variant: 'destructive',
        });
        return;
      }
      
      // Security: Validate file type - only allow safe image formats
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t('profile.edit.invalidFileType') || 'Invalid file type',
          description: t('profile.edit.allowedFileTypes') || 'Please use JPEG, PNG, WebP, or GIF images',
          variant: 'destructive',
        });
        return;
      }
      
      // Security: Block SVG files which can contain embedded scripts
      if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        toast({
          title: t('profile.edit.invalidFileType') || 'Invalid file type',
          description: t('profile.edit.svgNotAllowed') || 'SVG files are not allowed for security reasons',
          variant: 'destructive',
        });
        return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const displayAvatar = avatarPreview || avatarUrl || profile?.avatar_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('profile.edit.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={displayAvatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getInitials(fullName || profile?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{t('profile.edit.avatarHint')}</p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full-name">{t('profile.edit.fullName')}</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('profile.edit.fullNamePlaceholder')}
              maxLength={100}
            />
          </div>

          {/* Avatar URL (alternative to upload) */}
          <div className="space-y-2">
            <Label htmlFor="avatar-url">{t('profile.edit.avatarUrl')}</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setAvatarFile(null);
                setAvatarPreview(null);
              }}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => updateProfile.mutate()} 
            disabled={updateProfile.isPending || !fullName.trim()}
          >
            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
