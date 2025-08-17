
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
import { RefreshCw, Search, Save, Shield, Plus } from "lucide-react";

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

export default function AdminDashboard() {
  const { isAdmin, loading, user } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  // New record creation form
  const [newEmail, setNewEmail] = useState("");
  const [newRestaurantId, setNewRestaurantId] = useState("");
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newPlan, setNewPlan] = useState<Plan>("free");
  const [newManagedBySales, setNewManagedBySales] = useState(true);
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Access denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, navigate, toast]);

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
    setLoadingSearch(true);
    try {
      const orFilter = `email.ilike.%${query}%,restaurant_name.ilike.%${query}%`;
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .or(orFilter)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSubscribers(data as Subscriber[]);
    } catch (err) {
      console.error("[Admin] search error:", err);
      toast({ title: "Search failed", description: "Could not fetch subscribers.", variant: "destructive" });
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

      const { data, error } = await supabase.from("subscribers").upsert(payload).select().maybeSingle();
      if (error) throw error;

      toast({ title: "Saved", description: `${row.email} updated successfully.` });
    } catch (err) {
      console.error("[Admin] save error:", err);
      toast({ title: "Save failed", description: "Could not update subscriber.", variant: "destructive" });
    } finally {
      setSavingIds((s) => ({ ...s, [row.id]: false }));
    }
  };

  const createNewRecord = async () => {
    if (!newEmail || !newRestaurantId) {
      toast({ title: "Missing fields", description: "Email and Restaurant User ID are required.", variant: "destructive" });
      return;
    }
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

      const { data, error } = await supabase.from("subscribers").upsert(insertPayload, { onConflict: "email" }).select().maybeSingle();
      if (error) throw error;

      toast({ title: "Subscriber created", description: `${newEmail} added/updated.` });

      // Reset form
      setNewEmail("");
      setNewRestaurantId("");
      setNewRestaurantName("");
      setNewPlan("free");
      setNewManagedBySales(true);
      setNewNotes("");

      // Refresh results if query matches
      if (query && newEmail.toLowerCase().includes(query.toLowerCase())) {
        handleSearch();
      }
    } catch (err) {
      console.error("[Admin] create error:", err);
      toast({ title: "Creation failed", description: "Could not create subscriber.", variant: "destructive" });
    }
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
              />
              <Button onClick={handleSearch} disabled={loadingSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {loadingSearch ? "Searching..." : "Search"}
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
              {subscribers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No results yet. Try searching above.</p>
              ) : (
                subscribers.map((row) => (
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create / Attach Subscription Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To create a subscription record for a user, provide their Email and Restaurant User ID (UUID).
              You can copy the UUID from Supabase Users.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Restaurant User ID (UUID)</Label>
                <Input value={newRestaurantId} onChange={(e) => setNewRestaurantId(e.target.value)} placeholder="xxxxxx-xxxx-...." />
              </div>
              <div className="space-y-2">
                <Label>Restaurant Name (optional)</Label>
                <Input value={newRestaurantName} onChange={(e) => setNewRestaurantName(e.target.value)} />
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
                Create / Upsert
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
