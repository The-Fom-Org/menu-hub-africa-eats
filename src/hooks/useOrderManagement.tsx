
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
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    customizations?: Record<string, any>;
    menu_item: {
      name: string;
      price: number;
    };
  }>;
}

export const useOrderManagement = (restaurantId: string) => {
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
        .eq('restaurant_id', restaurantId)
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
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, order_status: status }
            : order
        )
      );

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
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, payment_status: 'completed', order_status: 'confirmed' }
            : order
        )
      );

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

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
    }
  }, [restaurantId]);

  // Set up real-time subscription for order updates
  useEffect(() => {
    if (!restaurantId) return;

    const subscription = supabase
      .channel('order-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
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
  }, [restaurantId]);

  return {
    orders,
    loading,
    updateOrderStatus,
    markOrderPaid,
    refetch: fetchOrders
  };
};
