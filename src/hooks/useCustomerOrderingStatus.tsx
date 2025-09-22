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

      console.log('🔄 Fetching ordering status for restaurant:', restaurantId);

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
          console.log('✅ Ordering status fetched:', enabled);
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
    console.log('📡 Setting up real-time subscription for restaurant:', restaurantId);
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
          console.log('📡 Real-time update received:', payload);
          if (payload.new && 'ordering_enabled' in payload.new) {
            const enabled = (payload.new as any).ordering_enabled;
            console.log('🔄 Updating ordering status via real-time:', enabled);
            setOrderingEnabled(enabled);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up ordering status subscription');
      subscription.unsubscribe();
    };
  }, [restaurantId]);

  return { orderingEnabled, loading };
};