import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

interface EditMenuItemDialogProps {
  item: MenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateItem: (itemId: string, updates: Partial<MenuItem>) => Promise<any>;
}

export const EditMenuItemDialog = ({ item, open, onOpenChange, onUpdateItem }: EditMenuItemDialogProps) => {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [price, setPrice] = useState(item.price.toString());
  const [imageUrl, setImageUrl] = useState(item.image_url || "");
  const [isAvailable, setIsAvailable] = useState(item.is_available);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setLoading(true);
    try {
      const result = await onUpdateItem(item.id, {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        image_url: imageUrl || null,
        is_available: isAvailable,
      });
      
      if (result) {
        toast({
          title: "Item updated",
          description: `${name} has been updated successfully.`,
        });
        onOpenChange(false);
      } else {
        throw new Error("Failed to update item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
          <DialogDescription>
            Update the details for this menu item.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-item-name">Item Name</Label>
            <Input
              id="edit-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nyama Choma"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-item-description">Description</Label>
            <Textarea
              id="edit-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the dish"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-item-price">Price (KSh)</Label>
            <Input
              id="edit-item-price"
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
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-item-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="edit-item-available">Available</Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !price}>
              {loading ? "Updating..." : "Update Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};