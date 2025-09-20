import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCustomerOrderingStatus = (restaurantId: string) => {
  const [orderingEnabled, setOrderingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchOrderingStatus = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('ordering_enabled')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching ordering status:', error);
        setOrderingEnabled(true); // Default to enabled on error
      } else if (data) {
        setOrderingEnabled(data.ordering_enabled);
      } else {
        // No settings found, default to enabled
        setOrderingEnabled(true);
      }
    } catch (error) {
      console.error('Error fetching ordering status:', error);
      setOrderingEnabled(true); // Default to enabled on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderingStatus();
  }, [restaurantId]);

  return { orderingEnabled, loading };
};