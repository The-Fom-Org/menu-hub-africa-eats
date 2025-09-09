import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentStatusCheckerProps {
  children: React.ReactNode;
}

export function PaymentStatusChecker({ children }: PaymentStatusCheckerProps) {
  const [orderReference, setOrderReference] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const checkOrderStatus = async () => {
    if (!orderReference.trim() || !phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both order reference and phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Search for orders using the last 8 characters of the ID (reference) and phone number
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', phoneNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Find order with matching reference (last 8 chars of ID)
      const matchingOrder = data?.find(order => 
        order.id.slice(-8).toUpperCase() === orderReference.toUpperCase()
      );

      if (matchingOrder) {
        setOrderStatus(matchingOrder);
      } else {
        setOrderStatus({ notFound: true });
        toast({
          title: "Order Not Found",
          description: "No order found with that reference and phone number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking order status:', error);
      toast({
        title: "Error",
        description: "Failed to check order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (paymentStatus: string, orderStatus: string) => {
    if (paymentStatus === 'completed' && orderStatus === 'confirmed') {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    } else if (paymentStatus === 'pending' || orderStatus === 'pending') {
      return <Clock className="h-6 w-6 text-yellow-600" />;
    } else {
      return <XCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusText = (paymentStatus: string, orderStatus: string) => {
    if (paymentStatus === 'completed' && orderStatus === 'confirmed') {
      return "Payment confirmed and order confirmed";
    } else if (paymentStatus === 'completed') {
      return "Payment received, order being prepared";
    } else if (paymentStatus === 'pending') {
      return "Payment pending verification";
    } else {
      return "Payment not yet received";
    }
  };

  const resetForm = () => {
    setOrderReference("");
    setPhoneNumber("");
    setOrderStatus(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Check Payment Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference">Order Reference</Label>
            <Input
              id="reference"
              placeholder="Enter 8-character reference (e.g., ABC12345)"
              value={orderReference}
              onChange={(e) => setOrderReference(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground">
              This is the 8-character code from your order confirmation
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Enter phone number used for order"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={checkOrderStatus}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Check Status
              </>
            )}
          </Button>
          
          {orderStatus && !orderStatus.notFound && (
            <div className="mt-6 p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(orderStatus.payment_status, orderStatus.order_status)}
                <div>
                  <h4 className="font-medium">Order #{orderStatus.id.slice(-8).toUpperCase()}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getStatusText(orderStatus.payment_status, orderStatus.order_status)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">KES {orderStatus.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="capitalize">{orderStatus.payment_method?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Type:</span>
                  <span className="capitalize">{orderStatus.order_type}</span>
                </div>
                {orderStatus.scheduled_time && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span>{new Date(orderStatus.scheduled_time).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              {orderStatus.payment_status === 'pending' && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Pending Payment:</strong> Your payment is being verified. 
                    This usually takes 1-2 hours for manual payments.
                  </p>
                </div>
              )}
              
              {orderStatus.payment_status === 'completed' && orderStatus.order_status === 'confirmed' && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Order Confirmed:</strong> Your payment has been received and your order is being prepared!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}