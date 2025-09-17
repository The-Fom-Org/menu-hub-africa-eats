import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Crown,
  Users,
  TrendingUp,
  Calendar,
  Edit,
  X,
  Settings,
  Megaphone,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading } = useAuth();

  const [userId, setUserId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [stats, setStats] = useState<any>({
    totalSubscribers: 0,
    activePlans: 0,
    trials: 0,
    churnRate: 0,
  });

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin-login");
    }
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading || authLoading) return <p>Loading...</p>;
  if (!isAdmin) return null;

  // API actions
  const handleUpsert = async () => {
    try {
      await api.post("/admin/upsert-customer", { userId });
      alert("Customer upserted successfully");
      setUserId("");
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert("Error upserting customer");
    }
  };

  const handleActivate = async () => {
    try {
      await api.post("/admin/activate-subscription", { userId, subscriptionId });
      alert("Subscription activated successfully");
      setUserId("");
      setSubscriptionId("");
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert("Error activating subscription");
    }
  };

  const handleSearch = async () => {
    try {
      const res = await api.get(`/admin/search-user?email=${searchEmail}`);
      setSearchResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error searching user");
    }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await api.get("/admin/subscribers");
      setSubscribers(res.data.subscribers);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      alert("Error fetching subscribers");
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleEdit = (subscriber: any) => {
    setEditingId(subscriber.id);
    setEditForm({ ...subscriber });
  };

  const handleSave = async () => {
    try {
      await api.put(`/admin/subscribers/${editingId}`, editForm);
      alert("Subscriber updated successfully");
      setEditingId(null);
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert("Error updating subscriber");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Total Subscribers</CardTitle>
            <Users className="h-5 w-5" />
          </CardHeader>
          <CardContent>{stats.totalSubscribers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Plans</CardTitle>
            <Crown className="h-5 w-5" />
          </CardHeader>
          <CardContent>{stats.activePlans}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trials</CardTitle>
            <Calendar className="h-5 w-5" />
          </CardHeader>
          <CardContent>{stats.trials}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Churn Rate</CardTitle>
            <TrendingUp className="h-5 w-5" />
          </CardHeader>
          <CardContent>{stats.churnRate}%</CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Button onClick={handleUpsert}>Upsert Customer</Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Input
              placeholder="Subscription ID"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
            />
            <Button onClick={handleActivate}>Activate Subscription</Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search by email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {searchResult && (
            <div className="mt-4 p-4 border rounded">
              <p>Email: {searchResult.email}</p>
              <p>Status: {searchResult.subscriptionStatus}</p>
              <p>Plan: {searchResult.plan || "-"}</p>
              <p>Trial: {searchResult.trial ? "Yes" : "No"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    {editingId === s.id ? (
                      <Input
                        value={editForm.email || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    ) : (
                      s.email
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === s.id ? (
                      <Input
                        value={editForm.subscriptionStatus || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            subscriptionStatus: e.target.value,
                          })
                        }
                      />
                    ) : (
                      s.subscriptionStatus
                    )}
                  </TableCell>
                  <TableCell>{s.plan || "-"}</TableCell>
                  <TableCell>{s.trial ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {editingId === s.id ? (
                      <>
                        <Button size="sm" onClick={handleSave} className="mr-2">
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => handleEdit(s)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
