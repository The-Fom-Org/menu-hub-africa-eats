
// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('📱 Push message received:', event);
  
  let notificationData = {
    title: 'Order Update',
    body: 'Your order status has been updated',
    icon: '/menuhub.png',
    badge: '/menuhub.png',
    tag: 'order-update',
    requireInteraction: true,
    data: {}
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📱 Push data received:', pushData);
      
      notificationData = {
        ...notificationData,
        ...pushData,
      };
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
    }
  }

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: 'view',
          title: 'View Order'
        }
      ]
    }
  );

  event.waitUntil(notificationPromise);
});

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        const hadWindowToFocus = clientsArr.some((windowClient) => {
          if (windowClient.url.includes(self.location.origin)) {
            windowClient.focus();
            return true;
          }
          return false;
        });

        if (!hadWindowToFocus) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
