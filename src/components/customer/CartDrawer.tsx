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
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartDrawerProps {
  restaurantId: string;
}

export const CartDrawer = ({ restaurantId }: CartDrawerProps) => {
  const cart = useCart(restaurantId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Direct state access with detailed logging
  const cartItems = cart.cartItems;
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const hasItems = cartItems.length > 0;

  console.log('🛒 CartDrawer render:', {
    restaurantId,
    cartItemsLength: cartItems.length,
    cartCount,
    cartTotal,
    hasItems,
    isOpen
  });

  const showReloadNotification = useCallback(() => {
    console.log('🔄 Showing reload notification');
    toast({
      title: "Cart sync issue",
      description: (
        <div className="flex items-center gap-2">
          <span>Cart may be out of sync. Please reload the page.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔄 User clicked reload button');
              window.location.reload();
            }}
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reload
          </Button>
        </div>
      ),
      duration: 8000,
    });
  }, [toast]);

  const handleCheckout = useCallback(() => {
    console.log('💳 Checkout clicked:', {
      hasItems,
      cartCount,
      cartItemsLength: cartItems.length,
      cartTotal
    });
    
    // Double-check cart state
    if (!hasItems || cartCount === 0 || cartItems.length === 0) {
      console.log('🚫 Cart appears empty, attempting sync');
      
      // Try to sync cart first
      const synced = cart.syncCart();
      
      // Check again after sync
      setTimeout(() => {
        const newItems = cart.cartItems;
        const newCount = newItems.reduce((count, item) => count + item.quantity, 0);
        
        console.log('🔍 After sync check:', {
          synced,
          newItemsLength: newItems.length,
          newCount
        });
        
        if (!synced || newItems.length === 0 || newCount === 0) {
          console.log('❌ Cart is still empty after sync');
          toast({
            title: "Cart is empty",
            description: "Please add some items to your cart before checkout.",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }
        
        console.log('✅ Cart has items after sync, proceeding to checkout');
        setIsOpen(false);
        navigate(`/checkout?restaurantId=${restaurantId}`);
      }, 200);
      
      return;
    }
    
    console.log('✅ Cart has items, proceeding to checkout');
    setIsOpen(false);
    navigate(`/checkout?restaurantId=${restaurantId}`);
  }, [hasItems, cartCount, cartItems.length, cartTotal, cart, toast, navigate, restaurantId]);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('🔄 CartDrawer updating quantity:', { itemId, quantity, customizations });
    
    try {
      cart.updateQuantity(itemId, quantity, customizations);
      
      // Verify update after a delay
      setTimeout(() => {
        const updatedItem = cart.cartItems.find(item => 
          item.id === itemId && item.customizations === customizations
        );
        
        console.log('🔍 Quantity update verification:', {
          expected: quantity,
          found: updatedItem,
          actual: updatedItem?.quantity
        });
        
        if (quantity > 0 && (!updatedItem || updatedItem.quantity !== quantity)) {
          console.error('❌ Quantity update verification failed');
          showReloadNotification();
          return;
        }
        
        if (quantity === 0 && updatedItem) {
          console.error('❌ Item should be removed but still exists');
          showReloadNotification();
          return;
        }
        
        console.log('✅ Quantity update verified successfully');
        toast({
          title: "Quantity updated",
          description: "Item quantity has been updated in your cart.",
          duration: 2000,
        });
      }, 150);
      
    } catch (error) {
      console.error('❌ Error updating quantity in CartDrawer:', error);
      showReloadNotification();
    }
  }, [cart, toast, showReloadNotification]);

  const handleRemoveItem = useCallback((itemId: string, customizations?: string) => {
    console.log('🗑️ CartDrawer removing item:', { itemId, customizations });
    
    try {
      cart.removeFromCart(itemId, customizations);
      
      // Verify removal after a delay
      setTimeout(() => {
        const removedItem = cart.cartItems.find(item => 
          item.id === itemId && item.customizations === customizations
        );
        
        console.log('🔍 Item removal verification:', {
          itemId,
          customizations,
          stillExists: !!removedItem
        });
        
        if (removedItem) {
          console.error('❌ Item removal verification failed - item still exists');
          showReloadNotification();
          return;
        }
        
        console.log('✅ Item removal verified successfully');
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
          duration: 2000,
        });
      }, 150);
      
    } catch (error) {
      console.error('❌ Error removing item in CartDrawer:', error);
      showReloadNotification();
    }
  }, [cart, toast, showReloadNotification]);

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
                Proceed to Checkout ({cartCount} items)
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
