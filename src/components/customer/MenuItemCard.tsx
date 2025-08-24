
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
  const cart = useCart(restaurantId);
  const { toast } = useToast();
  const [showCustomization, setShowCustomization] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Find cart item without customizations for the quick add/remove buttons
  const cartItem = cart.cartItems.find(cartItem => cartItem.id === item.id && !cartItem.customizations);
  const currentQuantity = cartItem?.quantity || 0;

  console.log('🍽️ MenuItemCard render:', {
    itemId: item.id,
    itemName: item.name,
    currentQuantity,
    cartItem: cartItem ? 'found' : 'not found',
    isProcessing,
    cartLastSync: cart.lastSyncTime
  });

  const handleAddToCart = useCallback(async (customizations?: string, specialInstructions?: string) => {
    console.log('➕ MenuItemCard: Starting add to cart process:', {
      itemId: item.id,
      itemName: item.name,
      customizations,
      specialInstructions
    });

    if (isProcessing) {
      console.log('⏳ Already processing, skipping...');
      return;
    }

    setIsProcessing(true);

    try {
      const success = await cart.addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        customizations,
        special_instructions: specialInstructions,
      });

      if (success) {
        console.log('✅ Item successfully added to cart');
        toast({
          title: "Added to cart",
          description: `${item.name} has been added to your cart.`,
          duration: 2000,
        });
      } else {
        console.error('❌ Failed to add item to cart');
        toast({
          title: "Error",
          description: "Failed to add item to cart. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Error in add to cart process:', error);
      toast({
        title: "Error",
        description: "Problem adding the item to the cart. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cart, item, toast, isProcessing]);

  const handleQuickAdd = useCallback(async () => {
    console.log('⚡ Quick add clicked for item:', item.id);
    await handleAddToCart();
  }, [handleAddToCart]);

  const handleDecrease = useCallback(async () => {
    console.log('➖ Decrease clicked for item:', { itemId: item.id, currentQuantity });
    
    if (currentQuantity > 0 && !isProcessing) {
      setIsProcessing(true);
      
      try {
        const newQuantity = currentQuantity - 1;
        const success = await cart.updateQuantity(item.id, newQuantity);
        
        if (success) {
          if (newQuantity === 0) {
            console.log('✅ Item successfully removed from cart');
            toast({
              title: "Quantity updated",
              description: `${item.name} removed from cart.`,
              duration: 1000,
            });
          } else {
            console.log('✅ Quantity successfully decreased');
            toast({
              title: "Quantity updated", 
              description: `${item.name} quantity decreased.`,
              duration: 1000,
            });
          }
        } else {
          console.error('❌ Failed to update quantity');
          toast({
            title: "Error",
            description: "Failed to update quantity. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('❌ Error updating quantity:', error);
        toast({
          title: "Error",
          description: "Failed to update quantity. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [currentQuantity, cart, item, toast, isProcessing]);

  // Use imported image with fallback
  const getImageSrc = () => {
    if (item.image_url) {
      // If it's a relative path to assets, convert it to import
      if (item.image_url.startsWith('/src/assets/') || item.image_url.startsWith('src/assets/')) {
        try {
          // For Vite, we need to use dynamic imports for assets
          return item.image_url.replace('/src/assets/', '/src/assets/').replace('src/assets/', '/src/assets/');
        } catch (error) {
          console.error('Error loading asset image:', error);
          return null;
        }
      }
      return item.image_url;
    }
    return null;
  };

  const imageSrc = getImageSrc();

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-background/80 backdrop-blur-sm">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.fallback-emoji')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'fallback-emoji w-full h-full flex items-center justify-center text-4xl';
                  fallback.textContent = '🍽️';
                  parent.appendChild(fallback);
                }
              }}
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
              className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0 shadow-sm text-xs"
            >
              {getBadgeIcon(item.popularity_badge)}
              <span className="ml-1 font-medium">
                {getBadgeText(item.popularity_badge)}
              </span>
            </Badge>
          )}

          {/* Chef's Special Badge */}
          {item.is_chef_special && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 bg-secondary/90 text-secondary-foreground border-0 shadow-sm text-xs"
            >
              <Star className="h-3 w-3 fill-current mr-1" />
              <span className="font-medium">Special</span>
            </Badge>
          )}
        </div>
        
        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="space-y-2">
            {/* Item Name */}
            <h3 className="font-bold text-sm sm:text-lg leading-tight text-foreground line-clamp-2">
              {item.name}
            </h3>
            
            {/* Persuasion Description */}
            {item.persuasion_description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 font-medium">
                {item.persuasion_description}
              </p>
            )}
            
            {/* Regular Description */}
            {item.description && !item.persuasion_description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-xl font-bold text-primary">
                KSh {item.price.toFixed(2)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3 sm:pb-4 px-3 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Customize Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomization(true)}
              className="flex-1 rounded-full border-muted-foreground/20 hover:bg-muted text-xs sm:text-sm"
              disabled={isProcessing}
            >
              Customize
            </Button>
            
            {/* Add/Quantity Controls */}
            {currentQuantity === 0 ? (
              <Button
                onClick={handleQuickAdd}
                size="sm"
                className="px-4 sm:px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm"
                disabled={isProcessing}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {isProcessing ? 'Adding...' : 'Add'}
              </Button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 bg-muted rounded-full p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDecrease}
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-background"
                  disabled={isProcessing}
                >
                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="text-xs sm:text-sm font-bold w-6 sm:w-8 text-center">
                  {currentQuantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickAdd}
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-background"
                  disabled={isProcessing}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
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
