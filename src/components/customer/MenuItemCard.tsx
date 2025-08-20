
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { CustomerMenuItem } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { MenuItemCustomizationDialog } from './MenuItemCustomizationDialog';
import { useToast } from '@/hooks/use-toast';

interface MenuItemCardProps {
  item: CustomerMenuItem;
  restaurantId: string;
}

export const MenuItemCard = ({ item, restaurantId }: MenuItemCardProps) => {
  const { addToCart, cartItems, updateQuantity, updateTrigger } = useCart(restaurantId);
  const { toast } = useToast();
  const [showCustomization, setShowCustomization] = useState(false);

  // Find cart item without customizations for the quick add/remove buttons
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id && !cartItem.customizations);
  const quantity = cartItem?.quantity || 0;

  const getBadgeDetails = (badge: string) => {
    switch (badge) {
      case 'most_popular':
        return { text: 'Most Popular ⭐', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'chefs_pick':
        return { text: "Chef's Pick 🔥", className: 'bg-red-100 text-red-800 border-red-200' };
      case 'customer_favorite':
        return { text: 'Customer Favorite ❤️', className: 'bg-pink-100 text-pink-800 border-pink-200' };
      default:
        return null;
    }
  };

  const handleAddToCart = useCallback((customizations?: string, specialInstructions?: string) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      customizations,
      special_instructions: specialInstructions,
    });

    toast({
      title: "Added to cart",
      description: `${item.name} added successfully!`,
      duration: 2000,
    });
  }, [addToCart, item, toast]);

  const handleQuickAdd = useCallback(() => {
    if (quantity === 0) {
      handleAddToCart();
    } else {
      updateQuantity(item.id, quantity + 1);
      toast({
        title: "Quantity updated",
        description: `${item.name} quantity increased!`,
        duration: 2000,
      });
    }
  }, [quantity, handleAddToCart, updateQuantity, item, toast]);

  const handleDecrease = useCallback(() => {
    if (quantity > 0) {
      updateQuantity(item.id, quantity - 1);
      toast({
        title: "Quantity updated", 
        description: quantity === 1 ? `${item.name} removed from cart` : `${item.name} quantity decreased`,
        duration: 2000,
      });
    }
  }, [quantity, updateQuantity, item, toast]);

  const badgeDetails = getBadgeDetails((item as any).popularity_badge);

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card border border-border/50">
        {/* Image Container */}
        {item.image_url && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Badge Overlay */}
            {badgeDetails && (
              <Badge 
                variant="secondary" 
                className={`absolute top-3 left-3 ${badgeDetails.className} shadow-md`}
              >
                {badgeDetails.text}
              </Badge>
            )}
            
            {/* Price Badge */}
            <Badge 
              variant="default" 
              className="absolute bottom-3 right-3 bg-white/95 text-foreground shadow-lg text-base font-bold px-3 py-1"
            >
              KSh {item.price.toFixed(2)}
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-bold text-foreground leading-tight">
              {item.name}
            </CardTitle>
            {!item.image_url && (
              <div className="flex flex-col items-end gap-1">
                <Badge variant="default" className="text-base font-bold">
                  KSh {item.price.toFixed(2)}
                </Badge>
                {badgeDetails && (
                  <Badge variant="secondary" className={`${badgeDetails.className} text-xs`}>
                    {badgeDetails.text}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Marketing Description (Psychology-focused) */}
          {(item as any).persuasion_description ? (
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {(item as any).persuasion_description}
            </p>
          ) : item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description.length > 50 ? 
                `${item.description.substring(0, 50)}...` : 
                item.description
              }
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomization(true)}
              className="flex-1 hover:bg-accent hover:scale-105 transition-all duration-200"
            >
              Customize
            </Button>
            
            {quantity === 0 ? (
              <Button
                onClick={handleQuickAdd}
                size="sm"
                className="px-6 bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-md font-semibold"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Cart
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDecrease}
                  className="h-8 w-8 p-0 rounded-full hover:bg-background"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-bold w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickAdd}
                  className="h-8 w-8 p-0 rounded-full hover:bg-background"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <MenuItemCustomizationDialog
        item={item}
        open={showCustomization}
        onOpenChange={setShowCustomization}
        onAddToCart={handleAddToCart}
      />
    </>
  );
};
