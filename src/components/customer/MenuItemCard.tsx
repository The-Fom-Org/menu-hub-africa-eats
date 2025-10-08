import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Star, Flame, Trophy, ShoppingCart } from "lucide-react";
import { CustomerMenuItem } from "@/hooks/useCustomerMenuData";
import { useCart } from "@/hooks/useCart";
import { MenuItemCustomizationDialog } from "./MenuItemCustomizationDialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface MenuItemCardProps {
  item: CustomerMenuItem;
  restaurantId: string;
  orderingEnabled?: boolean;
}

const appetite = {
  primary: "#E76F51", // terracotta
  accent: "#6A994E",  // olive
  cream: "#FFF8F1",   // background
};

const getBadgeIcon = (badge: string) => {
  switch (badge) {
    case "most-popular":
      return <Star className="h-3 w-3 fill-current" />;
    case "chef-pick":
      return <Flame className="h-3 w-3" />;
    case "bestseller":
      return <Trophy className="h-3 w-3" />;
    default:
      return null;
  }
};

const getBadgeText = (badge: string) => {
  switch (badge) {
    case "most-popular":
      return "Most Popular";
    case "chef-pick":
      return "Chef's Pick";
    case "bestseller":
      return "Bestseller";
    default:
      return "";
  }
};

export const MenuItemCard = ({ item, restaurantId, orderingEnabled = true }: MenuItemCardProps) => {
  console.log('🍽️ MenuItemCard render:', { itemName: item.name, restaurantId, orderingEnabled });
  const cart = useCart(restaurantId);
  const { toast } = useToast();
  const [showCustomization, setShowCustomization] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const cartItem = cart.cartItems.find(
    (cartItem) => cartItem.id === item.id && !cartItem.customizations
  );
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = useCallback(
    (customizations?: string, specialInstructions?: string) => {
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
      } finally {
        setIsProcessing(false);
      }
    },
    [cart, item, toast, isProcessing]
  );

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
            description:
              newQuantity === 0
                ? `${item.name} removed from cart.`
                : `${item.name} quantity updated.`,
            duration: 1200,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update quantity. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      } finally {
        setIsProcessing(false);
      }
    }
  }, [currentQuantity, cart, item, toast, isProcessing]);

  const imageSrc = item.image_url || null;

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="w-full h-full flex flex-col overflow-hidden rounded-2xl bg-white border shadow-sm hover:shadow-lg transition-all duration-300 min-w-0"
        style={{ borderColor: "#00000010" }}
      >
        {/* Image */}
        <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector(".fallback-emoji")) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "fallback-emoji w-full h-full flex items-center justify-center text-xl sm:text-2xl bg-muted";
                  fallback.textContent = "🍽️";
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl bg-muted">
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

          {/* Chef’s Special Badge */}
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

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <CardHeader className="pb-2 px-3 pt-3 text-left">
            <h3 className="font-bold text-base leading-tight line-clamp-2">
              {item.name}
            </h3>

            {/* Description */}
            {item.persuasion_description ? (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2 font-medium">
                {item.persuasion_description}
              </p>
            ) : item.description ? (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            ) : null}

            {/* Price */}
            <div className="mt-2 text-lg font-extrabold" style={{ color: appetite.primary }}>
              KSh {item.price.toFixed(2)}
            </div>
          </CardHeader>

          {/* Actions */}
          <CardContent className="pt-0 pb-3 px-3 mt-auto">
            {orderingEnabled ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomization(true)}
                  className="flex-1 rounded-full border-muted-foreground/20 hover:bg-muted text-xs h-8 px-2 sm:px-3 min-w-0"
                  disabled={isProcessing}
                >
                  <span className="truncate">Customize</span>
                </Button>

                {currentQuantity === 0 ? (
                  <Button
                    onClick={handleQuickAdd}
                    size="sm"
                    className="px-2 sm:px-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-xs h-8 min-w-0 flex-shrink-0"
                    style={{ background: appetite.primary, color: "white" }}
                    disabled={isProcessing}
                  >
                    <ShoppingCart className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">{isProcessing ? "Adding…" : "Add"}</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDecrease}
                      className="h-6 w-6 p-0 rounded-full hover:bg-background"
                      disabled={isProcessing}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold w-5 text-center">
                      {currentQuantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleQuickAdd}
                      className="h-6 w-6 p-0 rounded-full hover:bg-background"
                      disabled={isProcessing}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <Badge variant="secondary" className="text-xs">
                  Ordering Disabled
                </Badge>
              </div>
            )}
          </CardContent>
        </div>
      </motion.div>

      {orderingEnabled && (
        <MenuItemCustomizationDialog
          item={item}
          open={showCustomization}
          onOpenChange={setShowCustomization}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
};
