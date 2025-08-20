import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { paymentGatewayRegistry } from '@/lib/payment-gateways/registry';
import { createOrderWithItems } from '@/components/checkout/OrderCreationHandler';

interface PaymentGatewayWithCredentials {
  type: string;
  name: string;
  requiresCredentials: boolean;
  supportedMethods: string[];
  credentials?: any;
}

// Type for payment methods from database
interface PaymentMethodsConfig {
  mpesa_manual?: {
    enabled: boolean;
    till_number?: string;
    paybill_number?: string;
    account_number?: string;
  };
  pesapal?: {
    enabled: boolean;
    consumer_key?: string;
    consumer_secret?: string;
  };
  bank_transfer?: {
    enabled: boolean;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  };
  cash?: {
    enabled: boolean;
  };
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const restaurantId = searchParams.get('restaurantId');
  
  const { 
    cartItems, 
    getCartTotal, 
    orderType, 
    setOrderType, 
    customerInfo, 
    setCustomerInfo,
    getOrderDetails,
    clearCart 
  } = useCart(restaurantId || 'default');

  const subscriptionLimits = useSubscriptionLimits(restaurantId || undefined);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableGateways, setAvailableGateways] = useState<PaymentGatewayWithCredentials[]>([]);

  // Validate restaurant ID
  useEffect(() => {
    if (!restaurantId) {
      toast({
        title: "Invalid restaurant",
        description: "Please select a valid restaurant menu",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    console.log('Using restaurant ID:', restaurantId);
  }, [restaurantId, navigate, toast]);

  // Load payment settings based on subscription plan
  useEffect(() => {
    const loadPaymentSettings = async () => {
      if (!restaurantId || subscriptionLimits.isLoading) return;

      try {
        console.log('Loading payment settings for restaurant:', restaurantId);
        console.log('Subscription plan:', subscriptionLimits.plan);
        
        const allGateways = paymentGatewayRegistry.getAll();
        
        // For free plan, only allow mpesa_manual and cash
        if (subscriptionLimits.plan === 'free') {
          console.log('Free plan detected, loading M-Pesa manual and cash only');
          
          const { data: paymentSettings } = await supabase
            .from('restaurant_payment_settings')
            .select('payment_methods')
            .eq('restaurant_id', restaurantId)
            .maybeSingle();

          const paymentMethods = paymentSettings?.payment_methods as PaymentMethodsConfig || {};
          console.log('Free plan payment methods from DB:', paymentMethods);

          // Always show mpesa_manual and cash for free plan
          const available: PaymentGatewayWithCredentials[] = [
            {
              type: 'mpesa_manual',
              name: 'M-Pesa (Manual)',
              requiresCredentials: false,
              supportedMethods: ['mpesa'],
              credentials: paymentMethods.mpesa_manual || {}
            },
            {
              type: 'cash',
              name: 'Cash Payment',
              requiresCredentials: false,
              supportedMethods: ['cash'],
              credentials: {}
            }
          ];

          setAvailableGateways(available);
          // Set default payment method to the first available
          if (available.length > 0 && !paymentMethod) {
            setPaymentMethod(available[0].type);
          }
          return;
        }

        // For paid plans, show all enabled payment methods
        const { data, error } = await supabase
          .from('restaurant_payment_settings')
          .select('payment_methods')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading payment settings:', error);
        }

        const paymentMethods = data?.payment_methods as PaymentMethodsConfig || {};
        console.log('Paid plan payment methods from DB:', paymentMethods);
        
        const available: PaymentGatewayWithCredentials[] = allGateways
          .filter(gateway => {
            const config = paymentMethods[gateway.type as keyof PaymentMethodsConfig];
            const isEnabledInSettings = config?.enabled;
            const isAllowedByPlan = subscriptionLimits.allowedPaymentMethods.includes(gateway.type);
            console.log(`Gateway ${gateway.type}: enabled=${isEnabledInSettings}, allowed=${isAllowedByPlan}`);
            return isEnabledInSettings && isAllowedByPlan;
          })
          .map(gateway => ({
            type: gateway.type,
            name: gateway.name,
            requiresCredentials: gateway.requiresCredentials,
            supportedMethods: gateway.supportedMethods,
            credentials: paymentMethods[gateway.type as keyof PaymentMethodsConfig] || {}
          }));

        console.log('Available gateways after filtering:', available);
        setAvailableGateways(available);
        
        // Set default payment method to the first available if none is selected
        if (available.length > 0 && !paymentMethod) {
          setPaymentMethod(available[0].type);
        }
      } catch (error) {
        console.error('Error loading payment settings:', error);
        // Fallback to basic methods
        const fallbackGateways = [
          {
            type: 'cash',
            name: 'Cash Payment',
            requiresCredentials: false,
            supportedMethods: ['cash'],
            credentials: {}
          }
        ];
        
        setAvailableGateways(fallbackGateways);
        if (!paymentMethod) {
          setPaymentMethod('cash');
        }
      }
    };

    loadPaymentSettings();
  }, [restaurantId, subscriptionLimits.plan, subscriptionLimits.isLoading, subscriptionLimits.allowedPaymentMethods]);

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate(-1)}>
              Go back to menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOrderTypeChange = (type: 'now' | 'later') => {
    setOrderType(type);
    if (type === 'now') {
      setCustomerInfo({ name: '', phone: '', preferred_time: '' });
    }
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (orderType === 'later') {
      if (!customerInfo.name.trim()) {
        toast({
          title: "Name required",
          description: "Please enter your name for pre-orders",
          variant: "destructive",
        });
        return false;
      }
      if (!customerInfo.phone.trim()) {
        toast({
          title: "Phone required",
          description: "Please enter your phone number for pre-orders",
          variant: "destructive",
        });
        return false;
      }
      if (!customerInfo.preferred_time.trim()) {
        toast({
          title: "Time required",
          description: "Please select your preferred pickup time",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm() || !restaurantId) return;

    setIsProcessing(true);
    
    try {
      const orderDetails = getOrderDetails();
      
      console.log('Creating order with details:', orderDetails);
      console.log('Using restaurant ID:', restaurantId);

      const orderData = {
        restaurant_id: restaurantId,
        customer_name: orderDetails.customer_name || null,
        customer_phone: orderDetails.customer_phone || null,
        order_type: orderDetails.order_type,
        payment_method: paymentMethod,
        payment_status: 'pending',
        order_status: 'pending',
        total_amount: orderDetails.total,
        scheduled_time: orderDetails.preferred_time ? new Date(orderDetails.preferred_time).toISOString() : null,
      };

      console.log('Order data to insert:', orderData);

      const orderItems = cartItems.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        customizations: item.customizations ? { customizations: item.customizations } : {},
      }));

      // Use the new order creation handler
      const order = await createOrderWithItems(orderData, orderItems);

      console.log('Order and items created successfully:', order);

      const selectedGateway = availableGateways.find(g => g.type === paymentMethod);
      console.log('Selected payment gateway:', selectedGateway);
      
      if (selectedGateway && paymentMethod === 'pesapal') {
        try {
          console.log('Initializing Pesapal payment with credentials:', selectedGateway.credentials);
          const { data, error } = await supabase.functions.invoke('pesapal-initialize', {
            body: {
              amount: orderDetails.total,
              currency: 'KES',
              orderId: order.id,
              description: `Order from Restaurant`,
              customerInfo: {
                name: orderDetails.customer_name || 'Customer',
                email: 'customer@example.com',
                phone: orderDetails.customer_phone || '',
              },
              credentials: selectedGateway.credentials,
            }
          });

          if (error) throw error;

          console.log('Pesapal initialization response:', data);

          if (data.success && data.redirect_url) {
            window.location.href = data.redirect_url;
            return;
          }
        } catch (pesapalError) {
          console.error('Pesapal payment failed:', pesapalError);
          toast({
            title: "Payment initialization failed",
            description: "Please try a different payment method",
            variant: "destructive",
          });
          return;
        }
      }

      clearCart();
      
      // Show success notification first
      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation shortly.",
      });

      // Show reload notification with primary color
      setTimeout(() => {
        toast({
          title: "Please reload the page",
          description: "To see the latest updates",
          className: "border-primary text-primary-foreground bg-primary",
        });
      }, 1000);

      navigate('/order-success', { 
        state: { 
          orderDetails: {
            ...orderDetails,
            restaurant_id: restaurantId,
          },
          paymentMethod,
          orderId: order.id,
        }
      });

    } catch (error) {
      console.error('Order creation failed:', error);
      toast({
        title: "Order failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cartTotal = getCartTotal();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
            <h1 className="text-xl font-bold text-foreground">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={orderType} 
                  onValueChange={handleOrderTypeChange}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="now" />
                    <Label htmlFor="now" className="flex items-center gap-2 cursor-pointer">
                      <MapPin className="h-4 w-4" />
                      Order for Now (Dining In)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="later" id="later" />
                    <Label htmlFor="later" className="flex items-center gap-2 cursor-pointer">
                      <Clock className="h-4 w-4" />
                      Pre-order for Later
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Customer Information (for pre-orders) */}
            {orderType === 'later' && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                      placeholder="+254 700 000 000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Preferred Pickup Time *</Label>
                    <Input
                      id="time"
                      type="datetime-local"
                      value={customerInfo.preferred_time}
                      onChange={(e) => handleCustomerInfoChange('preferred_time', e.target.value)}
                      className="mt-1"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              availableGateways={availableGateways}
            />
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${item.customizations}-${index}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.customizations && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.customizations}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        KSh {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    {index < cartItems.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}

                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>KSh {cartTotal.toFixed(2)}</span>
                </div>

                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? 'Processing...' : `Complete Order - KSh ${cartTotal.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
