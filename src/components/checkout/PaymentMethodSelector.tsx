
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
        return (
          <div className="mt-2 space-y-1 text-sm">
            {gateway.credentials?.till_number && (
              <p><strong>Till Number:</strong> {gateway.credentials.till_number}</p>
            )}
            {gateway.credentials?.paybill_number && (
              <p><strong>Paybill:</strong> {gateway.credentials.paybill_number}</p>
            )}
            {gateway.credentials?.account_number && (
              <p><strong>Account:</strong> {gateway.credentials.account_number}</p>
            )}
            <p className="text-muted-foreground">Send payment and confirm with the restaurant</p>
          </div>
        );
      case 'bank_transfer':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {gateway.credentials?.bank_name && (
              <p><strong>Bank:</strong> {gateway.credentials.bank_name}</p>
            )}
            {gateway.credentials?.account_number && (
              <p><strong>Account Number:</strong> {gateway.credentials.account_number}</p>
            )}
            {gateway.credentials?.account_name && (
              <p><strong>Account Name:</strong> {gateway.credentials.account_name}</p>
            )}
            <p className="text-muted-foreground">Transfer funds and share receipt with restaurant</p>
          </div>
        );
      case 'cash':
        return (
          <p className="mt-2 text-sm text-muted-foreground">
            Pay with cash upon delivery or pickup
          </p>
        );
      case 'pesapal':
        return (
          <p className="mt-2 text-sm text-muted-foreground">
            Secure online payment via Pesapal (M-Pesa, Card, Bank)
          </p>
        );
      default:
        return null;
    }
  };

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
          onValueChange={setPaymentMethod}
          className="space-y-4"
        >
          {availableGateways.map((gateway) => (
            <div key={gateway.type} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={gateway.type} id={gateway.type} />
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
