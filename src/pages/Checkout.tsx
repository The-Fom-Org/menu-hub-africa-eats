import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Clock, MapPin, CreditCard, Smartphone } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const restaurantId = searchParams.get('restaurantId') || 'default';
  
  const { 
    cartItems, 
    getCartTotal, 
    orderType, 
    setOrderType, 
    customerInfo, 
    setCustomerInfo,
    getOrderDetails,
    clearCart 
  } = useCart(restaurantId);

  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const orderDetails = getOrderDetails();
      
      // In a real app, you would:
      // 1. Send order to backend
      // 2. Process payment via M-Pesa or card
      // 3. Send confirmation
      
      // For demo, we'll just show success
      clearCart();
      navigate('/order-success', { 
        state: { 
          orderDetails,
          paymentMethod,
          orderId: `ORDER-${Date.now()}` 
        }
      });

      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation shortly.",
      });

    } catch (error) {
      toast({
        title: "Payment failed",
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(value) => setPaymentMethod(value as 'mpesa' | 'card')}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mpesa" id="mpesa" />
                    <Label htmlFor="mpesa" className="flex items-center gap-2 cursor-pointer">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      M-Pesa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      Card Payment
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'mpesa' && (
                  <Alert className="mt-4">
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      You will receive an M-Pesa prompt to complete payment
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
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
                  {isProcessing ? 'Processing...' : `Pay KSh ${cartTotal.toFixed(2)}`}
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