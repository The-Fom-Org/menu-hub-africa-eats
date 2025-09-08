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
import { CallWaiterDialog } from "@/components/customer/CallWaiterDialog";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ShoppingCart, Clock, MapPin, Star, Award, ChefHat, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";


const CustomerMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(restaurantId || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const cart = useCart(restaurantId);
  const [showVideoSplash, setShowVideoSplash] = useState(true);

  // Call waiter functionality is now handled by CallWaiterDialog component
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideoSplash(false);
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Show loading splash screen with food video
  if (loading || showVideoSplash) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover absolute top-0 left-0"
        >
          <source src="/videos/loader2.mp4" type="video/mp4" />
        </video>

        {/* Overlay with subtle text */}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
            {restaurantInfo?.name || "MenuHub"}
          </h1>
          <p className="mt-2 text-white/80 text-lg">Loading your menu...</p>
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

  const handlesSearch = (query: string) => {
    setSearchQuery(query);
  };
   const handleSearch = (e: React.FormEvent) => {
     e.preventDefault();
     // Search functionality - already handled by searchQuery state
     setIsSearchOpen(false);
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
        onSearch={handlesSearch}
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
      <div className="container mx-auto px-1 -mt-5 relative z-8">
        {/* Main Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-5 mb-5"
        >
            <div className="text-center space-y-4">
              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <CallWaiterDialog restaurantId={restaurantId || ""}>
                  <Button 
                    variant="outline" 
                    className="group flex items-center gap-2 px-6 py-2 rounded-2xl border-1 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                  >
                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Phone className="h-3 w-3 text-primary" />
                    </div>
                    <span className="font-semibold">Call Waiter</span>
                  </Button>
                </CallWaiterDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChefsSpecial}
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                  <ChefHat className="h-4 w-4" />
                  Chef's Special
                </Button>
              </div>
            </div>
        </motion.div>
        <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </Button>            
              
              {/* Search Bar */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleSearch}
                    className="border-t border-border/50 py-4"
                  >
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button type="submit" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.form>
                     
                )}
              </AnimatePresence>

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
                <div className="grid gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
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