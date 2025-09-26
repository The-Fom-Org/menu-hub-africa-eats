
import { Button } from '@/components/ui/button';
import { CustomerMenuCategory } from '@/hooks/useCustomerMenuData';

export const getCategoryEmoji = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  // Common category mappings
  if (name.includes('burger')) return '🍔';
  if (name.includes('pizza')) return '🍕';
  if (name.includes('wine')) return '🍷';
  if (name.includes('pork')) return '🐷';
  if (name.includes ('beef') || name.includes('mbuzi') || name.includes('meat')) return '🍖';
  if (name.includes('salad') || name.includes('green') || name.includes('vegetable')) return '🥗';
  if (name.includes('drink') || name.includes('beverage') || name.includes('juice') || name.includes('Tots') || name.includes('soda')) return '🍹';
  if (name.includes('dessert') || name.includes('sweet') || name.includes('cake') || name.includes('ice cream')) return '🍰';
  if (name.includes('chicken') || name.includes('poultry')) return '🍗';
  if (name.includes('beers')) return '🍺';
  if ( name.includes('cocktails')) return '🍸';
  if (name.includes('fish') || name.includes('seafood') || name.includes('ocean')) return '🐟';
  if (name.includes('pasta') || name.includes('noodle') || name.includes('spaghetti')) return '🍝';
  if (name.includes('soup') || name.includes('stew')) return '🍲';
  if (name.includes('rice') || name.includes('pilau') || name.includes('biryani')) return '🍚';
  if (name.includes('bread') || name.includes('chapati') || name.includes('roti')) return '🍞';
  if (name.includes('coffee') || name.includes('tea') || name.includes('chai')) return '☕';
  if (name.includes('appetizer') || name.includes('starter') || name.includes('snack')) return '🥟';
  if (name.includes('grill') || name.includes('bbq') || name.includes('nyama choma')) return '🔥';
  if (name.includes('vegetarian') || name.includes('vegan')) return '🌱';
  if (name.includes('fruit') || name.includes('fresh')) return '🍎';
  if (name.includes('breakfast') || name.includes('morning')) return '🥞';
  
  // Default emoji
  return '🍽️';
};

export const categoryEmojiMap: Record<string, string> = {
  'Burgers': '🍔',
  'Pizza': '🍕',
  'Salads': '🥗',
  'Drinks': '🍹',
  'Desserts': '🍰',
  'Chicken': '🍗',
  'Fish': '🐟',
  'Pasta': '🍝',
  'Soups': '🍲',
  'Rice': '🍚',
  'Bread': '🍞',
  'Coffee & Tea': '☕',
  'Appetizers': '🥟',
  'Grilled': '🔥',
  'Vegetarian': '🌱',
  'Fruits': '🍎',
  'Breakfast': '🥞',
};

interface CategoryEmojisProps {
  categories: CustomerMenuCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryEmojis = ({ categories, selectedCategory, onSelectCategory }: CategoryEmojisProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onSelectCategory(category.id)}
          className="flex-shrink-0 gap-2"
        >
          <span>{getCategoryEmoji(category.name)}</span>
          <span>{category.name}</span>
        </Button>
      ))}
    </div>
  );
};
