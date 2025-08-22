
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { orderId, orderStatus, customerName, totalAmount } = await req.json()
    
    console.log('Sending push notification for order:', orderId, 'status:', orderStatus)

    if (!orderId || !orderStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId or orderStatus' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get push subscriptions for this order
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('order_id', orderId)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for order:', orderId)
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare notification content based on status
    const getNotificationContent = (status: string) => {
      switch (status) {
        case 'confirmed':
          return {
            title: '✅ Order Confirmed!',
            body: `Your order ${customerName ? `for ${customerName} ` : ''}has been confirmed and is being prepared.`,
          }
        case 'preparing':
          return {
            title: '👨‍🍳 Now Preparing',
            body: `Your order ${customerName ? `for ${customerName} ` : ''}is now being prepared by our kitchen.`,
          }
        case 'ready':
          return {
            title: '🎉 Order Ready!',
            body: `Your order ${customerName ? `for ${customerName} ` : ''}is ready for pickup!`,
          }
        case 'completed':
          return {
            title: '✨ Order Complete',
            body: `Your order ${customerName ? `for ${customerName} ` : ''}has been completed. Thank you!`,
          }
        case 'cancelled':
          return {
            title: '❌ Order Cancelled',
            body: `Your order ${customerName ? `for ${customerName} ` : ''}has been cancelled.`,
          }
        default:
          return {
            title: '📋 Order Update',
            body: `Your order status has been updated to: ${status}`,
          }
      }
    }

    const { title, body } = getNotificationContent(orderStatus)
    
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    if (!vapidPrivateKey) {
      console.error('VAPID_PRIVATE_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'Push notification not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send push notifications to all subscriptions
    const pushPromises = subscriptions.map(async (sub: PushSubscription) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        // Use web-push library equivalent logic
        const payload = JSON.stringify({
          title,
          body,
          icon: '/menuhub.png',
          badge: '/menuhub.png',
          tag: `order-${orderId}`,
          data: {
            orderId,
            orderStatus,
            url: '/',
          },
        })

        // For now, we'll use a simple fetch to the push service
        // In a production environment, you'd want to use a proper web-push library
        const response = await fetch(pushSubscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'TTL': '86400',
          },
          body: payload,
        })

        if (!response.ok) {
          console.error(`Push failed for subscription ${sub.endpoint}:`, response.status)
        } else {
          console.log(`Push sent successfully to ${sub.endpoint}`)
        }

        return { success: response.ok, endpoint: sub.endpoint }
      } catch (error) {
        console.error(`Error sending push to ${sub.endpoint}:`, error)
        return { success: false, endpoint: sub.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length

    console.log(`Push notifications sent: ${successCount}/${subscriptions.length}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: subscriptions.length,
        results 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-order-status-push function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
