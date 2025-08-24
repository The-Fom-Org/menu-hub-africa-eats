
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
    
    const vapidPrivateKeySecret = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLWpRS3aayd6oZtql3BGFyXl4FvTZrYlBaU7YTJjFID5gcmqinVc5eg' // MUST match frontend public key

    if (!vapidPrivateKeySecret) {
      console.error('❌ VAPID_PRIVATE_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'Push notification not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔑 Preparing VAPID auth (supports PEM, PKCS#8, or raw JWK)')

    const pushPromises = subscriptions.map(async (sub: PushSubscription) => {
      try {
        console.log('📱 Sending push to endpoint:', sub.endpoint.substring(0, 60) + '...')

        // Build payload (we’ll omit it when encryption isn’t available to ensure delivery)
        const payloadObject = {
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
        }
        const payloadJson = JSON.stringify(payloadObject)

        // Create VAPID JWT
        const jwt = await createVapidJWT(sub.endpoint, vapidPublicKey, vapidPrivateKeySecret)
        if (!jwt) {
          console.error('❌ Failed to create VAPID JWT')
          return { success: false, endpoint: sub.endpoint, error: 'JWT creation failed' }
        }

        // IMPORTANT: For maximum deliverability right now, send NO payload.
        // Many push services require proper Web Push encryption for payloads.
        // We’ll omit payload here so the push still arrives; the SW shows a default.
        const headers: Record<string, string> = {
          'TTL': '86400',
          'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        }

        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers,
          // body intentionally omitted to avoid encryption requirements
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Push failed for subscription ${sub.endpoint}:`, response.status, errorText)
          return { success: false, endpoint: sub.endpoint, status: response.status, error: errorText }
        } else {
          console.log(`✅ Push sent successfully to ${sub.endpoint.substring(0, 60)}...`)
          return { success: true, endpoint: sub.endpoint }
        }
      } catch (error) {
        console.error(`❌ Error sending push to ${sub.endpoint}:`, error)
        return { success: false, endpoint: sub.endpoint, error: (error as Error).message }
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

/**
 * Create proper VAPID JWT (ES256)
 * Accepts private key in multiple formats:
 * - PKCS#8 PEM (-----BEGIN PRIVATE KEY-----)
 * - Base64/Base64URL PKCS#8 (DER)
 * - Raw JWK "d" (base64url) combined with x,y derived from the public key
 */
async function createVapidJWT(audience: string, publicKeyBase64Url: string, privateKeySecret: string): Promise<string | null> {
  try {
    const url = new URL(audience)
    const aud = `${url.protocol}//${url.host}`
    
    const header = { typ: 'JWT', alg: 'ES256' }
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      aud,
      exp: now + 86400, // 24 hours
      sub: 'mailto:support@menuhub.africa'
    }

    const encodedHeader = base64UrlEncodeString(JSON.stringify(header))
    const encodedPayload = base64UrlEncodeString(JSON.stringify(payload))
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    const cryptoKey = await importVapidPrivateKey(privateKeySecret, publicKeyBase64Url)
    if (!cryptoKey) {
      console.error('❌ importVapidPrivateKey failed (format not recognized or invalid key)')
      return null
    }

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    )

    const encodedSignature = arrayBufferToBase64Url(signature)
    return `${unsignedToken}.${encodedSignature}`
  } catch (error) {
    console.error('❌ Error creating VAPID JWT:', error)
    return null
  }
}

async function importVapidPrivateKey(secret: string, publicKeyBase64Url: string): Promise<CryptoKey | null> {
  // Try PEM (PKCS#8)
  if (secret.includes('-----BEGIN') && secret.includes('PRIVATE KEY-----')) {
    try {
      const pem = secret
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\r?\n|\r/g, '')
        .trim()
      const der = base64ToUint8Array(pem)
      return crypto.subtle.importKey(
        'pkcs8',
        der,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      )
    } catch (e) {
      console.warn('⚠️ Failed to import PEM PKCS#8 key, trying other formats...', e)
    }
  }

  // Try base64/base64url PKCS#8 DER
  try {
    const der = ((): Uint8Array => {
      // detect base64url vs base64 by presence of - or _
      if (secret.includes('-') || secret.includes('_')) {
        return base64UrlToUint8Array(secret)
      }
      return base64ToUint8Array(secret)
    })()

    // Heuristic: PKCS#8 DER is typically > 100 bytes; raw "d" is 32 bytes
    if (der.byteLength > 64) {
      return crypto.subtle.importKey(
        'pkcs8',
        der,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      )
    }
  } catch (e) {
    console.warn('⚠️ Failed to import base64/b64url PKCS#8, trying JWK...', e)
  }

  // Try raw "d" (base64url) with x,y from public key
  try {
    const d = toBase64Url(secret)
    const { x, y } = parsePublicKeyXY(publicKeyBase64Url)
    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      d,
      ext: false,
      key_ops: ['sign'],
    } as JsonWebKey

    return crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    )
  } catch (e) {
    console.error('❌ Failed to import private key as JWK:', e)
    return null
  }
}

// Helpers

function base64UrlEncodeString(str: string): string {
  const bytes = new TextEncoder().encode(str)
  return arrayBufferToBase64Url(bytes.buffer)
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return toBase64Url(base64)
}

function toBase64Url(b64OrB64Url: string): string {
  // If it's already url-safe, just strip padding
  if (b64OrB64Url.includes('-') || b64OrB64Url.includes('_')) {
    return b64OrB64Url.replace(/=/g, '')
  }
  return b64OrB64Url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4 === 2 ? '==' : base64.length % 4 === 3 ? '=' : ''
  return base64ToUint8Array(base64 + padding)
}

function parsePublicKeyXY(publicKeyBase64Url: string): { x: string, y: string } {
  // Frontend public key is uncompressed EC point: 0x04 || X(32) || Y(32)
  const bytes = base64UrlToUint8Array(publicKeyBase64Url)
  if (bytes[0] !== 0x04 || bytes.length !== 65) {
    throw new Error('Invalid uncompressed P-256 public key format')
  }
  const xBytes = bytes.slice(1, 33)
  const yBytes = bytes.slice(33, 65)

  const xB64 = btoa(String.fromCharCode(...xBytes))
  const yB64 = btoa(String.fromCharCode(...yBytes))

  return {
    x: toBase64Url(xB64),
    y: toBase64Url(yB64),
  }
}
