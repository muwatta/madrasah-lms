import { useEffect, useCallback } from 'react';
import { pushAPI } from '../api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;

      // Check existing subscription
      let subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        // Already subscribed — ensure backend has it
        const subJson = subscription.toJSON();
        if (subJson.endpoint) {
          await pushAPI.subscribe({
            endpoint: subJson.endpoint,
            p256dh: (subJson.keys?.p256dh as string) || '',
            auth: (subJson.keys?.auth as string) || '',
          } as PushSubscription);
        }
        return true;
      }

      // Get VAPID key
      const res = await pushAPI.vapidKey();
      const vapidKey = res.data.publicKey;
      if (!vapidKey) return false;

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send to backend
      const subJson = subscription.toJSON();
      if (subJson.endpoint) {
        await pushAPI.subscribe({
          endpoint: subJson.endpoint,
          p256dh: (subJson.keys?.p256dh as string) || '',
          auth: (subJson.keys?.auth as string) || '',
        } as PushSubscription);
      }

      return true;
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await pushAPI.unsubscribe(endpoint);
      }
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
    }
  }, []);

  // Auto-register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return { subscribe, unsubscribe };
}
