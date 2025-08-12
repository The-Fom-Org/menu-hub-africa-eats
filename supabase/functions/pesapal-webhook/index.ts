import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Pesapal IPN webhook received');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook data
    const webhookData = await req.json();
    console.log('Webhook data:', webhookData);

    const { 
      OrderTrackingId, 
      OrderMerchantReference, 
      OrderNotificationType,
      OrderCreatedDate 
    } = webhookData;

    if (OrderNotificationType === 'COMPLETED') {
      // Payment completed - update order status
      console.log('Payment completed for tracking ID:', OrderTrackingId);

      // Check if this is a subscription payment
      if (OrderMerchantReference?.startsWith('subscription_')) {
        // Update subscription payment status
        const { error: subError } = await supabase
          .from('subscription_payments')
          .update({ 
            payment_status: 'completed',
            gateway_reference: OrderTrackingId,
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', OrderMerchantReference);

        if (subError) {
          console.error('Failed to update subscription payment:', subError);
        } else {
          console.log('Subscription payment updated successfully');
        }
      } else {
        // Update customer order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'completed',
            order_status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', OrderMerchantReference);

        if (orderError) {
          console.error('Failed to update order:', orderError);
        } else {
          console.log('Order updated successfully');
        }
      }
    } else if (OrderNotificationType === 'FAILED') {
      console.log('Payment failed for tracking ID:', OrderTrackingId);
      
      // Update payment status to failed
      if (OrderMerchantReference?.startsWith('subscription_')) {
        await supabase
          .from('subscription_payments')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', OrderMerchantReference);
      } else {
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', OrderMerchantReference);
      }
    }

    return new Response('OK', {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response('Error', {
      headers: corsHeaders,
      status: 500,
    });
  }
});