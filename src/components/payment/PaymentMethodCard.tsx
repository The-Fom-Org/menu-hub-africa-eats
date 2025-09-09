import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface PaymentMethodCardProps {
  method: string;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  currency: string;
  customerName: string;
  orderReference: string;
  timestamp: string;
  onConfirmPayment: () => void;
}

export function PaymentMethodCard({
  method,
  status,
  amount,
  currency,
  customerName,
  orderReference,
  timestamp,
  onConfirmPayment
}: PaymentMethodCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-medium">{customerName}</h4>
            <p className="text-sm text-muted-foreground">Ref: {orderReference}</p>
          </div>
          <Badge className={getStatusColor()}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="capitalize">{status}</span>
            </div>
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">{currency} {amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method:</span>
            <span className="capitalize">{method.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span>{new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>
        
        {status === 'pending' && (
          <button
            onClick={onConfirmPayment}
            className="w-full mt-3 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Confirm Payment Received
          </button>
        )}
      </CardContent>
    </Card>
  );
}