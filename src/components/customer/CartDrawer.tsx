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
  orderingEnabled?: boolean;
}

export const CartDrawer = ({ restaurantId, orderingEnabled = true }: CartDrawerProps) => {
  const cart = useCart(restaurantId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('🛒 CartDrawer render state:', {
    restaurantId,
    cartItemsLength: cart.cartItems.length,
    lastSyncTime: cart.lastSyncTime,
    cartItems: cart.cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
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

  const handleEmergencyReset = useCallback(() => {
    console.log('🚨 Emergency cart reset triggered');
    cart.resetCart();
    toast({
      title: "Cart reset",
      description: "Your cart has been completely reset.",
      duration: 2000,
    });
  }, [cart, toast]);

  const handleCheckout = useCallback(() => {
    if (!orderingEnabled) {
      toast({
        title: "Ordering Unavailable", 
        description: "This restaurant is not currently accepting orders",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    console.log('💳 ===== CHECKOUT PROCESS START =====');
    console.log('💳 React state before validation:', {
      cartItemsLength: cart.cartItems.length,
      cartItems: cart.cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
      reactStateCount: cart.getCartCount(),
      reactStateTotal: cart.getCartTotal(),
      reactStateHasItems: cart.hasItems()
    });
    
    // Get latest cart state directly from localStorage
    const latestItems = cart.getLatestCartState();
    console.log('💳 Latest localStorage state:', {
      latestItemsLength: latestItems.length,
      latestItems: latestItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
      latestCount: cart.getCartCount(latestItems),
      latestTotal: cart.getCartTotal(latestItems),
      latestHasItems: cart.hasItems(latestItems)
    });
    
    // Validate cart state
    const validation = cart.validateCartState();
    console.log('💳 Cart validation result:', {
      isValid: validation.isValid,
      issues: validation.issues,
      validationLatestItems: validation.latestItems.length,
      validationItems: validation.latestItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
    });

    // Additional calculations for debugging
    const latestCount = cart.getCartCount(latestItems);
    const latestHasItems = cart.hasItems(latestItems);
    const reactStateEmpty = cart.cartItems.length === 0;
    const latestStateEmpty = latestItems.length === 0;
    const countIsZero = latestCount === 0;
    
    console.log('💳 Detailed empty checks:', {
      reactStateEmpty,
      latestStateEmpty,
      countIsZero,
      latestCount,
      latestHasItems,
      'latestItems.length === 0': latestItems.length === 0,
      'latestCount === 0': latestCount === 0,
      '!latestHasItems': !latestHasItems
    });

    // If validation fails, offer recovery options
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
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Cart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmergencyReset}
                className="text-xs"
              >
                Reset Cart
              </Button>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
      return;
    }

    // Check if cart is actually empty using latest data
    console.log('💳 Final empty check conditions:');
    console.log('💳 - latestItems.length === 0:', latestItems.length === 0);
    console.log('💳 - latestCount === 0:', latestCount === 0);
    console.log('💳 - !latestHasItems:', !latestHasItems);
    console.log('💳 - Combined empty condition:', latestItems.length === 0 || latestCount === 0 || !latestHasItems);
    
    if (latestItems.length === 0 || latestCount === 0 || !latestHasItems) {
      console.log('❌ ===== CART DEEMED EMPTY =====');
      console.log('❌ Empty check details:', {
        'latestItems.length': latestItems.length,
        'latestItems.length === 0': latestItems.length === 0,
        latestCount,
        'latestCount === 0': latestCount === 0,
        latestHasItems,
        '!latestHasItems': !latestHasItems,
        'Final condition': latestItems.length === 0 || latestCount === 0 || !latestHasItems
      });
      
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart before checkout.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Cart is valid - proceed to checkout
    console.log('✅ ===== CART VALIDATION PASSED =====');
    console.log('✅ Proceeding to checkout with:', {
      itemsCount: latestItems.length,
      totalQuantity: latestCount,
      hasItems: latestHasItems
    });
    
    setIsOpen(false);
    navigate(`/checkout?restaurantId=${restaurantId}`);
  }, [cart, toast, navigate, restaurantId, handleManualSync, handleEmergencyReset]);

  const handleUpdateQuantity = useCallback(async (itemId: string, quantity: number, customizations?: string) => {
    console.log('🔄 CartDrawer updating quantity:', { itemId, quantity, customizations });
    
    if (isProcessing) {
      console.log('⏳ Already processing, skipping...');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const success = cart.updateQuantity(itemId, quantity, customizations);
      
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
      const success = cart.removeFromCart(itemId, customizations);
      
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

  // Use single calculations per render to avoid inconsistencies
  const cartItems = cart.cartItems;
  const totalCount = cart.getCartCount();
  const totalAmount = cart.getCartTotal();
  const isEmpty = cartItems.length === 0 || totalCount === 0;

  console.log('📊 CartDrawer final state:', { 
    cartItemsLength: cartItems.length, 
    totalCount, 
    totalAmount, 
    isEmpty 
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant={!isEmpty ? "default" : "outline"}
          size="sm"
          disabled={!orderingEnabled}
          className={`relative ${
            orderingEnabled 
              ? "" 
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {totalCount > 0 && orderingEnabled && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {totalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Your Order</SheetTitle>
              <SheetDescription>
                {!orderingEnabled 
                  ? 'Ordering is currently disabled' 
                  : isEmpty 
                  ? 'Your cart is empty' 
                  : 'Review your items before checkout'
                }
              </SheetDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualSync}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEmergencyReset}
                className="text-xs text-destructive hover:text-destructive"
              >
                Reset
              </Button>
            </div>
          </div>
        </SheetHeader>

        {isEmpty ? (
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
                disabled={isEmpty || isProcessing || !orderingEnabled}
              >
                {isProcessing ? 'Processing...' : 
                 !orderingEnabled ? 'Ordering Disabled' :
                 `Proceed to Checkout (${totalCount} items)`}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
