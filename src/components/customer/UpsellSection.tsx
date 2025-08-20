
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerMenuCategory } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

interface UpsellSectionProps {
  categories: CustomerMenuCategory[];
  restaurantId: string;
}

export const UpsellSection = ({ categories, restaurantId }: UpsellSectionProps) => {
  const { addToCart } = useCart(restaurantId);
  const { toast } = useToast();

  // Get suggested items from drinks and desserts categories
  const getSuggestedItems = () => {
    const drinksCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('drink') || 
      cat.name.toLowerCase().includes('beverage')
    );
    const dessertsCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('dessert') || 
      cat.name.toLowerCase().includes('sweet')
    );

    const suggestions = [];
    
    if (drinksCategory?.menu_items) {
      suggestions.push(...drinksCategory.menu_items.slice(0, 2));
    }
    if (dessertsCategory?.menu_items) {
      suggestions.push(...dessertsCategory.menu_items.slice(0, 1));
    }

    return suggestions.slice(0, 3);
  };

  const suggestedItems = getSuggestedItems();

  if (suggestedItems.length === 0) return null;

  const handleAddToCart = (item: any) => {
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
    <section className="py-8 bg-gradient-to-r from-accent/20 to-secondary/20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Complete Your Meal 🍷
          </h2>
          <p className="text-muted-foreground">
            Perfect additions to make your meal complete
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {suggestedItems.map((item, index) => (
            <Card 
              key={item.id} 
              className={`transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                index === 1 ? 'ring-2 ring-primary/30 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-4">
                {item.image_url && (
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    {index === 1 && ( // Highlight middle option
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  
                  {(item as any).persuasion_description && (
                    <p className="text-xs text-muted-foreground">
                      {(item as any).persuasion_description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      KSh {item.price.toFixed(2)}
                    </span>
                    <Button 
                      size="sm" 
                      variant={index === 1 ? "default" : "outline"}
                      onClick={() => handleAddToCart(item)}
                      className="text-xs px-3 py-1"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
