
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { MenuItemCustomizationDialog } from './MenuItemCustomizationDialog';

interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
  };
  restaurantId: string;
}

export const MenuItemCard = ({ item, restaurantId }: MenuItemCardProps) => {
  const { addToCart, cartItems, updateQuantity } = useCart(restaurantId);
  const [quantity, setQuantity] = useState(1);
  const [showCustomization, setShowCustomization] = useState(false);

  // Find cart item by ID and customizations
  const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
  const cartQuantity = cartItem?.quantity || 0;

  console.log('MenuItemCard - item:', item.name, 'cartQuantity:', cartQuantity, 'cartItems:', cartItems);

  const handleAddToCart = (customizations?: string, specialInstructions?: string) => {
    console.log('Adding to cart with reload:', item.name, 'customizations:', customizations);
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      customizations,
      special_instructions: specialInstructions,
    });
    // Reload is handled by the useCart hook's addToCart function
  };

  const handleQuantityChange = (newQuantity: number) => {
    console.log('Updating quantity with reload for:', item.name, 'from', cartQuantity, 'to', newQuantity);
    updateQuantity(item.id, newQuantity);
    // Reload is handled by the useCart hook's updateQuantity function
  };

  if (!item.is_available) {
    return (
      <Card className="opacity-50">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              )}
            </div>
            {item.image_url && (
              <div className="ml-4 flex-shrink-0">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-primary">
              KSh {item.price.toFixed(2)}
            </span>
            <Badge variant="secondary">Unavailable</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              )}
            </div>
            {item.image_url && (
              <div className="ml-4 flex-shrink-0">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-primary">
              KSh {item.price.toFixed(2)}
            </span>
            
            {cartQuantity > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(cartQuantity - 1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium w-8 text-center">{cartQuantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(cartQuantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowCustomization(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to Cart
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <MenuItemCustomizationDialog
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        onAddToCart={handleAddToCart}
        item={item}
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
    </>
  );
};
