import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RestaurantSettings {
  id: string;
  user_id: string;
  ordering_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useRestaurantSettings = (userId: string) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('restaurant_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      } else {
        // Get admin default before creating settings
        const { data: adminSettings } = await (supabase as any)
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'default_ordering_enabled')
          .maybeSingle();

        const defaultEnabled = adminSettings?.setting_value && 
          typeof adminSettings.setting_value === 'object' && 
          'enabled' in adminSettings.setting_value 
            ? (adminSettings.setting_value as { enabled: boolean }).enabled 
            : true;

        // Create default settings if none exist using admin default
        const { data: newSettings, error: createError } = await (supabase as any)
          .from('restaurant_settings')
          .insert({
            user_id: userId,
            ordering_enabled: defaultEnabled
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
    if (!userId) return false;

    try {
      // First try to update if settings exist
      const { data: existingData } = await (supabase as any)
        .from('restaurant_settings')
        .select('id')
        .eq('user_id', userId)
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
          .eq('user_id', userId)
          .select()
          .single();
      } else {
        // Get admin default before creating new settings
        const { data: adminSettings } = await (supabase as any)
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'default_ordering_enabled')
          .maybeSingle();

        const defaultEnabled = adminSettings?.setting_value && 
          typeof adminSettings.setting_value === 'object' && 
          'enabled' in adminSettings.setting_value 
            ? (adminSettings.setting_value as { enabled: boolean }).enabled 
            : true;

        // Insert new settings with admin default
        result = await (supabase as any)
          .from('restaurant_settings')
          .insert({
            user_id: userId,
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
  }, [userId]);

  return {
    settings,
    loading,
    updateOrderingEnabled,
    refresh: fetchSettings
  };
};