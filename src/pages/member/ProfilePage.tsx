import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import { TrophyCase } from '@/components/gamification/TrophyCase';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { useGamification } from '@/contexts/GamificationContext';
import { User, Trophy, BarChart3, Pencil } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { stats, userAchievements } = useGamification();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="glass-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getInitials(profile?.full_name || '')}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 sm:justify-start justify-center">
                  <h1 className="text-2xl font-bold truncate">{profile?.full_name || t('common.user')}</h1>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground capitalize">{profile?.role}</p>
              </div>
              <XPDisplay className="w-full sm:w-auto flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.total_xp_earned || 0}</p>
              <p className="text-xs text-muted-foreground">{t('gamification.profile.totalXP')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{userAchievements.length}</p>
              <p className="text-xs text-muted-foreground">{t('gamification.profile.achievements')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">Lv.{stats?.current_level || 1}</p>
              <p className="text-xs text-muted-foreground">{t('gamification.profile.level')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.current_xp || 0}</p>
              <p className="text-xs text-muted-foreground">{t('gamification.profile.currentXP')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trophies" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trophies" className="gap-2">
              <Trophy className="h-4 w-4" />
              {t('gamification.profile.trophyCase')}
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('gamification.profile.statsTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="trophies" className="mt-4">
            <TrophyCase />
          </TabsContent>
          <TabsContent value="stats" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{t('gamification.profile.progressStats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <XPDisplay />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Edit Profile Modal */}
        <ProfileEditModal open={editModalOpen} onOpenChange={setEditModalOpen} />
      </div>
    </MemberLayout>
  );
}
