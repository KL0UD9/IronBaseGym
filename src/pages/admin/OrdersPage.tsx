import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Package, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/ui/kpi-card';
import { toast } from 'sonner';

interface OrderWithUser {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user: { full_name: string } | null;
  items: { quantity: number; product: { name: string } | null }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        user:profiles!orders_user_id_fkey(full_name),
        items:order_items(
          quantity,
          product:products(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      const ordersData = (data || []) as unknown as OrderWithUser[];
      setOrders(ordersData);

      // Calculate stats
      const totalRevenue = ordersData.reduce((sum, o) => sum + Number(o.total), 0);
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length;

      setStats({
        totalOrders: ordersData.length,
        totalRevenue,
        pendingOrders,
        avgOrderValue: ordersData.length > 0 ? totalRevenue / ordersData.length : 0,
      });
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
    } else {
      toast.success('Order status updated');
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    }
  };

  const getStatusVariant = (status: string): 'confirmed' | 'cancelled' | 'waitlist' | 'active' | 'expired' | 'pending' => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'confirmed';
      case 'cancelled':
        return 'cancelled';
      case 'pending':
        return 'pending';
      case 'shipped':
        return 'active';
      default:
        return 'pending';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Store Orders
          </h1>
          <p className="text-muted-foreground mt-1">Manage merch store purchases</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingBag}
          />
          <KPICard
            title="Store Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
          />
          <KPICard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={Package}
          />
          <KPICard
            title="Avg Order Value"
            value={`$${stats.avgOrderValue.toFixed(2)}`}
            icon={TrendingUp}
          />
        </div>

        {/* Orders Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No orders yet</p>
                <p className="text-muted-foreground">Orders will appear here once customers make purchases</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{order.user?.full_name || 'Unknown'}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-sm text-muted-foreground truncate">
                          {order.items.map(item => 
                            `${item.product?.name || 'Unknown'} (${item.quantity})`
                          ).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        ${Number(order.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
