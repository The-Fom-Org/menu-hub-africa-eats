import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  phone_number?: string;
  logo_url?: string;
  cover_image_url?: string;
  primary_color?: string;
  secondary_color?: string;
  tagline?: string;
}

interface UserBranch {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: string;
  is_default: boolean;
  restaurant: Restaurant;
}

interface BranchContextType {
  currentBranch: UserBranch | null;
  userBranches: UserBranch[];
  loading: boolean;
  switchBranch: (branchId: string) => void;
  refreshBranches: () => Promise<void>;
  ensureUserHasRestaurant: () => Promise<string | null>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};

interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState<UserBranch | null>(null);
  const [userBranches, setUserBranches] = useState<UserBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserBranches = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: branches, error } = await supabase
        .from('user_branches')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setUserBranches(branches || []);

      // Set current branch from localStorage, default, or first available
      const savedBranchId = localStorage.getItem('currentBranchId');
      let targetBranch = null;

      if (savedBranchId) {
        targetBranch = branches?.find(b => b.id === savedBranchId);
      }

      if (!targetBranch) {
        targetBranch = branches?.find(b => b.is_default) || branches?.[0];
      }

      setCurrentBranch(targetBranch || null);
    } catch (error) {
      console.error('Error fetching user branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureUserHasRestaurant = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      // Call the database function to ensure user has a restaurant
      const { data, error } = await supabase
        .rpc('ensure_user_has_restaurant', { target_user_id: user.id });

      if (error) throw error;

      // Refresh branches after ensuring restaurant exists
      await fetchUserBranches();
      
      return data;
    } catch (error: any) {
      console.error('Error ensuring user has restaurant:', error);
      toast({
        title: "Setup Error",
        description: "There was an issue setting up your restaurant. Please try refreshing the page.",
        variant: "destructive",
      });
      return null;
    }
  };

  const switchBranch = (branchId: string) => {
    const branch = userBranches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      localStorage.setItem('currentBranchId', branchId);
    }
  };

  const refreshBranches = async () => {
    setLoading(true);
    await fetchUserBranches();
  };

  useEffect(() => {
    if (user) {
      fetchUserBranches();
    } else {
      setCurrentBranch(null);
      setUserBranches([]);
      setLoading(false);
    }
  }, [user]);

  // Auto-ensure restaurant exists if user has no branches
  useEffect(() => {
    if (!loading && user && userBranches.length === 0) {
      ensureUserHasRestaurant();
    }
  }, [loading, user, userBranches.length]);

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        userBranches,
        loading,
        switchBranch,
        refreshBranches,
        ensureUserHasRestaurant,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};