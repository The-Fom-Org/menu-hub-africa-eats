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

interface CartDrawerProps {
  restaurantId: string;
}

export const CartDrawer = ({ restaurantId }: CartDrawerProps) => {
  const { cartItems, getCartTotal, getCartCount, updateQuantity, removeFromCart } = useCart(restaurantId);
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate(`/checkout?restaurantId=${restaurantId}`);
  };

  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  if (cartCount === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="relative">
        <ShoppingCart className="h-4 w-4 mr-2" />
        Cart
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {cartCount}
          </Badge>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Order</SheetTitle>
          <SheetDescription>
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
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
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.customizations)}
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
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.customizations)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id, item.customizations)}
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

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">KSh {cartTotal.toFixed(2)}</span>
            </div>
            
            <Button 
              onClick={handleCheckout}
              className="w-full"
              size="lg"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};