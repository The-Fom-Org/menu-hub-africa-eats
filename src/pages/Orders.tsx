
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle,
  AlertCircle,
  XCircle,
  ChefHat,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrderManagement, Order } from '@/hooks/useOrderManagement';
import { format } from 'date-fns';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading, updateOrderStatus, markOrderPaid } = useOrderManagement(user?.id || '');
  const [activeTab, setActiveTab] = useState('all');

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Please login to view orders</p>
            <Button onClick={() => navigate('/login')}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filterOrders = (orders: Order[], filter: string) => {
    switch (filter) {
      case 'pending':
        return orders.filter(order => order.order_status === 'pending');
      case 'active':
        return orders.filter(order => 
          ['confirmed', 'preparing'].includes(order.order_status)
        );
      case 'completed':
        return orders.filter(order => 
          ['ready', 'completed'].includes(order.order_status)
        );
      case 'cancelled':
        return orders.filter(order => order.order_status === 'cancelled');
      default:
        return orders;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleMarkPaid = async (orderId: string) => {
    await markOrderPaid(orderId);
  };

  const filteredOrders = filterOrders(orders, activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                Total Orders: {orders.length}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Order Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterOrders(orders, 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({filterOrders(orders, 'active').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterOrders(orders, 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({filterOrders(orders, 'cancelled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? "You haven't received any orders yet." 
                      : `No ${activeTab} orders at the moment.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            className={`${getStatusColor(order.order_status)} text-white`}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.order_status)}
                              {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                            </span>
                          </Badge>
                          <CardTitle className="text-lg">
                            Order #{order.id.slice(-6)}
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline"
                            className={`${getPaymentStatusColor(order.payment_status)} text-white border-0`}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            {order.payment_status}
                          </Badge>
                          <span className="text-lg font-bold text-green-600">
                            KSh {Number(order.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Customer Info & Order Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(order.created_at), 'MMM dd, yyyy - HH:mm')}
                            </span>
                          </div>
                          
                          {order.customer_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{order.customer_name}</span>
                            </div>
                          )}
                          
                          {order.customer_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{order.customer_phone}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            {order.order_type === 'now' ? (
                              <>
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>Dining In</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Pickup: {order.scheduled_time 
                                    ? format(new Date(order.scheduled_time), 'MMM dd, yyyy - HH:mm')
                                    : 'Time not specified'
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Payment Method:</span>
                            <span className="ml-2 font-medium">
                              {order.payment_method?.replace('_', ' ').toUpperCase() || 'Not specified'}
                            </span>
                          </div>
                          
                          {/* Order Status Update */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Update Status:</span>
                            <Select
                              value={order.order_status}
                              onValueChange={(value) => handleStatusUpdate(order.id, value as any)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="preparing">Preparing</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Mark as Paid Button */}
                          {order.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkPaid(order.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Order Items */}
                      <div>
                        <h4 className="font-medium mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {order.order_items?.map((item, index) => (
                            <div key={item.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{item.menu_item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} × KSh {Number(item.unit_price).toFixed(2)}
                                </p>
                                {item.customizations && Object.keys(item.customizations).length > 0 && (
                                  <div className="mt-1">
                                    <p className="text-xs text-muted-foreground font-medium">Customizations:</p>
                                    <p className="text-xs text-muted-foreground">
                                      {JSON.stringify(item.customizations, null, 2).replace(/[{}",]/g, '').trim()}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <p className="font-medium">
                                KSh {(Number(item.unit_price) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div>
                          <h4 className="font-medium mb-2">Special Instructions</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            {order.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Orders;
