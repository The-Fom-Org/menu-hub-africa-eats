import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useRestaurantPaymentSettings } from '@/hooks/useRestaurantPaymentSettings';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import OrderCreationHandler from '@/components/checkout/OrderCreationHandler';
import { Clock, MapPin, Phone, User, Calendar, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, getCartTotal, getCartCount, hasItems } = useCart(restaurantId);
  const { availableGateways, isLoading: paymentSettingsLoading } = useRestaurantPaymentSettings(restaurantId);
  const { toast } = useToast();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'scheduled'>('dine_in');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const totalAmount = getCartTotal();
  const itemCount = getCartCount();
  const isScheduledOrder = orderType === 'scheduled';
  const depositAmount = isScheduledOrder ? Math.round(totalAmount * 0.4) : totalAmount;

  useEffect(() => {
    // If no items in cart, redirect back to menu
    if (!hasItems()) {
      navigate(`/customer-menu/${restaurantId}`);
      return;
    }

    // Pre-populate from URL params if available
    const prefilledName = searchParams.get('name');
    const prefilledPhone = searchParams.get('phone');
    const prefilledTable = searchParams.get('table');

    if (prefilledName) setCustomerName(prefilledName);
    if (prefilledPhone) setCustomerPhone(prefilledPhone);
    if (prefilledTable) setTableNumber(prefilledTable);
  }, [restaurantId, hasItems, navigate, searchParams]);

  useEffect(() => {
    // Auto-select first available payment method
    if (availableGateways.length > 0 && !paymentMethod) {
      const firstGateway = availableGateways[0];
      switch (firstGateway.type) {
        case 'pesapal':
          setPaymentMethod('mpesa'); // Default to M-Pesa via Pesapal
          break;
        case 'mpesa_manual':
          setPaymentMethod('mpesa_manual');
          break;
        case 'bank_transfer':
          setPaymentMethod('bank_transfer');
          break;
        case 'cash':
          setPaymentMethod('cash');
          break;
        default:
          setPaymentMethod(firstGateway.type);
      }
    }
  }, [availableGateways, paymentMethod]);

  const isFormValid = () => {
    return (
      customerName.trim() &&
      customerPhone.trim() &&
      paymentMethod &&
      (!isScheduledOrder || scheduledDateTime) &&
      (orderType !== 'dine_in' || tableNumber.trim())
    );
  };

  const handleOrderCreation = (createOrder: (orderData: any) => Promise<void>) => {
    if (!isFormValid()) return;

    const orderData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      tableNumber: orderType === 'dine_in' ? tableNumber.trim() : undefined,
      orderType,
      paymentMethod,
      scheduledTime: isScheduledOrder ? new Date(scheduledDateTime).toISOString() : undefined,
      notes: notes.trim() || undefined,
    };

    createOrder(orderData);
  };

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid restaurant ID</p>
      </div>
    );
  }

  if (paymentSettingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/customer-menu/${restaurantId}`)}
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Back to Menu
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Checkout</h1>
            </div>
            <Badge variant="outline" className="ml-auto text-xs sm:text-sm">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Full Name *</Label>
                  <Input
                    id="customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number *</Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g., 0712345678"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">Email (Optional)</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Order Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="dine_in" id="dine_in" />
                      <Label htmlFor="dine_in" className="cursor-pointer">Dine In</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="takeaway" id="takeaway" />
                      <Label htmlFor="takeaway" className="cursor-pointer">Takeaway</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled" className="cursor-pointer">Schedule for Later</Label>
                    </div>
                  </div>
                </RadioGroup>

                {orderType === 'dine_in' && (
                  <div className="mt-4">
                    <Label htmlFor="table-number">Table Number *</Label>
                    <Input
                      id="table-number"
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Enter your table number"
                      required
                    />
                  </div>
                )}

                {orderType === 'scheduled' && (
                  <div className="mt-4">
                    <Label htmlFor="scheduled-time">Scheduled Date & Time *</Label>
                    <Input
                      id="scheduled-time"
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      min={format(new Date(Date.now() + 30 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")} // 30 minutes from now
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                  {isScheduledOrder && (
                    <Badge variant="secondary" className="ml-2">40% Deposit Required</Badge>
                  )}
                </CardTitle>
                {isScheduledOrder && (
                  <CardDescription>
                    For scheduled orders, you'll pay 40% now (KES {depositAmount}) and the remaining 60% when you collect your order.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {availableGateways.length > 0 ? (
                  <PaymentMethodSelector
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    availableGateways={availableGateways}
                    excludeCash={isScheduledOrder} // No cash for scheduled orders
                    restaurantId={restaurantId}
                  />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No payment methods are currently configured for this restaurant. Please contact the restaurant directly.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
                <CardDescription>Any special requests or dietary requirements?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., No onions, extra spicy, etc."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{itemCount} {itemCount === 1 ? 'item' : 'items'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.customizations && (
                          <p className="text-sm text-muted-foreground">{item.customizations}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">KES {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>KES {totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {isScheduledOrder && (
                    <>
                      <div className="flex justify-between text-primary font-medium">
                        <span>Deposit (40%)</span>
                        <span>KES {depositAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground text-sm">
                        <span>Remaining (pay later)</span>
                        <span>KES {(totalAmount - depositAmount).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  {!isScheduledOrder && (
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>KES {totalAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Place Order Button */}
                <OrderCreationHandler restaurantId={restaurantId}>
                  {({ createOrder, isCreatingOrder }) => (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleOrderCreation(createOrder)}
                      disabled={!isFormValid() || isCreatingOrder || availableGateways.length === 0}
                    >
                      {isCreatingOrder ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          {isScheduledOrder ? `Pay Deposit (KES ${depositAmount.toFixed(2)})` : `Place Order (KES ${totalAmount.toFixed(2)})`}
                        </>
                      )}
                    </Button>
                  )}
                </OrderCreationHandler>

                {isScheduledOrder && paymentMethod !== 'cash' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      You'll be redirected to complete the 40% deposit payment. The remaining 60% will be collected when you pick up your order.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
