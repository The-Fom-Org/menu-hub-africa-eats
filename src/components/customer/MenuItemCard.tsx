
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Star, Flame, Trophy } from 'lucide-react';
import { CustomerMenuItem } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { MenuItemCustomizationDialog } from './MenuItemCustomizationDialog';
import { useToast } from '@/hooks/use-toast';

interface MenuItemCardProps {
  item: CustomerMenuItem;
  restaurantId: string;
}

const getBadgeIcon = (badge: string) => {
  switch (badge) {
    case 'most-popular':
      return <Star className="h-3 w-3 fill-current" />;
    case 'chef-pick':
      return <Flame className="h-3 w-3" />;
    case 'bestseller':
      return <Trophy className="h-3 w-3" />;
    default:
      return null;
  }
};

const getBadgeText = (badge: string) => {
  switch (badge) {
    case 'most-popular':
      return 'Most Popular';
    case 'chef-pick':
      return "Chef's Pick";
    case 'bestseller':
      return 'Bestseller';
    default:
      return '';
  }
};

export const MenuItemCard = ({ item, restaurantId }: MenuItemCardProps) => {
  const { addToCart, cartItems, updateQuantity, updateTrigger } = useCart(restaurantId);
  const { toast } = useToast();
  const [showCustomization, setShowCustomization] = useState(false);

  // Find cart item without customizations for the quick add/remove buttons
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id && !cartItem.customizations);
  const quantity = cartItem?.quantity || 0;

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
      description: `${item.name} has been added to your cart.`,
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
        description: `${item.name} quantity increased.`,
        duration: 2000,
      });
    }
  }, [quantity, handleAddToCart, updateQuantity, item, toast]);

  const handleDecrease = useCallback(() => {
    if (quantity > 0) {
      updateQuantity(item.id, quantity - 1);
      toast({
        title: "Quantity updated",
        description: quantity === 1 ? `${item.name} removed from cart.` : `${item.name} quantity decreased.`,
        duration: 2000,
      });
    }
  }, [quantity, updateQuantity, item, toast]);

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-background/80 backdrop-blur-sm">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🍽️
            </div>
          )}
          
          {/* Popularity Badge */}
          {item.popularity_badge && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0 shadow-sm"
            >
              {getBadgeIcon(item.popularity_badge)}
              <span className="ml-1 text-xs font-medium">
                {getBadgeText(item.popularity_badge)}
              </span>
            </Badge>
          )}

          {/* Chef's Special Badge */}
          {item.is_chef_special && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 bg-secondary/90 text-secondary-foreground border-0 shadow-sm"
            >
              <Star className="h-3 w-3 fill-current mr-1" />
              <span className="text-xs font-medium">Special</span>
            </Badge>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <div className="space-y-2">
            {/* Item Name */}
            <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-2">
              {item.name}
            </h3>
            
            {/* Persuasion Description */}
            {item.persuasion_description && (
              <p className="text-sm text-muted-foreground line-clamp-2 font-medium">
                {item.persuasion_description}
              </p>
            )}
            
            {/* Regular Description */}
            {item.description && !item.persuasion_description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary">
                KSh {item.price.toFixed(2)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <div className="flex items-center gap-2">
            {/* Customize Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomization(true)}
              className="flex-1 rounded-full border-muted-foreground/20 hover:bg-muted"
            >
              Customize
            </Button>
            
            {/* Add/Quantity Controls */}
            {quantity === 0 ? (
              <Button
                onClick={handleQuickAdd}
                size="sm"
                className="px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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
                  <Minus className="h-4 w-4" />
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
                  <Plus className="h-4 w-4" />
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
