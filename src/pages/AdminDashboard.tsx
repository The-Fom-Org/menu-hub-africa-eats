import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Save, Shield, Plus, Link, Users, TrendingUp } from "lucide-react";

type Plan = "free" | "standard" | "advanced";

interface Subscriber {
  id: string;
  restaurant_id: string;
  email: string;
  restaurant_name: string | null;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  billing_method: string | null;
  admin_notes: string | null;
  managed_by_sales: boolean;
  created_at: string;
  updated_at: string;
}

interface Profile {
  user_id: string;
  restaurant_name: string | null;
}

export default function AdminDashboard() {
  const { isAdmin, loading, user } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [activatingSubscription, setActivatingSubscription] = useState<string | null>(null);

  // New record creation form
  const [newEmail, setNewEmail] = useState("");
  const [newRestaurantId, setNewRestaurantId] = useState("");
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newPlan, setNewPlan] = useState<Plan>("free");
  const [newManagedBySales, setNewManagedBySales] = useState(true);
  const [newNotes, setNewNotes] = useState("");

  const adminItems = [
    {
      title: "Subscribers",
      description: "Manage restaurant subscriptions and billing",
      icon: Users,
      href: "/admin/subscribers",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Lead Funnel", 
      description: "MenuHub lead capture and sales funnel",
      icon: TrendingUp,
      href: "/lead-funnel",
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  useEffect(() => {
    // Only redirect if we definitively have a user, loading is done, and the user is not an admin
    if (!loading && user && !isAdmin) {
      toast({
        title: "Access denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, user, navigate, toast]);

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

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Dashboard
          </h1>
          <Badge variant="secondary">Signed in as {user?.email}</Badge>
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
                  {subscribers.map((row) => (
                    <div key={row.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="font-medium">{row.restaurant_name || "Unnamed Restaurant"}</div>
                          <div className="text-sm text-muted-foreground">{row.email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {row.managed_by_sales ? "Managed by Sales" : row.billing_method || "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={row.subscription_tier === "advanced" ? "default" : row.subscription_tier === "standard" ? "secondary" : "outline"}>
                            {planLabel(row.subscription_tier)}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Plan</Label>
                          <Select
                            value={(row.subscription_tier as Plan) || "free"}
                            onValueChange={(val) => {
                              row.subscription_tier = val;
                              row.subscribed = val !== "free";
                              // force rerender
                              setSubscribers((prev) => [...prev]);
                            }}
                          >
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
                          <Label>Restaurant Name</Label>
                          <Input
                            value={row.restaurant_name || ""}
                            onChange={(e) => {
                              row.restaurant_name = e.target.value || null;
                              setSubscribers((prev) => [...prev]);
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Managed by Sales</Label>
                          <Select
                            value={row.managed_by_sales ? "yes" : "no"}
                            onValueChange={(v) => {
                              row.managed_by_sales = v === "yes";
                              row.billing_method = row.managed_by_sales ? "sales_managed" : row.billing_method;
                              setSubscribers((prev) => [...prev]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label>Admin Notes</Label>
                        <Textarea
                          placeholder='e.g. "Contract signed, billing handled offline"'
                          value={row.admin_notes || ""}
                          onChange={(e) => {
                            row.admin_notes = e.target.value || null;
                            setSubscribers((prev) => [...prev]);
                          }}
                        />
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          onClick={() => saveRow(row)}
                          disabled={!!savingIds[row.id]}
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {savingIds[row.id] ? "Saving..." : "Save"}
                        </Button>
                        
                        <Button
                          onClick={() => activateManageSubscription(row.restaurant_id, row.email)}
                          disabled={activatingSubscription === row.restaurant_id}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Link className="h-4 w-4" />
                          {activatingSubscription === row.restaurant_id ? "Activating..." : "Activate Manage Subscription"}
                        </Button>
                      </div>
                    </div>
                  ))}
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
      </div>
    </div>
  );
}
