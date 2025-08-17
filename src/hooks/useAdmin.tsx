
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("[useAdmin] admin check:", { data, error });
      setIsAdmin(!!data && !error);
      setLoading(false);
    };

    checkAdmin();
  }, [user?.id, authLoading]);

  return { isAdmin, loading, user };
}

export default useAdmin;
