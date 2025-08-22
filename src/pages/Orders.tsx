
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Clock, User, Phone, Receipt, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { orders, loading, updateOrderStatus, markOrderPaid } = useOrderManagement(user?.id || '');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      await markOrderPaid(orderId);
    } catch (error) {
      console.error('Failed to mark order as paid:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Orders Management</h1>
            <Badge variant="outline" className="ml-auto">
              {orders.length} Total Orders
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">
                Orders will appear here when customers place them through your digital menu.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(-6)}
                      </div>
                      <Badge className={getStatusBadgeColor(order.order_status)}>
                        {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={getPaymentStatusBadgeColor(order.payment_status)}
                      >
                        Payment: {order.payment_status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      <p className="font-semibold text-lg">
                        KSh {order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {order.customer_name || 'Walk-in Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground">Customer</p>
                      </div>
                    </div>
                    
                    {order.customer_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{order.customer_phone}</p>
                          <p className="text-xs text-muted-foreground">Phone</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {order.order_type === 'now' ? 'Dine In' : 'Pre-order'}
                        </p>
                        {order.scheduled_time && (
                          <p className="text-xs text-muted-foreground">
                            Pickup: {format(new Date(order.scheduled_time), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-3">Order Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.order_items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.menu_item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  KSh {item.menu_item.price.toFixed(2)} each
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              KSh {item.unit_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              KSh {(item.quantity * item.unit_price).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {order.payment_status === 'pending' && (
                      <Button
                        onClick={() => handleMarkPaid(order.id)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark as Paid
                      </Button>
                    )}

                    {order.order_status === 'pending' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                        variant="outline"
                        size="sm"
                      >
                        Confirm Order
                      </Button>
                    )}

                    {order.order_status === 'confirmed' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, 'preparing')}
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        Start Preparing
                      </Button>
                    )}

                    {order.order_status === 'preparing' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Mark as Ready
                      </Button>
                    )}

                    {order.order_status === 'ready' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        Complete Order
                      </Button>
                    )}

                    {!['completed', 'cancelled'].includes(order.order_status) && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
