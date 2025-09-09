import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, DollarSign, Smartphone, Building2, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  notes: string;
}

export default function PaymentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingPayments();
    }
  }, [user]);

  const fetchPendingPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', user.id)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'completed',
          order_status: 'confirmed'
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Payment Confirmed",
        description: "Order has been marked as paid and confirmed",
      });

      // Refresh the list
      fetchPendingPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa_manual':
        return <Smartphone className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'mpesa_manual':
        return 'M-Pesa';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'pesapal':
        return 'Card Payment';
      default:
        return method;
    }
  };

  const filterOrdersByPaymentMethod = (method: string) => {
    return orders.filter(order => order.payment_method === method);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card key={order.id}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{order.customer_name || 'Anonymous'}</CardTitle>
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">KES {order.total_amount}</p>
            <Badge variant="outline" className="mt-1">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID:</span>
            <span className="font-mono">{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Method:</span>
            <div className="flex items-center gap-1">
              {getPaymentMethodIcon(order.payment_method)}
              <span>{getPaymentMethodLabel(order.payment_method)}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Time:</span>
            <span>{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
          </div>
          {order.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes:</span>
              <p className="mt-1 text-sm">{order.notes}</p>
            </div>
          )}
          <div className="pt-3 border-t">
            <Button 
              onClick={() => confirmPayment(order.id)}
              className="w-full"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Payment Received
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage and confirm manual payments from customers
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="mpesa_manual">
            M-Pesa ({filterOrdersByPaymentMethod('mpesa_manual').length})
          </TabsTrigger>
          <TabsTrigger value="bank_transfer">
            Bank ({filterOrdersByPaymentMethod('bank_transfer').length})
          </TabsTrigger>
          <TabsTrigger value="cash">
            Cash ({filterOrdersByPaymentMethod('cash').length})
          </TabsTrigger>
          <TabsTrigger value="pesapal">
            Card ({filterOrdersByPaymentMethod('pesapal').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.length > 0 ? (
              orders.map(order => <OrderCard key={order.id} order={order} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium">No pending payments</h3>
                <p className="text-muted-foreground">All payments have been processed!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mpesa_manual" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrdersByPaymentMethod('mpesa_manual').map(order => 
              <OrderCard key={order.id} order={order} />
            )}
            {filterOrdersByPaymentMethod('mpesa_manual').length === 0 && (
              <div className="col-span-full text-center py-12">
                <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending M-Pesa payments</h3>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bank_transfer" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrdersByPaymentMethod('bank_transfer').map(order => 
              <OrderCard key={order.id} order={order} />
            )}
            {filterOrdersByPaymentMethod('bank_transfer').length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending bank transfers</h3>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cash" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrdersByPaymentMethod('cash').map(order => 
              <OrderCard key={order.id} order={order} />
            )}
            {filterOrdersByPaymentMethod('cash').length === 0 && (
              <div className="col-span-full text-center py-12">
                <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending cash payments</h3>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pesapal" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterOrdersByPaymentMethod('pesapal').map(order => 
              <OrderCard key={order.id} order={order} />
            )}
            {filterOrdersByPaymentMethod('pesapal').length === 0 && (
              <div className="col-span-full text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending card payments</h3>
                <p className="text-sm text-muted-foreground">Card payments are usually processed automatically</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}