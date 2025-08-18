
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
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
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
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  // Force re-render when cart changes
  useEffect(() => {
    const count = cart.getCartCount();
    const total = cart.getCartTotal();
    setCartCount(count);
    setCartTotal(total);
    console.log('Cart updated - count:', count, 'total:', total, 'items:', cart.cartItems.length);
  }, [cart.cartItems, cart.updateTrigger]);

  const handleCheckout = () => {
    if (cartCount === 0) return;
    setIsOpen(false);
    navigate(`/checkout?restaurantId=${restaurantId}`);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number, customizations?: string) => {
    cart.updateQuantity(itemId, quantity, customizations);
    toast({
      title: "Quantity updated",
      description: "Please reload the page for the cart to update.",
      duration: 2000,
    });
  };

  const handleRemoveItem = (itemId: string, customizations?: string) => {
    cart.removeFromCart(itemId, customizations);
    toast({
      title: "Item removed",
      description: "Please reload the page for the cart to update.",
      duration: 2000,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={cartCount > 0 ? "default" : "outline"} 
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
            {cartCount === 0 ? 'Your cart is empty' : 'Review your items before checkout'}
          </SheetDescription>
        </SheetHeader>

        {cartCount === 0 ? (
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
                {cart.cartItems.map((item, index) => (
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
                    {index < cart.cartItems.length - 1 && <Separator />}
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
                disabled={cartCount === 0}
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
