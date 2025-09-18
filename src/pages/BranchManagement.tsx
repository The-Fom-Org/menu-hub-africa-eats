import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Plus, Settings, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BranchManagement() {
  const { userBranches, currentBranch, refreshBranches, switchBranch } = useBranch();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    description: "",
    phone_number: "",
    tagline: "",
  });

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsCreating(true);

      // Create new restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: newRestaurant.name,
          description: newRestaurant.description,
          phone_number: newRestaurant.phone_number,
          tagline: newRestaurant.tagline,
          primary_color: '#059669',
          secondary_color: '#dc2626',
        })
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // Create user-restaurant relationship
      const { error: branchError } = await supabase
        .from('user_branches')
        .insert({
          user_id: user.id,
          restaurant_id: restaurant.id,
          role: 'owner',
          is_default: userBranches.length === 0, // Make first restaurant default
        });

      if (branchError) throw branchError;

      toast({
        title: "Restaurant Created",
        description: `${newRestaurant.name} has been added to your account.`,
      });

      // Reset form and refresh
      setNewRestaurant({ name: "", description: "", phone_number: "", tagline: "" });
      setIsDialogOpen(false);
      await refreshBranches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create restaurant",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetDefault = async (branchId: string) => {
    if (!user) return;

    try {
      // Remove default from all branches
      await supabase
        .from('user_branches')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      await supabase
        .from('user_branches')
        .update({ is_default: true })
        .eq('id', branchId);

      toast({
        title: "Default Updated",
        description: "Default restaurant has been updated.",
      });

      await refreshBranches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update default restaurant",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Restaurant Branches</h1>
              <p className="text-muted-foreground">
                Manage your restaurant locations and switch between them.
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Restaurant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Restaurant</DialogTitle>
                  <DialogDescription>
                    Create a new restaurant branch to manage separately.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRestaurant}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Restaurant Name</Label>
                      <Input
                        id="name"
                        value={newRestaurant.name}
                        onChange={(e) => setNewRestaurant(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Mama Mia's Downtown"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newRestaurant.description}
                        onChange={(e) => setNewRestaurant(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your restaurant"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={newRestaurant.phone_number}
                        onChange={(e) => setNewRestaurant(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="+254 700 123 456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={newRestaurant.tagline}
                        onChange={(e) => setNewRestaurant(prev => ({ ...prev, tagline: e.target.value }))}
                        placeholder="Your restaurant's motto"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Restaurant"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Restaurant List */}
          <div className="grid gap-6">
            {userBranches.map((branch) => (
              <Card key={branch.id} className={`${currentBranch?.id === branch.id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {branch.restaurant.name}
                          {branch.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {currentBranch?.id === branch.id && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {branch.restaurant.description || "No description provided"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentBranch?.id !== branch.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => switchBranch(branch.id)}
                        >
                          Switch To
                        </Button>
                      )}
                      {!branch.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(branch.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/custom-branding`)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p className="text-muted-foreground">
                        {branch.restaurant.phone_number || "Not set"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Role:</span>
                      <p className="text-muted-foreground capitalize">{branch.role}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tagline:</span>
                      <p className="text-muted-foreground">
                        {branch.restaurant.tagline || "Not set"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {userBranches.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Restaurants Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You don't have any restaurants set up yet. Create your first restaurant to get started.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Restaurant
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}