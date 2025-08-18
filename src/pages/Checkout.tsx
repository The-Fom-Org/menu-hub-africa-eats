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
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { paymentGatewayRegistry } from '@/lib/payment-gateways/registry';

interface PaymentGatewayWithCredentials {
  type: string;
  name: string;
  requiresCredentials: boolean;
  supportedMethods: string[];
  credentials?: any;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const restaurantId = searchParams.get('restaurantId') || 'default';
  
  const { 
    cartItems, 
    cartTotal,
    orderType, 
    setOrderType, 
    customerInfo, 
    setCustomerInfo,
    getOrderDetails,
    clearCart 
  } = useCart(restaurantId);

  const subscriptionLimits = useSubscriptionLimits();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableGateways, setAvailableGateways] = useState<PaymentGatewayWithCredentials[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  // Load payment settings for this restaurant
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        setIsLoadingPaymentMethods(true);
        console.log('Loading payment settings for restaurant:', restaurantId);
        
        const { data, error } = await supabase
          .from('restaurant_payment_settings')
          .select('payment_methods')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading payment settings:', error);
        }

        const paymentMethods = data?.payment_methods || {};
        console.log('Payment methods from DB:', paymentMethods);
        
        const allGateways = paymentGatewayRegistry.getAll();
        console.log('All available gateways:', allGateways);
        console.log('Subscription limits:', subscriptionLimits);
        
        // Filter and map available gateways based on restaurant settings AND subscription limits
        const available: PaymentGatewayWithCredentials[] = allGateways
          .filter(gateway => {
            // Check if gateway is allowed by subscription plan
            const allowedByPlan = subscriptionLimits.canEnablePaymentMethod(gateway.type);
            if (!allowedByPlan) {
              console.log(`Gateway ${gateway.type} not allowed by plan ${subscriptionLimits.plan}`);
              return false;
            }

            // Check if gateway is enabled by restaurant settings
            const config = paymentMethods[gateway.type];
            const isEnabled = config?.enabled || gateway.type === 'cash';
            console.log(`Gateway ${gateway.type}: enabled=${isEnabled}, config=`, config);
            return isEnabled;
          })
          .map(gateway => ({
            type: gateway.type,
            name: gateway.name,
            requiresCredentials: gateway.requiresCredentials,
            supportedMethods: gateway.supportedMethods,
            credentials: paymentMethods[gateway.type] || {}
          }));

        console.log('Available gateways after filtering:', available);

        // If no payment methods configured, add default allowed methods
        if (available.length === 0) {
          const defaultMethods = ['cash'];
          if (subscriptionLimits.canEnablePaymentMethod('mpesa_manual')) {
            defaultMethods.push('mpesa_manual', 'bank_transfer');
          }

          defaultMethods.forEach(methodType => {
            const gateway = allGateways.find(g => g.type === methodType);
            if (gateway) {
              available.push({
                type: gateway.type,
                name: gateway.name,
                requiresCredentials: gateway.requiresCredentials,
                supportedMethods: gateway.supportedMethods,
                credentials: {}
              });
            }
          });
        }

        setAvailableGateways(available);
        
        // Set default payment method to first available
        if (available.length > 0) {
          setPaymentMethod(available[0].type);
        }
      } catch (error) {
        console.error('Error loading payment settings:', error);
        // Fallback to cash only
        const cashGateway = paymentGatewayRegistry.get('cash');
        if (cashGateway) {
          setAvailableGateways([{
            type: cashGateway.type,
            name: cashGateway.name,
            requiresCredentials: cashGateway.requiresCredentials,
            supportedMethods: cashGateway.supportedMethods,
            credentials: {}
          }]);
          setPaymentMethod('cash');
        }
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };

    if (!subscriptionLimits.isLoading) {
      loadPaymentSettings();
    }
  }, [restaurantId, subscriptionLimits]);

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
    // For free plans that don't support pre-orders, just silently keep it as 'now'
    if (type === 'later' && subscriptionLimits.requiresUpgradeForPreOrders) {
      return; // Don't change anything, no toast notification
    }
    
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
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      const orderDetails = getOrderDetails();
      const orderId = `ORDER-${Date.now()}`;

      console.log('Creating order with details:', orderDetails);

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          restaurant_id: restaurantId,
          customer_name: orderDetails.customer_name,
          customer_phone: orderDetails.customer_phone,
          order_type: orderDetails.order_type,
          payment_method: paymentMethod,
          payment_status: 'pending',
          order_status: 'pending',
          total_amount: orderDetails.total,
          scheduled_time: orderDetails.preferred_time ? new Date(orderDetails.preferred_time).toISOString() : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      console.log('Order created successfully:', order);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        customizations: item.customizations ? { customizations: item.customizations } : {},
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      console.log('Order items created successfully');

      // Handle payment based on method
      const selectedGateway = availableGateways.find(g => g.type === paymentMethod);
      console.log('Selected payment gateway:', selectedGateway);
      
      if (selectedGateway) {
        if (paymentMethod === 'pesapal') {
          // Initialize Pesapal payment
          try {
            console.log('Initializing Pesapal payment with credentials:', selectedGateway.credentials);
            const { data, error } = await supabase.functions.invoke('pesapal-initialize', {
              body: {
                amount: orderDetails.total,
                currency: 'KES',
                orderId: orderId,
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
              // Redirect to Pesapal
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
      }

      // For manual payment methods, show success page
      clearCart();
      navigate('/order-success', { 
        state: { 
          orderDetails: {
            ...orderDetails,
            orderId,
          },
          paymentMethod,
          paymentInstructions: selectedGateway?.credentials,
          isManualPayment: ['cash', 'mpesa_manual', 'bank_transfer'].includes(paymentMethod),
        }
      });

      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation shortly.",
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

  const isManualPayment = ['cash', 'mpesa_manual', 'bank_transfer'].includes(paymentMethod);

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

      <main className="max-w-4xl mx-auto px-4 py-6 pb-32">
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
                  {/* Only show pre-order option if allowed by subscription */}
                  {!subscriptionLimits.requiresUpgradeForPreOrders && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="later" id="later" />
                      <Label htmlFor="later" className="flex items-center gap-2 cursor-pointer">
                        <Clock className="h-4 w-4" />
                        Pre-order for Later
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Customer Information (for pre-orders) */}
            {orderType === 'later' && !subscriptionLimits.requiresUpgradeForPreOrders && (
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
            {isLoadingPaymentMethods ? (
              <Card>
                <CardHeader>
                  <CardTitle>Loading Payment Methods...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                availableGateways={availableGateways}
              />
            )}
          </div>

          {/* Order Summary - Fixed positioning */}
          <div className="space-y-6">
            <Card className="lg:sticky lg:top-24">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={handlePayment}
            disabled={isProcessing || isLoadingPaymentMethods}
            className="w-full"
            size="lg"
          >
            {isProcessing 
              ? 'Processing...' 
              : isManualPayment 
                ? `Place Order - KSh ${cartTotal.toFixed(2)}` 
                : `Pay Now - KSh ${cartTotal.toFixed(2)}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
