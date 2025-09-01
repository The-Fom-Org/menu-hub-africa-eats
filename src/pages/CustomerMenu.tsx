
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCustomerMenuData } from "@/hooks/useCustomerMenuData";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { CategoryEmojis } from "@/components/customer/CategoryEmojis";
import { MenuItemCard } from "@/components/customer/MenuItemCard";
import { UpsellSection } from "@/components/customer/UpsellSection";
import { CarouselHeroSection } from "@/components/customer/CarouselHeroSection";
import { LeadCaptureIntegration } from "@/components/customer/LeadCaptureIntegration";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Phone, ShoppingCart, Clock, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const CustomerMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(restaurantId || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cart = useCart(restaurantId);

  const handleCallWaiter = async () => {
    if (!restaurantId) return;
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("waiter_calls").insert([{
        restaurant_id: restaurantId,
        table_number: "Table 1", // Could be dynamic
        customer_name: "Guest",
        status: "pending",
        notes: "Customer requested assistance"
      }]);

      if (error) throw error;
      
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Waiter called",
        description: "A waiter will be with you shortly!",
      });
    } catch (error) {
      console.error("Error calling waiter:", error);
    }
  };

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurantInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Menu Not Found</h1>
          <p className="text-muted-foreground">
            Sorry, we couldn't find the menu for this restaurant.
          </p>
        </div>
      </div>
    );
  }

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
  const availableItems = selectedCategoryData?.menu_items?.filter(item => item.is_available) || [];
  const allMenuItems = categories.flatMap(cat => cat.menu_items || []);
  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Components */}
      <SEOHead
        title={`${restaurantInfo.name} - Digital Menu | Order Online`}
        description={`Browse ${restaurantInfo.name}'s digital menu and order online. ${restaurantInfo.description || 'Authentic African cuisine with convenient mobile ordering.'}`}
        keywords={`${restaurantInfo.name}, african restaurant, digital menu, online ordering, kenyan food, ${restaurantInfo.name} menu`}
        canonicalUrl={currentUrl}
        ogType="restaurant.menu"
        ogImage={restaurantInfo.cover_image_url || restaurantInfo.logo_url}
        restaurantName={restaurantInfo.name}
      />
      
      <StructuredData 
        type="restaurant" 
        restaurantData={{
          name: restaurantInfo.name,
          description: restaurantInfo.description,
          phone: restaurantInfo.phone_number,
          logoUrl: restaurantInfo.logo_url,
          primaryColor: restaurantInfo.primary_color
        }}
        pageUrl={currentUrl}
      />
      
      <StructuredData 
        type="menu" 
        restaurantData={{
          name: restaurantInfo.name,
          menuItems: allMenuItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image_url: item.image_url
          }))
        }}
        pageUrl={currentUrl}
      />

      {/* Lead Capture Integration */}
      {restaurantId && <LeadCaptureIntegration restaurantId={restaurantId} />}

      {/* Hero Section */}
      <CarouselHeroSection 
        restaurantName={restaurantInfo.name}
        coverImageUrl={restaurantInfo.cover_image_url}
        onScrollToMenu={() => {
          const menuElement = document.getElementById('menu-section');
          menuElement?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Restaurant Info */}
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {restaurantInfo.name}
          </h1>
          {restaurantInfo.tagline && (
            <p className="text-lg text-muted-foreground mb-4">{restaurantInfo.tagline}</p>
          )}
          {restaurantInfo.description && (
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
              {restaurantInfo.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            variant="outline" 
            onClick={handleCallWaiter}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Call Waiter
          </Button>
          
          <Button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 relative"
            disabled={!cart.hasItems()}
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart ({cart.getCartCount()})
            {cart.hasItems() && (
              <Badge variant="secondary" className="absolute -top-2 -right-2">
                {cart.getCartCount()}
              </Badge>
            )}
          </Button>
        </div>

        <Separator className="mb-8" />

        {/* Category Navigation */}
        <CategoryEmojis
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Menu Items */}
        <div className="mt-8" id="menu-section">
          {selectedCategoryData && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                {selectedCategoryData.name}
              </h2>
              
              {availableItems.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No items available</h3>
                  <p className="text-muted-foreground">
                    This category doesn't have any available items right now.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      restaurantId={restaurantId || ""}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upsell Section */}
        {cart.hasItems() && (
          <UpsellSection
            restaurantId={restaurantId || ""}
            currentCartItems={cart.cartItems}
            allItems={allMenuItems}
          />
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        restaurantId={restaurantId || ""}
      />
    </div>
  );
};

export default CustomerMenu;
