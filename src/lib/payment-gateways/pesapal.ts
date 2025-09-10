export interface PesapalConfig {
  consumer_key: string;
  consumer_secret: string;
  environment: 'sandbox' | 'production';
  ipn_id?: string;
}

export interface PesapalPaymentRequest {
  orderId: string;
  currency: string;
  amount: number;
  description: string;
  callbackUrl: string;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  consumer_key?: string;
  consumer_secret?: string;
  environment?: string;
  ipn_id?: string;
}

export class PesapalGateway {
  private config: PesapalConfig;

  constructor(config: PesapalConfig) {
    this.config = config;
  }

  async initializePayment(request: PesapalPaymentRequest): Promise<{ redirect_url: string; order_tracking_id: string }> {
    try {
      console.log('Initializing Pesapal payment via Supabase function:', request);
      
      const payloadForEdgeFunction = {
        orderId: request.orderId,
        currency: request.currency,
        amount: request.amount,
        description: request.description,
        customerInfo: request.customerInfo,
        callbackUrl: request.callbackUrl,
        credentials: {
          consumer_key: this.config.consumer_key,
          consumer_secret: this.config.consumer_secret,
        },
        isSubscription: false,
      };
      
      console.log('Sending payload to Pesapal edge function:', payloadForEdgeFunction);
      
      const response = await fetch('https://mrluhxwootpggtptglcd.supabase.co/functions/v1/pesapal-initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadForEdgeFunction),
      });

      const responseText = await response.text();
      console.log('Pesapal edge function response:', responseText);

      if (!response.ok) {
        throw new Error(`Payment initialization failed: ${response.status} ${response.statusText} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed Pesapal response data:', data);
      
      if (!data.redirect_url || !data.tracking_id) {
        throw new Error('Invalid response from payment gateway: missing redirect_url or tracking_id');
      }
      
      return {
        redirect_url: data.redirect_url,
        order_tracking_id: data.tracking_id, // Map tracking_id to order_tracking_id
      };
    } catch (error) {
      console.error('Pesapal payment initialization error:', error);
      throw error;
    }
  }

  async verifyPayment(orderTrackingId: string): Promise<{ status: string; amount: number; currency: string }> {
    try {
      console.log('Verifying Pesapal payment via Supabase function:', orderTrackingId);
      
      const response = await fetch('https://mrluhxwootpggtptglcd.supabase.co/functions/v1/pesapal-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_tracking_id: orderTrackingId,
          consumer_key: this.config.consumer_key,
          consumer_secret: this.config.consumer_secret,
          environment: this.config.environment,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error) {
      console.error('Pesapal payment verification error:', error);
      throw error;
    }
  }
}