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

        // Try to get restaurant ID from user_branches first (new model)
        const { data: userBranchData, error: branchError } = await (supabase as any)
          .from('user_branches')
          .select('restaurant_id')
          .eq('user_id', urlParamId)
          .eq('is_default', true)
          .maybeSingle();

        let actualRestaurantId = userBranchData?.restaurant_id;
        
        if (!actualRestaurantId) {
          console.log('⚠️ No restaurant found in user_branches for ordering status, using user ID as fallback');
          // Fallback to legacy model - there might not be restaurant settings
          setOrderingEnabled(true);
          return;
        }

        console.log('✅ Found restaurant ID for ordering status:', actualRestaurantId);

        const { data, error } = await (supabase as any)
          .from('restaurant_settings')
          .select('ordering_enabled')
          .eq('restaurant_id', actualRestaurantId)
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