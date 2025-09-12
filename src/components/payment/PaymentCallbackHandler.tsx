import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PesapalGateway } from '@/lib/payment-gateways/pesapal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useRestaurantPaymentSettings } from '@/hooks/useRestaurantPaymentSettings';

interface PaymentCallbackHandlerProps {
  orderTrackingId: string | null;
  customerToken: string;
  restaurantId: string;
  onPaymentVerified: (success: boolean) => void;
}

export const PaymentCallbackHandler = ({
  orderTrackingId,
  customerToken,
  restaurantId,
  onPaymentVerified
}: PaymentCallbackHandlerProps) => {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { settings: paymentSettings } = useRestaurantPaymentSettings(restaurantId);

  const verifyPayment = async () => {
    if (!orderTrackingId || !paymentSettings) return;
    
    setVerifying(true);
    setError(null);
    
    try {
      console.log('Verifying Pesapal payment:', { orderTrackingId, customerToken });
      
      const pesapalCredentials = paymentSettings.payment_methods?.pesapal;
      if (!pesapalCredentials?.consumer_key || !pesapalCredentials?.consumer_secret) {
        throw new Error('Payment credentials not configured');
      }
      
      const gateway = new PesapalGateway({
        consumer_key: pesapalCredentials.consumer_key,
        consumer_secret: pesapalCredentials.consumer_secret,
        environment: 'sandbox', // TODO: Make this configurable
      });
      
      const result = await gateway.verifyPayment(orderTrackingId);
      console.log('Payment verification result:', result);
      
      // Update order status based on payment result
      const paymentStatus = result.status === 'completed' ? 'paid' : 'failed';
      const orderStatus = result.status === 'completed' ? 'confirmed' : 'pending';
      
      // Use edge function to update order status (bypasses RLS)
      const { data: updateResult, error: updateError } = await supabase.functions.invoke('update-order-status', {
        body: {
          customerToken,
          paymentStatus,
          orderStatus
        }
      });
      
      if (updateError || !updateResult?.success) {
        throw new Error(updateError?.message || updateResult?.error || 'Failed to update order status');
      }
      
      if (result.status === 'completed') {
        setSuccess(true);
        onPaymentVerified(true);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully!",
        });
      } else if (result.status === 'failed') {
        throw new Error('Payment was declined or failed');
      } else if (result.status === 'pending') {
        throw new Error('Payment is still pending. Please try again in a few minutes.');
      } else {
        throw new Error(`Payment status: ${result.status}`);
      }
      
    } catch (error) {
      console.error('Payment verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      setError(errorMessage);
      onPaymentVerified(false);
      toast({
        title: "Payment Verification Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (orderTrackingId && paymentSettings && !success && !verifying) {
      verifyPayment();
    }
  }, [orderTrackingId, paymentSettings]);

  if (!orderTrackingId) return null;

  return (
    <div className="space-y-4">
      {verifying && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Verifying your payment, please wait...
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>{error}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={verifyPayment}
              disabled={verifying}
              className="bg-background"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry Verification
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment verified successfully! Your order is now confirmed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};