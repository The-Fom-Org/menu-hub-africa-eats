
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';
import { useCustomerMenuData } from '@/hooks/useCustomerMenuData';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { MenuItemCard } from '@/components/customer/MenuItemCard';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';

const CustomerMenu = () => {
  const { restaurantId } = useParams();
  
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
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

  const availableItems = categories?.reduce((total, category) => {
    return total + (category.menu_items?.filter(item => item.is_available).length || 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Fixed Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{restaurantInfo.name}</h1>
              {restaurantInfo.description && (
                <p className="text-muted-foreground mt-1">{restaurantInfo.description}</p>
              )}
            </div>
            <CartDrawer restaurantId={restaurantId} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Restaurant Info and Menu Display */}
        {availableItems === 0 ? (
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
        ) : (
          <div className="space-y-8">
            {categories?.map((category) => {
              const availableItems = category.menu_items?.filter(item => item.is_available) || [];
              
              if (availableItems.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {availableItems.length} item{availableItems.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableItems.map((item) => (
                      <MenuItemCard 
                        key={item.id} 
                        item={item} 
                        restaurantId={restaurantId}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
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
