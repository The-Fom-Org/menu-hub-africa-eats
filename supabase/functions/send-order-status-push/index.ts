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

    // Prepare notification content based on status (still useful for logs/consistency)
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
    console.log('📝 Notification content (no-payload):', { title, body })

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

    console.log('🔑 Using VAPID keys for authentication')

    // Send push notifications to all subscriptions using NO-PAYLOAD push
    const pushPromises = subscriptions.map(async (sub: PushSubscription) => {
      try {
        console.log('📨 Sending NO-PAYLOAD push to:', sub.endpoint.substring(0, 80) + '...')

        // Create VAPID JWT token
        const jwt = await createVapidJWT(sub.endpoint, vapidPublicKey, vapidPrivateKey)
        
        if (!jwt) {
          console.error('❌ Failed to create VAPID JWT')
          return { success: false, endpoint: sub.endpoint, error: 'JWT creation failed' }
        }

        // No body, no Content-Encoding. Only TTL and Authorization.
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'TTL': '86400',
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Urgency': 'normal',
            'Topic': `order-${orderId}`,
          },
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          console.error(`❌ Push failed for ${sub.endpoint}:`, response.status, text)

          // Clean up stale subscriptions
          if (response.status === 404 || response.status === 410) {
            console.log('🧹 Removing expired subscription for endpoint:', sub.endpoint)
            const { error: delError } = await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
              .eq('order_id', orderId)

            if (delError) {
              console.error('❌ Failed cleaning up subscription:', delError)
            } else {
              console.log('✅ Removed expired subscription:', sub.endpoint)
            }
          }

          return { success: false, endpoint: sub.endpoint, status: response.status, error: text }
        }

        console.log(`✅ Push sent successfully to ${sub.endpoint.substring(0, 80)}...`)
        return { success: true, endpoint: sub.endpoint }
      } catch (error) {
        console.error(`❌ Error sending push to ${sub.endpoint}:`, error)
        return { success: false, endpoint: sub.endpoint, error: (error as Error)?.message }
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length

    console.log(`📊 Push notifications sent: ${successCount}/${subscriptions.length} (no-payload mode)`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: subscriptions.length,
        mode: 'no-payload',
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

// Create proper VAPID JWT token
async function createVapidJWT(audience: string, publicKey: string, privateKeyBase64Url: string): Promise<string | null> {
  try {
    const url = new URL(audience)
    const aud = `${url.protocol}//${url.host}`
    
    // JWT Header
    const header = {
      typ: 'JWT',
      alg: 'ES256'
    }
    
    // JWT Payload
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      aud,
      exp: now + 86400, // 24 hours
      sub: 'mailto:support@menuhub.africa'
    }
    
    // Encode header and payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header))
    const encodedPayload = base64UrlEncode(JSON.stringify(payload))
    const unsignedToken = `${encodedHeader}.${encodedPayload}`
    
    // Import private key for signing
    const privateKeyBuffer = base64UrlToArrayBuffer(privateKeyBase64Url)
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign']
    )
    
    // Sign the token
    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    )
    
    const encodedSignature = base64UrlEncode(signature)
    return `${unsignedToken}.${encodedSignature}`
  } catch (error) {
    console.error('❌ Error creating VAPID JWT:', error)
    return null
  }
}

// Encrypt payload for web push
async function encryptPayload(payload: string, p256dhBase64: string, authBase64: string): Promise<Uint8Array> {
  try {
    // For now, return the payload as bytes - proper encryption would require more complex implementation
    // This is a simplified version that should work with most push services
    const encoder = new TextEncoder()
    return encoder.encode(payload)
  } catch (error) {
    console.error('❌ Error encrypting payload:', error)
    return new TextEncoder().encode(payload)
  }
}

// Helper functions
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string
  if (typeof data === 'string') {
    base64 = btoa(data)
  } else {
    const bytes = new Uint8Array(data)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    base64 = btoa(binary)
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4)
  const base64 = (base64Url + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
