export interface PesapalConfig {
  consumer_key: string;
  consumer_secret: string;
  environment: 'sandbox' | 'production';
  ipn_id?: string;
}

export interface PesapalPaymentRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  redirect_mode?: string;
  notification_id?: string;
  billing_address: {
    email_address?: string;
    phone_number?: string;
    country_code?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

export class PesapalGateway {
  private config: PesapalConfig;

  constructor(config: PesapalConfig) {
    this.config = config;
  }

  async initializePayment(request: PesapalPaymentRequest): Promise<{ redirect_url: string; order_tracking_id: string }> {
    try {
      console.log('Initializing Pesapal payment via Supabase function:', request);
      
      const response = await fetch('/functions/v1/pesapal-initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          consumer_key: this.config.consumer_key,
          consumer_secret: this.config.consumer_secret,
          environment: this.config.environment,
          ipn_id: this.config.ipn_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment initialization failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        redirect_url: data.redirect_url,
        order_tracking_id: data.order_tracking_id,
      };
    } catch (error) {
      console.error('Pesapal payment initialization error:', error);
      throw error;
    }
  }

  async verifyPayment(orderTrackingId: string): Promise<{ status: string; amount: number; currency: string }> {
    try {
      console.log('Verifying Pesapal payment via Supabase function:', orderTrackingId);
      
      const response = await fetch('/functions/v1/pesapal-verify', {
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