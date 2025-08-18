import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CustomerMenuItem } from '@/hooks/useCustomerMenuData';

interface MenuItemCustomizationDialogProps {
  item: CustomerMenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (customizations?: string, specialInstructions?: string) => void;
}

export const MenuItemCustomizationDialog = ({
  item,
  open,
  onOpenChange,
  onAddToCart,
}: MenuItemCustomizationDialogProps) => {
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);

  // Mock customization options - in real implementation, these would come from the database
  const mockCustomizations = [
    { id: '1', name: 'Extra Cheese', price: 50 },
    { id: '2', name: 'No Onions', price: 0 },
    { id: '3', name: 'Extra Spicy', price: 0 },
    { id: '4', name: 'Add Avocado', price: 100 },
    { id: '5', name: 'Less Salt', price: 0 },
  ];

  const toggleCustomization = (customization: string) => {
    setSelectedCustomizations(prev => 
      prev.includes(customization)
        ? prev.filter(c => c !== customization)
        : [...prev, customization]
    );
  };

  const getCustomizationPrice = () => {
    return selectedCustomizations.reduce((total, customization) => {
      const option = mockCustomizations.find(opt => opt.name === customization);
      return total + (option?.price || 0);
    }, 0);
  };

  const handleAddToCart = () => {
    const customizationsText = selectedCustomizations.length > 0 
      ? selectedCustomizations.join(', ') 
      : undefined;
    
    onAddToCart(customizationsText, specialInstructions || undefined);
    
    // Reset form
    setSelectedCustomizations([]);
    setSpecialInstructions('');
    onOpenChange(false);
  };

  const totalPrice = item.price + getCustomizationPrice();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Customize your order and add special instructions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customization Options */}
          <div>
            <Label className="text-sm font-medium">Customizations</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {mockCustomizations.map((customization) => (
                <div
                  key={customization.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCustomizations.includes(customization.name)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  }`}
                  onClick={() => toggleCustomization(customization.name)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{customization.name}</span>
                    {customization.price > 0 && (
                      <Badge variant="outline" className="text-xs">
                        +KSh {customization.price}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <Label htmlFor="instructions" className="text-sm font-medium">
              Special Instructions
            </Label>
            <Textarea
              id="instructions"
              placeholder="Any special requests or dietary requirements..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Price:</span>
              <Badge variant="secondary" className="text-base">
                KSh {totalPrice.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};