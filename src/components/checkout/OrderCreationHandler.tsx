
import { supabase } from '@/integrations/supabase/client';

interface OrderData {
  restaurant_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_type: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  total_amount: number;
  scheduled_time: string | null;
}

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  customizations: any;
}

export const createOrderWithItems = async (
  orderData: OrderData,
  orderItems: Omit<OrderItem, 'order_id'>[]
) => {
  try {
    console.log('Creating order with public access...');
    
    // Create order without authentication context
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('Order created successfully:', order);

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Try to cleanup the order if items failed
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('Order items created successfully');
    return order;
  } catch (error) {
    console.error('Order creation process failed:', error);
    throw error;
  }
};
