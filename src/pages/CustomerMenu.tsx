
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UtensilsCrossed, Search } from 'lucide-react';
import { useCustomerMenuData } from '@/hooks/useCustomerMenuData';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { MenuItemCard } from '@/components/customer/MenuItemCard';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';

const CustomerMenu = () => {
  const { restaurantId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  console.log('CustomerMenu - restaurantId from URL params:', restaurantId);
  
  if (!restaurantId) {
    console.error('No restaurant ID in URL params');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Restaurant not found</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(restaurantId);
  const { cartCount } = useCart(restaurantId);

  console.log('CustomerMenu - restaurantInfo:', restaurantInfo, 'categories:', categories?.length, 'cartCount:', cartCount);

  // Filter items based on search query
  const filteredCategories = categories?.map(category => ({
    ...category,
    menu_items: category.menu_items?.filter(item => 
      item.is_available && 
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || []
  })).filter(category => category.menu_items && category.menu_items.length > 0) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading customer menu:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Failed to load menu</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!restaurantInfo) {
    console.error('Restaurant not found');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Restaurant not found</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAvailableItems = categories?.reduce((total, category) => {
    return total + (category.menu_items?.filter(item => item.is_available).length || 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section with Cover Image */}
      {restaurantInfo.cover_image_url && (
        <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          <img
            src={restaurantInfo.cover_image_url}
            alt={`${restaurantInfo.name} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end gap-4">
                {restaurantInfo.logo_url && (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white overflow-hidden bg-white flex-shrink-0">
                    <img
                      src={restaurantInfo.logo_url}
                      alt={`${restaurantInfo.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="text-white">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                    {restaurantInfo.name}
                  </h1>
                  {restaurantInfo.description && (
                    <p className="text-white/90 mt-2 text-sm md:text-base">
                      {restaurantInfo.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header without cover image */}
      {!restaurantInfo.cover_image_url && (
        <header className="bg-card border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              {restaurantInfo.logo_url && (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={restaurantInfo.logo_url}
                    alt={`${restaurantInfo.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {restaurantInfo.name}
                </h1>
                {restaurantInfo.description && (
                  <p className="text-muted-foreground mt-1">
                    {restaurantInfo.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Fixed Cart and Search Bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <CartDrawer restaurantId={restaurantId} />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Menu Display */}
        {totalAvailableItems === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">No items available</h3>
                  <p className="text-muted-foreground mt-2">
                    This restaurant hasn't added any menu items yet, or all items are currently unavailable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredCategories.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">No items found</h3>
                  <p className="text-muted-foreground mt-2">
                    Try adjusting your search terms to find what you're looking for.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {category.menu_items?.length || 0} item{(category.menu_items?.length || 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.menu_items?.map((item) => (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      restaurantId={restaurantId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Fixed Cart Button for Mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <CartDrawer restaurantId={restaurantId} />
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;
