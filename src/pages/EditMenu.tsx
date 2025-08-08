import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit3, Trash2, Image, DollarSign, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMenuData } from "@/hooks/useMenuData";
import { AddCategoryDialog } from "@/components/dialogs/AddCategoryDialog";
import { AddMenuItemDialog } from "@/components/dialogs/AddMenuItemDialog";
import { EditMenuItemDialog } from "@/components/dialogs/EditMenuItemDialog";

const EditMenu = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { categories, loading: menuLoading, addCategory, addMenuItem, updateMenuItem, deleteMenuItem } = useMenuData();
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      const success = await deleteMenuItem(itemId);
      if (success) {
        toast({
          title: "Item deleted",
          description: `${itemName} has been removed from your menu.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    await updateMenuItem(itemId, { is_available: !currentStatus });
  };

  if (loading || menuLoading) {
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
              <AddCategoryDialog 
                onAddCategory={addCategory}
                trigger={
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                }
              />
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
          {categories.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">No menu categories yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your menu by adding your first category
                </p>
                <AddCategoryDialog 
                  onAddCategory={addCategory}
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Category
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription>
                        {category.menu_items?.length || 0} items in this category
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <AddMenuItemDialog 
                        categoryId={category.id}
                        categoryName={category.name}
                        onAddItem={addMenuItem}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {category.menu_items && category.menu_items.length > 0 ? (
                    <div className="divide-y">
                      {category.menu_items.map((item) => (
                        <div key={item.id} className="p-6 hover:bg-muted/10 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{item.name}</h4>
                                <Badge 
                                  variant={item.is_available ? "default" : "secondary"}
                                  className="cursor-pointer"
                                  onClick={() => handleToggleAvailability(item.id, item.is_available)}
                                >
                                  {item.is_available ? "Available" : "Out of Stock"}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-2">{item.description}</p>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="font-medium text-primary">KSH {item.price}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Image className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">No items in this category yet</p>
                      <AddMenuItemDialog 
                        categoryId={category.id}
                        categoryName={category.name}
                        onAddItem={addMenuItem}
                        trigger={
                          <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Item
                          </Button>
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call to Action */}
        {categories.length > 0 && (
          <Card className="mt-8 bg-gradient-hero text-primary-foreground">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Build Your Complete Menu</h3>
              <p className="text-lg mb-6 text-primary-foreground/90">
                Add more categories and items to create the perfect digital menu for your restaurant
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
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Category
                    </Button>
                  }
                />
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
        )}
      </main>
      
      {editingItem && (
        <EditMenuItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onUpdateItem={updateMenuItem}
        />
      )}
    </div>
  );
};

export default EditMenu;