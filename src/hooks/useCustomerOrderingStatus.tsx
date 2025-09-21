import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCustomerOrderingStatus = (restaurantId: string) => {
  const [orderingEnabled, setOrderingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchOrderingStatus = async () => {
    if (!restaurantId) {
      console.log('⚠️ [OrderingStatus] No restaurant ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 [OrderingStatus] Fetching ordering status for restaurant:', restaurantId);
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('ordering_enabled')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      console.log('📊 [OrderingStatus] Raw response:', { data, error });

      if (error) {
        console.error('❌ [OrderingStatus] Error fetching ordering status:', error);
        setOrderingEnabled(true); // Default to enabled on error
      } else if (data) {
        console.log('✅ [OrderingStatus] Setting ordering enabled to:', data.ordering_enabled);
        setOrderingEnabled(data.ordering_enabled);
      } else {
        console.log('⚠️ [OrderingStatus] No settings found, defaulting to enabled');
        // No settings found, default to enabled
        setOrderingEnabled(true);
      }
    } catch (error) {
      console.error('❌ [OrderingStatus] Catch error fetching ordering status:', error);
      setOrderingEnabled(true); // Default to enabled on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderingStatus();
    
    // Set up real-time subscription to restaurant settings
    const channel = supabase
      .channel('restaurant_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_settings',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('🔄 [OrderingStatus] Real-time update received:', payload);
          if (payload.new && 'ordering_enabled' in payload.new) {
            setOrderingEnabled(payload.new.ordering_enabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return { orderingEnabled, loading, refetch: fetchOrderingStatus };
};