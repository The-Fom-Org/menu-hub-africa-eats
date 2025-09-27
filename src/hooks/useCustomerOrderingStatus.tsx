import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCustomerOrderingStatus = (restaurantId: string) => {
  const [orderingEnabled, setOrderingEnabled] = useState(true); // Default to enabled
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderingStatus = async () => {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('restaurant_settings')
          .select('ordering_enabled')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching ordering status:', error);
          // Default to enabled on error
          setOrderingEnabled(true);
        } else {
          // If no settings found, default to enabled
          const enabled = data?.ordering_enabled ?? true;
          setOrderingEnabled(enabled);
        }
      } catch (error) {
        console.error('❌ Error in fetchOrderingStatus:', error);
        setOrderingEnabled(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderingStatus();

    // Set up real-time subscription for settings changes
    const subscription = supabase
      .channel('restaurant_settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_settings',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          if (payload.new && 'ordering_enabled' in payload.new) {
            const enabled = (payload.new as any).ordering_enabled;
            setOrderingEnabled(enabled);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [restaurantId]);

  return { orderingEnabled, loading };
};