import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Menu, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranchMenuData } from "@/hooks/useBranchMenuData";
import { useBranch } from "@/contexts/BranchContext";
import { AddCategoryDialog } from "@/components/dialogs/AddCategoryDialog";

const DigitalMenu = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { currentBranch, loading: branchLoading } = useBranch();
  const { categories, addCategory } = useBranchMenuData();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading || branchLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your menu...</p>
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
              <h1 className="text-xl font-bold text-foreground">Digital Menu</h1>
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
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Your Digital Menu
          </h2>
          <p className="text-muted-foreground text-lg">
            Create and manage your restaurant's digital menu
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="hover:shadow-warm transition-all duration-300 cursor-pointer group"
            onClick={() => {}}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                Add Menu Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Create categories like Appetizers, Main Dishes, Drinks
              </CardDescription>
              <AddCategoryDialog 
                onAddCategory={addCategory}
                trigger={
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 group-hover:bg-primary/10 group-hover:text-primary"
                  >
                    Create Category
                  </Button>
                }
              />
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-warm transition-all duration-300 cursor-pointer group"
            onClick={() => navigate("/edit-menu")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Menu className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                Edit Menu Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Add food items with photos, prices, and descriptions
              </CardDescription>
              <Button 
                variant="ghost" 
                className="w-full mt-4 group-hover:bg-primary/10 group-hover:text-primary"
              >
                Manage Items
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-warm transition-all duration-300 cursor-pointer group"
            onClick={() => navigate("/qr-code")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Eye className="h-6 w-6 text-accent" />
                </div>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                Preview & QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                See how your menu will look to customers
              </CardDescription>
              <Button 
                variant="ghost" 
                className="w-full mt-4 group-hover:bg-primary/10 group-hover:text-primary"
                onClick={() => currentBranch && window.open(`/menu/${currentBranch.restaurant_id}`, '_blank')}
              >
                Preview Menu
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Menu Status */}
        <Card className="bg-gradient-hero text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              {categories.length === 0 ? "Ready to Build Your Menu?" : `You have ${categories.length} categories`}
            </h3>
            <p className="text-lg mb-6 text-primary-foreground/90">
              {categories.length === 0 
                ? "Start by creating your first menu category and adding delicious items"
                : "Continue building your menu or generate QR codes for your tables"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AddCategoryDialog 
                onAddCategory={addCategory}
                trigger={
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  >
                    {categories.length === 0 ? "Get Started" : "Add Category"}
                  </Button>
                }
              />
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => currentBranch && window.open(`/menu/${currentBranch.restaurant_id}`, '_blank')}
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

export default DigitalMenu;