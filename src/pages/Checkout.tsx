import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useCustomerMenuData } from '@/hooks/useCustomerMenuData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantPaymentSettings } from '@/hooks/useRestaurantPaymentSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, User, Phone, Clock, CreditCard, Info } from 'lucide-react';
import OrderCreationHandler from '@/components/checkout/OrderCreationHandler';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: { [key: string]: string | string[] };
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const paramRestaurantId = searchParams.get('restaurantId');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use the URL parameter directly as the user ID
  const restaurantId = paramRestaurantId;
  
  // Only initialize cart and fetch data if we have a restaurant ID
  const cart = useCart(restaurantId || '');
  const { restaurantInfo, loading: dataLoading } = useCustomerMenuData(restaurantId || '');
  const { settings: paymentSettings, loading: paymentSettingsLoading, getAvailableGateways } = useRestaurantPaymentSettings(restaurantId || '');
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isCartInitialized, setIsCartInitialized] = useState(false);

  console.log('🛒 Checkout page state:', {
    restaurantId,
    cartItemsLength: cart.cartItems.length,
    isCartInitialized,
    paymentSettingsLoading,
    availableGateways: paymentSettings ? getAvailableGateways() : [],
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
      navigate(`/menu/${paramRestaurantId || restaurantId}`);
      return;
    }
  }, [cart, restaurantId, navigate, toast, isCartInitialized]);

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

      // Validate phone number for M-Pesa payments
      if (paymentMethod === 'mpesa_daraja' && !customerPhone) {
        toast({
          title: "Phone number required",
          description: "Please enter your phone number for M-Pesa payments.",
          variant: "destructive",
        });
        return false;
      }

      // Validate phone number format for M-Pesa
      if (paymentMethod === 'mpesa_daraja' && customerPhone) {
        const phoneRegex = /^(\+254|254|0)[7-9]\d{8}$/;
        if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
          toast({
            title: "Invalid phone number",
            description: "Please enter a valid Kenyan mobile number (e.g., 0712345678).",
            variant: "destructive",
          });
          return false;
        }
      }
    }

    return true;
  };

  // Show loading until both restaurant data, cart, and payment settings are loaded
  if (dataLoading || paymentSettingsLoading || !isCartInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {dataLoading ? 'Loading restaurant...' : paymentSettingsLoading ? 'Loading payment methods...' : 'Loading cart...'}
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
    <OrderCreationHandler restaurantId={paramRestaurantId || ''}>
      {({ createOrder, isCreatingOrder }) => (
        <div className="min-h-screen bg-background">
          <header className="bg-card border-b shadow-sm">
            <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/menu/${paramRestaurantId}`)}
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

              <div className="space-y-4 sm:space-y-6">
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
                      <Label htmlFor="customerPhone" className="text-xs sm:text-sm">
                        Phone Number {paymentMethod === 'mpesa_daraja' ? '(Required for M-Pesa)' : '(Optional)'}
                      </Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter your phone number (e.g., 0712345678)"
                        className="text-sm"
                        required={paymentMethod === 'mpesa_daraja'}
                      />
                      {paymentMethod === 'mpesa_daraja' && (
                        <p className="text-xs text-muted-foreground">
                          Required for M-Pesa STK Push payment
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tableNumber" className="text-xs sm:text-sm">Table Number/ Area Code</Label>
                      <Input
                        id="tableNumber"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="e.g. 12 or T3"
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

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
                      availableGateways={paymentSettings ? getAvailableGateways() : []}
                      excludeCash={cart.orderType === 'later'}
                    />
                  </CardContent>
                </Card>

                <Button
                  onClick={async () => {
                    if (!validateForm()) return;

                    await createOrder({
                      restaurantId: restaurantId!,
                      customerName: customerName || null,
                      customerPhone: customerPhone || null,
                      tableNumber: tableNumber || null,
                      orderType: cart.orderType,
                      paymentMethod: paymentMethod || 'cash',
                      scheduledTime: cart.orderType === 'later' ? new Date(scheduledTime).toISOString() : null,
                    });
                  }}
                  disabled={isCreatingOrder}
                  size="lg"
                  className="w-full text-sm sm:text-base"
                >
                  {isCreatingOrder ? (
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
      )}
    </OrderCreationHandler>
  );
};

export default Checkout;