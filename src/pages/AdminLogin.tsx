
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth/cleanup";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, LogIn } from "lucide-react";

export default function AdminLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@menuhub.com");
  const [password, setPassword] = useState("AdminPass123!");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const createAdminUser = async () => {
    setCreating(true);
    try {
      console.log('Calling create-admin-user function...');
      
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {}
      });
      
      console.log('Function response:', { data, error });
      
      if (error) {
        console.error('Function error:', error);
        toast({ 
          title: "Creation failed", 
          description: error.message || "Could not create admin user.", 
          variant: "destructive" 
        });
        return;
      }
      
      if (data?.success) {
        toast({ 
          title: "Admin user created", 
          description: "You can now sign in with the admin credentials." 
        });
      } else {
        toast({ 
          title: "Creation failed", 
          description: data?.error || "Unknown error occurred.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Create admin error:', error);
      toast({ 
        title: "Creation failed", 
        description: "Could not create admin user.", 
        variant: "destructive" 
      });
    } finally {
      setCreating(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing credentials", description: "Please enter email and password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting admin login with:', email);
      
      // Clean up any previous session limbo
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch (_err) {
        console.log('Signout error (ignoring):', _err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log('Sign in result:', { data, error });
      
      if (error) {
        console.error('Sign in error:', error);
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
        return;
      }

      const user = data.user;
      if (!user) {
        toast({ title: "Sign in failed", description: "No user returned.", variant: "destructive" });
        return;
      }

      console.log('User signed in:', user.id, user.email);

      // Verify admin membership (RLS allows users to read their own admin row)
      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log('Admin verification:', { adminRow, adminError });

      if (adminError) {
        console.error('Admin verification error:', adminError);
        toast({ title: "Access check failed", description: adminError.message, variant: "destructive" });
        // Optional: sign out on failure to verify
        try {
          await supabase.auth.signOut({ scope: "global" });
        } catch (_e) {}
        cleanupAuthState();
        return;
      }

      if (!adminRow) {
        // Not an admin: block and sign out
        toast({
          title: "Not authorized",
          description: "This account does not have admin access.",
          variant: "destructive",
        });
        try {
          await supabase.auth.signOut({ scope: "global" });
        } catch (_e) {}
        cleanupAuthState();
        return;
      }

      toast({ title: "Welcome, admin", description: "Redirecting to the dashboard..." });

      // Full reload for a clean state, then go to /admin
      if (typeof window !== "undefined") {
        window.location.href = "/admin";
      } else {
        navigate("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Admin Login</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in with your admin credentials to access the dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@menuhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full flex items-center gap-2" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Default credentials: admin@menuhub.com / AdminPass123!
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={createAdminUser}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Admin User (if needed)"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
