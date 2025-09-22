import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  ordering_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useRestaurantSettings = (restaurantId: string) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('restaurant_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await (supabase as any)
          .from('restaurant_settings')
          .insert({
            restaurant_id: restaurantId,
            ordering_enabled: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating restaurant settings:', createError);
        } else {
          setSettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderingEnabled = async (enabled: boolean) => {
    if (!restaurantId) return false;

    try {
      // First try to update if settings exist
      const { data: existingData } = await (supabase as any)
        .from('restaurant_settings')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      let result;
      if (existingData) {
        // Update existing settings
        result = await (supabase as any)
          .from('restaurant_settings')
          .update({ 
            ordering_enabled: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('restaurant_id', restaurantId)
          .select()
          .single();
      } else {
        // Insert new settings
        result = await (supabase as any)
          .from('restaurant_settings')
          .insert({
            restaurant_id: restaurantId,
            ordering_enabled: enabled
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error updating restaurant settings:', result.error);
        toast({
          title: "Error",
          description: "Failed to update settings. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      setSettings(result.data);
      toast({
        title: "Settings updated",
        description: `Ordering system has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
      return true;
    } catch (error) {
      console.error('Error in updateOrderingEnabled:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  return {
    settings,
    loading,
    updateOrderingEnabled,
    refresh: fetchSettings
  };
};