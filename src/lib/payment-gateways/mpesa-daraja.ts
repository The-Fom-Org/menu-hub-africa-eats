export interface MpesaDarajaConfig {
  business_short_code: string;
  consumer_key: string;
  consumer_secret: string;
  passkey: string;
  environment: 'sandbox' | 'production';
}

export interface MpesaPaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  phone_number: string;
  credentials: MpesaDarajaConfig;
}

export class MpesaDarajaGateway {
  private config: MpesaDarajaConfig;

  constructor(config: MpesaDarajaConfig) {
    this.config = config;
  }

  async initializePayment(request: MpesaPaymentRequest): Promise<{ checkout_request_id: string; merchant_request_id: string }> {
    try {
      console.log('Initializing M-Pesa Daraja payment via Supabase function:', {
        orderId: request.orderId,
        amount: request.amount,
        phone: request.phone_number.slice(0, 3) + '***'
      });

      const response = await fetch('https://mrluhxwootpggtptglcd.supabase.co/functions/v1/mpesa-initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: request.orderId,
          amount: request.amount,
          phone_number: request.phone_number,
          description: request.description,
          credentials: request.credentials,
        }),
      });

      const responseText = await response.text();
      console.log('M-Pesa edge function response:', responseText);

      if (!response.ok) {
        throw new Error(`Payment initialization failed: ${response.status} ${response.statusText} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed M-Pesa response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }
      
      if (!data.checkout_request_id) {
        throw new Error('Invalid response from M-Pesa: missing checkout_request_id');
      }
      
      return {
        checkout_request_id: data.checkout_request_id,
        merchant_request_id: data.merchant_request_id,
      };
    } catch (error) {
      console.error('M-Pesa payment initialization error:', error);
      throw error;
    }
  }

  async verifyPayment(checkoutRequestId: string): Promise<{ status: string; amount?: number; receipt?: string }> {
    try {
      console.log('Verifying M-Pesa payment via Supabase function:', checkoutRequestId);
      
      const response = await fetch('https://mrluhxwootpggtptglcd.supabase.co/functions/v1/mpesa-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkout_request_id: checkoutRequestId,
          credentials: {
            business_short_code: this.config.business_short_code,
            consumer_key: this.config.consumer_key,
            consumer_secret: this.config.consumer_secret,
            environment: this.config.environment,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('M-Pesa verification response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Payment verification failed');
      }
      
      return {
        status: data.status || 'pending',
        amount: data.amount,
        receipt: data.mpesa_receipt_number,
      };
    } catch (error) {
      console.error('M-Pesa payment verification error:', error);
      throw error;
    }
  }
}