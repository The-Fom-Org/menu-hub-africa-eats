import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, Download, Share, Copy } from "lucide-react";
import { User } from "@supabase/supabase-js";

const QRCodePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleCopyLink = () => {
    const menuLink = `${window.location.origin}/menu/demo`;
    navigator.clipboard.writeText(menuLink);
    toast({
      title: "Link copied!",
      description: "Menu link has been copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading QR Code...</p>
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
              <h1 className="text-xl font-bold text-foreground">QR Code Generator</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Your QR Code
              </h2>
              <p className="text-muted-foreground text-lg">
                Let customers scan to view your digital menu
              </p>
            </div>

            <Card className="text-center p-8">
              <div className="mb-6">
                {/* Placeholder QR Code */}
                <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">QR Code will appear here</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Configure your menu first
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button className="w-full" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Instructions and Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How to Use Your QR Code</CardTitle>
                <CardDescription>
                  Simple steps to get your contactless menu working
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Complete Your Menu</h4>
                    <p className="text-sm text-muted-foreground">Add menu items and categories first</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Download & Print</h4>
                    <p className="text-sm text-muted-foreground">Print your QR code on table tents or stickers</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Place on Tables</h4>
                    <p className="text-sm text-muted-foreground">Customers scan to view your menu instantly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customization Options</CardTitle>
                <CardDescription>
                  Personalize your QR code experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Add Your Logo to QR Code
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Custom Colors & Branding
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Multiple QR Codes (Tables)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Track Scans & Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Ready to Go Contactless?</h3>
                <p className="mb-4 text-primary-foreground/90">
                  Complete your menu setup to generate your QR code
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => navigate("/digital-menu")}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Setup Menu First
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QRCodePage;