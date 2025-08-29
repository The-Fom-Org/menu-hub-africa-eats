
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Lead = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  lead_source: string;
  order_context: any;
  marketing_consent: boolean;
  dietary_restrictions: string[] | null;
  favorite_cuisines: string[] | null;
  dining_frequency: string | null;
  notes: string | null;
  created_at: string;
};

export const LeadManagementTable: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const fetchLeads = async () => {
    if (!user?.id) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_leads")
      .select("*")
      .eq("restaurant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Failed to load leads",
        description: "Please try again.",
        variant: "destructive",
      });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    // Realtime: refresh when new leads come in
    if (!user?.id) return;
    const channel = supabase
      .channel("customer-leads-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_leads", filter: `restaurant_id=eq.${user.id}` },
        () => fetchLeads()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((l) => {
      return (
        l.customer_name.toLowerCase().includes(term) ||
        l.customer_phone.toLowerCase().includes(term) ||
        (l.customer_email || "").toLowerCase().includes(term) ||
        (l.lead_source || "").toLowerCase().includes(term)
      );
    });
  }, [leads, q]);

  const exportCsv = () => {
    const rows = [
      [
        "Created At",
        "Name",
        "Phone",
        "Email",
        "Source",
        "Consent",
        "Dining Frequency",
        "Dietary",
        "Favorite Cuisines",
        "Notes",
        "Item Count",
        "Subtotal",
      ],
      ...filtered.map((l) => [
        l.created_at,
        l.customer_name,
        l.customer_phone,
        l.customer_email ?? "",
        l.lead_source,
        l.marketing_consent ? "Yes" : "No",
        l.dining_frequency ?? "",
        (l.dietary_restrictions || []).join("; "),
        (l.favorite_cuisines || []).join("; "),
        l.notes ?? "",
        String(l?.order_context?.itemCount ?? ""),
        String(l?.order_context?.subtotal ?? ""),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-xl">Customer Leads</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email..." className="w-56" />
          <Button variant="secondary" onClick={fetchLeads} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={exportCsv}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Dining</TableHead>
                <TableHead>Dietary</TableHead>
                <TableHead>Favorite Cuisines</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    {loading ? "Loading leads..." : "No leads found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{l.customer_name}</TableCell>
                    <TableCell>{l.customer_phone}</TableCell>
                    <TableCell>{l.customer_email || "-"}</TableCell>
                    <TableCell className="capitalize">{(l.lead_source || "").replace("_", " ")}</TableCell>
                    <TableCell>{l.marketing_consent ? "Yes" : "No"}</TableCell>
                    <TableCell className="capitalize">{l.dining_frequency || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={(l.dietary_restrictions || []).join(", ")}>
                      {(l.dietary_restrictions || []).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={(l.favorite_cuisines || []).join(", ")}>
                      {(l.favorite_cuisines || []).join(", ") || "-"}
                    </TableCell>
                    <TableCell>{l?.order_context?.itemCount ?? "-"}</TableCell>
                    <TableCell>{l?.order_context?.subtotal ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
