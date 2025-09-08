// Simple registry that doesn't use the complex PaymentGateway interface
class SimplePaymentRegistry {
  private availableGateways = ['pesapal', 'mpesa', 'bank_transfer', 'cash'];

  getAvailable(): string[] {
    return this.availableGateways;
  }
}

export const paymentGatewayRegistry = new SimplePaymentRegistry();