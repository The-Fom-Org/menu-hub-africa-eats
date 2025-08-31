import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Users, 
  TrendingUp, 
  Calendar,
  Edit,
  Save,
  X,
  RefreshCw,
  Settings,
  Megaphone
} from "lucide-react";

interface Subscriber {
  id: string;
  restaurant_id: string;
  email: string;
  restaurant_name?: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_start?: string;
  subscription_end?: string;
  managed_by_sales: boolean;
  billing_method?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Subscriber>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin-login");
      return;
    }
  }, [user, loading, navigate]);

  const fetchSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast({
        title: "Error loading subscribers",
        description: "Failed to load subscriber data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleEdit = (subscriber: Subscriber) => {
    setEditingId(subscriber.id);
    setEditForm(subscriber);
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('subscribers')
        .update({
          restaurant_name: editForm.restaurant_name,
          subscribed: editForm.subscribed,
          subscription_tier: editForm.subscription_tier,
          subscription_start: editForm.subscription_start,
          subscription_end: editForm.subscription_end,
          managed_by_sales: editForm.managed_by_sales,
          billing_method: editForm.billing_method,
          admin_notes: editForm.admin_notes,
        })
        .eq('id', editingId);

      if (error) throw error;

      setSubscribers(prev => 
        prev.map(sub => 
          sub.id === editingId 
            ? { ...sub, ...editForm } as Subscriber
            : sub
        )
      );

      setEditingId(null);
      setEditForm({});
      
      toast({
        title: "Subscriber updated",
        description: "Subscriber information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast({
        title: "Update failed",
        description: "Failed to update subscriber. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const activeSubscribers = subscribers.filter(sub => sub.subscribed);
  const totalRevenue = activeSubscribers.reduce((sum, sub) => sum + 2500, 0); // Assuming 2500 KES per month

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage subscribers and monitor MenuHub performance.
              </p>
            </div>
            
            <div className="flex gap-2">
              {/* Added Lead Funnel button for admin */}
              <Button
                variant="outline"
                onClick={() => navigate("/lead-funnel")}
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Marketing Funnel
              </Button>
              
              <Button
                variant="outline"
                onClick={fetchSubscribers}
                disabled={loadingSubscribers}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingSubscribers ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscribers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSubscribers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Managed</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscribers.filter(sub => sub.managed_by_sales).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscribers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subscribers Management</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubscribers ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading subscribers...</p>
                </div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No subscribers found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="border rounded-lg p-4">
                      {editingId === subscriber.id ? (
                        // Edit form
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="restaurant_name">Restaurant Name</Label>
                              <Input
                                id="restaurant_name"
                                value={editForm.restaurant_name || ''}
                                onChange={(e) => setEditForm({...editForm, restaurant_name: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="subscription_tier">Subscription Tier</Label>
                              <Input
                                id="subscription_tier"
                                value={editForm.subscription_tier || ''}
                                onChange={(e) => setEditForm({...editForm, subscription_tier: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="subscription_start">Start Date</Label>
                              <Input
                                id="subscription_start"
                                type="date"
                                value={editForm.subscription_start ? new Date(editForm.subscription_start).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditForm({...editForm, subscription_start: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="subscription_end">End Date</Label>
                              <Input
                                id="subscription_end"
                                type="date"
                                value={editForm.subscription_end ? new Date(editForm.subscription_end).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditForm({...editForm, subscription_end: e.target.value})}
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={editForm.subscribed || false}
                                onCheckedChange={(checked) => setEditForm({...editForm, subscribed: checked})}
                              />
                              <Label>Active Subscription</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={editForm.managed_by_sales || false}
                                onCheckedChange={(checked) => setEditForm({...editForm, managed_by_sales: checked})}
                              />
                              <Label>Sales Managed</Label>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="admin_notes">Admin Notes</Label>
                            <Textarea
                              id="admin_notes"
                              value={editForm.admin_notes || ''}
                              onChange={(e) => setEditForm({...editForm, admin_notes: e.target.value})}
                              placeholder="Internal notes about this subscriber..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={handleSave}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display view
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {subscriber.restaurant_name || 'Unnamed Restaurant'}
                              </h3>
                              <div className="flex gap-2">
                                <Badge variant={subscriber.subscribed ? "default" : "secondary"}>
                                  {subscriber.subscribed ? "Active" : "Inactive"}
                                </Badge>
                                {subscriber.managed_by_sales && (
                                  <Badge variant="outline">Sales Managed</Badge>
                                )}
                                {subscriber.subscription_tier && (
                                  <Badge variant="outline">{subscriber.subscription_tier}</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Email:</strong> {subscriber.email}</p>
                              <p><strong>Restaurant ID:</strong> {subscriber.restaurant_id}</p>
                              {subscriber.subscription_start && (
                                <p><strong>Subscription:</strong> {new Date(subscriber.subscription_start).toLocaleDateString()} - {subscriber.subscription_end ? new Date(subscriber.subscription_end).toLocaleDateString() : 'Ongoing'}</p>
                              )}
                              <p><strong>Created:</strong> {new Date(subscriber.created_at).toLocaleDateString()}</p>
                              {subscriber.admin_notes && (
                                <p><strong>Notes:</strong> {subscriber.admin_notes}</p>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subscriber)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
