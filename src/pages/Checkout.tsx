import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useCustomerMenuData } from '@/hooks/useCustomerMenuData';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, User, Phone, Clock, CreditCard } from 'lucide-react';
import { createOrderWithItems } from '@/components/checkout/OrderCreationHandler';
import { useToast } from '@/hooks/use-toast';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import NotificationPermissionDialog from '@/components/notifications/NotificationPermissionDialog';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: { [key: string]: string | string[] };
}

interface RestaurantData {
  id: string;
  restaurant_name: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  tagline: string | null;
  phone_number: string | null;
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurant');
  const navigate = useNavigate();
  const { cart, clearCart, getTotalPrice } = useCart();
  const { restaurantData, loading: dataLoading } = useCustomerMenuData(restaurantId || '');
  const { toast } = useToast();
  const { isSupported, permission, requestPermission, subscribeToPush } = usePushNotifications();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'now' | 'later'>('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      navigate('/');
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      navigate(`/menu/${restaurantId}`);
      return;
    }
  }, [cart, restaurantId, navigate, toast]);

  const handleOrderSubmission = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const orderData = {
        restaurant_id: restaurantId!,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        order_type: orderType,
        payment_method: paymentMethod,
        payment_status: 'pending',
        order_status: 'pending',
        total_amount: getTotalPrice(),
        scheduled_time: orderType === 'later' ? new Date(scheduledTime).toISOString() : null,
      };

      const orderItems = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        customizations: item.customizations || {},
      }));

      const order = await createOrderWithItems(orderData, orderItems);
      
      if (order) {
        setPendingOrderId(order.id);
        
        // Show notification permission dialog if supported and not already granted
        if (isSupported && permission !== 'granted' && permission !== 'denied') {
          setShowNotificationDialog(true);
        } else if (permission === 'granted') {
          // Subscribe to notifications if permission already granted
          await subscribeToPush(order.id);
          completeCheckout(order.id);
        } else {
          // No notification support or denied, proceed directly
          completeCheckout(order.id);
        }
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeCheckout = (orderId: string) => {
    clearCart();
    toast({
      title: "Order placed successfully!",
      description: "You'll receive updates on your order status.",
    });
    navigate(`/order-success?order=${orderId}&restaurant=${restaurantId}`);
  };

  const handleNotificationAllow = async () => {
    const granted = await requestPermission();
    if (granted && pendingOrderId) {
      await subscribeToPush(pendingOrderId);
    }
    if (pendingOrderId) {
      completeCheckout(pendingOrderId);
    }
    return granted;
  };

  const handleNotificationDeny = () => {
    if (pendingOrderId) {
      completeCheckout(pendingOrderId);
    }
  };

  const validateForm = () => {
    if (!paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return false;
    }

    if (orderType === 'later' && !scheduledTime) {
      toast({
        title: "Pickup time required",
        description: "Please select a pickup time for pre-orders.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurantData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Restaurant not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/menu/${restaurantId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Menu
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
              <Badge variant="outline" className="ml-auto">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.customizations)}`} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        KSh {item.price.toFixed(2)} × {item.quantity}
                      </p>
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.customizations).map(([key, value]) => (
                            <span key={key} className="block">
                              {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-medium">
                      KSh {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>KSh {getTotalPrice().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Order Details */}
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Customer Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name (Optional)</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Order Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={orderType} onValueChange={(value: 'now' | 'later') => setOrderType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="now" id="now" />
                      <Label htmlFor="now">Order Now (Dine In)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="later" id="later" />
                      <Label htmlFor="later">Pre-order (Schedule Pickup)</Label>
                    </div>
                  </RadioGroup>
                  
                  {orderType === 'later' && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">Pickup Time</Label>
                      <Input
                        id="scheduledTime"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Method</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethodSelector
                    restaurantId={restaurantId!}
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    orderAmount={getTotalPrice()}
                  />
                </CardContent>
              </Card>

              {/* Place Order Button */}
              <Button
                onClick={handleOrderSubmission}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  `Place Order - KSh ${getTotalPrice().toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>

      <NotificationPermissionDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        onAllow={handleNotificationAllow}
        onDeny={handleNotificationDeny}
      />
    </>
  );
};

export default Checkout;
