
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Check, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

const PLANS = [
  { name: 'Basic', price: 9.99, features: ['Digital Menu for 1 Restaurant','Basic QR Code Generation','Up to 50 Menu Items','Email Support'], popular: false },
  { name: 'Premium', price: 19.99, features: ['Digital Menu for Up to 3 Restaurants','Custom Branding & Colors','Unlimited Menu Items','Order Management','Analytics Dashboard','Priority Support'], popular: true },
  { name: 'Enterprise', price: 39.99, features: ['Unlimited Restaurants','White-label Solution','Advanced Analytics','API Access','Custom Integrations','Dedicated Account Manager','24/7 Phone Support'], popular: false }
];

export default function ManageSubscription() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user, authLoading, navigate]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      // Use PESAPAL-based status check (no Stripe)
      const { data, error } = await supabase.functions.invoke('check-subscription-pesapal');
      if (error) throw error;
      setSubscriptionData(data as SubscriptionData);
      console.log('Subscription status (Pesapal):', data);
    } catch (error) {
      console.error('Error checking subscription (Pesapal):', error);
      toast({ title: "Error", description: "Failed to load subscription status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string, amountUSD: number) => {
    if (!user) return;
    try {
      setProcessingCheckout(planName);
      // Initialize Pesapal subscription payment using Edge Function (uses MenuHub credentials via secrets)
      const orderId = `subscription_${planName.toLowerCase()}_${Date.now()}`;
      const description = `MenuHub ${planName} Plan Subscription`;
      const { data, error } = await supabase.functions.invoke('pesapal-initialize', {
        body: {
          amount: amountUSD,             // keep USD to match UI pricing
          currency: 'USD',
          orderId,
          description,
          customerInfo: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
            email: user.email || '',
            phone: ''
          },
          callbackUrl: `${window.location.origin}/manage-subscription?success=true`,
          cancelUrl: `${window.location.origin}/manage-subscription?canceled=true`,
          isSubscription: true
        }
      });

      if (error) throw error;

      if (data?.redirect_url) {
        window.open(data.redirect_url, '_blank');
        toast({ title: "Redirecting to Pesapal", description: "Complete your subscription in the new tab" });
      } else {
        throw new Error('Missing redirect URL from Pesapal');
      }
    } catch (error) {
      console.error('Error creating Pesapal subscription:', error);
      toast({ title: "Error", description: "Failed to start Pesapal checkout", variant: "destructive" });
    } finally {
      setProcessingCheckout(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Manage Your Subscription</h1>
            <p className="text-muted-foreground mb-6">
              Choose the perfect plan for your restaurant business
            </p>

            {subscriptionData?.subscribed && (
              <div className="flex items-center justify-center gap-4 mb-6">
                <Badge variant="default" className="px-4 py-2">
                  <Crown className="h-4 w-4 mr-2" />
                  Current Plan: {subscriptionData.subscription_tier}
                </Badge>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={checkSubscriptionStatus}
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = subscriptionData?.subscription_tier === plan.name;
              const isSubscribed = subscriptionData?.subscribed && isCurrentPlan;

              return (
                <Card
                  key={plan.name}
                  className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                    <CardDescription>
                      Perfect for {plan.name.toLowerCase()} restaurant needs
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Separator className="mb-4" />
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "secondary" : "default"}
                      disabled={isSubscribed || processingCheckout === plan.name}
                      onClick={() => handleSubscribe(plan.name, plan.price)}
                    >
                      {processingCheckout === plan.name ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isSubscribed ? (
                        'Current Plan'
                      ) : isCurrentPlan ? (
                        'Manage via Pesapal'
                      ) : (
                        'Subscribe with Pesapal'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {subscriptionData?.subscription_end && (
            <div className="text-center mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your subscription renews on{' '}
                <span className="font-medium">
                  {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
