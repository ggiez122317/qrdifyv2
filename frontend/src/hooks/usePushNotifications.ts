import { useEffect } from 'react';
import api from '@/lib/axios';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const usePushNotifications = () => {
    useEffect(() => {
        const initPush = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return;
            }

            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                // Only request permission if it hasn't been denied
                if (Notification.permission === 'denied') return;

                if (Notification.permission !== 'granted') {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') return;
                }

                const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!VAPID_PUBLIC_KEY) {
                    console.warn('VAPID Public Key missing - push notifications disabled');
                    return;
                }

                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                }

                // Some browsers/environments cause Axios to hang or fail when deeply cloning PushSubscription.
                // Converting it explicitly to JSON safely avoids these Axios timeout bugs.
                const subJSON = subscription.toJSON ? subscription.toJSON() : JSON.parse(JSON.stringify(subscription));

                await api.post('/api/push-subscriptions', subJSON);
            } catch (error) {
                console.warn('Push notification subscription failed/timed out:', error);
            }
        };

        // Only run after login is verified/user exists, but for simplicity, we do it in a layout 
        // that requires auth.
        initPush();
    }, []);
};
