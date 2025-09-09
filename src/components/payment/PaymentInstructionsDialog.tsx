import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Clock, Smartphone, Building2, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PaymentInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: string;
  paymentSettings: any;
  orderDetails: {
    orderId: string;
    amount: number;
    currency: string;
    customerName: string;
  };
  onPaymentConfirmed: () => void;
}

export function PaymentInstructionsDialog({
  open,
  onOpenChange,
  paymentMethod,
  paymentSettings,
  orderDetails,
  onPaymentConfirmed
}: PaymentInstructionsDialogProps) {
  const { toast } = useToast();
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied to clipboard`,
    });
  };

  const handleConfirmPayment = () => {
    setPaymentConfirmed(true);
    onPaymentConfirmed();
    toast({
      title: "Payment confirmation received",
      description: "We'll verify your payment and update your order status shortly.",
    });
  };

  const renderMpesaInstructions = () => {
    const mpesaSettings = paymentSettings?.payment_methods?.mpesa_manual;
    if (!mpesaSettings?.enabled) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <Smartphone className="h-5 w-5" />
          <h3 className="font-semibold">M-Pesa Payment Instructions</h3>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="text-sm text-muted-foreground">
            Follow these steps to complete your payment:
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Amount:</span>
              <span className="text-lg font-bold text-green-600">
                {orderDetails.currency} {orderDetails.amount}
              </span>
            </div>
            
            {mpesaSettings.till_number && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Till Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">{mpesaSettings.till_number}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(mpesaSettings.till_number, "Till Number")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {mpesaSettings.paybill_number && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Paybill:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg">{mpesaSettings.paybill_number}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(mpesaSettings.paybill_number, "Paybill Number")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {mpesaSettings.account_number && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Account:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">{mpesaSettings.account_number}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(mpesaSettings.account_number, "Account Number")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Reference:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg">{orderDetails.orderId.slice(-8).toUpperCase()}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(orderDetails.orderId.slice(-8).toUpperCase(), "Reference")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Instructions:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Go to M-Pesa on your phone</li>
              <li>Select "Pay Bill" {mpesaSettings.till_number ? 'or "Buy Goods & Services"' : ''}</li>
              <li>Enter the {mpesaSettings.paybill_number ? 'Paybill' : 'Till'} number above</li>
              {mpesaSettings.account_number && <li>Enter the Account number</li>}
              <li>Enter the amount: {orderDetails.currency} {orderDetails.amount}</li>
              <li>Use the reference number above</li>
              <li>Enter your M-Pesa PIN and confirm</li>
            </ol>
          </div>
        </div>
      </div>
    );
  };

  const renderBankTransferInstructions = () => {
    const bankSettings = paymentSettings?.payment_methods?.bank_transfer;
    if (!bankSettings?.enabled) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
          <Building2 className="h-5 w-5" />
          <h3 className="font-semibold">Bank Transfer Instructions</h3>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Amount:</span>
              <span className="text-lg font-bold text-blue-600">
                {orderDetails.currency} {orderDetails.amount}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Bank:</span>
              <span className="font-medium">{bankSettings.bank_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Account Name:</span>
              <span className="font-medium">{bankSettings.account_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Account Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg">{bankSettings.account_number}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankSettings.account_number, "Account Number")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Reference:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg">{orderDetails.orderId.slice(-8).toUpperCase()}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(orderDetails.orderId.slice(-8).toUpperCase(), "Reference")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Instructions:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Log into your online banking or visit your bank</li>
              <li>Transfer the exact amount to the account details above</li>
              <li>Use the reference number provided</li>
              <li>Keep your transaction receipt</li>
              <li>Your order will be confirmed once payment is received (usually within 1-2 hours)</li>
            </ol>
          </div>
        </div>
      </div>
    );
  };

  const renderCashInstructions = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <Banknote className="h-5 w-5" />
          <h3 className="font-semibold">Cash Payment</h3>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Amount to Pay:</span>
            <span className="text-lg font-bold text-green-600">
              {orderDetails.currency} {orderDetails.amount}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Order Reference:</span>
            <span className="font-mono text-lg">{orderDetails.orderId.slice(-8).toUpperCase()}</span>
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-800">
            <strong>Instructions:</strong>
            <p className="mt-2">
              Please have the exact amount ready when collecting your order. 
              Quote your order reference number to the cashier.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Complete Your Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {paymentMethod === 'mpesa_manual' && renderMpesaInstructions()}
          {paymentMethod === 'bank_transfer' && renderBankTransferInstructions()}
          {paymentMethod === 'cash' && renderCashInstructions()}
          
          {!paymentConfirmed && paymentMethod !== 'cash' && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handleConfirmPayment}
                className="w-full"
                variant="default"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I have completed the payment
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Only click this after you've made the payment. We'll verify and update your order status.
              </p>
            </div>
          )}
          
          {paymentConfirmed && (
            <div className="pt-4 border-t">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">Payment confirmation received!</p>
                <p className="text-sm text-green-600 mt-1">
                  We'll verify your payment and update your order status shortly.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}