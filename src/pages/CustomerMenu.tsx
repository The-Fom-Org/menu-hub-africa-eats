import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCustomerMenuData } from "@/hooks/useCustomerMenuData";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { CategoryEmojis } from "@/components/customer/CategoryEmojis";
import { MenuItemCard } from "@/components/customer/MenuItemCard";
import { UpsellSection } from "@/components/customer/UpsellSection";
import { CarouselHeroSection } from "@/components/customer/CarouselHeroSection";
import { StickyHeader } from "@/components/customer/StickyHeader";
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
  const [searchQuery, setSearchQuery] = useState<string>("");
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
  const allAvailableItems = selectedCategoryData?.menu_items?.filter(item => item.is_available) || [];
  
  // Filter items based on search query
  const availableItems = searchQuery.trim() 
    ? allAvailableItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allAvailableItems;
  
  const allMenuItems = categories.flatMap(cat => cat.menu_items || []);
  const currentUrl = window.location.href;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleChefsSpecial = () => {
    // Find items marked as chef's special or featured
    const specialItems = allMenuItems.filter(item => 
      item.is_chef_special || item.popularity_badge === 'chef-pick'
    );
    
    if (specialItems.length > 0) {
      // Find the category of the first special item
      const specialCategory = categories.find(cat => 
        cat.menu_items?.some(item => item.id === specialItems[0].id)
      );
      
      if (specialCategory) {
        setSelectedCategory(specialCategory.id);
        setSearchQuery(''); // Clear search to show all items in category
      }
    }
    
    // Scroll to menu section
    const menuElement = document.getElementById('menu-section');
    menuElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactRestaurant = () => {
    if (restaurantInfo.phone_number) {
      window.open(`tel:${restaurantInfo.phone_number}`, '_self');
    }
  };

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
      <StickyHeader
        restaurantName={restaurantInfo.name}
        restaurantId={restaurantId || ""}
        logoUrl={restaurantInfo.logo_url}
        onSearch={handleSearch}
        onChefsSpecial={handleChefsSpecial}
        onContactRestaurant={handleContactRestaurant}
      />

      {/* Hero Section */}
      <CarouselHeroSection 
        restaurantName={restaurantInfo.name}
        coverImageUrl={restaurantInfo.cover_image_url}
        onScrollToMenu={() => {
          const menuElement = document.getElementById('menu-section');
          menuElement?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Enhanced Restaurant Info Section */}
      <div className="container mx-auto px-4 -mt-12 relative z-20">
        {/* Main Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8 mb-8"
        >
          <div className="text-center space-y-6">
            {/* Restaurant Logo */}
            {restaurantInfo.logo_url && (
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img 
                    src={restaurantInfo.logo_url} 
                    alt={`${restaurantInfo.name} logo`}
                    className="h-20 w-20 object-cover rounded-2xl border-4 border-primary/20 shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-white fill-current" />
                  </div>
                </div>
              </div>
            )}

            {/* Restaurant Name & Tagline */}
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

            {/* Restaurant Features */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold bg-primary/10 text-primary border-primary/20">
                <Award className="h-4 w-4 mr-2" />
                Premium Quality
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold bg-green-500/10 text-green-600 border-green-500/20">
                <Clock className="h-4 w-4 mr-2" />
                Fast Service
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold bg-amber-500/10 text-amber-600 border-amber-500/20">
                <ChefHat className="h-4 w-4 mr-2" />
                Fresh Ingredients
              </Badge>
            </div>
          </div>

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

        <Separator className="my-8 opacity-30" />

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
    </div>
  );
};

export default CustomerMenu;