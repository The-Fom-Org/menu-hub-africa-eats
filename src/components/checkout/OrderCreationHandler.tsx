
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
    console.log('=== ORDER CREATION START ===');
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    console.log('Order items:', JSON.stringify(orderItems, null, 2));
    
    // Create order without authentication context
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('=== ORDER CREATION ERROR ===');
      console.error('Error code:', orderError.code);
      console.error('Error message:', orderError.message);
      console.error('Error details:', orderError.details);
      console.error('Error hint:', orderError.hint);
      console.error('Full error object:', JSON.stringify(orderError, null, 2));
      
      // Provide more specific error messages
      if (orderError.code === '42501') {
        throw new Error('Permission denied: Unable to create order. Please check your permissions.');
      } else if (orderError.code === '23505') {
        throw new Error('Duplicate order: This order already exists.');
      } else if (orderError.code === '23503') {
        throw new Error('Invalid data: Referenced restaurant or menu item does not exist.');
      } else if (orderError.code === '23514') {
        throw new Error('Invalid data: Check constraint violation.');
      } else {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
    }

    console.log('=== ORDER CREATED SUCCESSFULLY ===');
    console.log('Order ID:', order.id);
    console.log('Order details:', JSON.stringify(order, null, 2));

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    console.log('=== CREATING ORDER ITEMS ===');
    console.log('Items to insert:', JSON.stringify(itemsWithOrderId, null, 2));

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)
      .select();

    if (itemsError) {
      console.error('=== ORDER ITEMS CREATION ERROR ===');
      console.error('Error code:', itemsError.code);
      console.error('Error message:', itemsError.message);
      console.error('Error details:', itemsError.details);
      console.error('Error hint:', itemsError.hint);
      console.error('Full error object:', JSON.stringify(itemsError, null, 2));
      
      // Try to cleanup the order if items failed
      console.log('Attempting to cleanup order due to items failure...');
      try {
        await supabase.from('orders').delete().eq('id', order.id);
        console.log('Order cleanup successful');
      } catch (cleanupError) {
        console.error('Order cleanup failed:', cleanupError);
      }
      
      // Provide more specific error messages for items
      if (itemsError.code === '42501') {
        throw new Error('Permission denied: Unable to create order items. Please check your permissions.');
      } else if (itemsError.code === '23503') {
        throw new Error('Invalid menu item: One or more menu items do not exist.');
      } else {
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }
    }

    console.log('=== ORDER ITEMS CREATED SUCCESSFULLY ===');
    console.log('Created items:', JSON.stringify(createdItems, null, 2));
    console.log('=== ORDER CREATION COMPLETE ===');
    
    return order;
  } catch (error) {
    console.error('=== ORDER CREATION PROCESS FAILED ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    throw error;
  }
};
