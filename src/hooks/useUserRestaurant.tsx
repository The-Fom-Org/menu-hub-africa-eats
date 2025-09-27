import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserRestaurant = (userId: string | undefined) => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRestaurant = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching restaurant for user:', userId);
        
        const { data, error } = await (supabase as any)
          .from('user_branches')
          .select('restaurant_id')
          .eq('user_id', userId)
          .eq('is_default', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching user restaurant:', error);
          console.error('❌ Full error:', JSON.stringify(error, null, 2));
        } else {
          const foundRestaurantId = (data as any)?.restaurant_id || null;
          console.log('✅ Found restaurant ID:', foundRestaurantId, 'for user:', userId);
          setRestaurantId(foundRestaurantId);
        }
      } catch (error) {
        console.error('❌ Error in fetchUserRestaurant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRestaurant();
  }, [userId]);

  return { restaurantId, loading };
};