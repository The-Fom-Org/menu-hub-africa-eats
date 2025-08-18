
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Smartphone, Building, DollarSign, CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

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
        const totalAmount = gateway.credentials?.totalAmount || 0;
        return (
          <div className="mt-3 space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 font-medium">
              <Smartphone className="h-4 w-4" />
              M-Pesa Payment Instructions
            </div>
            
            {/* Amount to Pay */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-800">Amount to Pay:</div>
              <div className="bg-white p-3 rounded border border-green-300 flex items-center justify-between">
                <div className="text-xl font-bold text-green-900">KSh {totalAmount.toFixed(2)}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(totalAmount.toString(), 'Amount')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {gateway.credentials?.till_number && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-green-800">Pay to Till Number:</div>
                <div className="bg-white p-3 rounded border border-green-300 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-900">{gateway.credentials.till_number}</div>
                    <div className="text-xs text-green-700 mt-1">Enter this Till Number in your M-Pesa</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(gateway.credentials.till_number, 'Till Number')}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            
            {gateway.credentials?.paybill_number && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-green-800">Pay to Paybill:</div>
                <div className="bg-white p-3 rounded border border-green-300">
                  <div className="flex items-center justify-between">
                    <div><strong>Paybill:</strong> {gateway.credentials.paybill_number}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(gateway.credentials.paybill_number, 'Paybill')}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {gateway.credentials?.account_number && (
                    <div className="flex items-center justify-between mt-1">
                      <div><strong>Account:</strong> {gateway.credentials.account_number}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(gateway.credentials.account_number, 'Account Number')}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-white p-3 rounded border border-green-300">
              <div className="text-sm font-medium text-green-800 mb-2">How to Pay:</div>
              <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
                <li>Go to M-Pesa on your phone</li>
                <li>Select "Lipa na M-Pesa"</li>
                <li>Select "Pay Bill" {gateway.credentials?.till_number && 'or "Buy Goods and Services"'}</li>
                <li>Enter the {gateway.credentials?.paybill_number ? 'Paybill' : 'Till'} number above</li>
                {gateway.credentials?.account_number && <li>Enter the Account number</li>}
                <li>Enter the exact amount: <strong>KSh {totalAmount.toFixed(2)}</strong></li>
                <li>Enter your M-Pesa PIN</li>
                <li>Wait for confirmation SMS</li>
              </ol>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-green-700">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>After payment, you'll receive an M-Pesa confirmation message. Please keep this for your records and show it to the restaurant if requested.</span>
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
                <div className="ml-6">
                  {getPaymentInstructions(gateway)}
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
