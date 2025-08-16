
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { headers: corsHeaders, status: 405 });
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response('Unsupported Media Type', { headers: corsHeaders, status: 415 });
  }

  try {
    console.log('Pesapal IPN webhook received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook data safely
    let webhookData: any;
    try {
      webhookData = await req.json();
    } catch {
      return new Response('Invalid JSON', { headers: corsHeaders, status: 400 });
    }

    // Minimal logging to avoid PII exposure
    const {
      OrderTrackingId,
      OrderMerchantReference,
      OrderNotificationType,
      OrderCreatedDate,
    } = webhookData ?? {};

    // Basic validation
    if (
      typeof OrderNotificationType !== 'string' ||
      typeof OrderMerchantReference !== 'string' ||
      typeof OrderTrackingId !== 'string'
    ) {
      console.warn('Webhook missing required fields');
      return new Response('Bad Request', { headers: corsHeaders, status: 400 });
    }

    console.log(
      `Webhook: type=${OrderNotificationType} tracking=${OrderTrackingId} ref=${OrderMerchantReference}`
    );

    if (OrderNotificationType === 'COMPLETED') {
      // Payment completed - update order or subscription payment
      if (OrderMerchantReference?.startsWith('subscription_')) {
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
      // Update payment status to failed
      if (OrderMerchantReference?.startsWith('subscription_')) {
        const { error } = await supabase
          .from('subscription_payments')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', OrderMerchantReference);
        if (error) console.error('Failed to mark subscription payment failed:', error);
      } else {
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', OrderMerchantReference);
        if (error) console.error('Failed to mark order failed:', error);
      }
    } else {
      // Unknown or unhandled type
      console.warn('Unhandled notification type:', OrderNotificationType);
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
