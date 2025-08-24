
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
import { ShoppingCart, Plus, Minus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartDrawerProps {
  restaurantId: string;
}

export const CartDrawer = ({ restaurantId }: CartDrawerProps) => {
  const cart = useCart(restaurantId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Direct cart values - no memoization to avoid stale state
  const cartItems = cart.cartItems || [];
  const totalCount = cart.getCartCount();
  const totalAmount = cart.getCartTotal();
  const hasCartItems = cart.hasItems();
  const isEmpty = cartItems.length === 0 || totalCount === 0;

  console.log('🛒 CartDrawer render state:', {
    restaurantId,
    cartItemsLength: cartItems.length,
    totalCount,
    totalAmount,
    hasCartItems,
    isEmpty,
    lastSyncTime: cart.lastSyncTime,
    cartItems: cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
  });

  const handleManualSync = useCallback(() => {
    console.log('🔄 Manual cart sync triggered');
    const success = cart.forceRefresh();
    
    if (success) {
      toast({
        title: "Cart synced",
        description: "Your cart has been refreshed successfully.",
        duration: 2000,
      });
    } else {
      toast({
        title: "Sync failed", 
        description: "Failed to sync cart. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [cart, toast]);

  const handleCheckout = useCallback(async () => {
    console.log('💳 Checkout process starting');
    
    // Force refresh cart before checkout validation
    console.log('🔄 Force refreshing cart before checkout');
    const refreshSuccess = cart.forceRefresh();
    
    if (!refreshSuccess) {
      console.error('❌ Failed to refresh cart before checkout');
      toast({
        title: "Cart sync error",
        description: "Please refresh the cart and try again.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Wait a moment for state to update, then validate
    setTimeout(() => {
      const validation = cart.validateCartState();
      const currentItems = cart.cartItems || [];
      const currentCount = cart.getCartCount();
      const currentHasItems = cart.hasItems();
      
      console.log('🔍 Pre-checkout validation:', {
        validation,
        currentItemsLength: currentItems.length,
        currentCount,
        currentHasItems,
        items: currentItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
      });

      if (!validation.isValid) {
        console.error('❌ Cart validation failed:', validation.issues);
        toast({
          title: "Cart validation failed",
          description: (
            <div className="space-y-2">
              <p>Cart state is inconsistent:</p>
              <ul className="text-xs">
                {validation.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Cart
              </Button>
            </div>
          ),
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      // Final check - use fresh cart state
      if (currentItems.length === 0 || currentCount === 0 || !currentHasItems) {
        console.log('❌ Cart is empty after validation - Current state:', {
          itemsLength: currentItems.length,
          count: currentCount,
          hasItems: currentHasItems
        });
        toast({
          title: "Cart is empty",
          description: "Please add some items to your cart before checkout.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // If we reach here, cart is valid - proceed to checkout
      console.log('✅ Cart validation passed, proceeding to checkout');
      setIsOpen(false);
      navigate(`/checkout?restaurantId=${restaurantId}`);
    }, 100);
  }, [cart, toast, navigate, restaurantId, handleManualSync]);

  const handleUpdateQuantity = useCallback(async (itemId: string, quantity: number, customizations?: string) => {
    console.log('🔄 CartDrawer updating quantity:', { itemId, quantity, customizations });
    
    if (isProcessing) {
      console.log('⏳ Already processing, skipping...');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const success = await cart.updateQuantity(itemId, quantity, customizations);
      
      if (success) {
        console.log('✅ Quantity update successful');
        toast({
          title: "Quantity updated",
          description: quantity === 0 ? "Item removed from cart." : "Item quantity has been updated in your cart.",
          duration: 2000,
        });
      } else {
        console.error('❌ Quantity update failed');
        toast({
          title: "Error",
          description: "Failed to update quantity. Please try syncing your cart.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Error updating quantity in CartDrawer:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try syncing your cart.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cart, toast, isProcessing]);

  const handleRemoveItem = useCallback(async (itemId: string, customizations?: string) => {
    console.log('🗑️ CartDrawer removing item:', { itemId, customizations });
    
    if (isProcessing) {
      console.log('⏳ Already processing, skipping...');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const success = await cart.removeFromCart(itemId, customizations);
      
      if (success) {
        console.log('✅ Item removal successful');
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
          duration: 2000,
        });
      } else {
        console.error('❌ Item removal failed');
        toast({
          title: "Error",
          description: "Failed to remove item. Please try syncing your cart.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Error removing item in CartDrawer:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try syncing your cart.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cart, toast, isProcessing]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={!isEmpty ? "default" : "outline"} 
          size="sm" 
          className="relative"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {totalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Your Order</SheetTitle>
              <SheetDescription>
                {isEmpty ? 'Your cart is empty' : 'Review your items before checkout'}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSync}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync
            </Button>
          </div>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">Add some delicious items to get started!</p>
              {cartItems.length !== totalCount && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Cart state mismatch detected</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSync}
                    className="mt-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Fix Cart
                  </Button>
                </div>
              )}
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
                          disabled={isProcessing}
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
                          disabled={isProcessing}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.customizations)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          disabled={isProcessing}
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
                <span className="font-bold text-lg">KSh {totalAmount.toFixed(2)}</span>
              </div>
              
              <Button 
                onClick={handleCheckout}
                className="w-full"
                size="lg"
                disabled={isEmpty || isProcessing}
              >
                {isProcessing ? 'Processing...' : `Proceed to Checkout (${totalCount} items)`}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
