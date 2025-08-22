
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, MapPin, Phone, Mail, MessageCircle, Home } from 'lucide-react';

interface OrderSuccessState {
  orderDetails: {
    restaurant_id: string;
    customer_name?: string;
    customer_phone?: string;
    order_type: string;
    total: number;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      customizations?: string;
      special_instructions?: string;
    }>;
    preferred_time?: string;
    orderId?: string;
  };
  paymentMethod: string;
  orderId?: string;
}

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as OrderSuccessState;

  console.log('OrderSuccess state:', state);

  // Redirect if no order data
  if (!state?.orderDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No order information found</p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { orderDetails, paymentMethod, orderId } = state;
  const finalOrderId = orderId || orderDetails.orderId || 'unknown';

  const handleSendWhatsApp = () => {
    // Simulate WhatsApp confirmation
    alert('WhatsApp confirmation would be sent here');
  };

  const handleSendSMS = () => {
    // Simulate SMS confirmation
    alert('SMS confirmation would be sent here');
  };

  const handleSendEmail = () => {
    // Simulate email confirmation
    alert('Email confirmation would be sent here');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-6 w-6" />
              <h1 className="text-xl font-bold">Order Placed Successfully!</h1>
            </div>
            <p className="text-muted-foreground">
              Your order has been placed and will be processed shortly
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Order Status */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {orderDetails.order_type === 'now' ? (
                  <>
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Dining In</p>
                      <p className="text-sm text-muted-foreground">
                        Your order is being prepared now
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Pre-order Scheduled</p>
                      <p className="text-sm text-muted-foreground">
                        Ready for pickup at {orderDetails.preferred_time}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Badge variant="default" className="bg-green-600">
                Order #{finalOrderId.toString().slice(-6)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Customer Info */}
            {orderDetails.order_type === 'later' && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {orderDetails.customer_name?.charAt(0).toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{orderDetails.customer_name || 'Customer'}</p>
                      <p className="text-sm text-muted-foreground">{orderDetails.customer_phone}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Pickup: {orderDetails.preferred_time}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Payment Method:</span>
                  <Badge variant="outline">
                    {paymentMethod === 'mpesa_manual' ? 'M-Pesa (Manual)' : 
                     paymentMethod === 'cash' ? 'Cash Payment' :
                     paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                     paymentMethod}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Order ID:</span>
                  <span className="text-sm font-mono">#{finalOrderId.toString().slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>KSh {orderDetails.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Confirmation Options */}
            <Card>
              <CardHeader>
                <CardTitle>Send Confirmation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Get your order confirmation via your preferred method
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendSMS}
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    SMS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendEmail}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderDetails.items.map((item, index) => (
                  <div key={`${item.id}-${item.customizations}-${index}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.customizations && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.customizations}
                          </p>
                        )}
                        {item.special_instructions && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            Note: {item.special_instructions}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × KSh {item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        KSh {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    {index < orderDetails.items.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}

                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">KSh {orderDetails.total.toFixed(2)}</span>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={() => navigate(`/menu/${orderDetails.restaurant_id}`)}
                    variant="outline"
                    className="w-full"
                  >
                    Order Again
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <h3 className="font-semibold mb-3">What happens next?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {orderDetails.order_type === 'now' ? (
                <>
                  <p>• Your order is being prepared by the kitchen</p>
                  <p>• You will be notified when it's ready</p>
                  <p>• Please remain seated at your table</p>
                </>
              ) : (
                <>
                  <p>• We'll start preparing your order before your scheduled pickup time</p>
                  <p>• You'll receive a notification when your order is ready</p>
                  <p>• Please arrive at your scheduled time: {orderDetails.preferred_time}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default OrderSuccess;
