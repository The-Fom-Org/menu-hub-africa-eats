
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Smartphone, Building, Banknote } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  availableGateways: string[];
  excludeCash?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  setPaymentMethod,
  availableGateways,
  excludeCash = false
}) => {
  const getPaymentMethodConfig = () => {
    const methods = [];
    
    if (!excludeCash) {
      methods.push({
        id: 'cash',
        name: 'Cash',
        description: 'Pay at restaurant',
        icon: <Banknote className="h-5 w-5" />
      });
    }
    
    if (availableGateways.includes('pesapal')) {
      methods.push({
        id: 'pesapal',
        name: 'Card Payment',
        description: 'Visa, Mastercard via Pesapal',
        icon: <CreditCard className="h-5 w-5" />
      });
    }
    
    if (availableGateways.includes('mpesa')) {
      methods.push({
        id: 'mpesa',
        name: 'M-Pesa',
        description: 'Mobile money payment',
        icon: <Smartphone className="h-5 w-5" />
      });
    }
    
    if (availableGateways.includes('bank_transfer')) {
      methods.push({
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        icon: <Building className="h-5 w-5" />
      });
    }
    
    return methods;
  };

  const methods = getPaymentMethodConfig();
  
  if (methods.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">No payment methods configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
      <div className="space-y-3">
        {methods.map((method) => (
          <div key={method.id} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value={method.id} id={method.id} />
            <div className="flex items-center space-x-3 flex-1">
              <div className="text-primary">
                {method.icon}
              </div>
              <div className="flex-1">
                <Label htmlFor={method.id} className="font-medium cursor-pointer">
                  {method.name}
                </Label>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
};

export default PaymentMethodSelector;
