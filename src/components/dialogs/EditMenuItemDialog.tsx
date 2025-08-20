
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MenuItem, useMenuData } from '@/hooks/useMenuData';
import { useToast } from '@/hooks/use-toast';

interface EditMenuItemDialogProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditMenuItemDialog = ({ item, open, onOpenChange }: EditMenuItemDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [persuasionDescription, setPersuasionDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSpecial, setIsSpecial] = useState(false);
  const [popularityBadge, setPopularityBadge] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { updateMenuItem, deleteMenuItem } = useMenuData();
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setPersuasionDescription((item as any).persuasion_description || '');
      setPrice(item.price.toString());
      setImageUrl(item.image_url || '');
      setIsAvailable(item.is_available);
      setIsSpecial((item as any).is_special || false);
      setPopularityBadge((item as any).popularity_badge || '');
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !name.trim() || !price) return;

    setIsLoading(true);
    try {
      const result = await updateMenuItem(item.id, {
        name: name.trim(),
        description: description.trim(),
        persuasion_description: persuasionDescription.trim(),
        price: parseFloat(price),
        image_url: imageUrl.trim() || undefined,
        is_available: isAvailable,
        is_special: isSpecial,
        popularity_badge: popularityBadge || undefined,
      });

      if (result) {
        toast({
          title: "Menu item updated",
          description: `${name} has been updated.`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      const result = await deleteMenuItem(item.id);
      if (result) {
        toast({
          title: "Menu item deleted",
          description: `${item.name} has been removed from your menu.`,
        });
        onOpenChange(false);
      }
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="available">Available</Label>
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

          <div className="flex justify-between pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Item
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Item'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
