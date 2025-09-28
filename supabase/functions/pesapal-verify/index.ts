import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  transactionId: string;
  credentials?: {
    consumer_key: string;
    consumer_secret: string;
  };
  isSubscription?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId, credentials, isSubscription = false }: VerifyRequest = await req.json();

    console.log('Verifying Pesapal payment:', { transactionId, isSubscription });

    // Use appropriate credentials based on payment type
    let pesapalCredentials;
    
    if (isSubscription) {
      pesapalCredentials = {
        consumer_key: Deno.env.get('PESAPAL_CONSUMER_KEY') || '',
        consumer_secret: Deno.env.get('PESAPAL_CONSUMER_SECRET') || ''
      };
    } else {
      if (!credentials?.consumer_key || !credentials?.consumer_secret) {
        throw new Error('Restaurant Pesapal credentials are required');
      }
      pesapalCredentials = credentials;
    }

    const baseUrl = Deno.env.get('PESAPAL_BASE_URL') || 'https://pay.pesapal.com/v3';

    // Step 1: Get authentication token
    const authResponse = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: pesapalCredentials.consumer_key,
        consumer_secret: pesapalCredentials.consumer_secret,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    const token = authData.token;

    // Step 2: Get transaction status
    const statusUrl = `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${transactionId}`;
    
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    
    console.log('Pesapal status response:', statusData);

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        payment_status_description: statusData.payment_status_description,
        amount: statusData.amount,
        currency: statusData.currency,
        merchant_reference: statusData.merchant_reference,
        payment_account: statusData.payment_account,
        created_date: statusData.created_date,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Pesapal verification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});