import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OverdueMember {
  id: string;
  user: { full_name: string } | null;
  membership: { name: string; price: number } | null;
  end_date: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export default function BillingPage() {
  const [overdueMembers, setOverdueMembers] = useState<OverdueMember[]>([]);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      // Fetch overdue members (membership expired yesterday)
      const yesterday = subDays(new Date(), 1).toISOString().split('T')[0];
      
      const { data: overdue } = await supabase
        .from('user_memberships')
        .select(`
          id,
          end_date,
          user:profiles!user_memberships_user_id_fkey(full_name),
          membership:memberships!user_memberships_membership_id_fkey(name, price)
        `)
        .eq('end_date', yesterday)
        .eq('status', 'active');

      const overdueData = (overdue || []) as unknown as OverdueMember[];
      setOverdueMembers(overdueData);
      
      const overdueTotal = overdueData.reduce((sum, m) => {
        return sum + (m.membership?.price || 0);
      }, 0);
      setTotalOverdue(overdueTotal);

      // Calculate revenue for last 6 months
      const monthlyData: MonthlyRevenue[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: memberships } = await supabase
          .from('user_memberships')
          .select(`
            membership:memberships!user_memberships_membership_id_fkey(price)
          `)
          .lte('start_date', monthEnd.toISOString())
          .gte('end_date', monthStart.toISOString());

        const monthRevenue = (memberships || []).reduce((sum, um) => {
          const membershipData = um.membership as { price: number } | null;
          return sum + (membershipData?.price || 0);
        }, 0);

        monthlyData.push({
          month: format(monthDate, 'MMM'),
          revenue: monthRevenue,
        });
      }

      setRevenueData(monthlyData);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Billing & Revenue</h1>
          <p className="text-muted-foreground mt-1">Track payments and revenue trends</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue (6 months)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueData.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-destructive/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Payments
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${totalOverdue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueMembers.length} member{overdueMembers.length !== 1 ? 's' : ''} with expired membership
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenue Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Payments List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueMembers.length > 0 ? (
              <div className="space-y-4">
                {overdueMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <div>
                      <p className="font-medium">{member.user?.full_name || 'Unknown Member'}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.membership?.name} • Expired {format(new Date(member.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-destructive">
                        ${member.membership?.price?.toLocaleString() || 0}
                      </span>
                      <StatusBadge status="expired" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No overdue payments</p>
                <p className="text-sm text-muted-foreground mt-1">All members are up to date!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
