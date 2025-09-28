
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Wine } from 'lucide-react';
import { CustomerMenuItem } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

interface UpsellSectionProps {
  restaurantId: string;
  allItems: CustomerMenuItem[];
  currentCartItems: any[];
  orderingEnabled?: boolean;
}

export const UpsellSection = ({ restaurantId, allItems, currentCartItems, orderingEnabled = true }: UpsellSectionProps) => {
  const { addToCart } = useCart(restaurantId);
  const { toast } = useToast();

  // Don't show upsell if ordering is disabled
  if (!orderingEnabled) return null;

  // Filter items for upsell - drinks, desserts, and high-margin items
  const upsellItems = allItems.filter(item => {
    const category = item.category_name?.toLowerCase() || '';
    const name = item.name.toLowerCase();
    
    return (
      item.is_available &&
      (category.includes('drink') || 
       category.includes('dessert') || 
       category.includes('beverage') ||
       name.includes('combo') ||
       name.includes('special')) &&
      !currentCartItems.some(cartItem => cartItem.id === item.id)
    );
  }).slice(0, 3); // Show max 3 items

  if (upsellItems.length === 0) return null;

  const handleAddUpsellItem = (item: CustomerMenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
    });

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
      duration: 2000,
    });
  };

  return (
    <div className="my-12 px-4">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wine className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Complete Your Meal</h2>
            </div>
            <p className="text-muted-foreground">
              Perfect pairings to make your meal even better
            </p>
          </div>

          {/* Upsell Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upsellItems.map((item, index) => (
              <div 
                key={item.id} 
                className={`relative bg-background/80 backdrop-blur-sm rounded-xl p-4 border hover:shadow-md transition-all duration-200 ${
                  index === 1 ? 'ring-2 ring-primary/50 scale-105' : '' // Highlight middle option
                }`}
              >
                {/* Most Popular Badge for middle item */}
                {index === 1 && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}

                {/* Item Image */}
                <div className="aspect-square w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-muted">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  {item.persuasion_description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.persuasion_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      KSh {item.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddUpsellItem(item)}
                      className="rounded-full h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              ✨ Add any of these items to complete your perfect meal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
