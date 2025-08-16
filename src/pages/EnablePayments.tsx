
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Smartphone, Shield, CheckCircle, AlertCircle, Building, Banknote, ExternalLink, Info } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentSettings {
  pesapal?: {
    enabled: boolean;
    consumer_key?: string;
    consumer_secret?: string;
  };
  mpesa_manual?: {
    enabled: boolean;
    till_number?: string;
    paybill_number?: string;
    account_number?: string;
  };
  bank_transfer?: {
    enabled: boolean;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  };
  cash?: {
    enabled: boolean;
  };
}

const EnablePayments = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    pesapal: { enabled: false },
    mpesa_manual: { enabled: false },
    bank_transfer: { enabled: false },
    cash: { enabled: true }
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }
      
      setUser(session.user);
      await loadPaymentSettings(session.user.id);
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

  const loadPaymentSettings = async (userId: string) => {
    try {
      // Use type assertion to work around missing types
      const { data, error } = await (supabase as any)
        .from('restaurant_payment_settings')
        .select('payment_methods')
        .eq('restaurant_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading payment settings:', error);
        return;
      }

      if (data?.payment_methods) {
        setPaymentSettings(data.payment_methods as PaymentSettings);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const handleSettingChange = (gateway: keyof PaymentSettings, field: string, value: any) => {
    setPaymentSettings(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [field]: value
      }
    }));
  };

  const savePaymentSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Use type assertion to work around missing types
      const { error } = await (supabase as any)
        .from('restaurant_payment_settings')
        .upsert({
          restaurant_id: user.id,
          payment_methods: paymentSettings
        }, {
          onConflict: 'restaurant_id'
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Payment method settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
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
              <Button 
                onClick={savePaymentSettings}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
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
            {/* Pesapal Integration */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Pesapal Integration</CardTitle>
                      <CardDescription>Accept M-Pesa, cards & bank payments</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.pesapal?.enabled ? "default" : "secondary"}>
                      {paymentSettings.pesapal?.enabled ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.pesapal?.enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('pesapal', 'enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Enable automated payments through Pesapal. Accept M-Pesa, cards, and bank transfers with instant confirmation.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Instant payment confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>M-Pesa, Cards & Bank transfers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Requires Pesapal business account</span>
                  </div>
                  
                  {!paymentSettings.pesapal?.enabled && (
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>How to get Pesapal credentials:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                          <li>Visit <a href="https://www.pesapal.com/business" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">pesapal.com/business</a> and create a business account</li>
                          <li>Complete your business verification (usually takes 1-2 business days)</li>
                          <li>Once approved, log into your Pesapal dashboard</li>
                          <li>Go to "API Keys" or "Integration" section</li>
                          <li>Generate your Consumer Key and Consumer Secret</li>
                          <li>Copy these credentials and paste them below</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {paymentSettings.pesapal?.enabled && (
                    <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Pesapal Credentials</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor="consumer_key">Consumer Key</Label>
                          <Input
                            id="consumer_key"
                            type="text"
                            value={paymentSettings.pesapal?.consumer_key || ''}
                            onChange={(e) => handleSettingChange('pesapal', 'consumer_key', e.target.value)}
                            placeholder="Your Pesapal Consumer Key"
                          />
                        </div>
                        <div>
                          <Label htmlFor="consumer_secret">Consumer Secret</Label>
                          <Input
                            id="consumer_secret"
                            type="password"
                            value={paymentSettings.pesapal?.consumer_secret || ''}
                            onChange={(e) => handleSettingChange('pesapal', 'consumer_secret', e.target.value)}
                            placeholder="Your Pesapal Consumer Secret"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 Don't forget to click "Save Settings" after entering your credentials
                      </p>
                    </div>
                  )}
                  
                  {!paymentSettings.pesapal?.enabled && (
                    <Button 
                      className="w-full mt-4"
                      onClick={() => window.open('https://www.pesapal.com/business', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Setup Pesapal Account
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* M-Pesa Manual */}
            <Card className="border-l-4 border-l-secondary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Smartphone className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <CardTitle>M-Pesa Till/Paybill</CardTitle>
                      <CardDescription>Manual M-Pesa payments</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.mpesa_manual?.enabled ? "default" : "secondary"}>
                      {paymentSettings.mpesa_manual?.enabled ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.mpesa_manual?.enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('mpesa_manual', 'enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Accept M-Pesa payments through your Till number or Paybill. Requires manual verification.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Manual payment verification required</span>
                  </div>
                  
                  {paymentSettings.mpesa_manual?.enabled && (
                    <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">M-Pesa Details</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor="till_number">Till Number (optional)</Label>
                          <Input
                            id="till_number"
                            type="text"
                            value={paymentSettings.mpesa_manual?.till_number || ''}
                            onChange={(e) => handleSettingChange('mpesa_manual', 'till_number', e.target.value)}
                            placeholder="e.g., 123456"
                          />
                        </div>
                        <div>
                          <Label htmlFor="paybill_number">Paybill Number (optional)</Label>
                          <Input
                            id="paybill_number"
                            type="text"
                            value={paymentSettings.mpesa_manual?.paybill_number || ''}
                            onChange={(e) => handleSettingChange('mpesa_manual', 'paybill_number', e.target.value)}
                            placeholder="e.g., 400200"
                          />
                        </div>
                        {paymentSettings.mpesa_manual?.paybill_number && (
                          <div>
                            <Label htmlFor="account_number">Account Number</Label>
                            <Input
                              id="account_number"
                              type="text"
                              value={paymentSettings.mpesa_manual?.account_number || ''}
                              onChange={(e) => handleSettingChange('mpesa_manual', 'account_number', e.target.value)}
                              placeholder="Account number for Paybill"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 These details will be shown to customers at checkout. Don't forget to click "Save Settings"
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Building className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>Bank Transfer</CardTitle>
                      <CardDescription>Direct bank account transfers</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.bank_transfer?.enabled ? "default" : "secondary"}>
                      {paymentSettings.bank_transfer?.enabled ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.bank_transfer?.enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('bank_transfer', 'enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Accept payments via bank transfer for larger orders. Requires manual verification.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Low transaction fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Manual verification required</span>
                  </div>
                  
                  {paymentSettings.bank_transfer?.enabled && (
                    <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Bank Account Details</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor="bank_name">Bank Name</Label>
                          <Input
                            id="bank_name"
                            type="text"
                            value={paymentSettings.bank_transfer?.bank_name || ''}
                            onChange={(e) => handleSettingChange('bank_transfer', 'bank_name', e.target.value)}
                            placeholder="e.g., Equity Bank"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bank_account_number">Account Number</Label>
                          <Input
                            id="bank_account_number"
                            type="text"
                            value={paymentSettings.bank_transfer?.account_number || ''}
                            onChange={(e) => handleSettingChange('bank_transfer', 'account_number', e.target.value)}
                            placeholder="Your bank account number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="account_name">Account Name</Label>
                          <Input
                            id="account_name"
                            type="text"
                            value={paymentSettings.bank_transfer?.account_name || ''}
                            onChange={(e) => handleSettingChange('bank_transfer', 'account_name', e.target.value)}
                            placeholder="Account holder name"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 These details will be shown to customers at checkout. Don't forget to click "Save Settings"
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cash Payments */}
            <Card className="border-l-4 border-l-muted">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/10 rounded-lg">
                      <Banknote className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle>Cash Payments</CardTitle>
                      <CardDescription>Traditional cash transactions</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.cash?.enabled ? "default" : "secondary"}>
                      {paymentSettings.cash?.enabled ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.cash?.enabled || false}
                      onCheckedChange={(checked) => handleSettingChange('cash', 'enabled', checked)}
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
                  {Object.entries(paymentSettings).map(([key, settings]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {key === 'pesapal' ? 'Pesapal' : 
                         key === 'mpesa_manual' ? 'M-Pesa Manual' :
                         key === 'bank_transfer' ? 'Bank Transfer' :
                         key === 'cash' ? 'Cash' : 
                         key.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={settings?.enabled ? "default" : "secondary"} className="text-xs">
                        {settings?.enabled ? "On" : "Off"}
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
                  onClick={() => window.open('https://www.pesapal.com/security', '_blank')}
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('https://www.pesapal.com/developers', '_blank')}
                >
                  Payment Setup Guide
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('https://www.pesapal.com/pricing', '_blank')}
                >
                  Transaction Fees
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('mailto:menuhubafrica@gmail.com', '_blank')}
                >
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
