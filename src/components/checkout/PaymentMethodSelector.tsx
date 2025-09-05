
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Smartphone, Building, Banknote } from 'lucide-react';

interface PaymentGateway {
  type: string;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  availableGateways: PaymentGateway[];
  excludeCash?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  setPaymentMethod,
  availableGateways,
  excludeCash = false
}) => {
  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      description: 'Pay with M-Pesa mobile money',
      icon: <Smartphone className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, Mastercard, or other cards',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: <Building className="h-5 w-5" />,
      enabled: true
    }
  ];

  if (!excludeCash) {
    paymentMethods.push({
      id: 'cash',
      name: 'Cash',
      description: 'Pay with cash on delivery/pickup',
      icon: <Banknote className="h-5 w-5" />,
      enabled: true
    });
  }

  const enabledMethods = paymentMethods.filter(method => method.enabled);

  if (enabledMethods.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">No payment methods available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
      <div className="space-y-3">
        {enabledMethods.map((method) => (
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
