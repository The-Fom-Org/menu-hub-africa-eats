// Payment Gateway Types and Interfaces

export interface PaymentGatewayConfig {
  type: 'pesapal' | 'mpesa_manual' | 'bank_transfer' | 'cash';
  credentials?: Record<string, string>;
  settings?: Record<string, any>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  callbackUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  message?: string;
  error?: string;
}

export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount?: number;
  currency?: string;
  paidAt?: Date;
  gatewayReference?: string;
}

export interface PaymentGateway {
  name: string;
  type: string;
  requiresCredentials: boolean;
  supportedMethods: string[];
  initializePayment(request: PaymentRequest, config: PaymentGatewayConfig): Promise<PaymentResponse>;
  verifyPayment(transactionId: string, config: PaymentGatewayConfig): Promise<PaymentStatus>;
  getCredentialFields(): { name: string; label: string; type: string; required: boolean }[];
}

export interface RestaurantPaymentSettings {
  id: string;
  restaurant_id: string;
  payment_methods: {
    pesapal?: {
      enabled: boolean;
      consumer_key?: string;
      consumer_secret?: string;
    };
    mpesa_manual?: {
      enabled: boolean;
      till_number?: string;
      paybill_number?: string;
      account_number?: string;
    };
    bank_transfer?: {
      enabled: boolean;
      bank_name?: string;
      account_number?: string;
      account_name?: string;
    };
    cash?: {
      enabled: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}