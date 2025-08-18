
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { QrCode, Clock, MapPin, Search } from 'lucide-react';
import { useCustomerMenuData } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { MenuItemCard } from '@/components/customer/MenuItemCard';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

const CustomerMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(restaurantId!);
  const { setOrderType, forceUpdate } = useCart(restaurantId!);
  const { canUsePreOrders } = useSubscriptionLimits();
  const [customerFlow, setCustomerFlow] = useState<'qr' | 'direct'>('direct');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Detect customer flow based on URL parameters or referrer
    const qrParam = searchParams.get('qr');
    const tableParam = searchParams.get('table');
    
    if (qrParam === 'true' || tableParam) {
      setCustomerFlow('qr');
      setOrderType('now');
    } else {
      setCustomerFlow('direct');
      // Only allow "later" orders if the restaurant supports pre-orders
      setOrderType(canUsePreOrders ? 'later' : 'now');
    }
  }, [searchParams, setOrderType, canUsePreOrders]);

  // Filter items based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    menu_items: category.menu_items?.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Apply custom branding colors as CSS variables with proper typing
  const brandingStyles: React.CSSProperties = restaurantInfo ? {
    '--brand-primary': restaurantInfo.primary_color || 'hsl(25 85% 55%)',
    '--brand-secondary': restaurantInfo.secondary_color || 'hsl(120 50% 25%)',
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen bg-gradient-subtle" style={brandingStyles}>
      {/* Cover Image Section */}
      {restaurantInfo?.cover_image_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={restaurantInfo.cover_image_url} 
            alt={`${restaurantInfo.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold mb-2">{restaurantInfo.name}</h1>
              {restaurantInfo.tagline && (
                <p className="text-lg opacity-90">{restaurantInfo.tagline}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {restaurantInfo?.logo_url ? (
                <img 
                  src={restaurantInfo.logo_url} 
                  alt={restaurantInfo.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: restaurantInfo?.primary_color || 'hsl(var(--primary))' }}
                >
                  {customerFlow === 'qr' ? (
                    <QrCode className="h-6 w-6" />
                  ) : (
                    <Clock className="h-6 w-6" />
                  )}
                </div>
              )}
              <div>
                <h1 className="font-bold text-xl text-foreground">
                  {restaurantInfo?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {restaurantInfo?.tagline || (customerFlow === 'qr' ? 'Order for now' : 'Pre-order for later')}
                </p>
              </div>
            </div>
            
            <CartDrawer key={forceUpdate} restaurantId={restaurantId!} />
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Flow Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Card 
          className="border-l-4"
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
              ) : canUsePreOrders ? (
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
              ) : (
                <>
                  <MapPin 
                    className="h-5 w-5" 
                    style={{ color: restaurantInfo?.primary_color || 'hsl(var(--primary))' }}
                  />
                  <div>
                    <p className="font-medium text-sm">Order Now</p>
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {searchTerm && categoriesToShow.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No items found matching "{searchTerm}"</p>
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No menu items available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs key={searchTerm} defaultValue={defaultActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto">
              {categoriesToShow.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className="whitespace-nowrap data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white"
                >
                  {category.name}
                  {searchTerm && category.menu_items && category.menu_items.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.menu_items.length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {categoriesToShow.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
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

                <div className="grid gap-4 sm:grid-cols-2">
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
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">
                          {searchTerm ? `No items found matching "${searchTerm}" in this category.` : 'No items in this category yet.'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default CustomerMenu;
