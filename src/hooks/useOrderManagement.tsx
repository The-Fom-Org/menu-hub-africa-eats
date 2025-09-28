import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: string;
  payment_method?: string;
  payment_status: string;
  order_status: string;
  total_amount: number;
  created_at: string;
  scheduled_time?: string;
  table_number?: string | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    menu_item: {
      name: string;
      price: number;
    };
  }>;
}

export const useOrderManagement = (userId: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error loading orders",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, order_status: status }
            : order
        )
      );

      // Send push notification
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (orderToUpdate) {
        try {
          await supabase.functions.invoke('send-order-status-push', {
            body: {
              orderId,
              orderStatus: status,
              customerName: orderToUpdate.customer_name,
              totalAmount: orderToUpdate.total_amount,
            },
          });
          console.log('Push notification sent for order status update');
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError);
          // Don't show error to user as the main operation succeeded
        }
      }

      toast({
        title: "Order updated",
        description: `Order status changed to ${status}`,
      });

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Update failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const markOrderPaid = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'completed',
          order_status: 'confirmed'
        })
        .eq('id', orderId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, payment_status: 'completed', order_status: 'confirmed' }
            : order
        )
      );

      // Send push notification for confirmation
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (orderToUpdate) {
        try {
          await supabase.functions.invoke('send-order-status-push', {
            body: {
              orderId,
              orderStatus: 'confirmed',
              customerName: orderToUpdate.customer_name,
              totalAmount: orderToUpdate.total_amount,
            },
          });
          console.log('Push notification sent for order confirmation');
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError);
        }
      }

      toast({
        title: "Payment confirmed",
        description: "Order has been marked as paid and confirmed",
      });

      return true;
    } catch (error) {
      console.error('Error marking order as paid:', error);
      toast({
        title: "Update failed",
        description: "Failed to mark order as paid. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTableNumber = async (orderId: string, tableNumber: string | null) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ table_number: tableNumber })
        .eq('id', orderId)
        .eq('user_id', userId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, table_number: tableNumber }
            : order
        )
      );

      toast({
        title: "Table updated",
        description: tableNumber ? `Table set to ${tableNumber}` : "Table cleared",
      });

      return true;
    } catch (error) {
      console.error('Error updating table number:', error);
      toast({
        title: "Update failed",
        description: "Failed to update table number. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  // Set up real-time subscription for order updates
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('order-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${userId}`
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
  }, [userId]);

  return {
    orders,
    loading,
    updateOrderStatus,
    markOrderPaid,
    updateTableNumber,
    refetch: fetchOrders
  };
};
