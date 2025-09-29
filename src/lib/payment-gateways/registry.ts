// Simple registry that doesn't use the complex PaymentGateway interface
class SimplePaymentRegistry {
  private availableGateways = ['pesapal', 'mpesa_daraja', 'mpesa_manual', 'bank_transfer', 'cash'];

  getAvailable(): string[] {
    return this.availableGateways;
  }
}

export const paymentGatewayRegistry = new SimplePaymentRegistry();