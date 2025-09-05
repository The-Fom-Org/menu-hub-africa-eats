import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSettings {
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
}

interface PaymentGateway {
  type: string;
  enabled: boolean;
  settings?: Record<string, any>;
}

export const useRestaurantPaymentSettings = (restaurantId?: string) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaymentSettings = async () => {
      if (!restaurantId) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const { data, error: fetchError } = await (supabase as any)
          .from('restaurant_payment_settings')
          .select('payment_methods')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (data?.payment_methods) {
          setPaymentSettings(data.payment_methods as PaymentSettings);
        }
      } catch (err) {
        console.error('Error loading payment settings:', err);
        setError('Failed to load payment settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentSettings();
  }, [restaurantId]);

  const getAvailableGateways = (): PaymentGateway[] => {
    const gateways: PaymentGateway[] = [];

    if (paymentSettings.pesapal?.enabled && paymentSettings.pesapal?.consumer_key) {
      gateways.push({
        type: 'pesapal',
        enabled: true,
        settings: paymentSettings.pesapal
      });
    }

    if (paymentSettings.mpesa_manual?.enabled) {
      gateways.push({
        type: 'mpesa_manual',
        enabled: true,
        settings: paymentSettings.mpesa_manual
      });
    }

    if (paymentSettings.bank_transfer?.enabled) {
      gateways.push({
        type: 'bank_transfer',
        enabled: true,
        settings: paymentSettings.bank_transfer
      });
    }

    if (paymentSettings.cash?.enabled) {
      gateways.push({
        type: 'cash',
        enabled: true,
        settings: paymentSettings.cash
      });
    }

    return gateways;
  };

  const getPaymentMethodConfig = (type: string) => {
    switch (type) {
      case 'pesapal':
        return paymentSettings.pesapal;
      case 'mpesa_manual':
        return paymentSettings.mpesa_manual;
      case 'bank_transfer':
        return paymentSettings.bank_transfer;
      case 'cash':
        return paymentSettings.cash;
      default:
        return undefined;
    }
  };

  return {
    paymentSettings,
    availableGateways: getAvailableGateways(),
    getPaymentMethodConfig,
    isLoading,
    error
  };
};