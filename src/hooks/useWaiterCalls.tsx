import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WaiterCall {
  id: string;
  restaurant_id: string;
  table_number: string;
  customer_name?: string;
  notes?: string;
  status: 'pending' | 'acknowledged' | 'completed';
  created_at: string;
  updated_at: string;
}

export const useWaiterCalls = (restaurantId: string) => {
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWaiterCalls = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWaiterCalls((data || []).map(call => ({
        ...call,
        status: call.status as 'pending' | 'acknowledged' | 'completed'
      })));
    } catch (error) {
      console.error('Error fetching waiter calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWaiterCallStatus = async (callId: string, newStatus: 'acknowledged' | 'completed') => {
    try {
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      
      if (newStatus === 'acknowledged') {
        updateData.acknowledged_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('waiter_calls')
        .update(updateData)
        .eq('id', callId);

      if (error) throw error;

      // Update local state
      setWaiterCalls(prev => prev.map(call => 
        call.id === callId 
          ? { ...call, status: newStatus, updated_at: new Date().toISOString() }
          : call
      ));

      toast({
        title: "Status updated",
        description: `Waiter call marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating waiter call status:', error);
      toast({
        title: "Error",
        description: "Failed to update waiter call status",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!restaurantId) return;

    fetchWaiterCalls();

    const channel = supabase
      .channel('waiter-calls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiter_calls',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('Waiter call change detected:', payload);
          fetchWaiterCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const pendingCalls = waiterCalls.filter(call => call.status === 'pending');
  const acknowledgedCalls = waiterCalls.filter(call => call.status === 'acknowledged');
  const completedCalls = waiterCalls.filter(call => call.status === 'completed');

  return {
    waiterCalls,
    pendingCalls,
    acknowledgedCalls,
    completedCalls,
    loading,
    updateWaiterCallStatus,
    refetch: fetchWaiterCalls
  };
};