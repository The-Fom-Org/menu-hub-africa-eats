import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderToken = searchParams.get('token');
  const restaurantId = searchParams.get('restaurantId');
  const errorMessage = searchParams.get('error') || 'Payment could not be processed';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(restaurantId ? `/menu/${restaurantId}` : '/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
            <h1 className="text-2xl font-bold">Payment Failed</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">
              Payment Failed
            </CardTitle>
            <p className="text-muted-foreground">
              We couldn't process your payment. Please try again.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {errorMessage}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-medium">Common reasons for payment failure:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Insufficient funds in your account</li>
                <li>• Network connectivity issues</li>
                <li>• Incorrect payment details</li>
                <li>• Transaction timeout</li>
                <li>• Bank or M-Pesa system maintenance</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">What you can do:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Check your account balance</li>
                <li>• Ensure you have a stable internet connection</li>
                <li>• Try a different payment method</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Button 
                onClick={() => navigate(`/checkout?restaurantId=${restaurantId}`)}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate(restaurantId ? `/menu/${restaurantId}` : '/')}
                className="w-full"
              >
                Back to Menu
              </Button>
            </div>

            {orderToken && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Order Reference: {orderToken.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  If you continue to have issues, please contact the restaurant with this reference number.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentFailure;