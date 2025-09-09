
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantPaymentSettings } from '@/hooks/useRestaurantPaymentSettings';
import { PesapalGateway, PesapalPaymentRequest } from '@/lib/payment-gateways/pesapal';
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
  const { settings: paymentSettings } = useRestaurantPaymentSettings(restaurantId);

  const createOrder = async (orderData: any) => {
    console.log('📝 Creating order with data:', orderData);
    setIsCreatingOrder(true);

    try {
      const totalAmount = getCartTotal();
      const isPreOrder = orderData.orderType === 'later';
      const paymentAmount = isPreOrder ? totalAmount * 0.4 : totalAmount;
      
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

      // Handle payment for pre-orders
      if (isPreOrder && orderData.paymentMethod !== 'cash') {
        await handlePayment(order, orderData, paymentAmount);
      } else {
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

  const handlePayment = async (order: any, orderData: any, amount: number) => {
    try {
      if (orderData.paymentMethod === 'pesapal') {
        await handlePesapalPayment(order, orderData, amount);
      } else if (orderData.paymentMethod === 'mpesa') {
        await handleMpesaPayment(order, orderData, amount);
      } else if (orderData.paymentMethod === 'bank_transfer') {
        await handleBankTransferPayment(order, orderData, amount);
      }
    } catch (error) {
      console.error('Payment handling error:', error);
      throw error;
    }
  };

  const handlePesapalPayment = async (order: any, orderData: any, amount: number) => {
    const pesapalSettings = paymentSettings?.payment_methods?.pesapal;
    if (!pesapalSettings?.consumer_key || !pesapalSettings?.consumer_secret) {
      throw new Error('Pesapal payment settings not configured');
    }

    const pesapal = new PesapalGateway({
      consumer_key: pesapalSettings.consumer_key,
      consumer_secret: pesapalSettings.consumer_secret,
      environment: 'sandbox', // TODO: Make this configurable
      ipn_id: pesapalSettings.ipn_id,
    });

    const paymentRequest: PesapalPaymentRequest = {
      id: order.id,
      currency: 'KES',
      amount: amount,
      description: `Pre-order reservation for ${orderData.customerName || 'Customer'}`,
      callback_url: `${window.location.origin}/order-success?token=${order.customer_token}&restaurant=${restaurantId}`,
      notification_id: pesapalSettings.ipn_id,
      billing_address: {
        email_address: orderData.customerPhone ? `${orderData.customerPhone}@example.com` : undefined,
        phone_number: orderData.customerPhone || undefined,
        first_name: orderData.customerName || 'Customer',
        country_code: 'KE',
      },
    };

    const paymentResponse = await pesapal.initializePayment(paymentRequest);
    
    // Clear cart before redirecting to payment
    clearCart();
    
    // Redirect to Pesapal payment page
    window.location.href = paymentResponse.redirect_url;
  };

  const handleMpesaPayment = async (order: any, orderData: any, amount: number) => {
    // Show M-Pesa instructions
    toast({
      title: "M-Pesa Payment",
      description: `Please send KSh ${amount.toFixed(2)} to the restaurant's M-Pesa number. Your order will be processed once payment is confirmed.`,
    });
    
    clearCart();
    navigate(`/order-success?token=${order.customer_token}&restaurant=${restaurantId}&paymentPending=true`);
  };

  const handleBankTransferPayment = async (order: any, orderData: any, amount: number) => {
    // Show bank transfer instructions
    toast({
      title: "Bank Transfer Payment",
      description: `Please transfer KSh ${amount.toFixed(2)} to the restaurant's bank account. Your order will be processed once payment is confirmed.`,
    });
    
    clearCart();
    navigate(`/order-success?token=${order.customer_token}&restaurant=${restaurantId}&paymentPending=true`);
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
