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
import { ImageUpload } from "@/components/ui/image-upload";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setLoading(true);
    try {
      const result = await onAddItem(categoryId, {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        image_url: imageUrl || null,
        is_available: isAvailable,
      });
      
      if (result) {
        toast({
          title: "Item added",
          description: `${name} has been added to ${categoryName}.`,
        });
        setName("");
        setDescription("");
        setPrice("");
        setImageUrl("");
        setIsAvailable(true);
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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Item to {categoryName}</DialogTitle>
          <DialogDescription>
            Add a new menu item to this category.
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
};