import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentStatus, PaymentGatewayConfig } from './types';

export class MPesaManualGateway implements PaymentGateway {
  name = 'M-Pesa Manual';
  type = 'mpesa_manual';
  requiresCredentials = false;
  supportedMethods = ['M-Pesa Till', 'M-Pesa Paybill'];

  getCredentialFields() {
    return [
      { name: 'till_number', label: 'Till Number (optional)', type: 'text', required: false },
      { name: 'paybill_number', label: 'Paybill Number (optional)', type: 'text', required: false },
      { name: 'account_number', label: 'Account Number (for Paybill)', type: 'text', required: false },
    ];
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    // For manual payments, we just return instructions - no actual payment URL
    return {
      success: true,
      transactionId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Manual payment instructions will be shown to customer',
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentStatus> {
    // Manual verification - always returns pending until manually confirmed
    return {
      transactionId,
      status: 'pending',
    };
  }
}

export class BankTransferGateway implements PaymentGateway {
  name = 'Bank Transfer';
  type = 'bank_transfer';
  requiresCredentials = false;
  supportedMethods = ['Bank Transfer'];

  getCredentialFields() {
    return [
      { name: 'bank_name', label: 'Bank Name', type: 'text', required: true },
      { name: 'account_number', label: 'Account Number', type: 'text', required: true },
      { name: 'account_name', label: 'Account Name', type: 'text', required: true },
    ];
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Bank transfer instructions will be shown to customer',
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentStatus> {
    return {
      transactionId,
      status: 'pending',
    };
  }
}

export class CashGateway implements PaymentGateway {
  name = 'Cash Payment';
  type = 'cash';
  requiresCredentials = false;
  supportedMethods = ['Cash'];

  getCredentialFields() {
    return [];
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId: `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Cash payment on delivery/pickup',
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentStatus> {
    return {
      transactionId,
      status: 'pending',
    };
  }
}