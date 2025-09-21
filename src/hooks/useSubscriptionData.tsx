
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  managed_by_sales?: boolean;
}

export function useSubscriptionData(userId: string | undefined) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscriptionStatus = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end, managed_by_sales')
        .eq('restaurant_id', userId)
        .maybeSingle();

      if (!subError && subData) {
        setSubscriptionData({
          subscribed: !!subData.subscribed,
          subscription_tier: subData.subscription_tier,
          subscription_end: subData.subscription_end,
          managed_by_sales: subData.managed_by_sales
        });
      } else {
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          managed_by_sales: false
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        managed_by_sales: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      checkSubscriptionStatus();
    }
  }, [userId]);

  return {
    subscriptionData,
    loading,
    refetch: checkSubscriptionStatus
  };
}
