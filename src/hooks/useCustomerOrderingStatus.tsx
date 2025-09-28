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
        // First, get the restaurant ID from user_branches table
        const { data: userBranchData, error: branchError } = await (supabase as any)
          .from('user_branches')
          .select('restaurant_id')
          .eq('user_id', urlParamId)
          .eq('is_default', true)
          .maybeSingle();

        if (branchError) {
          console.error('❌ Error fetching user restaurant for ordering status:', branchError);
          setOrderingEnabled(true);
          return;
        }

        const actualRestaurantId = userBranchData?.restaurant_id;
        if (!actualRestaurantId) {
          console.error('❌ Restaurant not found for user:', urlParamId);
          setOrderingEnabled(true);
          return;
        }

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