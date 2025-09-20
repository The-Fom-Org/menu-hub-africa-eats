import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LinkIcon } from "lucide-react";
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function ConnectToRestaurant() {
  const { refreshBranches } = useBranch();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !restaurantId.trim()) return;

    try {
      setIsConnecting(true);

      // First, check if the restaurant exists
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', restaurantId.trim())
        .maybeSingle();

      if (restaurantError || !restaurant) {
        toast({
          title: "Restaurant Not Found",
          description: "No restaurant found with that ID. Please check the ID and try again.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already connected to this restaurant
      const { data: existingBranch } = await supabase
        .from('user_branches')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId.trim())
        .maybeSingle();

      if (existingBranch) {
        toast({
          title: "Already Connected",
          description: `You are already connected to ${restaurant.name}.`,
          variant: "destructive",
        });
        return;
      }

      // Create the branch relationship
      const { error: branchError } = await supabase
        .from('user_branches')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId.trim(),
          role: 'staff', // Default role for connected users
          is_default: false,
        });

      if (branchError) throw branchError;

      toast({
        title: "Successfully Connected",
        description: `You are now connected to ${restaurant.name}.`,
      });

      // Reset form and close dialog
      setRestaurantId("");
      setIsOpen(false);
      await refreshBranches();
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to restaurant",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Connect to Restaurant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Existing Restaurant</DialogTitle>
          <DialogDescription>
            Enter the restaurant ID to connect to an existing restaurant as a branch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleConnect}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantId">Restaurant ID *</Label>
              <Input
                id="restaurantId"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                required
              />
              <p className="text-xs text-muted-foreground">
                Ask the restaurant owner for their restaurant ID to connect.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}