import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Check, RefreshCw, Smartphone, Users, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  managed_by_sales?: boolean;
  billing_method?: string | null;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: 'KES',
    description: 'Perfect for getting started',
    features: [
      'Up to 15 menu items',
      'Mobile-friendly QR code menu',
      'M-Pesa manual payments',
      'Cash payments',
      'Basic restaurant branding',
      'WhatsApp support'
    ],
    limitations: [
      'Limited to 15 menu items',
      'Manual payment verification only',
      'Basic payment methods only'
    ],
    popular: false,
    billing: 'Always free',
    commission: 'No monthly fees'
  },
  {
    id: 'standard',
    name: 'Standard Digital Menu Solution',
    price: 5000,
    currency: 'KES',
    description: 'Perfect for single restaurant locations',
    features: [
      'Unlimited menu items',
      'Mobile-friendly QR code-based menu',
      'Unlimited menu updates (photos, descriptions, prices)',
      'Order-taking via customer phones',
      'M-Pesa & card payment integration (Pesapal)',
      'Bank transfer payments',
      'Restaurant branding (logo, colors)',
      'Basic analytics (menu views, popular items)',
      'WhatsApp support'
    ],
    popular: true,
    commission: 'Monthly commissions'
  },
  {
    id: 'multi_location',
    name: 'Multi-location + Staff Management',
    price: 8000,
    currency: 'KES',
    description: 'For restaurant chains and growing businesses',
    features: [
      'Everything in Standard package',
      'Unlimited menu items',
      'Multi-location management',
      'Separate menus & analytics per branch',
      'Staff accounts & permissions',
      'Order assignment & tracking per waiter/chef',
      'Priority support',
      'Advanced reporting'
    ],
    popular: false,
    commission: 'Monthly commissions'
  }
];

export default function ManageSubscription() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState<string | null>(null);
  const { plan, currentMenuItemCount, maxMenuItems } = useSubscriptionLimits();

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
      const { data, error } = await supabase.functions.invoke('check-subscription-pesapal');
      if (error) throw error;
      let merged: SubscriptionData = data as SubscriptionData;

      const { data: subRow, error: subErr } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end, managed_by_sales, billing_method')
        .eq('restaurant_id', user!.id)
        .maybeSingle();

      if (!subErr && subRow) {
        merged = {
          subscribed: !!subRow.subscribed,
          subscription_tier: subRow.subscription_tier || merged.subscription_tier,
          subscription_end: subRow.subscription_end || merged.subscription_end,
          managed_by_sales: subRow.managed_by_sales,
          billing_method: subRow.billing_method,
        };
      }

      setSubscriptionData(merged);
      console.log('Subscription status (merged):', merged);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({ title: "Error", description: "Failed to load subscription status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, planName: string, amountKES: number) => {
    if (!user) return;
    try {
      setProcessingCheckout(planId);
      
      // Initialize Pesapal payment using MenuHub Africa's credentials
      const orderId = `menuhub_subscription_${planId}_${Date.now()}`;
      const description = `MenuHub Africa - ${planName} Package`;
      
      const { data, error } = await supabase.functions.invoke('pesapal-initialize', {
        body: {
          amount: amountKES,
          currency: 'KES',
          orderId,
          description,
          customerInfo: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Restaurant Owner',
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
          },
          callbackUrl: `${window.location.origin}/manage-subscription?success=true&plan=${planId}`,
          cancelUrl: `${window.location.origin}/manage-subscription?canceled=true`,
          isSubscription: true
        }
      });

      if (error) throw error;

      if (data?.redirect_url) {
        window.open(data.redirect_url, '_blank');
        toast({ 
          title: "Redirecting to Pesapal Payment", 
          description: "Complete your payment in the new tab. Payment goes directly to MenuHub Africa.",
          duration: 5000
        });
      } else {
        throw new Error('Missing redirect URL from Pesapal');
      }
    } catch (error) {
      console.error('Error creating Pesapal payment:', error);
      toast({ 
        title: "Payment Error", 
        description: "Failed to initialize Pesapal checkout. Please try again.", 
        variant: "destructive" 
      });
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

  const isSalesManaged = !!subscriptionData?.managed_by_sales || subscriptionData?.billing_method === 'sales_managed';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Choose Your MenuHub Package</h1>
            <p className="text-muted-foreground mb-6">
               Start free, upgrade when you're ready. Affordable monthly subscriptions. Perfect for Kenyan restaurants.
             
            </p>

            {subscriptionData?.subscribed && (
              <div className="flex items-center justify-center gap-4 mb-6">
                <Badge variant="default" className="px-4 py-2">
                  <Crown className="h-4 w-4 mr-2" />
                  Active Plan: {subscriptionData.subscription_tier}
                  {isSalesManaged && " – Managed by Sales"}
                </Badge>
              </div>
            )}

            {plan === 'free' && maxMenuItems && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-2">Current Usage (Free Plan)</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Menu Items</span>
                  <span className="font-semibold">{currentMenuItemCount}/{maxMenuItems}</span>
                </div>
                <Progress value={(currentMenuItemCount / maxMenuItems) * 100} className="h-2 mt-2" />
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

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PLANS.map((planItem) => {
              const isCurrentPlan = 
                (planItem.id === 'free' && plan === 'free') ||
                subscriptionData?.subscription_tier === planItem.name || 
                subscriptionData?.subscription_tier?.toLowerCase()?.includes(planItem.id);
              const isSubscribed = subscriptionData?.subscribed && isCurrentPlan;

              return (
                <Card
                  key={planItem.id}
                  className={`relative ${planItem.popular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {planItem.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        {planItem.id === 'free' ? 'Current' : 'Active'}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">{planItem.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {planItem.price === 0 ? 'FREE' : `${planItem.currency} ${planItem.price.toLocaleString()}`}
                      <div className="text-sm font-normal text-muted-foreground mt-1">
                        {planItem.billing}
                      </div>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      ✓ {planItem.commission}
                    </div>
                    <CardDescription className="mt-2">
                      {planItem.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Separator className="mb-4" />
                    <ul className="space-y-3 mb-6">
                      {planItem.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {planItem.limitations && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Limitations:</h4>
                        <ul className="space-y-2">
                          {planItem.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "secondary" : "default"}
                      size="lg"
                      disabled={planItem.id === 'free' ? isCurrentPlan : true}
                      onClick={() => {}}
                    >
                      {planItem.id === 'free' ? (
                        isCurrentPlan ? "Current Plan" : "Start Free"
                      ) : isSalesManaged ? (
                        "Managed by Sales"
                      ) : isSubscribed ? (
                        "Current Package"
                      ) : (
                        "Contact Sales"
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {planItem.id === 'free' ? 
                        "No credit card required" : 
                        isSalesManaged ? 
                          "This subscription is managed by our sales team." : 
                          "Contact our sales team to activate your plan."
                      }
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Payment Methods */}
          <div className="text-center mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Billing</h3>
            <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span>Managed by Sales (offline billing)</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Billing handled outside the system (bank transfer, invoice, M-Pesa, Stripe invoice, etc.). Your plan and features are reflected here.
            </p>
          </div>

          {/* Why Choose MenuHub */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-6">Why Choose MenuHub Africa?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-2">Start Free</h4>
                <p className="text-sm text-muted-foreground">Try our service with up to 15 menu items. Upgrade when you're ready to grow.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-2">M-Pesa Ready</h4>
                <p className="text-sm text-muted-foreground">Built for Kenya. Accept M-Pesa and card payments seamlessly.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-2">Local Support</h4>
                <p className="text-sm text-muted-foreground">Kenyan-based support team that understands your business needs.</p>
              </div>
            </div>
          </div>

          {subscriptionData?.subscription_end && (
            <div className="text-center mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your package was activated on{' '}
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
