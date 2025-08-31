
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, User, Phone, Receipt, CheckCircle, XCircle, Hash, AlertCircle, Package } from 'lucide-react';
import { format } from 'date-fns';
import OrderTableNumberEditor from '@/components/orders/OrderTableNumberEditor';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { orders, loading, updateOrderStatus, markOrderPaid, updateTableNumber } = useOrderManagement(user?.id || '');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Categorize orders
  const justReceivedOrders = orders.filter(order => order.order_status === 'pending');
  const pendingOrders = orders.filter(order => 
    ['confirmed', 'preparing', 'ready'].includes(order.order_status)
  );
  const completedOrders = orders.filter(order => 
    ['completed', 'cancelled'].includes(order.order_status)
  );

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

  const OrderCard = ({ order }: { order: any }) => (
    <Card key={order.id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base sm:text-lg">
              Order #{order.id.slice(-6)}
            </CardTitle>
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
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
            <p className="font-semibold text-base sm:text-lg">
              KSh {order.total_amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <OrderTableNumberEditor
              orderId={order.id}
              value={order.table_number || null}
              onSave={(newVal) => updateTableNumber(order.id, newVal)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {order.customer_name || 'Walk-in Customer'}
              </p>
              <p className="text-xs text-muted-foreground">Customer</p>
            </div>
          </div>
          
          {order.customer_phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{order.customer_phone}</p>
                <p className="text-xs text-muted-foreground">Phone</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
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
          <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Order Items</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Item</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Qty</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Unit Price</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.order_items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-xs sm:text-sm">{item.menu_item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          KSh {item.menu_item.price.toFixed(2)} each
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs sm:text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-right text-xs sm:text-sm">
                      KSh {item.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs sm:text-sm">
                      KSh {(item.quantity * item.unit_price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {order.payment_status === 'pending' && (
            <Button
              onClick={() => handleMarkPaid(order.id)}
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700 text-xs sm:text-sm"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Mark as Paid
            </Button>
          )}

          {order.order_status === 'pending' && (
            <Button
              onClick={() => handleStatusUpdate(order.id, 'confirmed')}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              Confirm Order
            </Button>
          )}

          {order.order_status === 'confirmed' && (
            <Button
              onClick={() => handleStatusUpdate(order.id, 'preparing')}
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm"
            >
              Start Preparing
            </Button>
          )}

          {order.order_status === 'preparing' && (
            <Button
              onClick={() => handleStatusUpdate(order.id, 'ready')}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
            >
              Mark as Ready
            </Button>
          )}

          {order.order_status === 'ready' && (
            <Button
              onClick={() => handleStatusUpdate(order.id, 'completed')}
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700 text-xs sm:text-sm"
            >
              Complete Order
            </Button>
          )}

          {!['completed', 'cancelled'].includes(order.order_status) && (
            <Button
              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
            >
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <Card>
      <CardContent className="py-8 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-xs sm:text-sm"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Orders Management</h1>
            </div>
            <Badge variant="outline" className="ml-auto text-xs sm:text-sm">
              {orders.length} Total Orders
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {orders.length === 0 ? (
          <EmptyState 
            icon={Receipt}
            title="No orders yet"
            description="Orders will appear here when customers place them through your digital menu."
          />
        ) : (
          <Tabs defaultValue="just-received" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger 
                value="just-received" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Just Received ({justReceivedOrders.length})
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                Pending ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="just-received" className="space-y-4 sm:space-y-6">
              {justReceivedOrders.length === 0 ? (
                <EmptyState 
                  icon={AlertCircle}
                  title="No new orders"
                  description="New orders from customers will appear here for you to confirm."
                />
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {justReceivedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 sm:space-y-6">
              {pendingOrders.length === 0 ? (
                <EmptyState 
                  icon={Package}
                  title="No pending orders"
                  description="Orders being prepared, ready for pickup, or confirmed will appear here."
                />
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 sm:space-y-6">
              {completedOrders.length === 0 ? (
                <EmptyState 
                  icon={CheckCircle}
                  title="No completed orders"
                  description="Completed and cancelled orders will appear here for your records."
                />
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Orders;
