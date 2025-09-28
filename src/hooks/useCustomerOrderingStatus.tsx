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
  const [orderingEnabled, setOrderingEnabled] = useState(true); // Default to enabled
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderingStatus = async () => {
      if (!urlParamId) {
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
          // Default to enabled on error
          setOrderingEnabled(true);
        } else {
          // If no settings found, default to enabled
          const enabled = data?.ordering_enabled ?? true;
          setOrderingEnabled(enabled);
          console.log('✅ Ordering status:', enabled);
        }
      } catch (error) {
        console.error('❌ Error in fetchOrderingStatus:', error);
        setOrderingEnabled(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderingStatus();

    // Note: Real-time subscription would need the actual restaurant ID
    // For now, we'll skip it to avoid complexity, but it can be added later
  }, [urlParamId]);

  return { orderingEnabled, loading };
};