import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/lib/auth/cleanup';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Keep this minimal and synchronous to avoid deadlocks
        setUser(session?.user ?? null);
        setLoading(false);

        // If you later add data fetching on SIGNED_IN, defer it:
        // if (event === 'SIGNED_IN') {
        //   setTimeout(() => { /* fetch user data */ }, 0);
        // }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clean up local state first to avoid limbo
    cleanupAuthState();

    let error: unknown = null;
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
      if (signOutError) {
        error = signOutError;
        console.warn('[Auth] Global signOut returned error:', signOutError);
      }
    } catch (err) {
      // Ignore network or unrelated errors; cleanup already done
      console.warn('[Auth] Global signOut threw:', err);
    }

    setUser(null);

    // Force a full reload to ensure a clean state across the app
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return { error };
  };

  return { user, loading, signOut };
};
