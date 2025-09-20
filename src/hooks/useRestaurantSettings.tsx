import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/hooks/use-toast';

interface RestaurantSettings {
  ordering_enabled: boolean;
  loading: boolean;
  updateOrderingEnabled: (enabled: boolean) => Promise<void>;
}

export const useRestaurantSettings = (): RestaurantSettings => {
  const [orderingEnabled, setOrderingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const { currentBranch } = useBranch();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!currentBranch?.restaurant_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('ordering_enabled')
        .eq('restaurant_id', currentBranch.restaurant_id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const { error: insertError } = await supabase
          .from('restaurant_settings')
          .insert({
            restaurant_id: currentBranch.restaurant_id,
            ordering_enabled: true,
          });

        if (insertError) throw insertError;
        setOrderingEnabled(true);
      } else {
        setOrderingEnabled(data.ordering_enabled);
      }
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurant settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderingEnabled = async (enabled: boolean) => {
    if (!currentBranch?.restaurant_id) return;

    try {
      const { error } = await supabase
        .from('restaurant_settings')
        .upsert({
          restaurant_id: currentBranch.restaurant_id,
          ordering_enabled: enabled,
        });

      if (error) throw error;

      setOrderingEnabled(enabled);
      toast({
        title: "Settings Updated",
        description: `Ordering system ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating restaurant settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [currentBranch?.restaurant_id]);

  return {
    ordering_enabled: orderingEnabled,
    loading,
    updateOrderingEnabled,
  };
};