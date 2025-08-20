
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

interface AddMenuItemDialogProps {
  categoryId: string;
  categoryName: string;
  onAddItem: (categoryId: string, item: any) => Promise<any>;
  trigger?: React.ReactNode;
}

export const AddMenuItemDialog = ({ categoryId, categoryName, onAddItem, trigger }: AddMenuItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [persuasionDescription, setPersuasionDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isChefSpecial, setIsChefSpecial] = useState(false);
  const [popularityBadge, setPopularityBadge] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { canAddMenuItem, plan, maxMenuItems, currentMenuItemCount } = useSubscriptionLimits();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    if (!canAddMenuItem) {
      toast({
        title: "Item limit reached",
        description: `Free plan is limited to ${maxMenuItems} menu items. Upgrade to add more.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await onAddItem(categoryId, {
        name: name.trim(),
        description: description.trim(),
        persuasion_description: persuasionDescription.trim(),
        price: parseFloat(price),
        image_url: imageUrl || null,
        is_available: isAvailable,
        is_chef_special: isChefSpecial,
        popularity_badge: popularityBadge || null,
      });
      
      if (result) {
        toast({
          title: "Item added",
          description: `${name} has been added to ${categoryName}.`,
        });
        setName("");
        setDescription("");
        setPersuasionDescription("");
        setPrice("");
        setImageUrl("");
        setIsAvailable(true);
        setIsChefSpecial(false);
        setPopularityBadge("");
        setOpen(false);
      } else {
        throw new Error("Failed to add item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" disabled={!canAddMenuItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item to {categoryName}</DialogTitle>
          <DialogDescription>
            Add a new menu item to this category.
            {plan === 'free' && maxMenuItems && (
              <span className="block mt-1 text-xs text-muted-foreground">
                {currentMenuItemCount}/{maxMenuItems} items used
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {!canAddMenuItem ? (
          <UpgradePrompt
            title="Menu Item Limit Reached"
            description={`Your free plan is limited to ${maxMenuItems} menu items. Upgrade to Standard or Advanced plan to add unlimited menu items.`}
            feature="unlimited menu items"
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Nyama Choma"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the dish"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="persuasion-description">Persuasion Description (≤ 10 words)</Label>
              <Input
                id="persuasion-description"
                value={persuasionDescription}
                onChange={(e) => setPersuasionDescription(e.target.value)}
                placeholder="e.g., Smoky grilled chicken with creamy garlic sauce"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                Short, sensory description for customer appeal
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-price">Price (KSh)</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Item Image</Label>
              <ImageUpload
                bucket="menu-images"
                path="items/"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="Upload menu item image"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="popularity-badge">Popularity Badge</Label>
              <Select value={popularityBadge} onValueChange={setPopularityBadge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select badge (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No badge</SelectItem>
                  <SelectItem value="most-popular">Most Popular ⭐</SelectItem>
                  <SelectItem value="chef-pick">Chef's Pick 🔥</SelectItem>
                  <SelectItem value="bestseller">Bestseller 🏆</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="chef-special"
                checked={isChefSpecial}
                onCheckedChange={setIsChefSpecial}
              />
              <Label htmlFor="chef-special">Chef's Special</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="item-available"
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
              />
              <Label htmlFor="item-available">Available</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim() || !price}>
                {loading ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
