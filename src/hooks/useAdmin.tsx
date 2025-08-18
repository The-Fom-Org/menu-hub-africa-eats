
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSubscriber {
  id: string;
  restaurant_id: string;
  email: string;
  restaurant_name?: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_start?: string;
  subscription_end?: string;
  billing_method?: string;
  admin_notes?: string;
  managed_by_sales: boolean;
  created_at: string;
  updated_at: string;
}

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<RestaurantSubscriber[]>([]);

  useEffect(() => {
    // Wait for auth to finish initializing before deciding admin state
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (user) {
      setLoading(true);
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      console.log('Checking admin status for user:', user.id, user.email);
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Admin query result:', { data, error });

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        const isAdminUser = !!data;
        console.log('Is admin user:', isAdminUser);
        setIsAdmin(isAdminUser);
      }
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscribers:', error);
        return;
      }

      setSubscribers(data || []);
    } catch (error) {
      console.error('Error in fetchSubscribers:', error);
    }
  };

  const updateSubscriber = async (
    restaurantId: string,
    updates: Partial<RestaurantSubscriber>
  ) => {
    if (!isAdmin) return { error: 'Unauthorized' };

    try {
      const upsertData = {
        restaurant_id: restaurantId,
        email: updates.email || '',
        ...updates,
      };

      const { data, error } = await supabase
        .from('subscribers')
        .upsert(upsertData)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscriber:', error);
        return { error: (error as any).message };
      }

      await fetchSubscribers();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateSubscriber:', error);
      return { error: 'Failed to update subscriber' };
    }
  };

  const searchRestaurants = async (searchTerm: string) => {
    if (!isAdmin || !searchTerm.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .or(`email.ilike.%${searchTerm}%,restaurant_name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching restaurants:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchRestaurants:', error);
      return [];
    }
  };

  return {
    user,
    isAdmin,
    loading,
    subscribers,
    fetchSubscribers,
    updateSubscriber,
    searchRestaurants,
  };
};
