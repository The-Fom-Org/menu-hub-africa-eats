import { useState } from "react";
import { useBranch } from "@/contexts/BranchContext";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Building2, Edit, Save, Plus, MapPin, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BranchManagement() {
  const { userBranches, selectedBranch, createNewBranch, refreshBranches } = useBranch();
  const { restaurant, updateRestaurant } = useRestaurantData();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    address: restaurant?.address || '',
    phone_number: restaurant?.phone_number || '',
    email: restaurant?.email || '',
    tagline: restaurant?.tagline || ''
  });
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    description: '',
    address: '',
    phone_number: '',
    email: ''
  });

  const handleSave = async () => {
    try {
      await updateRestaurant(formData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Branch information updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update branch information",
        variant: "destructive"
      });
    }
  };

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Branch Management</h1>
              <p className="text-muted-foreground">
                Manage your restaurant locations and branch information
              </p>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Branch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Restaurant Branch</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-name">Restaurant Name *</Label>
                    <Input
                      id="new-name"
                      value={newBranchData.name}
                      onChange={(e) => setNewBranchData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Branch name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-description">Description</Label>
                    <Textarea
                      id="new-description"
                      value={newBranchData.description}
                      onChange={(e) => setNewBranchData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-address">Address</Label>
                    <Input
                      id="new-address"
                      value={newBranchData.address}
                      onChange={(e) => setNewBranchData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Physical address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-phone">Phone Number</Label>
                    <Input
                      id="new-phone"
                      value={newBranchData.phone_number}
                      onChange={(e) => setNewBranchData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="Contact number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
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
          </div>

          <div className="grid gap-6">
            {/* Current Branch Details */}
            {selectedBranch && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Current Branch: {selectedBranch.restaurant.name}
                      </CardTitle>
                      <CardDescription>
                        Edit your current branch information
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (isEditing) {
                          handleSave();
                        } else {
                          setIsEditing(true);
                          setFormData({
                            name: restaurant?.name || '',
                            description: restaurant?.description || '',
                            address: restaurant?.address || '',
                            phone_number: restaurant?.phone_number || '',
                            email: restaurant?.email || '',
                            tagline: restaurant?.tagline || ''
                          });
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                      {isEditing ? 'Save Changes' : 'Edit Branch'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Restaurant Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline}
                      onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Your restaurant's tagline"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Describe your restaurant"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="Physical address"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={formData.phone_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                          disabled={!isEditing}
                          className="pl-10"
                          placeholder="Contact number"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="Contact email"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* All Branches List */}
            <Card>
              <CardHeader>
                <CardTitle>All Your Branches</CardTitle>
                <CardDescription>
                  Overview of all your restaurant locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {userBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`p-4 rounded-lg border ${
                        selectedBranch?.id === branch.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {branch.restaurant.name}
                            {selectedBranch?.id === branch.id && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                Active
                              </span>
                            )}
                          </h3>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            {branch.restaurant.address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {branch.restaurant.address}
                              </div>
                            )}
                            {branch.restaurant.phone_number && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {branch.restaurant.phone_number}
                              </div>
                            )}
                            {branch.restaurant.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {branch.restaurant.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Role: {branch.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}