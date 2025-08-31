
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type WaiterCall = {
  id: string;
  table_number: string;
  notes: string | null;
  status: string;
  created_at: string;
};

export function WaiterCallNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('waiter_calls')
        .select('*')
        .eq('restaurant_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching waiter calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('waiter_calls')
        .update({ status: 'resolved' })
        .eq('id', callId);

      if (error) throw error;

      setCalls(prev => prev.filter(call => call.id !== callId));
      toast({
        title: "Call resolved",
        description: "Waiter call has been marked as resolved.",
      });
    } catch (error) {
      console.error('Error resolving waiter call:', error);
      toast({
        title: "Error",
        description: "Failed to resolve waiter call.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCalls();

    // Set up real-time subscription
    if (!user?.id) return;

    const channel = supabase
      .channel(`waiter-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'waiter_calls',
          filter: `restaurant_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New waiter call:', payload.new);
          setCalls(prev => [payload.new as WaiterCall, ...prev]);
          
          // Show toast notification
          toast({
            title: "🔔 Waiter Needed!",
            description: `Table ${payload.new.table_number} needs assistance.`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Waiter Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading calls...</p>
        </CardContent>
      </Card>
    );
  }

  if (calls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Waiter Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pending waiter calls.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Waiter Calls
          <Badge variant="destructive">{calls.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {calls.map((call) => (
            <div
              key={call.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 border-yellow-200"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="font-medium">Table {call.table_number}</p>
                  {call.notes && (
                    <p className="text-sm text-muted-foreground">{call.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(call.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => markAsResolved(call.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolve
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
