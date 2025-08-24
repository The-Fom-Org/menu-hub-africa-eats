
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface OrderDetails {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_type: string;
  payment_method: string | null;
  payment_status: string;
  order_status: string;
  total_amount: number;
  created_at: string;
  scheduled_time: string | null;
  table_number: string | null;
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const restaurantId = searchParams.get('restaurant');
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrderDetails(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'preparing':
        return 'secondary';
      case 'ready':
        return 'outline';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!orderId || !restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Order not found</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't find your order details.
              </p>
              <Button onClick={() => navigate(`/menu/${restaurantId}`)}>
                Back to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/menu/${restaurantId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Order Confirmation</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Success Message */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Order Placed Successfully!
                </h2>
                <p className="text-muted-foreground">
                  Thank you for your order. We'll notify you with updates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          {orderDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono text-sm">{orderDetails.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusBadgeVariant(orderDetails.order_status)}>
                      {orderDetails.order_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">KSh {orderDetails.total_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Type</p>
                    <p className="capitalize">{orderDetails.order_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Placed At</p>
                    <p className="text-sm">{formatDate(orderDetails.created_at)}</p>
                  </div>
                  {orderDetails.scheduled_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Time</p>
                      <p className="text-sm">{formatDate(orderDetails.scheduled_time)}</p>
                    </div>
                  )}
                  {orderDetails.table_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Table Number</p>
                      <p className="font-semibold">{orderDetails.table_number}</p>
                    </div>
                  )}
                </div>

                {orderDetails.customer_name && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p>{orderDetails.customer_name}</p>
                  </div>
                )}

                {orderDetails.customer_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p>{orderDetails.customer_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderDetails?.order_type === 'now' ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    • Your order is being prepared
                  </p>
                  <p className="text-sm">
                    • You'll be notified when it's ready
                  </p>
                  <p className="text-sm">
                    • Payment will be collected when you receive your order
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">
                    • We'll confirm your reservation shortly
                  </p>
                  <p className="text-sm">
                    • You'll receive updates about your pre-order
                  </p>
                  <p className="text-sm">
                    • Pick up your order at the scheduled time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1"
              onClick={() => navigate(`/menu/${restaurantId}`)}
            >
              Order Again
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(`/menu/${restaurantId}`)}
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSuccess;
