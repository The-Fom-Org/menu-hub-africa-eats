import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const callbackData = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    
    if (!Body?.stkCallback) {
      console.log('Invalid callback structure');
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Invalid callback" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const callback = Body.stkCallback;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = callback;

    console.log('Processing callback for CheckoutRequestID:', CheckoutRequestID);

    // ResultCode 0 means success
    const isSuccessful = ResultCode === 0;
    
    let transactionData: any = {
      checkout_request_id: CheckoutRequestID,
      merchant_request_id: MerchantRequestID,
      result_code: ResultCode,
      result_desc: ResultDesc,
      success: isSuccessful
    };

    // If successful, extract transaction details
    if (isSuccessful && CallbackMetadata?.Item) {
      const metadata = CallbackMetadata.Item;
      
      for (const item of metadata) {
        switch (item.Name) {
          case 'Amount':
            transactionData.amount = item.Value;
            break;
          case 'MpesaReceiptNumber':
            transactionData.mpesa_receipt_number = item.Value;
            break;
          case 'Balance':
            transactionData.balance = item.Value;
            break;
          case 'TransactionDate':
            transactionData.transaction_date = item.Value;
            break;
          case 'PhoneNumber':
            transactionData.phone_number = item.Value;
            break;
        }
      }

      console.log('Payment successful:', transactionData);
      
      // Update order status to paid if successful
      // We need to find the order by the CheckoutRequestID or account reference
      // For now, we'll store the transaction data for verification
      
    } else {
      console.log('Payment failed or cancelled:', ResultDesc);
    }

    // Store the callback data for verification later
    const { error: logError } = await supabase
      .from('mpesa_callbacks')
      .insert({
        checkout_request_id: CheckoutRequestID,
        merchant_request_id: MerchantRequestID,
        result_code: ResultCode,
        result_desc: ResultDesc,
        callback_data: callbackData,
        success: isSuccessful,
        ...transactionData
      });

    if (logError) {
      console.error('Failed to log callback:', logError);
    }

    // Respond to M-Pesa (they expect a 200 response)
    return new Response(JSON.stringify({ 
      ResultCode: 0, 
      ResultDesc: "Callback received successfully" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    
    // Still return 200 to M-Pesa to prevent retries
    return new Response(JSON.stringify({ 
      ResultCode: 1, 
      ResultDesc: "Callback processing failed" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});