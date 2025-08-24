
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
import { ArrowLeft, ShoppingCart, User, Phone, Clock, CreditCard, Info } from 'lucide-react';
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

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const navigate = useNavigate();
  const cart = useCart(restaurantId || '');
  const { restaurantInfo, loading: dataLoading } = useCustomerMenuData(restaurantId || '');
  const { toast } = useToast();
  const { isSupported, permission, requestPermission, subscribeToPush } = usePushNotifications();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [isCartInitialized, setIsCartInitialized] = useState(false);

  console.log('🛒 Checkout page cart state:', {
    restaurantId,
    cartItemsLength: cart.cartItems.length,
    isCartInitialized,
    lastSyncTime: cart.lastSyncTime,
    cartItems: cart.cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
  });

  // Calculate reservation fee (40% of total for pre-orders)
  const totalAmount = cart.getCartTotal();
  const reservationFee = cart.orderType === 'later' ? totalAmount * 0.4 : totalAmount;
  const remainingAmount = cart.orderType === 'later' ? totalAmount - reservationFee : 0;

  // Wait for cart to be initialized before checking if empty
  useEffect(() => {
    console.log('🔄 Checkout useEffect - cart initialization check:', {
      lastSyncTime: cart.lastSyncTime,
      cartItemsLength: cart.cartItems.length,
      isCartInitialized
    });

    // Cart is considered initialized when lastSyncTime is set (meaning localStorage was loaded)
    if (cart.lastSyncTime > 0 && !isCartInitialized) {
      console.log('✅ Cart initialization detected');
      setIsCartInitialized(true);
    }
  }, [cart.lastSyncTime, cart.cartItems.length, isCartInitialized]);

  // Only redirect if cart is initialized AND empty
  useEffect(() => {
    if (!restaurantId) {
      navigate('/');
      return;
    }

    // Don't check for empty cart until it's initialized
    if (!isCartInitialized) {
      console.log('⏳ Waiting for cart to initialize...');
      return;
    }

    // Now we can safely check if cart is empty
    const latestItems = cart.getLatestCartState();
    const isEmpty = latestItems.length === 0 || cart.getCartCount(latestItems) === 0;

    console.log('🔍 Checkout empty cart check:', {
      isCartInitialized,
      latestItemsLength: latestItems.length,
      latestCount: cart.getCartCount(latestItems),
      isEmpty
    });

    if (isEmpty) {
      console.log('❌ Cart is empty, redirecting to menu');
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      navigate(`/menu/${restaurantId}`);
      return;
    }
  }, [cart, restaurantId, navigate, toast, isCartInitialized]);

  const handleOrderSubmission = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const orderData = {
        restaurant_id: restaurantId!,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        order_type: cart.orderType,
        payment_method: cart.orderType === 'now' ? 'cash' : paymentMethod,
        payment_status: cart.orderType === 'now' ? 'pending' : 'pending',
        order_status: 'pending',
        total_amount: totalAmount,
        scheduled_time: cart.orderType === 'later' ? new Date(scheduledTime).toISOString() : null,
      };

      const orderItems = cart.cartItems.map(item => ({
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
    cart.clearCart();
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
    if (cart.orderType === 'later') {
      if (!paymentMethod) {
        toast({
          title: "Payment method required",
          description: "Please select a payment method for pre-orders.",
          variant: "destructive",
        });
        return false;
      }

      if (!scheduledTime) {
        toast({
          title: "Pickup time required",
          description: "Please select a pickup time for pre-orders.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  // Show loading until both restaurant data and cart are loaded
  if (dataLoading || !isCartInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {dataLoading ? 'Loading restaurant...' : 'Loading cart...'}
          </p>
        </div>
      </div>
    );
  }

  if (!restaurantInfo) {
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
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/menu/${restaurantId}`)}
                  className="text-xs sm:text-sm"
                >
                  <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Back to Menu
                </Button>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">Checkout</h1>
              </div>
              <Badge variant="outline" className="ml-auto text-xs sm:text-sm">
                {cart.cartItems.length} item{cart.cartItems.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {cart.cartItems.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.customizations)}`} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        KSh {item.price.toFixed(2)} × {item.quantity}
                      </p>
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.customizations).map(([key, value]) => (
                            <span key={key} className="block truncate">
                              {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm sm:text-base flex-shrink-0">
                      KSh {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span>Total Order Value</span>
                    <span>KSh {totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {cart.orderType === 'later' && (
                    <>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Reservation Fee (40%)</span>
                        <span>KSh {reservationFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Pay at Restaurant</span>
                        <span>KSh {remainingAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-base sm:text-lg font-semibold text-primary">
                        <span>Pay Now</span>
                        <span>KSh {reservationFee.toFixed(2)}</span>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <div className="flex gap-2">
                          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs sm:text-sm text-blue-800">
                            <p className="font-medium mb-1">Pre-order Reservation</p>
                            <p>You'll pay 40% now to reserve your meal. The remaining 60% will be paid when you collect your order at the restaurant.</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {cart.orderType === 'now' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <div className="flex gap-2">
                        <Info className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-green-800">
                          <p className="font-medium mb-1">Dine In Order</p>
                          <p>You'll pay when your meal is ready. Please proceed to place your order and we'll prepare it for you.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer & Order Details */}
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Customer Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-xs sm:text-sm">Name (Optional)</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-xs sm:text-sm">Phone Number (Optional)</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Order Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <RadioGroup value={cart.orderType} onValueChange={(value: 'now' | 'later') => cart.setOrderType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="now" id="now" />
                      <Label htmlFor="now" className="text-sm">Order Now (Dine In)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="later" id="later" />
                      <Label htmlFor="later" className="text-sm">Pre-order (Schedule Pickup)</Label>
                    </div>
                  </RadioGroup>
                  
                  {cart.orderType === 'later' && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime" className="text-xs sm:text-sm">Pickup Time</Label>
                      <Input
                        id="scheduledTime"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method - Only show for pre-orders */}
              {cart.orderType === 'later' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Payment Method</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentMethodSelector
                      paymentMethod={paymentMethod}
                      setPaymentMethod={setPaymentMethod}
                      availableGateways={[]}
                      excludeCash={true}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Place Order Button */}
              <Button
                onClick={handleOrderSubmission}
                disabled={loading}
                size="lg"
                className="w-full text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  cart.orderType === 'now' 
                    ? `Place Order - KSh ${totalAmount.toFixed(2)}`
                    : `Reserve Table - KSh ${reservationFee.toFixed(2)}`
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
