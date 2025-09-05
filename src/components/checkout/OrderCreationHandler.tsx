
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantPaymentSettings } from '@/hooks/useRestaurantPaymentSettings';
import { paymentGatewayRegistry } from '@/lib/payment-gateways/registry';
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
  const { paymentSettings, getPaymentMethodConfig } = useRestaurantPaymentSettings(restaurantId);
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

      // Handle payment processing for pre-orders (scheduled orders)
      if (orderData.orderType === 'scheduled' && orderData.paymentMethod !== 'cash') {
        await processPayment(order, orderData, totalAmount);
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

  const processPayment = async (order: any, orderData: any, totalAmount: number) => {
    try {
      console.log('💳 Processing payment for scheduled order:', order.id);
      
      // Calculate 40% deposit for scheduled orders
      const depositAmount = Math.round(totalAmount * 0.4);
      
      const paymentMethodConfig = getPaymentMethodConfig(orderData.paymentMethod);
      
      if (!paymentMethodConfig) {
        throw new Error('Payment method not configured');
      }

      // Handle different payment methods
      switch (orderData.paymentMethod) {
        case 'mpesa':
        case 'card':
          // Use Pesapal for mpesa and card payments
          await processPesapalPayment(order, orderData, depositAmount);
          break;
        case 'mpesa_manual':
          await processManualMPesaPayment(order, orderData, depositAmount);
          break;
        case 'bank_transfer':
          await processBankTransferPayment(order, orderData, depositAmount);
          break;
        default:
          throw new Error('Unsupported payment method for scheduled orders');
      }
    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Payment processing failed. Please try again.",
        variant: "destructive",
      });
      setIsCreatingOrder(false);
    }
  };

  const processPesapalPayment = async (order: any, orderData: any, amount: number) => {
    const pesapalConfig = getPaymentMethodConfig('pesapal') as any;
    if (!pesapalConfig?.consumer_key || !pesapalConfig?.consumer_secret) {
      throw new Error('Pesapal credentials not configured');
    }

    const gateway = paymentGatewayRegistry.get('pesapal');
    if (!gateway) {
      throw new Error('Pesapal gateway not available');
    }

    const paymentRequest = {
      amount: amount,
      currency: 'KES',
      orderId: order.id,
      description: `Deposit for Order #${order.id}`,
      customerInfo: {
        name: orderData.customerName,
        phone: orderData.customerPhone,
        email: orderData.customerEmail
      },
      callbackUrl: `${window.location.origin}/order-success?token=${order.customer_token}&restaurant=${restaurantId}`,
      cancelUrl: `${window.location.origin}/customer-menu/${restaurantId}`
    };

    const gatewayConfig = {
      type: 'pesapal' as const,
      credentials: {
        consumer_key: pesapalConfig.consumer_key,
        consumer_secret: pesapalConfig.consumer_secret
      }
    };

    const response = await gateway.initializePayment(paymentRequest, gatewayConfig);
    
    if (!response.success || !response.paymentUrl) {
      throw new Error(response.error || 'Failed to initialize payment');
    }

    console.log('✅ Redirecting to Pesapal payment page');
    // Clear cart and redirect to payment
    clearCart();
    window.open(response.paymentUrl, '_blank');
    // Navigate to a "payment pending" page
    navigate(`/order-success?token=${order.customer_token}&restaurant=${restaurantId}&payment=pending`);
    setIsCreatingOrder(false);
  };

  const processManualMPesaPayment = async (order: any, orderData: any, amount: number) => {
    const mpesaConfig = getPaymentMethodConfig('mpesa_manual');
    
    // Show M-Pesa payment instructions
    clearCart();
    toast({
      title: "Payment Instructions",
      description: `Please pay KES ${amount} to complete your order. Instructions have been sent.`,
    });
    
    navigate(`/order-success?token=${order.customer_token}&restaurant=${restaurantId}&payment=manual&method=mpesa&amount=${amount}`);
    setIsCreatingOrder(false);
  };

  const processBankTransferPayment = async (order: any, orderData: any, amount: number) => {
    const bankConfig = getPaymentMethodConfig('bank_transfer');
    
    // Show bank transfer instructions
    clearCart();
    toast({
      title: "Payment Instructions",
      description: `Please transfer KES ${amount} to complete your order. Instructions have been sent.`,
    });
    
    navigate(`/order-success?token=${order.customer_token}&restaurant=${restaurantId}&payment=manual&method=bank&amount=${amount}`);
    setIsCreatingOrder(false);
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
