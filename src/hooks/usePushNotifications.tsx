
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Updated VAPID public key with proper P-256 format (Base64 URL encoded)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLWpRS3aayd6oZtql3BGFyXl4FvTZrYlBaU7YTJjFID5gcmqinVc5eg';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll receive updates about your orders.",
        });
        return true;
      } else {
        toast({
          title: "Notifications denied",
          description: "You won't receive order updates.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Permission error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
      return false;
    }
  };

  const subscribeToPush = async (orderId: string) => {
    console.log('🔔 Starting push subscription for order:', orderId);
    
    if (!isSupported) {
      console.log('❌ Push notifications not supported');
      return null;
    }

    if (permission !== 'granted') {
      console.log('❌ Permission not granted, requesting...');
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      setLoading(true);
      
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');
      
      // Convert VAPID public key from Base64 URL to Uint8Array
      const applicationServerKey = base64UrlToUint8Array(VAPID_PUBLIC_KEY);
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('✅ Push subscription created:', pushSubscription);
      setSubscription(pushSubscription);

      // Save subscription to database
      const { error } = await supabase.functions.invoke('save-push-subscription', {
        body: {
          orderId,
          subscription: pushSubscription.toJSON(),
        },
      });

      if (error) {
        console.error('❌ Error saving push subscription:', error);
        toast({
          title: "Subscription failed",
          description: "Failed to save notification subscription.",
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Push subscription saved successfully');
      toast({
        title: "Notifications enabled",
        description: "You'll receive updates about this order.",
      });

      return pushSubscription;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      toast({
        title: "Subscription failed",
        description: "Failed to subscribe to notifications.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    loading,
    requestPermission,
    subscribeToPush,
  };
};

// Helper function to convert Base64 URL to Uint8Array for VAPID key
function base64UrlToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
