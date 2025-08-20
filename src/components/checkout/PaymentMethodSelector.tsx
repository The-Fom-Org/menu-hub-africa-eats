
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Smartphone, Building, DollarSign } from 'lucide-react';

interface PaymentGatewayWithCredentials {
  type: string;
  name: string;
  requiresCredentials: boolean;
  supportedMethods: string[];
  credentials?: any;
}

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  availableGateways: PaymentGatewayWithCredentials[];
}

export const PaymentMethodSelector = ({ 
  paymentMethod, 
  setPaymentMethod, 
  availableGateways 
}: PaymentMethodSelectorProps) => {
  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'mpesa_manual':
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case 'pesapal':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentInstructions = (gateway: PaymentGatewayWithCredentials) => {
    console.log('Getting payment instructions for gateway:', gateway);
    
    switch (gateway.type) {
      case 'mpesa_manual':
        const hasCredentials = gateway.credentials && (gateway.credentials.till_number || gateway.credentials.paybill_number);
        
        return (
          <div className="mt-2 space-y-2 text-sm">
            {gateway.credentials?.till_number && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800">M-Pesa Till Number</p>
                <p className="text-lg font-mono text-green-900">{gateway.credentials.till_number}</p>
                <p className="text-xs text-green-700 mt-1">
                  📱 Go to M-Pesa → Lipa na M-Pesa → Buy Goods and Services → Enter Till Number
                </p>
              </div>
            )}
            
            {gateway.credentials?.paybill_number && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800">M-Pesa Paybill</p>
                <p className="text-lg font-mono text-green-900">{gateway.credentials.paybill_number}</p>
                {gateway.credentials?.account_number && (
                  <p className="text-sm text-green-800 mt-1">
                    Account: <span className="font-mono">{gateway.credentials.account_number}</span>
                  </p>
                )}
                <p className="text-xs text-green-700 mt-1">
                  📱 Go to M-Pesa → Lipa na M-Pesa → Pay Bill → Enter Paybill Number
                </p>
              </div>
            )}
            
            {!hasCredentials && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">💳 M-Pesa Payment Available</p>
                <p className="text-blue-700 text-sm mt-1">
                  The restaurant accepts M-Pesa payments. Payment details will be provided after you place your order.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  📞 The restaurant will contact you with M-Pesa payment instructions.
                </p>
              </div>
            )}
            
            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-yellow-800 text-xs">
                💡 <strong>Important:</strong> After sending payment, please keep your M-Pesa confirmation message and inform the restaurant.
              </p>
            </div>
          </div>
        );
        
      case 'bank_transfer':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {gateway.credentials?.bank_name && (
              <p><strong>Bank:</strong> {gateway.credentials.bank_name}</p>
            )}
            {gateway.credentials?.account_number && (
              <p><strong>Account Number:</strong> <span className="font-mono">{gateway.credentials.account_number}</span></p>
            )}
            {gateway.credentials?.account_name && (
              <p><strong>Account Name:</strong> {gateway.credentials.account_name}</p>
            )}
            <p className="text-muted-foreground">Transfer funds and share receipt with restaurant</p>
          </div>
        );
        
      case 'cash':
        return (
          <div className="mt-2">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800 font-medium">💵 Cash Payment</p>
              <p className="text-gray-700 text-sm mt-1">
                Pay with cash when you collect your order or dine in.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Please have the exact amount ready for faster service.
              </p>
            </div>
          </div>
        );
        
      case 'pesapal':
        return (
          <div className="mt-2">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium">🔒 Secure Online Payment</p>
              <p className="text-blue-700 text-sm mt-1">
                Pay securely online using M-Pesa, Credit/Debit Card, or Bank transfer via Pesapal.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                You'll be redirected to Pesapal's secure payment page to complete your payment.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (availableGateways.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-800">Loading payment methods...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={paymentMethod} 
          onValueChange={(value) => {
            console.log('Payment method changed to:', value);
            setPaymentMethod(value);
          }}
          className="space-y-4"
        >
          {availableGateways.map((gateway) => (
            <div key={gateway.type} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={gateway.type} 
                  id={gateway.type}
                  checked={paymentMethod === gateway.type}
                />
                <Label htmlFor={gateway.type} className="flex items-center gap-2 cursor-pointer">
                  {getPaymentIcon(gateway.type)}
                  {gateway.name}
                </Label>
              </div>
              
              {paymentMethod === gateway.type && (
                <Alert className="ml-6">
                  <AlertDescription>
                    {getPaymentInstructions(gateway)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
