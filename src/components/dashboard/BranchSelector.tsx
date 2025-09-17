import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranch } from "@/contexts/BranchContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function BranchSelector() {
  const { selectedBranch, userBranches, switchBranch, createNewBranch, loading } = useBranch();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    description: '',
    address: '',
    phone_number: '',
    email: ''
  });
  const { toast } = useToast();

  if (loading || !selectedBranch) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <Building2 className="h-4 w-4" />
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    );
  }

  const handleAddBranch = async () => {
    if (!newBranchData.name.trim()) {
      toast({
        title: "Error",
        description: "Restaurant name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      await createNewBranch(newBranchData);
      setShowAddDialog(false);
      setNewBranchData({
        name: '',
        description: '',
        address: '',
        phone_number: '',
        email: ''
      });
      toast({
        title: "Success",
        description: "New branch created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new branch",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border-border/50"
          >
            <Building2 className="h-4 w-4" />
            <span className="max-w-32 truncate">{selectedBranch.restaurant.name}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-popover/95 backdrop-blur-xl border-border/50"
        >
          <DropdownMenuLabel>Your Restaurants</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {userBranches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => switchBranch(branch.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{branch.restaurant.name}</span>
                {branch.restaurant.address && (
                  <span className="text-xs text-muted-foreground truncate">
                    {branch.restaurant.address}
                  </span>
                )}
              </div>
              {selectedBranch.id === branch.id && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Branch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Restaurant Branch</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                value={newBranchData.name}
                onChange={(e) => setNewBranchData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Branch name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newBranchData.description}
                onChange={(e) => setNewBranchData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newBranchData.address}
                onChange={(e) => setNewBranchData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Physical address"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newBranchData.phone_number}
                onChange={(e) => setNewBranchData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Contact number"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newBranchData.email}
                onChange={(e) => setNewBranchData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Contact email"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBranch}>
                Create Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}