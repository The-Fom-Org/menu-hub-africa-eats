import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/contexts/BranchContext';

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
  created_at?: string;
  updated_at?: string;
}

export function useRestaurantData() {
  const { selectedBranch } = useBranch();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRestaurantData = async (restaurantId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) {
        console.error('Error fetching restaurant data:', error);
        return;
      }

      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRestaurant = async (updates: Partial<Restaurant>) => {
    if (!selectedBranch?.restaurant_id) return null;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', selectedBranch.restaurant_id)
        .select()
        .single();

      if (error) throw error;

      setRestaurant(data);
      return data;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (selectedBranch?.restaurant_id) {
      fetchRestaurantData(selectedBranch.restaurant_id);
    } else {
      setRestaurant(null);
    }
  }, [selectedBranch?.restaurant_id]);

  return {
    restaurant: restaurant || selectedBranch?.restaurant,
    loading,
    updateRestaurant,
    refetch: () => {
      if (selectedBranch?.restaurant_id) {
        fetchRestaurantData(selectedBranch.restaurant_id);
      }
    }
  };
}