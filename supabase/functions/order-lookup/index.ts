import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Use ANON key for security - no direct table access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { customerToken } = await req.json()
    
    console.log('Looking up order with customer token:', customerToken)

    if (!customerToken) {
      return new Response(
        JSON.stringify({ error: 'Missing customer token' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use SERVICE ROLE to access order data securely
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Look up order by customer token (safe public identifier)
    const { data, error } = await serviceClient
      .from('orders')
      .select(`
        id,
        customer_name,
        order_type,
        payment_method,
        payment_status,
        order_status,
        total_amount,
        created_at,
        scheduled_time,
        table_number
      `)
      .eq('customer_token', customerToken)
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return only safe, customer-relevant data (no phone numbers or restaurant IDs)
    const safeOrderData = {
      id: data.id,
      customer_name: data.customer_name,
      order_type: data.order_type,
      payment_method: data.payment_method,
      payment_status: data.payment_status,
      order_status: data.order_status,
      total_amount: data.total_amount,
      created_at: data.created_at,
      scheduled_time: data.scheduled_time,
      table_number: data.table_number,
    }

    console.log('Order found successfully')

    return new Response(
      JSON.stringify({ success: true, order: safeOrderData }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in order-lookup function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})