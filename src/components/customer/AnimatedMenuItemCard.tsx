
import { useState, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Star, Flame, Trophy } from 'lucide-react';
import { CustomerMenuItem } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { MenuItemCustomizationDialog } from './MenuItemCustomizationDialog';
import { useToast } from '@/hooks/use-toast';
import { 
  imageVariants, 
  kenBurnsVariants, 
  priceChipVariants,
  VIEWPORT_TRIGGER 
} from '@/lib/motion-variants';

interface AnimatedMenuItemCardProps {
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

export const AnimatedMenuItemCard = ({ item, restaurantId }: AnimatedMenuItemCardProps) => {
  const cart = useCart(restaurantId);
  const { toast } = useToast();
  const [showCustomization, setShowCustomization] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const imageRef = useRef(null);
  const isImageInView = useInView(imageRef, VIEWPORT_TRIGGER);

  const cartItem = cart.cartItems.find(cartItem => cartItem.id === item.id && !cartItem.customizations);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = useCallback((customizations?: string, specialInstructions?: string) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const success = cart.addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        customizations,
        special_instructions: specialInstructions,
      });

      if (success) {
        toast({
          title: "Added to cart",
          description: `${item.name} has been added to your cart.`,
          duration: 2000,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to cart. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error in add to cart process:', error);
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

  const handleQuickAdd = useCallback(() => {
    handleAddToCart();
  }, [handleAddToCart]);

  const handleDecrease = useCallback(() => {
    if (currentQuantity > 0 && !isProcessing) {
      setIsProcessing(true);
      
      try {
        const newQuantity = currentQuantity - 1;
        const success = cart.updateQuantity(item.id, newQuantity);
        
        if (success) {
          toast({
            title: "Quantity updated",
            description: newQuantity === 0 ? `${item.name} removed from cart.` : `${item.name} quantity decreased.`,
            duration: 1000,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update quantity. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
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

  const getImageSrc = () => {
    if (item.image_url) {
      if (item.image_url.startsWith('/src/assets/') || item.image_url.startsWith('src/assets/')) {
        return item.image_url.replace('/src/assets/', '/src/assets/').replace('src/assets/', '/src/assets/');
      }
      return item.image_url;
    }
    return null;
  };

  const imageSrc = getImageSrc();

  return (
    <>
      <Card className="group overflow-hidden border-0 shadow-md bg-background/80 backdrop-blur-sm">
        {/* Image Container with Ken Burns Effect */}
        <div ref={imageRef} className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageSrc ? (
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate={isImageInView ? "visible" : "hidden"}
              className="w-full h-full"
            >
              <motion.img 
                src={imageSrc} 
                alt={item.name}
                className="w-full h-full object-cover"
                variants={kenBurnsVariants}
                initial="initial"
                animate={isImageInView ? "animate" : "initial"}
                style={{ willChange: 'transform' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement?.parentElement;
                  if (parent && !parent.querySelector('.fallback-emoji')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-emoji w-full h-full flex items-center justify-center text-4xl';
                    fallback.textContent = '🍽️';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div 
              variants={imageVariants}
              initial="hidden"
              animate={isImageInView ? "visible" : "hidden"}
              className="w-full h-full flex items-center justify-center text-4xl"
            >
              🍽️
            </motion.div>
          )}
          
          {/* Badges */}
          {item.popularity_badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Badge 
                variant="secondary" 
                className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0 shadow-sm text-xs"
              >
                {getBadgeIcon(item.popularity_badge)}
                <span className="ml-1 font-medium">
                  {getBadgeText(item.popularity_badge)}
                </span>
              </Badge>
            </motion.div>
          )}

          {item.is_chef_special && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Badge 
                variant="secondary" 
                className="absolute top-2 right-2 bg-secondary/90 text-secondary-foreground border-0 shadow-sm text-xs"
              >
                <Star className="h-3 w-3 fill-current mr-1" />
                <span className="font-medium">Special</span>
              </Badge>
            </motion.div>
          )}
        </div>
        
        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="space-y-2">
            <h3 className="font-bold text-sm sm:text-lg leading-tight text-foreground line-clamp-2">
              {item.name}
            </h3>
            
            {item.persuasion_description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 font-medium">
                {item.persuasion_description}
              </p>
            )}
            
            {item.description && !item.persuasion_description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <motion.span 
                variants={priceChipVariants}
                initial="hidden"
                animate="visible"
                className="text-lg sm:text-xl font-bold text-primary"
              >
                KSh {item.price.toFixed(2)}
              </motion.span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3 sm:pb-4 px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomization(true)}
              className="flex-1 rounded-full border-muted-foreground/20 hover:bg-muted text-xs sm:text-sm"
              disabled={isProcessing}
            >
              Customize
            </Button>
            
            {currentQuantity === 0 ? (
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleQuickAdd}
                  size="sm"
                  className="px-4 sm:px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm"
                  disabled={isProcessing}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {isProcessing ? 'Adding...' : 'Add'}
                </Button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 bg-muted rounded-full p-1">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDecrease}
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-background"
                    disabled={isProcessing}
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </motion.div>
                <span className="text-xs sm:text-sm font-bold w-6 sm:w-8 text-center">
                  {currentQuantity}
                </span>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleQuickAdd}
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-background"
                    disabled={isProcessing}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </motion.div>
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
