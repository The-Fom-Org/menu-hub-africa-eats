
import { useEffect, useState } from 'react';
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
  const { setOrderType, getCartCount } = useCart(restaurantId!);
  const [customerFlow, setCustomerFlow] = useState<'qr' | 'direct'>('direct');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpsellSection, setShowUpsellSection] = useState(false);

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

  // Show upsell section when user has items in cart
  useEffect(() => {
    const cartCount = getCartCount();
    setShowUpsellSection(cartCount > 0);
  }, [getCartCount]);

  // Filter items based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    menu_items: category.menu_items?.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item as any).persuasion_description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
  })).filter(category => 
    !searchTerm || category.menu_items.length > 0
  );

  // Get Chef's Special items
  const chefSpecialItems = categories.flatMap(category =>
    (category.menu_items || []).filter((item: any) => item.is_special)
  );

  // Use filtered categories for display
  const categoriesToShow = searchTerm ? filteredCategories : categories;

  // Create Chef's Special category if items exist
  const categoriesWithSpecials = chefSpecialItems.length > 0 ? [
    {
      id: 'chefs-specials',
      name: "Chef's Specials",
      description: 'Our signature dishes, crafted with love',
      menu_items: chefSpecialItems
    },
    ...categoriesToShow
  ] : categoriesToShow;

  const defaultActiveTab = searchTerm 
    ? categoriesToShow.find(cat => cat.menu_items && cat.menu_items.length > 0)?.id || categoriesToShow[0]?.id
    : categoriesWithSpecials[0]?.id;

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
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Restaurant Info */}
            <div className="flex items-center space-x-3">
              {restaurantInfo?.logo_url ? (
                <img 
                  src={restaurantInfo.logo_url} 
                  alt={restaurantInfo.name}
                  className="h-12 w-12 rounded-full object-cover shadow-md"
                />
              ) : (
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: restaurantInfo?.primary_color || 'hsl(var(--primary))' }}
                >
                  <span className="font-bold text-lg">
                    {restaurantInfo?.name?.charAt(0) || 'R'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg text-foreground">
                  {restaurantInfo?.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {restaurantInfo?.tagline || 'Delicious meals made fresh'}
                </p>
              </div>
            </div>

            {/* Chef's Special Shortcut & Cart */}
            <div className="flex items-center gap-3">
              {chefSpecialItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    const element = document.getElementById('chefs-specials-tab');
                    element?.click();
                  }}
                >
                  <Star className="h-4 w-4" />
                  Chef's Special
                </Button>
              )}
              <CartDrawer restaurantId={restaurantId!} />
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search delicious items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border/50 focus:border-primary"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {restaurantInfo && !searchTerm && (
        <HeroSection restaurantInfo={restaurantInfo} customerFlow={customerFlow} />
      )}

      {/* Flow Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Card 
          className="border-l-4 bg-gradient-to-r from-card to-accent/10"
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
                    <p className="font-medium text-sm">🍽️ Dining In Experience</p>
                    <p className="text-xs text-muted-foreground">Your order will be prepared fresh and served hot</p>
                  </div>
                  <Badge 
                    variant="default" 
                    className="ml-auto"
                    style={{ 
                      backgroundColor: restaurantInfo?.primary_color || 'hsl(var(--primary))',
                      color: 'white'
                    }}
                  >
                    Order Now
                  </Badge>
                </>
              ) : (
                <>
                  <Clock 
                    className="h-5 w-5" 
                    style={{ color: restaurantInfo?.secondary_color || 'hsl(var(--secondary))' }}
                  />
                  <div>
                    <p className="font-medium text-sm">⏰ Pre-order & Schedule</p>
                    <p className="text-xs text-muted-foreground">Order ahead for pickup or delivery at your preferred time</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="ml-auto"
                    style={{ 
                      backgroundColor: restaurantInfo?.secondary_color || 'hsl(var(--secondary))',
                      color: 'white'
                    }}
                  >
                    Schedule Order
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {searchTerm && categoriesWithSpecials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="space-y-3">
                <div className="text-4xl">🔍</div>
                <p className="text-lg font-medium text-muted-foreground">No items found</p>
                <p className="text-sm text-muted-foreground">Try searching for something else</p>
              </div>
            </CardContent>
          </Card>
        ) : categoriesWithSpecials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="space-y-3">
                <div className="text-4xl">🍽️</div>
                <p className="text-lg font-medium text-muted-foreground">Menu Coming Soon</p>
                <p className="text-sm text-muted-foreground">We're preparing something delicious for you!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs key={searchTerm} defaultValue={defaultActiveTab} className="space-y-6">
            {/* Category Tabs with Emojis */}
            <TabsList className="w-full justify-start overflow-x-auto bg-card/50 p-1 h-auto">
              {categoriesWithSpecials.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  id={`${category.id}-tab`}
                  value={category.id} 
                  className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium px-4 py-2 rounded-md transition-all duration-200"
                >
                  <span className="mr-2">
                    {category.id === 'chefs-specials' ? '⭐' : getCategoryEmoji(category.name)}
                  </span>
                  {category.name}
                  {searchTerm && category.menu_items && category.menu_items.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.menu_items.length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {categoriesWithSpecials.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                {/* Category Header */}
                <Card className="bg-gradient-to-r from-card to-accent/10">
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">
                      {category.id === 'chefs-specials' ? '⭐' : getCategoryEmoji(category.name)}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {category.name}
                    </CardTitle>
                    {category.description && (
                      <p className="text-muted-foreground text-lg">
                        {category.description}
                      </p>
                    )}
                    {searchTerm && category.menu_items && category.menu_items.length > 0 && (
                      <Badge variant="outline" className="mx-auto">
                        {category.menu_items.length} item{category.menu_items.length !== 1 ? 's' : ''} found
                      </Badge>
                    )}
                  </CardHeader>
                </Card>

                {/* Menu Items Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                  {category.menu_items && category.menu_items.length > 0 ? (
                    category.menu_items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        restaurantId={restaurantId!}
                      />
                    ))
                  ) : (
                    <Card className="sm:col-span-2">
                      <CardContent className="py-12 text-center">
                        <div className="space-y-3">
                          <div className="text-4xl">🍽️</div>
                          <p className="text-muted-foreground">
                            {searchTerm ? 
                              `No items found matching "${searchTerm}" in this category.` : 
                              'No items in this category yet.'
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Upsell Section */}
        {showUpsellSection && !searchTerm && (
          <div className="mt-12">
            <UpsellSection categories={categories} restaurantId={restaurantId!} />
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerMenu;
