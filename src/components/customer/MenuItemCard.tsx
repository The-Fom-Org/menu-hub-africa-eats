
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { CustomerMenuItem } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { MenuItemCustomizationDialog } from './MenuItemCustomizationDialog';
import { useToast } from '@/components/ui/use-toast';

interface MenuItemCardProps {
  item: CustomerMenuItem;
  restaurantId: string;
}

export const MenuItemCard = ({ item, restaurantId }: MenuItemCardProps) => {
  const { addToCart, cartItems, updateQuantity, cartVersion } = useCart(restaurantId);
  const { toast } = useToast();
  const [showCustomization, setShowCustomization] = useState(false);
  const [, forceUpdate] = useState(0);

  // Force re-render when cart changes
  useEffect(() => {
    forceUpdate(prev => prev + 1);
  }, [cartVersion, cartItems]);

  // Find cart item without customizations for the quick add/remove buttons
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id && !cartItem.customizations);
  const quantity = cartItem?.quantity || 0;

  console.log(`MenuItemCard ${item.name} - quantity:`, quantity, 'cartItems:', cartItems.length);

  const handleAddToCart = useCallback((customizations?: string, specialInstructions?: string) => {
    console.log('Adding item to cart:', item.name, customizations, specialInstructions);
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      customizations,
      special_instructions: specialInstructions,
    });

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
      duration: 2000,
    });
  }, [addToCart, item, toast]);

  const handleQuickAdd = useCallback(() => {
    console.log('Quick add clicked for:', item.name, 'current quantity:', quantity);
    if (quantity === 0) {
      handleAddToCart();
    } else {
      updateQuantity(item.id, quantity + 1);
      toast({
        title: "Quantity updated",
        description: `${item.name} quantity increased`,
        duration: 1500,
      });
    }
  }, [quantity, handleAddToCart, updateQuantity, item, toast]);

  const handleDecrease = useCallback(() => {
    console.log('Decrease clicked for:', item.name, 'current quantity:', quantity);
    if (quantity > 0) {
      updateQuantity(item.id, quantity - 1);
      toast({
        title: "Quantity updated",
        description: quantity === 1 ? `${item.name} removed from cart` : `${item.name} quantity decreased`,
        duration: 1500,
      });
    }
  }, [quantity, updateQuantity, item, toast]);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-warm transition-all duration-300">
        {item.image_url && (
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              {item.name}
            </CardTitle>
            <Badge variant="secondary" className="ml-2">
              KSh {item.price.toFixed(2)}
            </Badge>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {item.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomization(true)}
              className="flex-1 mr-2"
            >
              Customize
            </Button>
            
            {quantity === 0 ? (
              <Button
                onClick={handleQuickAdd}
                size="sm"
                className="px-4"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrease}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickAdd}
                  className="h-8 w-8 p-0"
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
