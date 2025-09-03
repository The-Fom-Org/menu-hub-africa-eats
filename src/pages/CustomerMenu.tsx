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
import { Phone, ShoppingCart, Clock, MapPin, Star, Award, ChefHat } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const CustomerMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(restaurantId || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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
       {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Restaurant Name */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent leading-tight">
                {restaurantInfo.name}
              </h1>
              {restaurantInfo.tagline && (
                <p className="text-xl md:text-2xl text-muted-foreground font-medium italic">
                  "{restaurantInfo.tagline}"
                </p>
              )}
            </div>

            {/* Description */}
            {restaurantInfo.description && (
              <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
                {restaurantInfo.description}
              </p>
            )}

            {/* Center: Chef's Special Button */}
            {chefSpecialItems.length > 0 && (
              <Button
                onClick={scrollToChefSpecials}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 border-primary/20 hover:bg-primary/10"
              >
                <Star className="h-4 w-4 text-primary fill-current" />
                <span className="font-medium">Chef's Special</span>
              </Button>
            )}
                        {/* Right: Cart */}
            <CartDrawer restaurantId={restaurantId!} />
          </div>
          
          {/* Mobile Chef's Special Button */}
          {chefSpecialItems.length > 0 && (
            <div className="mt-2 sm:hidden">
              <Button
                onClick={scrollToChefSpecials}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2 border-primary/20 hover:bg-primary/10"
              >
                <Star className="h-4 w-4 text-primary fill-current" />
                <span className="font-medium">Chef's Special ({chefSpecialItems.length} items)</span>
              </Button>
            </div>
          )}
          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleCallWaiter}
              className="group flex items-center gap-3 px-6 py-3 rounded-2xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Call Waiter</span>
            </Button>
            
            <CartDrawer restaurantId={restaurantId || ""} />
          </div>
        </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <CarouselHeroSection 
        restaurantName={restaurantInfo.name}
        coverImageUrl={restaurantInfo.cover_image_url}
        onScrollToMenu={() => {
          const menuElement = document.getElementById('menu-section');
          menuElement?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
          

        <Separator className="my-8 opacity-30" />

        {/* Menu Items */}
        <main ref={menuRef} className="max-w-6xl mx-auto px-2 sm:px-4 pb-6 sm:pb-8">
        {searchTerm && categoriesToShow.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="py-6 sm:py-8 text-center">
              <p className="text-muted-foreground">No items found matching "{searchTerm}"</p>
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="py-6 sm:py-8 text-center">
              <p className="text-muted-foreground">No menu items available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs key={`${searchTerm}-${showChefSpecials}`} defaultValue={defaultActiveTab} className="space-y-4 sm:space-y-6">
              {/* Category Tabs - Horizontal Scroll */}
              <div className="sticky top-16 sm:top-20 z-40 bg-background/95 backdrop-blur-md py-2 sm:py-4 -mx-2 sm:-mx-4 px-2 sm:px-4 border-b">
                <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 backdrop-blur-sm p-1 h-auto">
                  {categoriesToShow.map((category) => (
                    <TabsTrigger 
                     key={category.id} 
                      value={category.id} 
                      className="whitespace-nowrap flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm"
                    >
                      <span className="text-sm sm:text-lg">{getCategoryEmoji(category.name)}</span>
                      <span className="font-medium">{category.name}</span>
                      {(searchTerm || showChefSpecials) && category.menu_items && category.menu_items.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                          {category.menu_items.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Category Content */}
              {categoriesToShow.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4 sm:space-y-6">
                  <div id={`category-${category.id}`}>
                    <Card className="bg-card/50 backdrop-blur-sm">
                      <CardHeader className="text-center py-4 sm:py-6">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                          <span className="text-2xl sm:text-3xl">{getCategoryEmoji(category.name)}</span>
                          <CardTitle className="text-lg sm:text-2xl">{category.name}</CardTitle>
                            </div>
                        {category.description && (
                          <p className="text-sm sm:text-base text-muted-foreground">{category.description}</p>
                        )}
                        {(searchTerm || showChefSpecials) && category.menu_items && category.menu_items.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {showChefSpecials 
                              ? `${category.menu_items.length} chef's special item${category.menu_items.length !== 1 ? 's' : ''}`
                              : `Found ${category.menu_items.length} item${category.menu_items.length !== 1 ? 's' : ''} matching "${searchTerm}"`
                            }
                          </p>
                        )}
                      </CardHeader>
                    </Card>

                    {/* Menu Items Grid */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {category.menu_items && category.menu_items.length > 0 ? (
                        category.menu_items.map((item) => (
                          <MenuItemCard
                           key={item.id}
                            item={item}
                            restaurantId={restaurantId!}
                          />
                        ))
                      ) : (
                        <Card className="col-span-full bg-card/50 backdrop-blur-sm">
                          <CardContent className="py-6 sm:py-8 text-center">
                            <p className="text-muted-foreground text-sm sm:text-base">
                              {showChefSpecials 
                                ? "No chef's special items available at the moment."
                                : (searchTerm ? `No items found matching "${searchTerm}" in this category.` : 'No items in this category yet.')
                              }
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            {/* Upsell Section - Show when cart has items */}
            {cartCount > 0 && !showChefSpecials && (
              <UpsellSection
                restaurantId={restaurantId!}
                allItems={allMenuItems}
                currentCartItems={cartItems}
              />
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
};

export default CustomerMenu;