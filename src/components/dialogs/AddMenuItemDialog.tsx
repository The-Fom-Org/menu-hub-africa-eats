
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useMenuData } from '@/hooks/useMenuData';
import { useToast } from '@/hooks/use-toast';

interface AddMenuItemDialogProps {
  categoryId: string;
  onItemAdded?: () => void;
}

export const AddMenuItemDialog = ({ categoryId, onItemAdded }: AddMenuItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [persuasionDescription, setPersuasionDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSpecial, setIsSpecial] = useState(false);
  const [popularityBadge, setPopularityBadge] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { addMenuItem } = useMenuData();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setIsLoading(true);
    try {
      const result = await addMenuItem(categoryId, {
        name: name.trim(),
        description: description.trim(),
        persuasion_description: persuasionDescription.trim(),
        price: parseFloat(price),
        image_url: imageUrl.trim() || undefined,
        is_available: true,
        is_special: isSpecial,
        popularity_badge: popularityBadge || undefined,
      });

      if (result) {
        toast({
          title: "Menu item added",
          description: `${name} has been added to your menu.`,
        });
        setOpen(false);
        resetForm();
        onItemAdded?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPersuasionDescription('');
    setPrice('');
    setImageUrl('');
    setIsSpecial(false);
    setPopularityBadge('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Grilled Chicken Burger"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the item..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="persuasion-description">Marketing Description (≤10 words)</Label>
            <Input
              id="persuasion-description"
              value={persuasionDescription}
              onChange={(e) => setPersuasionDescription(e.target.value)}
              placeholder="e.g., Smoky grilled chicken with creamy garlic sauce"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Short, sensory description for customer appeal
            </p>
          </div>

          <div>
            <Label htmlFor="price">Price (KSh) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="special"
              checked={isSpecial}
              onCheckedChange={setIsSpecial}
            />
            <Label htmlFor="special">Mark as Chef's Special</Label>
          </div>

          <div>
            <Label htmlFor="badge">Popularity Badge</Label>
            <Select value={popularityBadge} onValueChange={setPopularityBadge}>
              <SelectTrigger>
                <SelectValue placeholder="Select a badge (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No badge</SelectItem>
                <SelectItem value="most_popular">Most Popular ⭐</SelectItem>
                <SelectItem value="chefs_pick">Chef's Pick 🔥</SelectItem>
                <SelectItem value="customer_favorite">Customer Favorite ❤️</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
