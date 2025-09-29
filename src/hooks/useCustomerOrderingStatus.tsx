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
  const [orderingEnabled, setOrderingEnabled] = useState(false); // Default to disabled, only enable when explicitly set
  
  useEffect(() => {
    const fetchOrderingStatus = async () => {
      if (!urlParamId) {
        console.log('⚠️ No urlParamId provided, keeping default disabled');
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
          console.log('⚠️ Keeping default ordering disabled due to error');
        } else {
          // If no settings found, default to disabled for new restaurants
          const enabled = data?.ordering_enabled ?? false;
          setOrderingEnabled(enabled);
          console.log('✅ Ordering status loaded:', { enabled, hasData: !!data });
        }
      } catch (error) {
        console.error('❌ Error in fetchOrderingStatus:', error);
        console.log('⚠️ Keeping default ordering disabled due to exception');
      }
    };

    fetchOrderingStatus();

    // Set up real-time subscription for instant updates
    const channel = supabase
      .channel(`restaurant-settings-${urlParamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_settings',
          filter: `user_id=eq.${urlParamId}`
        },
        (payload) => {
          console.log('🔄 Real-time ordering status update:', payload);
          if (payload.new && 'ordering_enabled' in payload.new && typeof payload.new.ordering_enabled === 'boolean') {
            setOrderingEnabled(payload.new.ordering_enabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [urlParamId]);

  return { orderingEnabled };
};