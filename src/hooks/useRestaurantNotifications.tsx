
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
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      console.log('[Notifications] Loading settings for', user.id);

      const { data, error } = await (supabase as any)
        .from('restaurant_notification_settings')
        .select('*')
        .eq('restaurant_id', user.id)
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
            restaurant_id: user.id,
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
  }, [user?.id]);

  // Realtime subscription for new orders
  useEffect(() => {
    if (!user?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`order-notify-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Notifications] New order received:', payload.new?.id);
          setUnreadCount((c) => c + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 1500);

          if (settings?.notifications_enabled) {
            const ringtone = settings.ringtone ?? defaultSettings.ringtone;
            const volume = settings.volume ?? defaultSettings.volume;
            playRingtone(ringtone, volume);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Intentionally exclude settings from deps to avoid resubscribing;
    // we only read latest settings at event time via closure which is okay for our simple case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, settings?.notifications_enabled, settings?.ringtone, settings?.volume]);

  // Mark all as read
  const markAllAsRead = () => {
    setUnreadCount(0);
    if (lastSeenKey) {
      localStorage.setItem(lastSeenKey, new Date().toISOString());
    }
  };

  const saveSettings = async () => {
    if (!user?.id || !settings) return;
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
            restaurant_id: user.id,
            ringtone: settings.ringtone,
            volume: settings.volume,
            notifications_enabled: settings.notifications_enabled,
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        if (inserted?.id) {
          setSettings({ ...settings, id: inserted.id, restaurant_id: inserted.restaurant_id });
        }
      }

      toast({ title: 'Notification settings saved' });
    } catch (e) {
      console.error('[Notifications] Save failed', e);
      toast({
        title: 'Failed to save settings',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testRingtone = async () => {
    const rt = settings?.ringtone ?? defaultSettings.ringtone;
    const vol = settings?.volume ?? defaultSettings.volume;
    await playRingtone(rt, vol);
  };

  return {
    unreadCount,
    pulse,
    settings,
    isLoading,
    isSaving,
    open,
    setOpen,
    setSettings: (s: NotificationSettings) => setSettings(s),
    saveSettings,
    testRingtone,
    markAllAsRead,
    options: RINGTONE_OPTIONS,
  };
}
