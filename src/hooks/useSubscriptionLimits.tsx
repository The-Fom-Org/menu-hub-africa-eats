
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBranchMenuData } from './useBranchMenuData';

export interface SubscriptionLimits {
  plan: 'free' | 'standard' | 'advanced';
  maxMenuItems: number | null; // null means unlimited
  allowedPaymentMethods: string[];
  currentMenuItemCount: number;
  canAddMenuItem: boolean;
  canEnablePaymentMethod: (method: string) => boolean;
  isLoading: boolean;
}

export const useSubscriptionLimits = (restaurantId?: string): SubscriptionLimits => {
  const { user } = useAuth();
  const { categories } = useBranchMenuData();
  const [plan, setPlan] = useState<'free' | 'standard' | 'advanced'>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Use the provided restaurantId or fall back to current user
  const targetRestaurantId = restaurantId || user?.id;

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!targetRestaurantId) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Checking subscription for restaurant:', targetRestaurantId);
        
        const { data, error } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, managed_by_sales')
          .eq('restaurant_id', targetRestaurantId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error);
          setPlan('free');
        } else if (data?.subscribed || data?.managed_by_sales) {
          // Determine plan based on subscription tier
          const tier = data.subscription_tier?.toLowerCase();
          console.log('Subscription tier:', tier);
          
          if (tier?.includes('multi') || tier?.includes('advanced')) {
            setPlan('advanced');
          } else if (tier?.includes('standard')) {
            setPlan('standard');
          } else {
            setPlan('free');
          }
        } else {
          console.log('No active subscription found, using free plan');
          setPlan('free');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setPlan('free');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [targetRestaurantId]);

  // Calculate current menu item count
  const currentMenuItemCount = categories.reduce((total, category) => {
    return total + (category.menu_items?.length || 0);
  }, 0);

  // Define plan limits
  const planLimits = {
    free: {
      maxMenuItems: 15,
      allowedPaymentMethods: ['mpesa_manual', 'cash']
    },
    standard: {
      maxMenuItems: null, // unlimited
      allowedPaymentMethods: ['pesapal', 'mpesa_manual', 'bank_transfer', 'cash']
    },
    advanced: {
      maxMenuItems: null, // unlimited
      allowedPaymentMethods: ['pesapal', 'mpesa_manual', 'bank_transfer', 'cash']
    }
  };

  const currentLimits = planLimits[plan];
  const canAddMenuItem = currentLimits.maxMenuItems === null || 
                        currentMenuItemCount < currentLimits.maxMenuItems;

  const canEnablePaymentMethod = (method: string) => {
    return currentLimits.allowedPaymentMethods.includes(method);
  };

  console.log('Subscription limits result:', {
    plan,
    allowedPaymentMethods: currentLimits.allowedPaymentMethods,
    isLoading,
    targetRestaurantId
  });

  return {
    plan,
    maxMenuItems: currentLimits.maxMenuItems,
    allowedPaymentMethods: currentLimits.allowedPaymentMethods,
    currentMenuItemCount,
    canAddMenuItem,
    canEnablePaymentMethod,
    isLoading
  };
};
