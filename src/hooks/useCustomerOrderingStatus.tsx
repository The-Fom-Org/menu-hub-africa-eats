import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch restaurant ordering status for customer menu.
 * 
 * @param urlParamId - The user ID from the URL (typically from QR codes)
 *                     This gets resolved to the actual restaurant ID to check settings
 * @returns Whether ordering is enabled for the restaurant
 */
export const useCustomerOrderingStatus = (urlParamId: string) => {
  const [orderingEnabled, setOrderingEnabled] = useState(false); // Default to disabled to prevent race condition
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderingStatus = async () => {
      if (!urlParamId) {
        console.log('⚠️ No urlParamId provided, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching ordering status for URL param:', urlParamId);

        // Direct query using user_id (post-migration model)
        const { data, error } = await (supabase as any)
          .from('restaurant_settings')
          .select('ordering_enabled')
          .eq('user_id', urlParamId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching ordering status:', error);
          // Default to enabled on error to maintain functionality
          setOrderingEnabled(true);
          console.log('⚠️ Using default ordering enabled due to error');
        } else {
          // If no settings found, default to enabled for new restaurants
          const enabled = data?.ordering_enabled ?? true;
          setOrderingEnabled(enabled);
          console.log('✅ Ordering status loaded:', { enabled, hasData: !!data });
        }
      } catch (error) {
        console.error('❌ Error in fetchOrderingStatus:', error);
        // Default to enabled on exception to maintain functionality
        setOrderingEnabled(true);
        console.log('⚠️ Using default ordering enabled due to exception');
      } finally {
        setLoading(false);
        console.log('🏁 Ordering status loading completed');
      }
    };

    fetchOrderingStatus();

    // Set up real-time subscription for ordering status changes
    console.log('🔔 Setting up real-time subscription for ordering status');
    const channel = supabase
      .channel('restaurant-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurant_settings',
          filter: `user_id=eq.${urlParamId}`
        },
        (payload) => {
          console.log('🔔 Real-time ordering status update:', payload);
          const newEnabled = payload.new?.ordering_enabled ?? true;
          setOrderingEnabled(newEnabled);
          console.log('🔔 Updated ordering status via real-time:', newEnabled);
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [urlParamId]);

  return { orderingEnabled, loading };
};