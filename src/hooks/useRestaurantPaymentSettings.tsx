import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentSettings {
  id: string;
  restaurant_id: string;
  pesapal_consumer_key?: string;
  pesapal_consumer_secret?: string;
  pesapal_ipn_id?: string;
  mpesa_business_shortcode?: string;
  mpesa_till_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  created_at: string;
  updated_at: string;
}

export const useRestaurantPaymentSettings = (restaurantId: string) => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!restaurantId) return;
    
    fetchPaymentSettings();
  }, [restaurantId]);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('restaurant_payment_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSettings(data);
    } catch (err) {
      console.error('Error fetching payment settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentSettings = async (updates: Partial<PaymentSettings>) => {
    try {
      const { error: updateError } = await supabase
        .from('restaurant_payment_settings')
        .upsert({
          restaurant_id: restaurantId,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Payment settings updated successfully",
      });

      await fetchPaymentSettings();
    } catch (err) {
      console.error('Error updating payment settings:', err);
      toast({
        title: "Error",
        description: "Failed to update payment settings",
        variant: "destructive",
      });
      throw err;
    }
  };

  const getAvailableGateways = () => {
    if (!settings) return [];
    
    const gateways = [];
    
    if (settings.pesapal_consumer_key && settings.pesapal_consumer_secret) {
      gateways.push('pesapal');
    }
    
    if (settings.mpesa_till_number || settings.mpesa_business_shortcode) {
      gateways.push('mpesa');
    }
    
    if (settings.bank_account_number && settings.bank_name) {
      gateways.push('bank_transfer');
    }
    
    return gateways;
  };

  return {
    settings,
    loading,
    error,
    updatePaymentSettings,
    getAvailableGateways,
    refresh: fetchPaymentSettings,
  };
};