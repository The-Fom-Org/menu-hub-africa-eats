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
      // Call our edge function to handle Pesapal payment initialization
      const response = await fetch('/api/payments/pesapal/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          credentials: config.credentials,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
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
      const response = await fetch('/api/payments/pesapal/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          credentials: config.credentials,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
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