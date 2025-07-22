import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit3, Trash2, Image, DollarSign } from "lucide-react";
import { User } from "@supabase/supabase-js";

const EditMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Demo menu data
  const menuCategories = [
    {
      id: 1,
      name: "Appetizers",
      items: [
        { id: 1, name: "Samosas", price: 150, description: "Crispy pastries with spiced vegetables", available: true },
        { id: 2, name: "Bhajias", price: 120, description: "Deep-fried potato fritters", available: true },
      ]
    },
    {
      id: 2,
      name: "Main Dishes",
      items: [
        { id: 3, name: "Ugali & Sukuma Wiki", price: 250, description: "Traditional cornmeal with greens", available: true },
        { id: 4, name: "Nyama Choma", price: 450, description: "Grilled meat with sides", available: false },
      ]
    },
    {
      id: 3,
      name: "Beverages",
      items: [
        { id: 5, name: "Dawa Tea", price: 80, description: "Honey ginger tea", available: true },
        { id: 6, name: "Fresh Juice", price: 120, description: "Passion fruit or mango", available: true },
      ]
    }
  ];

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu editor...</p>
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
              <h1 className="text-xl font-bold text-foreground">Edit Menu</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
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
            Menu Management
          </h2>
          <p className="text-muted-foreground text-lg">
            Add, edit, and organize your menu items
          </p>
        </div>

        {/* Menu Categories */}
        <div className="space-y-8">
          {menuCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardDescription>
                      {category.items.length} items in this category
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="divide-y">
                  {category.items.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{item.name}</h4>
                            <Badge variant={item.available ? "default" : "secondary"}>
                              {item.available ? "Available" : "Out of Stock"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-medium text-primary">KSH {item.price}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State / Add More */}
        <Card className="mt-8 bg-gradient-hero text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Build Your Complete Menu</h3>
            <p className="text-lg mb-6 text-primary-foreground/90">
              Add more categories and items to create the perfect digital menu for your restaurant
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Category
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/digital-menu")}
              >
                Preview Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditMenu;