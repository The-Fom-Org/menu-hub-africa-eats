import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Palette, Upload, Eye, Save } from "lucide-react";
import { User } from "@supabase/supabase-js";

const CustomBranding = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [branding, setBranding] = useState({
    restaurantName: "",
    tagline: "",
    description: "",
    primaryColor: "#059669",
    secondaryColor: "#dc2626",
    logoUrl: "",
    coverImageUrl: ""
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

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          restaurant_name: branding.restaurantName,
          tagline: branding.tagline,
          description: branding.description,
          primary_color: branding.primaryColor,
          secondary_color: branding.secondaryColor,
          logo_url: branding.logoUrl,
          cover_image_url: branding.coverImageUrl
        });

      if (error) throw error;

      toast({
        title: "Branding saved!",
        description: "Your custom branding has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save branding",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading branding settings...</p>
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
              <h1 className="text-xl font-bold text-foreground">Custom Branding</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Customize Your Brand
              </h2>
              <p className="text-muted-foreground text-lg">
                Personalize your restaurant's digital presence
              </p>
            </div>

            {/* Restaurant Information */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>
                  Basic details about your restaurant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="restaurantName">Restaurant Name</Label>
                  <Input
                    id="restaurantName"
                    value={branding.restaurantName}
                    onChange={(e) => setBranding({...branding, restaurantName: e.target.value})}
                    placeholder="Enter your restaurant name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={branding.tagline}
                    onChange={(e) => setBranding({...branding, tagline: e.target.value})}
                    placeholder="A catchy tagline for your restaurant"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={branding.description}
                    onChange={(e) => setBranding({...branding, description: e.target.value})}
                    placeholder="Tell customers about your restaurant..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Logo & Images</CardTitle>
                <CardDescription>
                  Upload your restaurant logo and cover images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Restaurant Logo</Label>
                  <ImageUpload
                    bucket="menu-images"
                    path="logos/"
                    value={branding.logoUrl}
                    onChange={(url) => setBranding({...branding, logoUrl: url})}
                    placeholder="Upload your restaurant logo"
                  />
                </div>
                
                <div>
                  <Label>Cover Image</Label>
                  <ImageUpload
                    bucket="menu-images"
                    path="covers/"
                    value={branding.coverImageUrl}
                    onChange={(url) => setBranding({...branding, coverImageUrl: url})}
                    placeholder="Upload a cover image"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Color Scheme */}
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>
                  Choose colors that represent your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                        className="w-16 h-10 p-1 rounded"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                        placeholder="#059669"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                        className="w-16 h-10 p-1 rounded"
                      />
                      <Input
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                        placeholder="#dc2626"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your branding will look to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mock menu preview */}
                <div className="border rounded-lg overflow-hidden bg-card">
                  {/* Header */}
                  <div 
                    className="h-32 flex items-center justify-center text-white"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-bold">
                        {branding.restaurantName || "Your Restaurant"}
                      </h3>
                      {branding.tagline && (
                        <p className="text-sm opacity-90 mt-1">{branding.tagline}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    {branding.description && (
                      <p className="text-muted-foreground mb-4">{branding.description}</p>
                    )}
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Featured Items</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded bg-muted/20">
                          <div>
                            <h5 className="font-medium">Sample Menu Item</h5>
                            <p className="text-sm text-muted-foreground">Delicious dish description</p>
                          </div>
                          <span 
                            className="font-bold px-2 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: branding.secondaryColor }}
                          >
                            KSH 250
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 rounded bg-muted/20">
                          <div>
                            <h5 className="font-medium">Another Great Dish</h5>
                            <p className="text-sm text-muted-foreground">Tasty and affordable</p>
                          </div>
                          <span 
                            className="font-bold px-2 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: branding.secondaryColor }}
                          >
                            KSH 180
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center">
                <Palette className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Make It Yours!</h3>
                <p className="mb-4 text-primary-foreground/90">
                  Customize every aspect of your digital presence to match your restaurant's unique style
                </p>
                <Button 
                  variant="secondary"
                  onClick={handleSave}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Apply Branding
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomBranding;