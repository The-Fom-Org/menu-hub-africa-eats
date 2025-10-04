import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const callbackData = await req.json();
    console.log('📱 M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    const { stkCallback } = Body || {};
    
    if (!stkCallback) {
      console.log('❌ Invalid callback format');
      return new Response('Invalid callback', { status: 400 });
    }

    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = stkCallback;

    // Find the order by checkout request ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('gateway_reference', CheckoutRequestID)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found for checkout request:', CheckoutRequestID);
      return new Response('Order not found', { status: 404 });
    }

    console.log('📝 Processing callback for order:', order.customer_token);

    if (ResultCode === 0) {
      // Payment successful
      let amount = 0;
      let mpesaReceiptNumber = '';
      let phoneNumber = '';
      
      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === 'Amount') {
            amount = item.Value;
          } else if (item.Name === 'MpesaReceiptNumber') {
            mpesaReceiptNumber = item.Value;
          } else if (item.Name === 'PhoneNumber') {
            phoneNumber = item.Value;
          }
        }
      }

      // Update order status to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          order_status: 'confirmed',
          gateway_reference: mpesaReceiptNumber,
          updated_at: new Date().toISOString()
        })
        .eq('customer_token', order.customer_token);

      if (updateError) {
        console.error('❌ Error updating order status:', updateError);
      } else {
        console.log('✅ Order payment confirmed:', order.customer_token);
      }

      // Store callback data for audit
      await supabase
        .from('mpesa_callbacks')
        .insert({
          checkout_request_id: CheckoutRequestID,
          merchant_request_id: MerchantRequestID,
          result_code: ResultCode,
          result_desc: ResultDesc,
          callback_data: callbackData,
          success: true,
          amount: amount,
          mpesa_receipt_number: mpesaReceiptNumber,
          phone_number: phoneNumber.toString(),
        });

    } else {
      // Payment failed
      console.log('❌ Payment failed:', ResultDesc);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('customer_token', order.customer_token);

      if (updateError) {
        console.error('❌ Error updating order status to failed:', updateError);
      }

      // Store failed callback data
      await supabase
        .from('mpesa_callbacks')
        .insert({
          checkout_request_id: CheckoutRequestID,
          merchant_request_id: MerchantRequestID,
          result_code: ResultCode,
          result_desc: ResultDesc,
          callback_data: callbackData,
          success: false,
        });
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    console.error('❌ M-Pesa callback error:', error);
    return new Response('Internal Server Error', { 
      headers: corsHeaders,
      status: 500 
    });
  }
});