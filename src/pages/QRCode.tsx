import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, Download, Share, Copy, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMenuData } from "@/hooks/useMenuData";

const QRCodePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { categories } = useMenuData();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleCopyLink = () => {
    const menuLink = `${window.location.origin}/menu/${user?.id}`;
    navigator.clipboard.writeText(menuLink);
    toast({
      title: "Link copied!",
      description: "Menu link has been copied to clipboard",
    });
  };

  const handleDownloadQR = () => {
    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been saved to your downloads folder",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Digital Menu',
        text: 'Check out my restaurant menu!',
        url: `${window.location.origin}/menu/${user?.id}`,
      });
    } else {
      toast({
        title: "Share",
        description: "Copy the link to share your menu",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading QR Code...</p>
        </div>
      </div>
    );
  }

  const hasMenuItems = categories.some(cat => cat.menu_items && cat.menu_items.length > 0);

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
                {hasMenuItems ? (
                  <div className="w-64 h-64 mx-auto bg-card rounded-lg flex items-center justify-center border">
                    <div className="text-center">
                      <div className="w-48 h-48 bg-foreground rounded-lg flex items-center justify-center mx-auto mb-4">
                        <div className="w-40 h-40 bg-background rounded grid grid-cols-8 gap-1 p-2">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-sm ${
                                Math.random() > 0.5 ? 'bg-foreground' : 'bg-background'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Scan to view menu
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                    <div className="text-center">
                      <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">QR Code will appear here</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Add menu items first
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  disabled={!hasMenuItems}
                  onClick={handleDownloadQR}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleShare}>
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/custom-branding")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Add Your Logo to QR Code
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/custom-branding")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Custom Colors & Branding
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Coming Soon", description: "Multiple QR codes feature is coming soon!" })}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Multiple QR Codes (Tables)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/analytics")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Track Scans & Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Ready to Go Contactless?</h3>
                <p className="mb-4 text-primary-foreground/90">
                  {hasMenuItems 
                    ? "Your menu is ready! Download your QR code and start serving customers."
                    : "Complete your menu setup to generate your QR code"
                  }
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="secondary"
                    onClick={() => navigate(hasMenuItems ? "/edit-menu" : "/digital-menu")}
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full"
                  >
                    {hasMenuItems ? "Edit Menu" : "Setup Menu First"}
                  </Button>
                  {hasMenuItems && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`/menu/${user?.id}?qr=true`, '_blank')}
                      className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      Preview Customer Menu
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QRCodePage;