import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { QrCode, Clock, MapPin, Search, Star } from 'lucide-react';
import { useCustomerMenuData } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { MenuItemCard } from '@/components/customer/MenuItemCard';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { HeroSection } from '@/components/customer/HeroSection';
import { UpsellSection } from '@/components/customer/UpsellSection';
import { getCategoryEmoji } from '@/components/customer/CategoryEmojis';

const CustomerMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(restaurantId!);
  const { setOrderType, cartItems, getCartCount } = useCart(restaurantId!);
  const [customerFlow, setCustomerFlow] = useState<'qr' | 'direct'>('direct');
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect customer flow based on URL parameters or referrer
    const qrParam = searchParams.get('qr');
    const tableParam = searchParams.get('table');
    
    if (qrParam === 'true' || tableParam) {
      setCustomerFlow('qr');
      setOrderType('now');
    } else {
      setCustomerFlow('direct');
      setOrderType('later');
    }
  }, [searchParams, setOrderType]);

  // Get Chef's Special items
  const chefSpecialItems = categories.flatMap(category => 
    category.menu_items?.filter(item => item.is_chef_special && item.is_available) || []
  );

  // Filter items based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    menu_items: category.menu_items?.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.persuasion_description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
  })).filter(category => 
    // Show category if it has matching items OR if no search term
    !searchTerm || category.menu_items.length > 0
  );

  // Use filtered categories for display
  const categoriesToShow = searchTerm ? filteredCategories : categories;

  // Find the first category with items for search results
  const defaultActiveTab = searchTerm 
    ? categoriesToShow.find(cat => cat.menu_items && cat.menu_items.length > 0)?.id || categoriesToShow[0]?.id
    : categoriesToShow[0]?.id;

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToChefSpecials = () => {
    // Find Chef's Special category or create a virtual one
    const chefSpecialCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('special') || cat.name.toLowerCase().includes("chef")
    );
    
    if (chefSpecialCategory) {
      // If there's a dedicated specials category, scroll to it
      const element = document.getElementById(`category-${chefSpecialCategory.id}`);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Otherwise scroll to menu and show all chef specials
      scrollToMenu();
    }
  };

  const cartCount = getCartCount();
  const allMenuItems = categories.flatMap(category => category.menu_items || []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Apply custom branding colors as CSS variables
  const brandingStyles = restaurantInfo ? {
    '--brand-primary': restaurantInfo.primary_color || 'hsl(25 85% 55%)',
    '--brand-secondary': restaurantInfo.secondary_color || 'hsl(120 50% 25%)',
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen bg-background" style={brandingStyles}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Restaurant Name */}
            <div className="flex items-center space-x-3">
              {restaurantInfo?.logo_url ? (
                <img 
                  src={restaurantInfo.logo_url} 
                  alt={restaurantInfo.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: restaurantInfo?.primary_color || 'hsl(var(--primary))' }}
                >
                  {restaurantInfo?.name?.charAt(0) || 'R'}
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg text-foreground">
                  {restaurantInfo?.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {restaurantInfo?.tagline || (customerFlow === 'qr' ? 'Dine in' : 'Takeaway')}
                </p>
              </div>
            </div>

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
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        restaurantName={restaurantInfo?.name || 'Restaurant'}
        coverImageUrl={restaurantInfo?.cover_image_url}
        onScrollToMenu={scrollToMenu}
      />

      {/* Flow Indicator */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Card 
          className="border-l-4 bg-card/50 backdrop-blur-sm"
          style={{ 
            borderLeftColor: customerFlow === 'qr' 
              ? restaurantInfo?.primary_color || 'hsl(var(--primary))' 
              : restaurantInfo?.secondary_color || 'hsl(var(--secondary))'
          }}
        >
          <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              {customerFlow === 'qr' ? (
                <>
                  <MapPin 
                    className="h-5 w-5" 
                    style={{ color: restaurantInfo?.primary_color || 'hsl(var(--primary))' }}
                  />
                  <div>
                    <p className="font-medium text-sm">Dining In</p>
                    <p className="text-xs text-muted-foreground">Your order will be prepared for immediate service</p>
                  </div>
                  <Badge 
                    variant="default" 
                    className="ml-auto"
                    style={{ 
                      backgroundColor: restaurantInfo?.primary_color || 'hsl(var(--primary))',
                      color: 'white'
                    }}
                  >
                    Now
                  </Badge>
                </>
              ) : (
                <>
                  <Clock 
                    className="h-5 w-5" 
                    style={{ color: restaurantInfo?.secondary_color || 'hsl(var(--secondary))' }}
                  />
                  <div>
                    <p className="font-medium text-sm">Pre-ordering</p>
                    <p className="text-xs text-muted-foreground">Schedule your meal for pickup or delivery</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="ml-auto"
                    style={{ 
                      backgroundColor: restaurantInfo?.secondary_color || 'hsl(var(--secondary))',
                      color: 'white'
                    }}
                  >
                    Later
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search delicious meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full border-muted-foreground/20 bg-background/80 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Menu Content */}
      <main ref={menuRef} className="max-w-6xl mx-auto px-4 pb-8">
        {searchTerm && categoriesToShow.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No items found matching "{searchTerm}"</p>
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No menu items available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs key={searchTerm} defaultValue={defaultActiveTab} className="space-y-6">
              {/* Category Tabs - Horizontal Scroll */}
              <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-md py-4 -mx-4 px-4 border-b">
                <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 backdrop-blur-sm p-1">
                  {categoriesToShow.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id} 
                      className="whitespace-nowrap flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full"
                    >
                      <span className="text-lg">{getCategoryEmoji(category.name)}</span>
                      <span className="font-medium">{category.name}</span>
                      {searchTerm && category.menu_items && category.menu_items.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {category.menu_items.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Category Content */}
              {categoriesToShow.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-6">
                  <div id={`category-${category.id}`}>
                    <Card className="bg-card/50 backdrop-blur-sm">
                      <CardHeader className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <span className="text-3xl">{getCategoryEmoji(category.name)}</span>
                          <CardTitle className="text-2xl">{category.name}</CardTitle>
                        </div>
                        {category.description && (
                          <p className="text-muted-foreground">{category.description}</p>
                        )}
                        {searchTerm && category.menu_items && category.menu_items.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Found {category.menu_items.length} item{category.menu_items.length !== 1 ? 's' : ''} matching "{searchTerm}"
                          </p>
                        )}
                      </CardHeader>
                    </Card>

                    {/* Menu Items Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {category.menu_items && category.menu_items.length > 0 ? (
                        category.menu_items.map((item) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            restaurantId={restaurantId!}
                          />
                        ))
                      ) : (
                        <Card className="sm:col-span-2 lg:col-span-3 bg-card/50 backdrop-blur-sm">
                          <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                              {searchTerm ? `No items found matching "${searchTerm}" in this category.` : 'No items in this category yet.'}
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
            {cartCount > 0 && (
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
  );
};

export default CustomerMenu;
