
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, 
  QrCode, 
  Palette, 
  CreditCard, 
  BarChart3, 
  Crown,
  RefreshCw,
  ArrowRight,
  Settings
} from "lucide-react";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  managed_by_sales?: boolean;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user, loading, navigate]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      setCheckingSubscription(true);
      
      // Check subscription status from subscribers table
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end, managed_by_sales')
        .eq('restaurant_id', user.id)
        .maybeSingle();

      if (!subError && subData) {
        setSubscriptionData({
          subscribed: !!subData.subscribed,
          subscription_tier: subData.subscription_tier,
          subscription_end: subData.subscription_end,
          managed_by_sales: subData.managed_by_sales
        });
      } else {
        // No subscription record found
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          managed_by_sales: false
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        managed_by_sales: false
      });
    } finally {
      setCheckingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasSubscriptionAccess = subscriptionData?.subscribed || subscriptionData?.managed_by_sales;

  const dashboardItems = [
    {
      title: "Digital Menu",
      description: "View and share your restaurant's digital menu",
      icon: Menu,
      href: "/digital-menu",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      available: true
    },
    {
      title: "Edit Menu",
      description: "Add, edit, or remove menu items and categories",
      icon: Settings,
      href: "/edit-menu",
      color: "text-green-600",
      bgColor: "bg-green-50",
      available: true
    },
    {
      title: "QR Code",
      description: "Generate and download QR codes for your menu",
      icon: QrCode,
      href: "/qr-code",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      available: true
    },
    {
      title: "Custom Branding",
      description: "Customize your menu's appearance and branding",
      icon: Palette,
      href: "/custom-branding",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      available: true
    },
    {
      title: "Enable Payments",
      description: "Set up payment methods for online orders",
      icon: CreditCard,
      href: "/enable-payments",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      available: true
    },
    {
      title: "Analytics",
      description: "View insights about your menu performance",
      icon: BarChart3,
      href: "/analytics",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      available: true
    },
    {
      title: "Manage Subscription",
      description: "View and manage your subscription plan",
      icon: Crown,
      href: "/manage-subscription",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      available: hasSubscriptionAccess
    }
  ];

  const availableItems = dashboardItems.filter(item => item.available);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Manage your restaurant's digital presence.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {subscriptionData && (
                <div className="text-right">
                  {hasSubscriptionAccess ? (
                    <Badge variant="default" className="mb-1">
                      <Crown className="h-3 w-3 mr-1" />
                      {subscriptionData.subscription_tier || 'Active'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mb-1">
                      Free Plan
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkSubscriptionStatus}
                    disabled={checkingSubscription}
                    className="text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${checkingSubscription ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={item.title} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(item.href)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${item.bgColor}`}>
                        <Icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!hasSubscriptionAccess && (
            <Card className="mt-8 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  Unlock Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Contact our sales team to unlock premium features including subscription management, 
                  advanced analytics, and priority support.
                </p>
                <Button variant="outline" onClick={() => navigate("/contact")}>
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Need help? Check our documentation or contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
