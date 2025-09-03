
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import NotificationPermissionDialog from '@/components/notifications/NotificationPermissionDialog';

interface OrderCreationHandlerProps {
  restaurantId: string;
  children: (params: {
    createOrder: (orderData: any) => Promise<void>;
    isCreatingOrder: boolean;
  }) => React.ReactNode;
}

const OrderCreationHandler = ({ restaurantId, children }: OrderCreationHandlerProps) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const navigate = useNavigate();
  const { clearCart, cartItems, getCartTotal } = useCart(restaurantId);
  const { subscribeToPush, requestPermission, isSupported } = usePushNotifications();
  const { toast } = useToast();

  const createOrder = async (orderData: any) => {
    console.log('📝 Creating order with data:', orderData);
    setIsCreatingOrder(true);

    try {
      const totalAmount = getCartTotal();
      
      // Pre-generate identifiers to avoid SELECT after insert (RLS-safe)
      const orderId = crypto.randomUUID();
      const customerToken = crypto.randomUUID();

      // Create the order without selecting it back (avoids RLS SELECT restriction)
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customer_token: customerToken,
          restaurant_id: restaurantId,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          table_number: orderData.tableNumber,
          order_type: orderData.orderType,
          payment_method: orderData.paymentMethod,
          payment_status: 'pending',
          order_status: 'pending',
          total_amount: totalAmount,
          scheduled_time: orderData.scheduledTime,
          notes: orderData.notes,
        });

      if (orderError) {
        console.error('❌ Order creation failed:', orderError);
        throw orderError;
      }

      const order = { id: orderId, customer_token: customerToken };
      console.log('✅ Order created successfully:', order);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        customizations: item.customizations || {},
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Order items creation failed:', itemsError);
        throw itemsError;
      }

      console.log('✅ Order items created successfully');

      // Handle push notifications if supported
      if (isSupported && Notification.permission === 'default') {
        console.log('🔔 Showing notification permission dialog');
        setPendingOrderData({ orderId: order.id, order, orderData });
        setShowNotificationDialog(true);
      } else if (isSupported && Notification.permission === 'granted') {
        console.log('🔔 Permission already granted, subscribing to push notifications');
        await subscribeToPush(order.id);
        finalizeOrder(order, orderData);
      } else {
        console.log('🔔 Push notifications not supported or denied');
        finalizeOrder(order, orderData);
      }
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      toast({
        title: "Order failed",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
      setIsCreatingOrder(false);
    }
  };

  const finalizeOrder = (order: any, orderData: any) => {
    console.log('🎉 Finalizing order:', order.id);
    clearCart();
    toast({
      title: "Order created successfully!",
      description: "Your order has been submitted and is being processed.",
    });
    // Pass the customer token instead of the order ID for secure access
    navigate(`/order-success?token=${order.customer_token}&restaurant=${restaurantId}`);
    setIsCreatingOrder(false);
  };

  const handleNotificationAllow = async (): Promise<boolean> => {
    if (!pendingOrderData) return false;

    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribeToPush(pendingOrderData.orderId);
      }
      return granted;
    } catch (error) {
      console.error('❌ Failed to enable notifications:', error);
      return false;
    }
  };

  const handleNotificationDeny = () => {
    if (pendingOrderData) {
      console.log('🔔 User denied notifications, proceeding without them');
      finalizeOrder(pendingOrderData.order, pendingOrderData.orderData);
      setPendingOrderData(null);
    }
  };

  const handleNotificationDialogClose = () => {
    if (pendingOrderData) {
      console.log('🔔 Notification dialog closed, proceeding without notifications');
      finalizeOrder(pendingOrderData.order, pendingOrderData.orderData);
      setPendingOrderData(null);
    }
    setShowNotificationDialog(false);
  };

  return (
    <>
      {children({ createOrder, isCreatingOrder })}
      
      <NotificationPermissionDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        onAllow={handleNotificationAllow}
        onDeny={handleNotificationDeny}
      />
    </>
  );
};

export default OrderCreationHandler;
