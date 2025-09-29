import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Crown, 
  Users, 
  TrendingUp, 
  Calendar,
  Edit,
  Save,
  Search,
  Shield,
  Plus,
  Link,
  X,
  RefreshCw,
  Settings,
  Megaphone
} from "lucide-react";

type Plan = "free" | "standard" | "advanced";


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

interface Profile {
  user_id: string;
  restaurant_name: string | null;
}

export default function AdminDashboard() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { isAdmin, user: adminUser, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Subscriber>>({});

  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [activatingSubscription, setActivatingSubscription] = useState<string | null>(null);

  // Admin settings state
  const [defaultOrderingEnabled, setDefaultOrderingEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // New record creation form
  const [newEmail, setNewEmail] = useState("");
  const [newRestaurantId, setNewRestaurantId] = useState("");
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newPlan, setNewPlan] = useState<Plan>("free");
  const [newManagedBySales, setNewManagedBySales] = useState(true);
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin-login");
    }
  }, [isAdmin, adminLoading, navigate]);

  const planLabel = (plan: string | null | undefined) => {
    switch (plan) {
      case "standard":
        return "Standard – $30";
      case "advanced":
        return "Advanced – $80";
      case "free":
      default:
        return "Free";
    }
  };

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

  const fetchAdminSettings = async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'default_ordering_enabled')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.setting_value?.enabled !== undefined) {
        setDefaultOrderingEnabled(data.setting_value.enabled);
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      toast({
        title: "Error loading settings",
        description: "Failed to load admin settings. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchAdminSettings();
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

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({ title: "Search required", description: "Please enter a search term.", variant: "destructive" });
      return;
    }

    console.log("[Admin] Starting search for:", query);
    setLoadingSearch(true);
    try {
      // Search in both subscribers and profiles tables
      const [subscribersResult, profilesResult] = await Promise.all([
        supabase
          .from("subscribers")
          .select("*")
          .or(`email.ilike.%${query}%,restaurant_name.ilike.%${query}%`)
          .order("updated_at", { ascending: false })
          .limit(25),
        supabase
          .from("profiles")
          .select("user_id, restaurant_name")
          .ilike("restaurant_name", `%${query}%`)
          .limit(25)
      ]);

      console.log("[Admin] Subscribers search result:", subscribersResult);
      console.log("[Admin] Profiles search result:", profilesResult);

      if (subscribersResult.error) {
        console.error("[Admin] Subscribers search error:", subscribersResult.error);
        throw subscribersResult.error;
      }

      if (profilesResult.error) {
        console.error("[Admin] Profiles search error:", profilesResult.error);
        throw profilesResult.error;
      }
      // Combine results, prioritizing subscribers data
      const foundSubscribers = subscribersResult.data as Subscriber[];
      const foundProfiles = profilesResult.data as Profile[] || [];

      // Auto-fill form if we find a match in profiles but not in subscribers
      if (foundSubscribers.length === 0 && foundProfiles.length > 0) {
        const firstProfile = foundProfiles[0];
        setNewRestaurantId(firstProfile.user_id);
        setNewRestaurantName(firstProfile.restaurant_name || "");
        
        // Try to get user email from auth.users (this might not work due to RLS)
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(firstProfile.user_id);
          if (authUser.user?.email) {
            setNewEmail(authUser.user.email);
          }
        } catch (error) {
          console.log("[Admin] Could not fetch user email from auth:", error);
          // This is expected due to RLS, so we'll leave email empty for manual entry
        }

        toast({ 
          title: "Restaurant found", 
          description: `Found ${firstProfile.restaurant_name}. Form has been pre-filled.`,
        });
      } else if (foundSubscribers.length > 0) {
        // Auto-fill with first subscriber found
        const firstSubscriber = foundSubscribers[0];
        setNewEmail(firstSubscriber.email);
        setNewRestaurantId(firstSubscriber.restaurant_id);
        setNewRestaurantName(firstSubscriber.restaurant_name || "");
        setNewPlan((firstSubscriber.subscription_tier as Plan) || "free");
        setNewManagedBySales(firstSubscriber.managed_by_sales);
        setNewNotes(firstSubscriber.admin_notes || "");
        toast({ 
          title: "Subscriber found", 
          description: `Found existing subscriber ${firstSubscriber.email}. Form has been pre-filled.`,
        });
      }

      setSubscribers(foundSubscribers);

      if (foundSubscribers.length === 0 && foundProfiles.length === 0) {
        toast({ 
          title: "No results", 
          description: "No restaurants found matching your search.",
          variant: "destructive" 
        });
      }

    } catch (err) {
      console.error("[Admin] search error:", err);
      toast({ 
        title: "Search failed", 
        description: `Could not search restaurants: ${err instanceof Error ? err.message : 'Unknown error'}`,
         variant: "destructive" 
      });
    } finally {
      setLoadingSearch(false);
    }
  };
  const saveRow = async (row: Subscriber) => {
    setSavingIds((s) => ({ ...s, [row.id]: true }));
    try {
      const payload = {
        id: row.id,
        restaurant_id: row.restaurant_id,
        email: row.email,
        restaurant_name: row.restaurant_name,
        subscribed: row.subscription_tier !== "free" && !!row.subscription_tier,
        subscription_tier: row.subscription_tier,
        billing_method: row.managed_by_sales ? "sales_managed" : row.billing_method,
        admin_notes: row.admin_notes,
        managed_by_sales: row.managed_by_sales,
      };

      console.log("[Admin] Saving subscriber with payload:", payload);

      const { data, error } = await supabase.from("subscribers").upsert(payload).select().maybeSingle();
      if (error) throw error;

      console.log("[Admin] Save successful:", data);
      toast({ title: "Saved", description: `${row.email} updated successfully.` });
    } catch (err) {
      console.error("[Admin] save error:", err);
      toast({ title: "Save failed", description: "Could not update subscriber.", variant: "destructive" });
    } finally {
      setSavingIds((s) => ({ ...s, [row.id]: false }));
    }
  };

  const activateManageSubscription = async (restaurantId: string, email: string) => {
    setActivatingSubscription(restaurantId);
    try {
      // First ensure the subscriber record exists with at least a basic subscription
      const { data: existingSubscriber } = await supabase
        .from("subscribers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (!existingSubscriber) {
        // Create a basic subscriber record if it doesn't exist
        const { error: createError } = await supabase
          .from("subscribers")
          .upsert({
            restaurant_id: restaurantId,
            email: email,
            restaurant_name: newRestaurantName || null,
            subscribed: true, // Activate subscription access
            subscription_tier: "standard", // Default to standard
            managed_by_sales: true,
            billing_method: "sales_managed",
            admin_notes: "Subscription page activated by admin"
          });

        if (createError) throw createError;
      } else {
        // Update existing subscriber to activate subscription
        const { error: updateError } = await supabase
          .from("subscribers")
          .update({
            subscribed: true,
            subscription_tier: existingSubscriber.subscription_tier || "standard",
            managed_by_sales: true,
            billing_method: "sales_managed",
            admin_notes: (existingSubscriber.admin_notes || "") + " | Subscription page activated by admin"
          })
          .eq("restaurant_id", restaurantId);

        if (updateError) throw updateError;
      }  
      toast({
        title: "Subscription Activated",
        description: `Manage Subscription page has been activated for ${email}. They can now access it from their dashboard.`
      });

      // Refresh search results
      if (query) {
        handleSearch();
      }

    } catch (err) {
      console.error("[Admin] activate subscription error:", err);
      toast({
        title: "Activation Failed",
        description: `Could not activate subscription page: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setActivatingSubscription(null);
    }
  };
  const createNewRecord = async () => {
    if (!newEmail || !newRestaurantId) {
      toast({ title: "Missing fields", description: "Email and Restaurant User ID are required.", variant: "destructive" });
      return;
    }
    
    console.log("[Admin] Creating new subscriber record:", {
      email: newEmail,
      restaurant_id: newRestaurantId,
      restaurant_name: newRestaurantName,
      plan: newPlan
    });

    try {
      const insertPayload = {
        restaurant_id: newRestaurantId,
        email: newEmail,
        restaurant_name: newRestaurantName || null,
        subscribed: newPlan !== "free",
        subscription_tier: newPlan,
        billing_method: newManagedBySales ? "sales_managed" : "offline",
        admin_notes: newNotes || null,
        managed_by_sales: newManagedBySales,
      };
      console.log("[Admin] Insert payload:", insertPayload);

      const { data, error } = await supabase.from("subscribers").upsert(insertPayload, { onConflict: "email" }).select().maybeSingle();
      if (error) throw error;

      console.log("[Admin] Create successful:", data);
      toast({ title: "Subscriber created", description: `${newEmail} added/updated successfully.` });

      // Reset form
      setNewEmail("");
      setNewRestaurantId("");
      setNewRestaurantName("");
      setNewPlan("free");
      setNewManagedBySales(true);
      setNewNotes("");

      // Refresh results if query matches
      if (query && (newEmail.toLowerCase().includes(query.toLowerCase()) || 
                   newRestaurantName?.toLowerCase().includes(query.toLowerCase()))) {
        handleSearch();
      }
    } catch (err) {
      console.error("[Admin] create error:", err);
      toast({ title: "Creation failed", description: `Could not create subscriber: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: "destructive" });
    }
  };

  const clearForm = () => {
    setNewEmail("");
    setNewRestaurantId("");
    setNewRestaurantName("");
    setNewPlan("free");
    setNewManagedBySales(true);
    setNewNotes("");
  };

  const updateDefaultOrderingEnabled = async (enabled: boolean) => {
    try {
      setSavingSettings(true);
      const { error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: { enabled },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'default_ordering_enabled');

      if (error) throw error;

      setDefaultOrderingEnabled(enabled);
      toast({
        title: "Settings updated",
        description: `Default ordering system ${enabled ? 'enabled' : 'disabled'} for new restaurants.`,
      });
    } catch (error) {
      console.error('Error updating admin settings:', error);
      toast({
        title: "Update failed",
        description: "Failed to update admin settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (adminLoading) {
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

          {/* Admin Settings Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Default Ordering System Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Controls whether ordering is enabled by default for new restaurants
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {defaultOrderingEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={defaultOrderingEnabled}
                      onCheckedChange={updateDefaultOrderingEnabled}
                      disabled={savingSettings || loadingSettings}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <Input
                  placeholder="Search by email or restaurant name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loadingSearch} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {loadingSearch ? "Searching..." : "Search"}
                </Button>
              </div>
              {subscribers.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Found {subscribers.length} existing subscriber{subscribers.length !== 1 ? 's' : ''}:
                </p>
                </div>
              </>
            )}  
            {/* Show activate subscription option for searched restaurants without existing subscription */}
            {query && newRestaurantId && !subscribers.some(s => s.restaurant_id === newRestaurantId) && (
              <>
                <Separator className="my-4" />
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Activate Manage Subscription Page</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      This restaurant doesn't have subscription access yet. You can activate the "Manage Subscription" page for them.
                    </p>
                    <div className="space-y-2 mb-4">
                      <p><strong>Restaurant:</strong> {newRestaurantName || "Unnamed"}</p>
                      <p><strong>Email:</strong> {newEmail || "Not found"}</p>
                      <p><strong>User ID:</strong> {newRestaurantId}</p>
                    </div>
                    <Button
                      onClick={() => activateManageSubscription(newRestaurantId, newEmail)}
                      disabled={activatingSubscription === newRestaurantId || !newEmail}
                      className="flex items-center gap-2"
                    >
                      <Link className="h-4 w-4" />
                      {activatingSubscription === newRestaurantId ? "Activating..." : "Activate Manage Subscription Page"}
                    </Button>
                    {!newEmail && (
                      <p className="text-xs text-destructive mt-2">Email is required to activate subscription page</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            </CardContent>
        </Card>

          <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Create / Attach Subscription Record
              {(newEmail || newRestaurantId || newRestaurantName) && (
                <Button variant="outline" size="sm" onClick={clearForm}>
                  Clear Form
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Search for a restaurant above to auto-fill this form, or manually provide their Email and Restaurant User ID (UUID).
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  placeholder="restaurant@email.com"
                />
              </div>
               <div className="space-y-2">
                <Label>Restaurant User ID (UUID) *</Label>
                <Input 
                  value={newRestaurantId} 
                  onChange={(e) => setNewRestaurantId(e.target.value)} 
                  placeholder="xxxxxx-xxxx-...." 
                />
              </div>
              <div className="space-y-2">
                <Label>Restaurant Name</Label>
                <Input 
                  value={newRestaurantName} 
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  placeholder="Restaurant Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={newPlan} onValueChange={(v: Plan) => setNewPlan(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="standard">Standard – $30</SelectItem>
                    <SelectItem value="advanced">Advanced – $80</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Managed by Sales</Label>
                <Select value={newManagedBySales ? "yes" : "no"} onValueChange={(v) => setNewManagedBySales(v === "yes")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Admin Notes</Label>
                <Textarea
                  placeholder='e.g. "Contract signed, billing handled offline"'
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={createNewRecord} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create / Upsert Subscriber
              </Button>
              <a
                href="https://supabase.com/dashboard/project/mrluhxwootpggtptglcd/auth/users"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                Open Supabase Users
              </a>
            </div>
          </CardContent>
        </Card>  
  
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
