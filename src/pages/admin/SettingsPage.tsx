import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SeedResult { membersCreated: number; membershipRecords: number; estimatedRevenue: string; checkInsCreated: number; }

export default function SettingsPage() {
  const { t } = useTranslation();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const { toast } = useToast();

  const handleSeedData = async () => {
    setSeeding(true); setSeedResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('seed-data');
      if (error) throw error;
      if (data.success) {
        setSeedResult(data.summary);
        toast({ title: t('admin.settings.seedSuccess'), description: t('admin.settings.seedSuccessDesc', { members: data.summary.membersCreated, checkIns: data.summary.checkInsCreated }) });
      } else throw new Error(data.error || 'Unknown error');
    } catch (error: any) {
      console.error('Seed error:', error);
      toast({ title: t('admin.settings.seedError'), description: error.message, variant: 'destructive' });
    } finally { setSeeding(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.settings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin.settings.subtitle')}</p>
        </div>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" />{t('admin.settings.demoData')}</CardTitle>
            <CardDescription>{t('admin.settings.demoDataDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-medium mb-3">{t('admin.settings.seedDataWillGenerate')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{t('admin.settings.seedItem1')}</li>
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{t('admin.settings.seedItem2')}</li>
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" />{t('admin.settings.seedItem3')}</li>
              </ul>
            </div>
            <Button onClick={handleSeedData} disabled={seeding} className="w-full sm:w-auto" size="lg">
              {seeding ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('admin.settings.seedingData')}</>) : (<><Database className="mr-2 h-4 w-4" />{t('admin.settings.seedDemoData')}</>)}
            </Button>
            {seedResult && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-primary font-medium mb-3"><CheckCircle className="h-5 w-5" />{t('admin.settings.seedSuccess')}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground">{t('admin.settings.members')}</p><p className="font-bold text-lg">{seedResult.membersCreated}</p></div>
                  <div><p className="text-muted-foreground">{t('admin.settings.memberships')}</p><p className="font-bold text-lg">{seedResult.membershipRecords}</p></div>
                  <div><p className="text-muted-foreground">{t('admin.settings.revenue')}</p><p className="font-bold text-lg">{seedResult.estimatedRevenue}</p></div>
                  <div><p className="text-muted-foreground">{t('admin.settings.checkIns')}</p><p className="font-bold text-lg">{seedResult.checkInsCreated}</p></div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-muted-foreground"><strong className="text-destructive">{t('admin.settings.warning')}</strong> {t('admin.settings.seedWarning')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
