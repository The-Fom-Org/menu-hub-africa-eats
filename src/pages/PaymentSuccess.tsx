import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  customer_token: string;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  payment_method: string;
  created_at: string;
  scheduled_time: string;
  order_type: string;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderToken = searchParams.get('token');
  const restaurantId = searchParams.get('restaurantId');

  useEffect(() => {
    if (!orderToken) {
      setError('Order token is missing');
      setLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [orderToken]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_token', orderToken)
        .single();

      if (fetchError) {
        console.error('Error fetching order:', fetchError);
        setError('Order not found');
        return;
      }

      setOrder(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || 'Order not found'}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (order.payment_status === 'completed') {
      return <CheckCircle className="h-8 w-8 text-green-600" />;
    } else if (order.payment_status === 'pending') {
      return <Clock className="h-8 w-8 text-orange-600" />;
    } else {
      return <AlertCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusMessage = () => {
    if (order.payment_status === 'completed') {
      return {
        title: 'Payment Successful!',
        description: 'Your payment has been confirmed and your order is being processed.',
        color: 'text-green-600'
      };
    } else if (order.payment_status === 'pending') {
      return {
        title: 'Payment Pending',
        description: 'Your payment is being processed. You will receive a confirmation shortly.',
        color: 'text-orange-600'
      };
    } else {
      return {
        title: 'Payment Failed',
        description: 'Your payment could not be processed. Please try again or contact support.',
        color: 'text-red-600'
      };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(restaurantId ? `/menu/${restaurantId}` : '/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
            <h1 className="text-2xl font-bold">Payment Status</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className={`text-2xl ${statusMessage.color}`}>
              {statusMessage.title}
            </CardTitle>
            <p className="text-muted-foreground">
              {statusMessage.description}
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-medium">{order.customer_token.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">KSh {order.total_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Type</p>
                <p className="font-medium capitalize">{order.order_type}</p>
              </div>
              {order.customer_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
              )}
              {order.table_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Table Number</p>
                  <p className="font-medium">{order.table_number}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Badge variant={order.payment_status === 'completed' ? 'default' : order.payment_status === 'pending' ? 'secondary' : 'destructive'}>
                Payment: {order.payment_status}
              </Badge>
              <Badge variant={order.order_status === 'confirmed' ? 'default' : 'secondary'}>
                Order: {order.order_status}
              </Badge>
            </div>

            {order.scheduled_time && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Scheduled Pickup</p>
                <p className="text-sm text-blue-600">
                  {new Date(order.scheduled_time).toLocaleDateString()} at {new Date(order.scheduled_time).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div className="pt-4 space-y-2">
              {order.payment_status === 'completed' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">What's Next?</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Your order has been confirmed and is being prepared</li>
                    <li>• You will receive updates about your order status</li>
                    {order.order_type === 'later' && <li>• Please arrive at your scheduled pickup time</li>}
                    {order.order_type === 'now' && <li>• Your order will be ready shortly</li>}
                  </ul>
                </div>
              )}

              {order.payment_status === 'pending' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Payment Processing</h4>
                  <p className="text-sm text-orange-700">
                    Your payment is being processed. This usually takes a few minutes. 
                    You will receive a confirmation once the payment is complete.
                  </p>
                </div>
              )}

              {order.payment_status === 'failed' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Payment Failed</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Your payment could not be processed. This might be due to insufficient funds, 
                    network issues, or other technical problems.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/checkout?restaurantId=${restaurantId}`)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentSuccess;