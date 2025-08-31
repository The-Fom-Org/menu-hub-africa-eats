import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/hooks/useOrderManagement';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WaiterCallNotifications } from "@/components/notifications/WaiterCallNotifications";

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  const fetchOrders = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            menu_item:menu_items (
              name,
              price
            )
          )
        `)
        .eq('restaurant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error loading orders",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setOrders(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for order updates
    if (!user?.id) return;

    const subscription = supabase
      .channel('order-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `restaurant_id=eq.${user.id}`
        }, 
        () => {
          console.log('Order changed, refreshing...');
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, toast]);

  const filteredOrders = orders.filter(order => {
    const statusMatch = orderStatusFilter === 'all' || order.order_status === orderStatusFilter;
    const searchTermMatch = searchTerm === '' || (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || order.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()));
    return statusMatch && searchTermMatch;
  });

  const OrderStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.order_status === 'pending').length;
    const confirmedOrders = orders.filter(order => order.order_status === 'confirmed').length;
    const completedOrders = orders.filter(order => order.order_status === 'completed').length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedOrders}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
          <CardDescription>
            {new Date(order.created_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Customer:</strong> {order.customer_name || 'Walk-in'}
          </p>
           {order.customer_phone && (
            <p>
              <strong>Phone:</strong> {order.customer_phone}
            </p>
          )}
          <p>
            <strong>Type:</strong> {order.order_type}
          </p>
          <p>
            <strong>Payment:</strong> {order.payment_method} ({order.payment_status})
          </p>
          <p>
            <strong>Status:</strong> {order.order_status}
          </p>
          <p>
            <strong>Total:</strong> KES {order.total_amount}
          </p>
          {order.table_number && (
            <p>
              <strong>Table:</strong> {order.table_number}
            </p>
          )}
          {order.scheduled_time && (
            <p>
              <strong>Scheduled:</strong> {new Date(order.scheduled_time).toLocaleString()}
            </p>
          )}
          {order.order_items && order.order_items.length > 0 && (
            <>
              <p><strong>Items:</strong></p>
              <ul>
                {order.order_items.map(item => (
                  <li key={item.id}>
                    {item.menu_item.name} x {item.quantity} - KES {item.unit_price * item.quantity}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="secondary">View Details</Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Orders & Notifications</h1>
            <p className="text-muted-foreground">
              Manage incoming orders and waiter call requests.
            </p>
          </div>

          {/* Waiter Call Notifications */}
          <WaiterCallNotifications />

          <OrderStats />

          <div className="flex items-center justify-between">
            <Input
              type="text"
              placeholder="Search customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center">Loading orders...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
