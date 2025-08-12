import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PesapalCredentials {
  consumer_key: string;
  consumer_secret: string;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  callbackUrl?: string;
  cancelUrl?: string;
  credentials?: PesapalCredentials;
  isSubscription?: boolean; // Flag for B2B payments
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      amount, 
      currency = 'KES', 
      orderId, 
      description, 
      customerInfo, 
      callbackUrl, 
      cancelUrl,
      credentials,
      isSubscription = false
    }: PaymentRequest = await req.json();

    console.log('Initializing Pesapal payment:', { orderId, amount, currency, isSubscription });

    // Use MenuHub credentials for subscription payments, restaurant credentials for customer payments
    let pesapalCredentials: PesapalCredentials;
    
    if (isSubscription) {
      // Use MenuHub Africa's Pesapal credentials for subscription payments
      pesapalCredentials = {
        consumer_key: Deno.env.get('PESAPAL_CONSUMER_KEY') || '',
        consumer_secret: Deno.env.get('PESAPAL_CONSUMER_SECRET') || ''
      };
    } else {
      // Use restaurant's own Pesapal credentials
      if (!credentials?.consumer_key || !credentials?.consumer_secret) {
        throw new Error('Restaurant Pesapal credentials are required for customer payments');
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

    console.log('Pesapal authentication successful');

    // Step 2: Submit order request
    const notificationId = Deno.env.get('IPN_ID') || '';
    
    const orderData = {
      id: orderId,
      currency: currency,
      amount: amount,
      description: description,
      callback_url: callbackUrl || `${req.headers.get('origin')}/order-success`,
      notification_id: notificationId,
      billing_address: {
        email_address: customerInfo.email || '',
        phone_number: customerInfo.phone || '',
        country_code: 'KE',
        first_name: customerInfo.name?.split(' ')[0] || '',
        last_name: customerInfo.name?.split(' ').slice(1).join(' ') || '',
      }
    };

    const orderResponse = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error('Order submission failed:', errorData);
      throw new Error(`Order submission failed: ${orderResponse.statusText}`);
    }

    const orderResult = await orderResponse.json();
    
    console.log('Pesapal order created successfully:', orderResult);

    return new Response(
      JSON.stringify({
        success: true,
        redirect_url: orderResult.redirect_url,
        tracking_id: orderResult.tracking_id,
        merchant_reference: orderResult.merchant_reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Pesapal initialization error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});