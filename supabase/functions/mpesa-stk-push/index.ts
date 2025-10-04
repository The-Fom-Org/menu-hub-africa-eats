import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface STKPushRequest {
  restaurantId: string;
  orderTrackingId: string;
  amount: number;
  phoneNumber: string;
  description: string;
}

interface MpesaCredentials {
  enabled: boolean;
  consumer_key: string;
  consumer_secret: string;
  business_short_code: string;
  passkey: string;
  callback_url?: string;
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

    const { restaurantId, orderTrackingId, amount, phoneNumber, description }: STKPushRequest = await req.json();

    console.log('🔄 STK Push request:', { restaurantId, orderTrackingId, amount, phoneNumber });

    // Get restaurant's M-Pesa credentials
    const { data: paymentSettings, error: settingsError } = await supabase
      .from('restaurant_payment_settings')
      .select('payment_methods')
      .eq('restaurant_id', restaurantId)
      .single();

    if (settingsError) {
      console.error('❌ Error fetching payment settings:', settingsError);
      throw new Error('Restaurant payment settings not found');
    }

    const mpesaConfig = paymentSettings.payment_methods?.mpesa_daraja as MpesaCredentials;
    
    if (!mpesaConfig?.enabled || !mpesaConfig.consumer_key || !mpesaConfig.consumer_secret) {
      throw new Error('M-Pesa Daraja not configured for this restaurant');
    }

    // Get M-Pesa access token
    const authString = btoa(`${mpesaConfig.consumer_key}:${mpesaConfig.consumer_secret}`);
    
    const tokenResponse = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get M-Pesa access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = btoa(`${mpesaConfig.business_short_code}${mpesaConfig.passkey}${timestamp}`);

    // Format phone number (ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Default callback URL if not provided
    const callbackUrl = mpesaConfig.callback_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;

    // STK Push request payload
    const stkPushPayload = {
      BusinessShortCode: mpesaConfig.business_short_code,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: mpesaConfig.business_short_code,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderTrackingId,
      TransactionDesc: description || `Payment for order ${orderTrackingId}`
    };

    console.log('📱 Sending STK Push:', { ...stkPushPayload, Password: '[HIDDEN]' });

    // Send STK Push request
    const stkResponse = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();
    console.log('📱 STK Push response:', stkData);

    if (stkData.ResponseCode !== '0') {
      throw new Error(stkData.ResponseDescription || 'STK Push failed');
    }

    // Store the checkout request ID for verification
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        gateway_reference: stkData.CheckoutRequestID,
        updated_at: new Date().toISOString()
      })
      .eq('customer_token', orderTrackingId);

    if (updateError) {
      console.error('❌ Error updating order with checkout request ID:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK Push sent successfully',
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ STK Push error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});