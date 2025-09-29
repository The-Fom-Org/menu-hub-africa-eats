import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MpesaCredentials {
  business_short_code: string;
  consumer_key: string;
  consumer_secret: string;
  passkey: string;
  environment: 'sandbox' | 'production';
}

interface MpesaPaymentRequest {
  amount: number;
  phone_number: string;
  orderId: string;
  description: string;
  credentials: MpesaCredentials;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      amount, 
      phone_number, 
      orderId, 
      description,
      credentials
    }: MpesaPaymentRequest = await req.json();

    console.log('Initializing M-Pesa STK Push:', { orderId, amount, phone_number: phone_number.slice(0, 3) + '***' });

    if (!credentials?.business_short_code || !credentials?.consumer_key || !credentials?.consumer_secret || !credentials?.passkey) {
      throw new Error('M-Pesa credentials are incomplete');
    }

    // M-Pesa API URLs
    const baseUrl = credentials.environment === 'production' 
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    // Step 1: Get OAuth token
    const authString = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`);
    
    const authResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!authResponse.ok) {
      throw new Error(`M-Pesa authentication failed: ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    console.log('M-Pesa authentication successful');

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const password = btoa(`${credentials.business_short_code}${credentials.passkey}${timestamp}`);

    // Format phone number to 254XXXXXXXX
    let formattedPhone = phone_number.replace(/[^\d]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('254')) {
      // Already formatted
    } else {
      formattedPhone = '254' + formattedPhone;
    }

    // Step 3: Initiate STK Push
    const stkPushData = {
      BusinessShortCode: credentials.business_short_code,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: credentials.business_short_code,
      PhoneNumber: formattedPhone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: orderId,
      TransactionDesc: description || `Payment for order ${orderId}`
    };

    console.log('Initiating STK Push with data:', { 
      ...stkPushData, 
      Password: '***', 
      PhoneNumber: formattedPhone.slice(0, 6) + '***' 
    });

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushData),
    });

    if (!stkResponse.ok) {
      const errorData = await stkResponse.text();
      console.error('STK Push failed:', errorData);
      throw new Error(`STK Push failed: ${stkResponse.statusText}`);
    }

    const stkResult = await stkResponse.json();
    console.log('STK Push response:', stkResult);

    // Check if STK push was accepted
    if (stkResult.ResponseCode !== '0') {
      throw new Error(stkResult.ResponseDescription || 'STK Push was not accepted');
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_request_id: stkResult.CheckoutRequestID,
        merchant_request_id: stkResult.MerchantRequestID,
        response_description: stkResult.ResponseDescription,
        customer_message: stkResult.CustomerMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('M-Pesa initialization error:', error);
    
    let errorMessage = 'M-Pesa payment initialization failed';
    let statusCode = 400;
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('authentication failed')) {
      errorMessage = 'Invalid M-Pesa credentials. Please check your M-Pesa settings.';
      statusCode = 401;
    } else if (errorMsg.includes('credentials are incomplete')) {
      errorMessage = 'M-Pesa payment method not properly configured.';
      statusCode = 422;
    } else if (errorMsg.includes('STK Push was not accepted')) {
      errorMessage = errorMsg;
    } else if (errorMsg) {
      errorMessage = errorMsg;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});