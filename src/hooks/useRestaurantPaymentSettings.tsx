import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentSettings {
  id: string;
  restaurant_id: string;
  payment_methods: {
    pesapal?: {
      enabled: boolean;
      consumer_key?: string;
      consumer_secret?: string;
      ipn_id?: string;
    };
    mpesa_manual?: {
      enabled: boolean;
      till_number?: string;
      paybill_number?: string;
      account_number?: string;
    };
    bank_transfer?: {
      enabled: boolean;
      bank_name?: string;
      account_number?: string;
      account_name?: string;
    };
    cash?: {
      enabled: boolean;
    };
  };
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

      setSettings(data as PaymentSettings);
    } catch (err) {
      console.error('Error fetching payment settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentSettings = async (paymentMethods: PaymentSettings['payment_methods']) => {
    try {
      const { error: updateError } = await supabase
        .from('restaurant_payment_settings')
        .upsert({
          restaurant_id: restaurantId,
          payment_methods: paymentMethods,
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
    if (!settings?.payment_methods) {
      return [];
    }
    
    const gateways = [];
    const methods = settings.payment_methods;
    
    if (methods.pesapal?.enabled && methods.pesapal.consumer_key && methods.pesapal.consumer_secret) {
      gateways.push('pesapal');
    }
    
    if (methods.mpesa_manual?.enabled && (methods.mpesa_manual.till_number || methods.mpesa_manual.paybill_number)) {
      gateways.push('mpesa');
    }
    
    if (methods.bank_transfer?.enabled && methods.bank_transfer.bank_name && methods.bank_transfer.account_number) {
      gateways.push('bank_transfer');
    }
    
    if (methods.cash?.enabled) {
      gateways.push('cash');
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