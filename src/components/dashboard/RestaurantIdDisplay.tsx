import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Eye } from "lucide-react";
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/hooks/use-toast';

export function RestaurantIdDisplay() {
  const { currentBranch } = useBranch();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Restaurant ID copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!currentBranch) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View Restaurant ID
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restaurant ID</DialogTitle>
          <DialogDescription>
            Share this ID with others so they can connect to your restaurant as a branch.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Restaurant Name</Label>
            <Input 
              value={currentBranch.restaurant.name} 
              readOnly 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Restaurant ID</Label>
            <div className="flex gap-2">
              <Input 
                value={currentBranch.restaurant_id} 
                readOnly 
                className="bg-muted font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentBranch.restaurant_id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Others can use this ID to connect to your restaurant. They will be added as staff members.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}