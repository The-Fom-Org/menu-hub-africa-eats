import { PaymentGateway } from './types';
import { PesapalGateway } from './pesapal';
import { MPesaManualGateway, BankTransferGateway, CashGateway } from './manual';

// Payment Gateway Registry
class PaymentGatewayRegistry {
  private gateways: Map<string, PaymentGateway> = new Map();

  constructor() {
    // Register available gateways
    this.register(new PesapalGateway());
    this.register(new MPesaManualGateway());
    this.register(new BankTransferGateway());
    this.register(new CashGateway());
  }

  register(gateway: PaymentGateway) {
    this.gateways.set(gateway.type, gateway);
  }

  get(type: string): PaymentGateway | undefined {
    return this.gateways.get(type);
  }

  getAll(): PaymentGateway[] {
    return Array.from(this.gateways.values());
  }

  getAvailable(): PaymentGateway[] {
    // Return all gateways - in future we can filter based on availability
    return this.getAll();
  }
}

export const paymentGatewayRegistry = new PaymentGatewayRegistry();