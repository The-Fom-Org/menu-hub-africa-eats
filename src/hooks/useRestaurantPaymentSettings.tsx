import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionLimits } from './useSubscriptionLimits';
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
    mpesa_daraja?: {
      enabled: boolean;
      business_short_code?: string;
      consumer_key?: string;
      consumer_secret?: string;
      passkey?: string;
      environment?: 'sandbox' | 'production';
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
  const { allowedPaymentMethods } = useSubscriptionLimits(restaurantId);

  useEffect(() => {
    if (!restaurantId) return;
    
    fetchPaymentSettings();
  }, [restaurantId]);

  const fetchPaymentSettings = async () => {
    if (!restaurantId) {
      console.log('⚠️ No restaurantId provided for payment settings');
      setLoading(false);
      return;
    }

    console.log('🔍 Fetching payment settings for restaurant ID:', restaurantId);
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('restaurant_payment_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching payment settings:', fetchError);
        throw fetchError;
      }

      console.log('✅ Payment settings loaded:', data ? 'Found settings' : 'No settings found');
      console.log('📄 Payment methods:', data?.payment_methods);
      setSettings(data as PaymentSettings);
    } catch (err) {
      console.error('❌ Exception in fetchPaymentSettings:', err);
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
    console.log('🔍 getAvailableGateways called:', {
      hasSettings: !!settings,
      paymentMethods: settings?.payment_methods,
      restaurantId
    });
    
    if (!settings?.payment_methods) {
      console.log('⚠️ No payment methods configured for restaurant');
      return [];
    }
    
    const gateways = [];
    const methods = settings.payment_methods;
    
    console.log('🔍 Checking available gateways for restaurant:', restaurantId, methods);
    
    if (methods.pesapal?.enabled && methods.pesapal.consumer_key && methods.pesapal.consumer_secret) {
      console.log('✅ Pesapal gateway available');
      gateways.push('pesapal');
    } else {
      console.log('❌ Pesapal gateway not available:', {
        enabled: methods.pesapal?.enabled,
        hasConsumerKey: !!methods.pesapal?.consumer_key,
        hasConsumerSecret: !!methods.pesapal?.consumer_secret
      });
    }
    
    if (methods.mpesa_daraja?.enabled && methods.mpesa_daraja.business_short_code && methods.mpesa_daraja.consumer_key && methods.mpesa_daraja.consumer_secret && methods.mpesa_daraja.passkey) {
      console.log('✅ M-Pesa Daraja gateway available');
      gateways.push('mpesa_daraja');
    } else {
      console.log('❌ M-Pesa Daraja gateway not available:', {
        enabled: methods.mpesa_daraja?.enabled,
        hasShortCode: !!methods.mpesa_daraja?.business_short_code,
        hasConsumerKey: !!methods.mpesa_daraja?.consumer_key,
        hasConsumerSecret: !!methods.mpesa_daraja?.consumer_secret,
        hasPasskey: !!methods.mpesa_daraja?.passkey
      });
    }
    
    if (methods.mpesa_manual?.enabled && (methods.mpesa_manual.till_number || methods.mpesa_manual.paybill_number)) {
      console.log('✅ M-Pesa manual gateway available');
      gateways.push('mpesa_manual');
    } else {
      console.log('❌ M-Pesa manual gateway not available:', {
        enabled: methods.mpesa_manual?.enabled,
        hasTillNumber: !!methods.mpesa_manual?.till_number,
        hasPaybillNumber: !!methods.mpesa_manual?.paybill_number
      });
    }
    
    if (methods.bank_transfer?.enabled && methods.bank_transfer.bank_name && methods.bank_transfer.account_number) {
      console.log('✅ Bank transfer gateway available');
      gateways.push('bank_transfer');
    } else {
      console.log('❌ Bank transfer gateway not available:', {
        enabled: methods.bank_transfer?.enabled,
        hasBankName: !!methods.bank_transfer?.bank_name,
        hasAccountNumber: !!methods.bank_transfer?.account_number
      });
    }
    
    if (methods.cash?.enabled) {
      console.log('✅ Cash payment available');
      gateways.push('cash');
    } else {
      console.log('❌ Cash payment not available:', { enabled: methods.cash?.enabled });
    }
    
    console.log('📋 Available payment gateways (before subscription filter):', gateways);
    
    // Filter by subscription limits
    const filteredGateways = gateways.filter(gateway => allowedPaymentMethods.includes(gateway));
    console.log('📋 Available payment gateways (after subscription filter):', filteredGateways, 'Allowed by subscription:', allowedPaymentMethods);
    
    return filteredGateways;
  };

  const validatePaymentSetup = () => {
    const validationResults = {
      isValid: false,
      errors: [] as string[],
      warnings: [] as string[],
    };

    if (!settings?.payment_methods) {
      validationResults.errors.push('No payment methods configured');
      return validationResults;
    }

    const methods = settings.payment_methods;
    let hasValidMethod = false;

    // Validate Pesapal
    if (methods.pesapal?.enabled) {
      if (!methods.pesapal.consumer_key) {
        validationResults.errors.push('Pesapal Consumer Key is missing');
      } else if (!methods.pesapal.consumer_secret) {
        validationResults.errors.push('Pesapal Consumer Secret is missing');
      } else {
        hasValidMethod = true;
      }
    }

    // Validate M-Pesa Daraja
    if (methods.mpesa_daraja?.enabled) {
      if (!methods.mpesa_daraja.business_short_code) {
        validationResults.errors.push('M-Pesa Daraja Business Short Code is missing');
      } else if (!methods.mpesa_daraja.consumer_key) {
        validationResults.errors.push('M-Pesa Daraja Consumer Key is missing');
      } else if (!methods.mpesa_daraja.consumer_secret) {
        validationResults.errors.push('M-Pesa Daraja Consumer Secret is missing');
      } else if (!methods.mpesa_daraja.passkey) {
        validationResults.errors.push('M-Pesa Daraja Passkey is missing');
      } else {
        hasValidMethod = true;
      }
    }

    // Validate M-Pesa Manual
    if (methods.mpesa_manual?.enabled) {
      if (!methods.mpesa_manual.till_number && !methods.mpesa_manual.paybill_number) {
        validationResults.errors.push('M-Pesa Till Number or Paybill Number is required');
      } else {
        hasValidMethod = true;
      }
    }

    // Validate Bank Transfer
    if (methods.bank_transfer?.enabled) {
      if (!methods.bank_transfer.bank_name) {
        validationResults.errors.push('Bank name is missing for bank transfer');
      } else if (!methods.bank_transfer.account_number) {
        validationResults.errors.push('Account number is missing for bank transfer');
      } else {
        hasValidMethod = true;
      }
    }

    // Cash is always valid if enabled
    if (methods.cash?.enabled) {
      hasValidMethod = true;
    }

    if (!hasValidMethod) {
      validationResults.errors.push('No valid payment methods configured');
    }

    validationResults.isValid = validationResults.errors.length === 0 && hasValidMethod;
    return validationResults;
  };

  return {
    settings,
    loading,
    error,
    updatePaymentSettings,
    getAvailableGateways,
    validatePaymentSetup,
    refresh: fetchPaymentSettings,
  };
};