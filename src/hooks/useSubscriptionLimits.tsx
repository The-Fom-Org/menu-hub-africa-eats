
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMenuData } from './useMenuData';

export interface SubscriptionLimits {
  plan: 'free' | 'standard' | 'advanced';
  maxMenuItems: number | null; // null means unlimited
  allowedPaymentMethods: string[];
  currentMenuItemCount: number;
  canAddMenuItem: boolean;
  canEnablePaymentMethod: (method: string) => boolean;
  canUsePreOrders: boolean; // New: whether pre-orders are allowed
  requiresUpgradeForPreOrders: boolean; // New: whether upgrade is needed for pre-orders
  isLoading: boolean;
}

export const useSubscriptionLimits = (): SubscriptionLimits => {
  const { user } = useAuth();
  const { categories } = useMenuData();
  const [plan, setPlan] = useState<'free' | 'standard' | 'advanced'>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, managed_by_sales')
          .eq('restaurant_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
          setPlan('free');
        } else if (data?.subscribed || data?.managed_by_sales) {
          // Determine plan based on subscription tier
          const tier = data.subscription_tier?.toLowerCase();
          if (tier?.includes('multi') || tier?.includes('advanced')) {
            setPlan('advanced');
          } else if (tier?.includes('standard')) {
            setPlan('standard');
          } else {
            setPlan('free');
          }
        } else {
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
  }, [user]);

  // Calculate current menu item count
  const currentMenuItemCount = categories.reduce((total, category) => {
    return total + (category.menu_items?.length || 0);
  }, 0);

  // Define plan limits
  const planLimits = {
    free: {
      maxMenuItems: 15,
      allowedPaymentMethods: ['mpesa_manual', 'cash', 'bank_transfer'], // Allow manual payments
      canUsePreOrders: false, // No pre-orders for free plan
    },
    standard: {
      maxMenuItems: null, // unlimited
      allowedPaymentMethods: ['pesapal', 'mpesa_manual', 'bank_transfer', 'cash'],
      canUsePreOrders: true, // Pre-orders allowed
    },
    advanced: {
      maxMenuItems: null, // unlimited
      allowedPaymentMethods: ['pesapal', 'mpesa_manual', 'bank_transfer', 'cash'],
      canUsePreOrders: true, // Pre-orders allowed
    }
  };

  const currentLimits = planLimits[plan];
  const canAddMenuItem = currentLimits.maxMenuItems === null || 
                        currentMenuItemCount < currentLimits.maxMenuItems;

  const canEnablePaymentMethod = (method: string) => {
    return currentLimits.allowedPaymentMethods.includes(method);
  };

  return {
    plan,
    maxMenuItems: currentLimits.maxMenuItems,
    allowedPaymentMethods: currentLimits.allowedPaymentMethods,
    currentMenuItemCount,
    canAddMenuItem,
    canEnablePaymentMethod,
    canUsePreOrders: currentLimits.canUsePreOrders,
    requiresUpgradeForPreOrders: !currentLimits.canUsePreOrders,
    isLoading
  };
};
