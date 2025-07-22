import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  Menu, 
  QrCode, 
  Edit3, 
  Palette, 
  CreditCard, 
  BarChart3,
  Smartphone,
  Globe,
  Users
} from "lucide-react";
import { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getBusinessName = () => {
    return user?.user_metadata?.business_name || "Your Restaurant";
  };

  const dashboardCards = [
    {
      title: "Your Digital Menu",
      description: "Create and manage your restaurant menu items",
      icon: Menu,
      color: "primary",
      comingSoon: false,
    },
    {
      title: "QR Code",
      description: "Generate QR codes for contactless ordering",
      icon: QrCode,
      color: "secondary",
      comingSoon: false,
    },
    {
      title: "Edit Menu Items",
      description: "Add, update, and organize your menu",
      icon: Edit3,
      color: "accent",
      comingSoon: false,
    },
    {
      title: "Customize Branding",
      description: "Personalize your restaurant's digital presence",
      icon: Palette,
      color: "primary",
      comingSoon: false,
    },
    {
      title: "Enable Payments",
      description: "Accept M-Pesa and other payment methods",
      icon: CreditCard,
      color: "secondary",
      comingSoon: false,
    },
    {
      title: "Analytics",
      description: "Track orders, popular items, and revenue",
      icon: BarChart3,
      color: "accent",
      comingSoon: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">MenuHub Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Karibu, Welcome to {getBusinessName()}!
          </h2>
          <p className="text-muted-foreground text-lg">
            Manage your digital menu, track orders, and grow your business
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Mobile Ready</p>
                  <p className="text-2xl font-bold text-foreground">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Online Presence</p>
                  <p className="text-2xl font-bold text-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Ready for Customers</p>
                  <p className="text-2xl font-bold text-foreground">Yes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            
            const getRouteForCard = (title: string) => {
              switch (title) {
                case "Your Digital Menu":
                  return "/digital-menu";
                case "QR Code":
                  return "/qr-code";
                case "Edit Menu Items":
                  return "/edit-menu";
                case "Customize Branding":
                  return "/custom-branding";
                case "Enable Payments":
                  return "/enable-payments";
                case "Analytics":
                  return "/analytics";
                default:
                  return "#";
              }
            };

            return (
              <Card 
                key={index}
                className="hover:shadow-warm transition-all duration-300 hover:scale-105 cursor-pointer group"
                onClick={() => {
                  const route = getRouteForCard(card.title);
                  if (route !== "#") {
                    navigate(route);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-${card.color}/10`}>
                      <Icon className={`h-6 w-6 text-${card.color}`} />
                    </div>
                    {card.comingSoon && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        Soon
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 group-hover:bg-primary/10 group-hover:text-primary"
                    disabled={card.comingSoon}
                  >
                    {card.comingSoon ? "Coming Soon" : "Manage →"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-hero text-primary-foreground">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Launch Your Digital Menu?</h3>
              <p className="text-lg mb-6 text-primary-foreground/90">
                Start by creating your first menu items and generate your QR code for customers
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Create First Menu Item
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Generate QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;