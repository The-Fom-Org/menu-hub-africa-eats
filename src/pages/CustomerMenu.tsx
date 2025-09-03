import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useCustomerMenuData } from "@/hooks/useCustomerMenuData";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { MenuItemCard } from "@/components/customer/MenuItemCard";
import { UpsellSection } from "@/components/customer/UpsellSection";
import { CarouselHeroSection } from "@/components/customer/CarouselHeroSection";
import { LeadCaptureIntegration } from "@/components/customer/LeadCaptureIntegration";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Phone, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";

const CustomerMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(
    restaurantId || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const cart = useCart(restaurantId);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCallWaiter = async () => {
    if (!restaurantId) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("waiter_calls").insert([
        {
          restaurant_id: restaurantId,
          table_number: "Table 1", // make dynamic later
          customer_name: "Guest",
          status: "pending",
          notes: "Customer requested assistance",
        },
      ]);

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
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Menu Not Found
          </h1>
          <p className="text-muted-foreground">
            Sorry, we couldn't find the menu for this restaurant.
          </p>
        </div>
      </div>
    );
  }

  const allMenuItems = categories.flatMap((cat) => cat.menu_items || []);
  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen bg-background">
      {/* SEO */}
      <SEOHead
        title={`${restaurantInfo.name} - Digital Menu | Order Online`}
        description={`Browse ${restaurantInfo.name}'s digital menu and order online. ${
          restaurantInfo.description ||
          "Authentic African cuisine with convenient mobile ordering."
        }`}
        keywords={`${restaurantInfo.name}, restaurant, digital menu, online ordering`}
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
          primaryColor: restaurantInfo.primary_color,
        }}
        pageUrl={currentUrl}
      />

      {/* Lead Capture */}
      {restaurantId && <LeadCaptureIntegration restaurantId={restaurantId} />}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
              {restaurantInfo.name}
            </h1>
            {restaurantInfo.tagline && (
              <p className="text-base md:text-lg text-muted-foreground italic">
                "{restaurantInfo.tagline}"
              </p>
            )}
          </div>
          <CartDrawer restaurantId={restaurantId!} />
        </div>
      </header>

      {/* Hero */}
      <CarouselHeroSection
        restaurantName={restaurantInfo.name}
        coverImageUrl={restaurantInfo.cover_image_url}
        onScrollToMenu={() => {
          menuRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <Separator className="my-8 opacity-30" />

      {/* Menu */}
      <main
        ref={menuRef}
        className="max-w-6xl mx-auto px-2 sm:px-4 pb-8 space-y-6"
      >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          {/* Tabs */}
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b px-2 sm:px-4 py-2">
            <TabsList className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="px-4 py-2 rounded-full text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <h2 className="text-xl font-bold mb-4">{cat.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.menu_items?.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    restaurantId={restaurantId!}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Upsell */}
        {cart.cartItems.length > 0 && (
          <UpsellSection
            restaurantId={restaurantId!}
            allItems={allMenuItems}
            currentCartItems={cart.cartItems}
          />
        )}
      </main>
    </div>
  );
};

export default CustomerMenu;
