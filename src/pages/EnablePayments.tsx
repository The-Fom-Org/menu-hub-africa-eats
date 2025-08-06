import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";

const EnablePayments = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    mpesa: false,
    cards: false,
    cash: true,
    bankTransfer: false
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }
      
      setUser(session.user);
      setIsLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSettingChange = (setting: keyof typeof paymentSettings) => {
    setPaymentSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    toast({
      title: "Settings updated",
      description: "Payment method settings have been saved.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-foreground">Payment Settings</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Payment Methods
          </h2>
          <p className="text-muted-foreground text-lg">
            Enable secure payment options for your customers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* M-Pesa */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>M-Pesa Integration</CardTitle>
                      <CardDescription>Accept mobile money payments</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.mpesa ? "default" : "secondary"}>
                      {paymentSettings.mpesa ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.mpesa}
                      onCheckedChange={() => handleSettingChange('mpesa')}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Enable customers to pay directly through M-Pesa STK Push. Instant, secure, and convenient.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Instant payment confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>No card details required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Popular with Kenyan customers</span>
                  </div>
                  {!paymentSettings.mpesa && (
                    <Button className="w-full mt-4">
                      Setup M-Pesa Integration
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Credit Cards */}
            <Card className="border-l-4 border-l-secondary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <CreditCard className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <CardTitle>Credit & Debit Cards</CardTitle>
                      <CardDescription>Visa, Mastercard, and local cards</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.cards ? "default" : "secondary"}>
                      {paymentSettings.cards ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.cards}
                      onCheckedChange={() => handleSettingChange('cards')}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Accept all major credit and debit cards with secure payment processing.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span>PCI DSS compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>International cards accepted</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>3.5% transaction fee</span>
                  </div>
                  {!paymentSettings.cards && (
                    <Button variant="outline" className="w-full mt-4">
                      Setup Card Payments
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cash Payments */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <CreditCard className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>Cash Payments</CardTitle>
                      <CardDescription>Traditional cash transactions</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.cash ? "default" : "secondary"}>
                      {paymentSettings.cash ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.cash}
                      onCheckedChange={() => handleSettingChange('cash')}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Allow customers to pay with cash when they pick up or receive their order.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>No transaction fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Familiar to all customers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card className="border-l-4 border-l-muted">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/10 rounded-lg">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle>Bank Transfer</CardTitle>
                      <CardDescription>Direct bank account transfers</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.bankTransfer ? "default" : "secondary"}>
                      {paymentSettings.bankTransfer ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.bankTransfer}
                      onCheckedChange={() => handleSettingChange('bankTransfer')}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Accept payments via bank transfer for larger orders.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Low transaction fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Manual verification required</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Current enabled methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(paymentSettings).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {key === 'mpesa' ? 'M-Pesa' : key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
                        {enabled ? "On" : "Off"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
                <p className="mb-4 text-primary-foreground/90">
                  All payment methods are secured with industry-standard encryption
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => window.open('https://docs.stripe.com/security', '_blank')}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  View Security Details
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Payment Setup Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Transaction Fees
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnablePayments;