
import React, { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<RestaurantSubscriber[]>([]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
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
      // Ensure we have required fields for upsert
      const upsertData = {
        restaurant_id: restaurantId,
        email: updates.email || '', // Provide a default if missing
        ...updates,
      };

      const { data, error } = await supabase
        .from('subscribers')
        .upsert(upsertData)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscriber:', error);
        return { error: error.message };
      }

      // Refresh the subscribers list
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
