import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus, PaymentGatewayConfig } from './types';

export class PesapalGateway implements PaymentGateway {
  name = 'Pesapal';
  type = 'pesapal';
  requiresCredentials = true;
  supportedMethods = ['M-Pesa', 'Card', 'Bank'];

  getCredentialFields() {
    return [
      { name: 'consumer_key', label: 'Consumer Key', type: 'text', required: true },
      { name: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true },
    ];
  }

  async initializePayment(request: PaymentRequest, config: PaymentGatewayConfig): Promise<PaymentResponse> {
    try {
      // Import supabase here to avoid module issues
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://mrluhxwootpggtptglcd.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybHVoeHdvb3RwZ2d0cHRnbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTc2MTMsImV4cCI6MjA2ODY5MzYxM30.aH9JWZ3hLtC-hOo3iBbJK64edLFkyJYkHXdOavANXMM'
      );

      // Call our Supabase edge function to handle Pesapal payment initialization
      const { data, error } = await supabase.functions.invoke('pesapal-initialize', {
        body: {
          amount: request.amount,
          currency: request.currency,
          orderId: request.orderId,
          description: request.description,
          customerInfo: request.customerInfo,
          callbackUrl: request.callbackUrl,
          cancelUrl: request.cancelUrl,
          credentials: config.credentials,
          isSubscription: false // This is for customer orders
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Payment initialization failed',
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Payment initialization failed',
        };
      }

      return {
        success: true,
        paymentUrl: data.redirect_url,
        transactionId: data.tracking_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed',
      };
    }
  }

  async verifyPayment(transactionId: string, config: PaymentGatewayConfig): Promise<PaymentStatus> {
    try {
      // Import supabase here to avoid module issues
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://mrluhxwootpggtptglcd.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybHVoeHdvb3RwZ2d0cHRnbGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTc2MTMsImV4cCI6MjA2ODY5MzYxM30.aH9JWZ3hLtC-hOo3iBbJK64edLFkyJYkHXdOavANXMM'
      );

      // Call our Supabase edge function to handle Pesapal payment verification
      const { data, error } = await supabase.functions.invoke('pesapal-verify', {
        body: {
          transactionId,
          credentials: config.credentials,
          isSubscription: false // This is for customer orders
        }
      });

      if (error) {
        return {
          transactionId,
          status: 'failed',
        };
      }

      if (!data.success) {
        return {
          transactionId,
          status: 'failed',
        };
      }

      return {
        transactionId,
        status: this.mapPesapalStatus(data.payment_status_description),
        amount: data.amount,
        currency: data.currency,
        paidAt: data.payment_status_description === 'COMPLETED' ? new Date() : undefined,
        gatewayReference: data.merchant_reference,
      };
    } catch (error) {
      return {
        transactionId,
        status: 'failed',
      };
    }
  }

  private mapPesapalStatus(pesapalStatus: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    switch (pesapalStatus?.toUpperCase()) {
      case 'COMPLETED':
        return 'completed';
      case 'FAILED':
        return 'failed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}