
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
  order_id: string
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
    
    console.log('📱 Sending push notification for order:', orderId, 'status:', orderStatus)

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
      console.error('❌ Error fetching subscriptions:', subError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📱 No push subscriptions found for order:', orderId)
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('📱 Found', subscriptions.length, 'subscriptions for order:', orderId)

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
    const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLWpRS3aayd6oZtql3BGFyXl4FvTZrYlBaU7YTJjFID5gcmqinVc5eg'
    
    if (!vapidPrivateKey) {
      console.error('❌ VAPID_PRIVATE_KEY not found in environment')
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
        console.log('📱 Sending push to endpoint:', sub.endpoint.substring(0, 50) + '...')

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

        // Create authentication headers for web push
        const vapidHeaders = await createVapidHeaders(
          sub.endpoint,
          vapidPublicKey,
          vapidPrivateKey,
          payload
        )

        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
            ...vapidHeaders,
          },
          body: await encryptPayload(payload, sub.p256dh, sub.auth),
        })

        if (!response.ok) {
          console.error(`❌ Push failed for subscription ${sub.endpoint}:`, response.status, await response.text())
          return { success: false, endpoint: sub.endpoint, status: response.status }
        } else {
          console.log(`✅ Push sent successfully to ${sub.endpoint.substring(0, 50)}...`)
          return { success: true, endpoint: sub.endpoint }
        }
      } catch (error) {
        console.error(`❌ Error sending push to ${sub.endpoint}:`, error)
        return { success: false, endpoint: sub.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length

    console.log(`📱 Push notifications sent: ${successCount}/${subscriptions.length}`)

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
    console.error('❌ Error in send-order-status-push function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to create VAPID headers
async function createVapidHeaders(
  endpoint: string,
  publicKey: string,
  privateKey: string,
  payload: string
): Promise<Record<string, string>> {
  const vapidHeaders: Record<string, string> = {}
  
  try {
    const url = new URL(endpoint)
    const audience = `${url.protocol}//${url.host}`
    
    vapidHeaders['Authorization'] = `vapid t=${await generateJWT(audience, publicKey, privateKey)}, k=${publicKey}`
  } catch (error) {
    console.error('❌ Error creating VAPID headers:', error)
  }
  
  return vapidHeaders
}

// Simplified JWT generation for VAPID
async function generateJWT(audience: string, publicKey: string, privateKey: string): Promise<string> {
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  }
  
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    sub: 'mailto:support@menuhub.africa'
  }
  
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  // For now, return a basic token - in production, you'd sign this properly
  return `${headerB64}.${payloadB64}.signature`
}

// Simplified encryption for web push
async function encryptPayload(payload: string, p256dh: string, auth: string): Promise<Uint8Array> {
  // For now, return the payload as bytes
  // In production, you'd implement proper AES-GCM encryption
  return new TextEncoder().encode(payload)
}
