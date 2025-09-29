import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  checkout_request_id: string;
  credentials?: {
    business_short_code: string;
    consumer_key: string;
    consumer_secret: string;
    environment: 'sandbox' | 'production';
  };
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
    const { checkout_request_id, credentials }: VerifyRequest = await req.json();

    console.log('Verifying M-Pesa payment:', checkout_request_id);

    // First check our callback logs
    const { data: callbackData, error: callbackError } = await supabase
      .from('mpesa_callbacks')
      .select('*')
      .eq('checkout_request_id', checkout_request_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (callbackError) {
      console.error('Error checking callback data:', callbackError);
    }

    if (callbackData) {
      console.log('Found callback data:', callbackData);
      
      return new Response(
        JSON.stringify({
          success: true,
          status: callbackData.success ? 'completed' : 'failed',
          result_code: callbackData.result_code,
          result_desc: callbackData.result_desc,
          amount: callbackData.amount,
          mpesa_receipt_number: callbackData.mpesa_receipt_number,
          transaction_date: callbackData.transaction_date,
          phone_number: callbackData.phone_number
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // If no callback data and credentials provided, query M-Pesa directly
    if (credentials) {
      console.log('No callback data found, querying M-Pesa API directly');
      
      const baseUrl = credentials.environment === 'production' 
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

      // Get OAuth token
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

      // Query transaction status
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
      const password = btoa(`${credentials.business_short_code}${credentials.business_short_code}${timestamp}`);

      const queryData = {
        BusinessShortCode: credentials.business_short_code,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkout_request_id
      };

      const queryResponse = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData),
      });

      if (!queryResponse.ok) {
        throw new Error(`M-Pesa query failed: ${queryResponse.statusText}`);
      }

      const queryResult = await queryResponse.json();
      console.log('M-Pesa query result:', queryResult);

      // Map M-Pesa response codes to our status
      let status = 'pending';
      if (queryResult.ResultCode === '0') {
        status = 'completed';
      } else if (queryResult.ResultCode === '1032') {
        status = 'cancelled'; // User cancelled
      } else if (queryResult.ResultCode === '1037') {
        status = 'timeout'; // Transaction timed out
      } else if (queryResult.ResultCode && queryResult.ResultCode !== '1037') {
        status = 'failed';
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: status,
          result_code: queryResult.ResultCode,
          result_desc: queryResult.ResultDesc,
          response_description: queryResult.ResponseDescription
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // No callback data and no credentials to query M-Pesa
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No transaction data found and no credentials provided for verification',
        status: 'pending'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error('M-Pesa verification error:', error);
    
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