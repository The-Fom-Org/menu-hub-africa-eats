import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { playRingtone, RINGTONE_OPTIONS, RingtoneId } from '@/lib/audio/ringtones';

type NotificationSettings = {
  id?: string;
  restaurant_id?: string;
  ringtone: RingtoneId;
  volume: number; // 0..100
  notifications_enabled: boolean;
};

type UseRestaurantNotificationsReturn = {
  unreadCount: number;
  pulse: boolean;
  settings: NotificationSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  setSettings: (s: NotificationSettings) => void;
  saveSettings: () => Promise<void>;
  testRingtone: () => Promise<void>;
  markAllAsRead: () => void;
  options: typeof RINGTONE_OPTIONS;
};

const defaultSettings: NotificationSettings = {
  ringtone: 'classic-bell',
  volume: 90,
  notifications_enabled: true,
};

export function useRestaurantNotifications(): UseRestaurantNotificationsReturn {
  const { user } = useAuth();
  const userId = user?.id; // Use user ID directly instead of restaurant mapping
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [open, setOpen] = useState(false);
  const lastSeenKey = useMemo(() => (user?.id ? `order_notifications_last_seen_${user.id}` : ''), [user?.id]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load or create settings
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      console.log('[Notifications] Loading settings for', userId);

      const { data, error } = await (supabase as any)
        .from('restaurant_notification_settings')
        .select('*')
        .eq('restaurant_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Notifications] Failed to load settings', error);
      }

      if (!isMounted) return;

      if (!data) {
        // create default row
        const { data: inserted, error: insertError } = await (supabase as any)
          .from('restaurant_notification_settings')
          .insert({
            restaurant_id: userId,
            ringtone: defaultSettings.ringtone,
            volume: defaultSettings.volume,
            notifications_enabled: defaultSettings.notifications_enabled,
          })
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('[Notifications] Failed to create default settings', insertError);
          setSettings(defaultSettings);
        } else {
          setSettings(inserted || defaultSettings);
        }
      } else {
        setSettings({
          id: data.id,
          restaurant_id: data.restaurant_id,
          ringtone: (data.ringtone || defaultSettings.ringtone) as RingtoneId,
          volume: typeof data.volume === 'number' ? data.volume : defaultSettings.volume,
          notifications_enabled: data.notifications_enabled ?? defaultSettings.notifications_enabled,
        });
      }
      setIsLoading(false);
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Realtime subscription for new orders and waiter calls
  useEffect(() => {
    if (!userId) return;

    console.log('[Notifications] Setting up realtime subscription for user:', userId);

    if (channelRef.current) {
      console.log('[Notifications] Removing existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notify-${userId}`)
      // New orders
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log('[Notifications] New order received:', payload.new?.id);
          setUnreadCount((c) => c + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);

          // Play notification sound if enabled
          if (settings?.notifications_enabled && settings?.ringtone && settings?.volume) {
            playRingtone(settings.ringtone, settings.volume / 100);
          }
        }
      )
      // New waiter calls
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'waiter_calls',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const table = payload?.new?.table_number || 'unknown';
          console.log('[Notifications] Waiter needed at table:', table);
          setUnreadCount((c) => c + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);

          // Play notification sound if enabled
          if (settings?.notifications_enabled && settings?.ringtone && settings?.volume) {
            playRingtone(settings.ringtone, settings.volume / 100);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[Notifications] Subscription error:', err);
        } else {
          console.log('[Notifications] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            channelRef.current = channel;
          }
        }
      });

    return () => {
      console.log('[Notifications] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, settings?.notifications_enabled, settings?.ringtone, settings?.volume]);

  // Mark all as read
  const markAllAsRead = () => {
    setUnreadCount(0);
    if (lastSeenKey) {
      localStorage.setItem(lastSeenKey, new Date().toISOString());
    }
  };

  const saveSettings = async () => {
    if (!userId || !settings) return;
    setIsSaving(true);
    console.log('[Notifications] Saving settings:', settings);

    try {
      if (settings.id) {
        const { error } = await (supabase as any)
          .from('restaurant_notification_settings')
          .update({
            ringtone: settings.ringtone,
            volume: settings.volume,
            notifications_enabled: settings.notifications_enabled,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data: inserted, error } = await (supabase as any)
          .from('restaurant_notification_settings')
          .insert({
            restaurant_id: userId,
            ringtone: settings.ringtone,
            volume: settings.volume,
            notifications_enabled: settings.notifications_enabled,
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        setSettings((prev) => prev ? { ...prev, id: inserted?.id } : prev);
      }

      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('[Notifications] Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testRingtone = async () => {
    if (!settings?.ringtone) return;
    console.log('[Notifications] Testing ringtone:', settings.ringtone, 'at volume:', settings.volume);
    await playRingtone(settings.ringtone, (settings.volume || 50) / 100);
  };

  return {
    unreadCount,
    pulse,
    settings,
    isLoading,
    isSaving,
    open,
    setOpen,
    setSettings,
    saveSettings,
    testRingtone,
    markAllAsRead,
    options: RINGTONE_OPTIONS,
  };
}