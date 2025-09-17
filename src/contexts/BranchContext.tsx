import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  email?: string;
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
  selectedBranch: UserBranch | null;
  userBranches: UserBranch[];
  loading: boolean;
  switchBranch: (branchId: string) => void;
  refreshBranches: () => Promise<void>;
  createNewBranch: (restaurantData: Omit<Restaurant, 'id'>) => Promise<void>;
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
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<UserBranch | null>(null);
  const [userBranches, setUserBranches] = useState<UserBranch[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved branch from localStorage
  const loadSavedBranch = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedBranchId');
      return saved;
    }
    return null;
  };

  // Save selected branch to localStorage
  const saveBranch = (branchId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBranchId', branchId);
    }
  };

  const fetchUserBranches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_branches')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error fetching user branches:', error);
        return;
      }

      const branches = data?.map(branch => ({
        ...branch,
        restaurant: branch.restaurant
      })) || [];

      setUserBranches(branches);

      // Set selected branch
      const savedBranchId = loadSavedBranch();
      let branchToSelect = null;

      if (savedBranchId) {
        branchToSelect = branches.find(b => b.id === savedBranchId);
      }
      
      if (!branchToSelect) {
        branchToSelect = branches.find(b => b.is_default) || branches[0];
      }

      if (branchToSelect) {
        setSelectedBranch(branchToSelect);
        saveBranch(branchToSelect.id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchBranch = (branchId: string) => {
    const branch = userBranches.find(b => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch);
      saveBranch(branchId);
    }
  };

  const refreshBranches = async () => {
    await fetchUserBranches();
  };

  const createNewBranch = async (restaurantData: Omit<Restaurant, 'id'>) => {
    if (!user) return;

    try {
      // Create restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert([restaurantData])
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // Create user-branch relationship
      const { error: branchError } = await supabase
        .from('user_branches')
        .insert([{
          user_id: user.id,
          restaurant_id: restaurant.id,
          role: 'owner',
          is_default: userBranches.length === 0
        }]);

      if (branchError) throw branchError;

      // Refresh branches list
      await fetchUserBranches();
    } catch (error) {
      console.error('Error creating new branch:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserBranches();
    } else {
      setSelectedBranch(null);
      setUserBranches([]);
    }
  }, [user]);

  const value: BranchContextType = {
    selectedBranch,
    userBranches,
    loading,
    switchBranch,
    refreshBranches,
    createNewBranch
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};