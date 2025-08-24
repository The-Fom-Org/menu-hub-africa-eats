
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, RefreshCw } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartDrawerProps {
  restaurantId: string;
}

export const CartDrawer = ({ restaurantId }: CartDrawerProps) => {
  const cart = useCart(restaurantId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [lastCartUpdate, setLastCartUpdate] = useState(Date.now());

  // Force re-render when cart items change
  useEffect(() => {
    setLastCartUpdate(Date.now());
  }, [cart.cartItems]);

  // Direct state checks
  const cartItems = cart.cartItems;
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const hasItems = cartItems.length > 0;

  console.log('CartDrawer render:', {
    itemsLength: cartItems.length,
    cartCount,
    cartTotal,
    hasItems,
    lastUpdate: lastCartUpdate
  });

  const showReloadNotification = () => {
    toast({
      title: "Cart sync issue",
      description: (
        <div className="flex items-center gap-2">
          <span>Please reload the page to sync your cart</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reload
          </Button>
        </div>
      ),
      duration: 5000,
    });
  };

  const handleCheckout = () => {
    console.log('Checkout clicked:', { hasItems, cartCount, itemsLength: cartItems.length });
    
    if (!hasItems || cartCount === 0) {
      // Try to sync cart first
      const synced = cart.syncCart();
      if (!synced || cart.cartItems.length === 0) {
        toast({
          title: "Cart is empty",
          description: "Please add some items to your cart before checkout.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    }
    
    setIsOpen(false);
    navigate(`/checkout?restaurantId=${restaurantId}`);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number, customizations?: string) => {
    try {
      console.log('Updating quantity in drawer:', { itemId, quantity, customizations });
      cart.updateQuantity(itemId, quantity, customizations);
      
      // Check if update was successful after a brief delay
      setTimeout(() => {
        const updatedItem = cart.cartItems.find(item => 
          item.id === itemId && item.customizations === customizations
        );
        
        if (quantity > 0 && (!updatedItem || updatedItem.quantity !== quantity)) {
          console.error('Quantity update failed:', { expected: quantity, actual: updatedItem?.quantity });
          showReloadNotification();
          return;
        }
        
        toast({
          title: "Quantity updated",
          description: "Item quantity has been updated in your cart.",
          duration: 2000,
        });
      }, 150);
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      showReloadNotification();
    }
  };

  const handleRemoveItem = (itemId: string, customizations?: string) => {
    try {
      console.log('Removing item in drawer:', { itemId, customizations });
      cart.removeFromCart(itemId, customizations);
      
      // Check if removal was successful after a brief delay
      setTimeout(() => {
        const removedItem = cart.cartItems.find(item => 
          item.id === itemId && item.customizations === customizations
        );
        
        if (removedItem) {
          console.error('Item removal failed:', removedItem);
          showReloadNotification();
          return;
        }
        
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
          duration: 2000,
        });
      }, 150);
      
    } catch (error) {
      console.error('Error removing item:', error);
      showReloadNotification();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={hasItems ? "default" : "outline"} 
          size="sm" 
          className="relative"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {cartCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {cartCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Your Order</SheetTitle>
          <SheetDescription>
            {!hasItems ? 'Your cart is empty' : 'Review your items before checkout'}
          </SheetDescription>
        </SheetHeader>

        {!hasItems ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">Add some delicious items to get started!</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 mt-6">
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${item.customizations}-${index}`} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        {item.customizations && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.customizations}
                          </p>
                        )}
                        {item.special_instructions && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            Note: {item.special_instructions}
                          </p>
                        )}
                        <p className="text-sm font-medium text-primary mt-1">
                          KSh {item.price.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.customizations)}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.customizations)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.customizations)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {index < cartItems.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t mt-auto">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">KSh {cartTotal.toFixed(2)}</span>
              </div>
              
              <Button 
                onClick={handleCheckout}
                className="w-full"
                size="lg"
                disabled={!hasItems || cartCount === 0}
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
