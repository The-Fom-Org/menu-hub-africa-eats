
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantPaymentSettings } from '@/hooks/useRestaurantPaymentSettings';
import { useAuth } from '@/hooks/useAuth';
import { PesapalGateway, PesapalPaymentRequest } from '@/lib/payment-gateways/pesapal';
import NotificationPermissionDialog from '@/components/notifications/NotificationPermissionDialog';
import { PaymentInstructionsDialog } from '@/components/payment/PaymentInstructionsDialog';

interface OrderCreationHandlerProps {
  restaurantId: string;
  children: (params: {
    createOrder: (orderData: any) => Promise<void>;
    isCreatingOrder: boolean;
  }) => React.ReactNode;
}

const OrderCreationHandler = ({ restaurantId: propRestaurantId, children }: OrderCreationHandlerProps) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use the prop restaurant ID directly since it's now the user ID
  const restaurantId = propRestaurantId;
  
  const { clearCart, cartItems, getCartTotal } = useCart(restaurantId);
  const { subscribeToPush, requestPermission, isSupported } = usePushNotifications();
  const { toast } = useToast();
  const { settings: paymentSettings } = useRestaurantPaymentSettings(restaurantId);

  const createOrder = async (orderData: any) => {
    console.log('📝 Creating order with data:', orderData);
    console.log('🏪 Restaurant ID being used:', restaurantId);
    console.log('🛒 Cart items:', cartItems);
    console.log('💰 Total amount:', getCartTotal());
    
    // Validate required data
    if (!restaurantId) {
      const error = 'Restaurant ID is missing - please ensure you are logged in and have a restaurant associated with your account';
      console.error('❌', error);
      toast({
        title: "Order failed",
        description: error,
        variant: "destructive",
      });
      return;
    }
    
    // Validation removed since restaurantLoading no longer exists
    
    if (cartItems.length === 0) {
      const error = 'No items in cart';
      console.error('❌', error);
      toast({
        title: "Order failed",
        description: error,
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingOrder(true);

    try {
      const totalAmount = getCartTotal();
      const isPreOrder = orderData.orderType === 'later';
      const paymentAmount = isPreOrder ? totalAmount * 0.4 : totalAmount;
      
      // Pre-generate identifiers to avoid SELECT after insert (RLS-safe)
      const orderId = crypto.randomUUID();
      const customerToken = crypto.randomUUID();

      // Create the order without selecting it back (avoids RLS SELECT restriction)
      console.log('🔄 Inserting order into database...');
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customer_token: customerToken,
          user_id: restaurantId,
          restaurant_id: restaurantId, // Keep for backward compatibility
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
        console.error('❌ Error details:', JSON.stringify(orderError, null, 2));
        throw orderError;
      }

      const order = { id: orderId, customer_token: customerToken };
      console.log('✅ Order created successfully:', order);

      // Create order items
      console.log('🔄 Creating order items...');
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        customizations: item.customizations || {},
      }));

      console.log('📦 Order items to insert:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Order items creation failed:', itemsError);
        console.error('❌ Items error details:', JSON.stringify(itemsError, null, 2));
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
      } else if (orderData.paymentMethod === 'mpesa_daraja') {
        await handleMpesaDarajaPayment(order, orderData, amount);
      } else if (orderData.paymentMethod === 'mpesa_manual') {
        handleMpesaPayment(order, orderData, amount);
      } else if (orderData.paymentMethod === 'bank_transfer') {
        handleBankTransferPayment(order, orderData, amount);
      }
    } catch (error) {
      console.error('Payment handling error:', error);
      throw error;
    }
  };

  const handlePesapalPayment = async (order: any, orderData: any, amount: number) => {
    console.log('🔄 Initiating Pesapal payment for order:', order.id);
    
    const pesapalSettings = paymentSettings?.payment_methods?.pesapal;
    console.log('💳 Payment settings check:', { 
      hasSettings: !!pesapalSettings, 
      hasConsumerKey: !!pesapalSettings?.consumer_key,
      hasConsumerSecret: !!pesapalSettings?.consumer_secret 
    });
    
    if (!pesapalSettings?.enabled) {
      const error = 'Pesapal payment is not enabled for this restaurant';
      console.error('❌', error);
      toast({
        title: "Payment Unavailable",
        description: error,
        variant: "destructive",
      });
      throw new Error(error);
    }

    if (!pesapalSettings?.consumer_key || !pesapalSettings?.consumer_secret) {
      const error = 'Restaurant Pesapal credentials are not configured. Please contact the restaurant to set up payments.';
      console.error('❌', error);
      toast({
        title: "Payment Configuration Error",
        description: error,
        variant: "destructive",
      });
      throw new Error(error);
    }

    const paymentRequest = {
      orderId: order.id,
      currency: 'KES',
      amount: amount,
      description: `Pre-order reservation for ${orderData.customerName || 'Customer'}`,
      callbackUrl: `${window.location.origin}/order-success?token=${order.customer_token}&restaurant=${restaurantId}`,
      customerInfo: {
        name: orderData.customerName || 'Customer',
        email: orderData.customerPhone ? `${orderData.customerPhone}@example.com` : undefined,
        phone: orderData.customerPhone || undefined,
      },
      credentials: {
        consumer_key: pesapalSettings.consumer_key,
        consumer_secret: pesapalSettings.consumer_secret,
      },
      isSubscription: false, // This is a customer payment, not a subscription
    };

    console.log('📤 Calling pesapal-initialize edge function with request:', {
      orderId: paymentRequest.orderId,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      hasCredentials: !!paymentRequest.credentials?.consumer_key
    });

    try {
      const { data, error } = await supabase.functions.invoke('pesapal-initialize', {
        body: paymentRequest,
      });

      console.log('📥 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Payment initialization failed: ${error.message || 'Unknown error'}`);
      }

      if (!data?.success) {
        console.error('❌ Payment initialization failed:', data?.error);
        throw new Error(data?.error || 'Payment initialization failed');
      }

      if (!data?.redirect_url) {
        console.error('❌ No redirect URL received from Pesapal');
        throw new Error('Invalid payment response - no redirect URL');
      }

      console.log('✅ Payment initialized successfully, redirecting to:', data.redirect_url);
      
      // Clear cart before redirecting to payment
      clearCart();
      
      // Redirect to Pesapal payment page
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error('❌ Pesapal payment initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleMpesaDarajaPayment = async (order: any, orderData: any, amount: number) => {
    console.log('🔄 Initiating M-Pesa Daraja payment for order:', order.id);
    
    const mpesaSettings = paymentSettings?.payment_methods?.mpesa_daraja;
    console.log('💳 M-Pesa Daraja settings check:', { 
      hasSettings: !!mpesaSettings, 
      hasShortCode: !!mpesaSettings?.business_short_code,
      hasConsumerKey: !!mpesaSettings?.consumer_key,
      hasConsumerSecret: !!mpesaSettings?.consumer_secret,
      hasPasskey: !!mpesaSettings?.passkey
    });
    
    if (!mpesaSettings?.enabled) {
      const error = 'M-Pesa payment is not enabled for this restaurant';
      console.error('❌', error);
      toast({
        title: "Payment Unavailable",
        description: error,
        variant: "destructive",
      });
      throw new Error(error);
    }

    if (!mpesaSettings?.business_short_code || !mpesaSettings?.consumer_key || 
        !mpesaSettings?.consumer_secret || !mpesaSettings?.passkey) {
      const error = 'Restaurant M-Pesa credentials are not configured. Please contact the restaurant to set up payments.';
      console.error('❌', error);
      toast({
        title: "Payment Configuration Error",
        description: error,
        variant: "destructive",
      });
      throw new Error(error);
    }

    if (!orderData.customerPhone) {
      const error = 'Phone number is required for M-Pesa payments';
      console.error('❌', error);
      toast({
        title: "Phone Number Required",
        description: error,
        variant: "destructive",
      });
      throw new Error(error);
    }

    const paymentRequest = {
      orderId: order.id,
      amount: amount,
      description: `Pre-order reservation for ${orderData.customerName || 'Customer'}`,
      phone_number: orderData.customerPhone,
      credentials: {
        business_short_code: mpesaSettings.business_short_code,
        consumer_key: mpesaSettings.consumer_key,
        consumer_secret: mpesaSettings.consumer_secret,
        passkey: mpesaSettings.passkey,
        environment: mpesaSettings.environment || 'sandbox',
      }
    };

    console.log('📤 Calling mpesa-initialize edge function with request:', {
      orderId: paymentRequest.orderId,
      amount: paymentRequest.amount,
      phone: paymentRequest.phone_number.slice(0, 3) + '***',
      hasCredentials: !!paymentRequest.credentials?.business_short_code
    });

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-initialize', {
        body: paymentRequest,
      });

      console.log('📥 M-Pesa edge function response:', { data, error });

      if (error) {
        console.error('❌ M-Pesa edge function error:', error);
        throw new Error(`M-Pesa payment initialization failed: ${error.message || 'Unknown error'}`);
      }

      if (!data?.success) {
        console.error('❌ M-Pesa payment initialization failed:', data?.error);
        throw new Error(data?.error || 'M-Pesa payment initialization failed');
      }

      if (!data?.checkout_request_id) {
        console.error('❌ No checkout request ID received from M-Pesa');
        throw new Error('Invalid payment response - no checkout request ID');
      }

      console.log('✅ M-Pesa STK Push initiated successfully:', data.checkout_request_id);
      
      toast({
        title: "STK Push Sent",
        description: "Please check your phone and enter your M-Pesa PIN to complete the payment.",
      });
      
      // Store the checkout request ID for verification
      // In a real app, you'd want to store this with the order for later verification
      
      // For now, we'll clear cart and show success (in reality, you'd verify payment first)
      clearCart();
      navigate(`/order-success?token=${order.customer_token}&restaurant=${restaurantId}&mpesa_checkout=${data.checkout_request_id}`);
      
    } catch (error) {
      console.error('❌ M-Pesa payment initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'M-Pesa payment initialization failed';
      toast({
        title: "M-Pesa Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleMpesaPayment = (order: any, orderData: any, amount: number) => {
    console.log('Handling M-Pesa manual payment for order:', order.id);
    setShowPaymentInstructions(true);
    setPendingPaymentData({
      orderId: order.id,
      paymentMethod: 'mpesa_manual',
      amount: amount,
      orderData: orderData,
      order: order
    });
  };

  const handleBankTransferPayment = (order: any, orderData: any, amount: number) => {
    console.log('Handling bank transfer payment for order:', order.id);
    setShowPaymentInstructions(true);
    setPendingPaymentData({
      orderId: order.id,
      paymentMethod: 'bank_transfer',
      amount: amount,
      orderData: orderData,
      order: order
    });
  };

  const finalizeOrder = (order: any, orderData: any) => {
    console.log('🎉 Finalizing order:', order.id);
    console.log('🔄 Clearing cart and navigating to success page...');
    clearCart();
    toast({
      title: "Order created successfully!",
      description: "Your order has been submitted and is being processed.",
    });
    // Pass the customer token instead of the order ID for secure access
    const successUrl = `/order-success?token=${order.customer_token}&restaurant=${restaurantId}`;
    console.log('🔄 Navigating to:', successUrl);
    navigate(successUrl);
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

  const handlePaymentConfirmed = () => {
    if (pendingPaymentData) {
      clearCart();
      navigate(`/order-success?token=${pendingPaymentData.order.customer_token}&restaurant=${restaurantId}&paymentPending=true`);
      setShowPaymentInstructions(false);
      setPendingPaymentData(null);
      setIsCreatingOrder(false);
    }
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
      
      <PaymentInstructionsDialog
        open={showPaymentInstructions}
        onOpenChange={setShowPaymentInstructions}
        paymentMethod={pendingPaymentData?.paymentMethod || ''}
        paymentSettings={paymentSettings}
        orderDetails={{
          orderId: pendingPaymentData?.orderId || '',
          amount: pendingPaymentData?.amount || 0,
          currency: 'KES',
          customerName: pendingPaymentData?.orderData?.customerName || ''
        }}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </>
  );
};

export default OrderCreationHandler;
