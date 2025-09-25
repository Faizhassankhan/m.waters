
"use client";

import { useEffect, useState, useContext } from 'react';
import { AppContext } from "@/contexts/app-provider";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
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

const NotificationSubscriber = () => {
  const { user } = useContext(AppContext);
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.serwist !== undefined) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    const subscribeAndStore = async () => {
      if (!VAPID_PUBLIC_KEY) {
        console.error("VAPID public key is not defined. Cannot subscribe for push notifications.");
        return;
      }
      if (user && !isSubscribed) {
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Store the subscription in your database
            const { error } = await supabase.from('push_subscriptions').insert({
                user_id: user.id,
                subscription: sub.toJSON(),
            });

            if (error) throw error;
            
            setSubscription(sub);
            setIsSubscribed(true);
            
            toast({
                title: "Notifications Enabled",
                description: "You'll now receive updates on new deliveries.",
            });
        } catch (error: any) {
            console.error('Failed to subscribe the user: ', error);
            if (Notification.permission === 'denied') {
                 toast({
                    variant: "destructive",
                    title: "Notification Permission Denied",
                    description: "Please enable notifications in your browser settings to receive updates.",
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Subscription Failed",
                    description: "Could not enable notifications. Please try again.",
                });
            }
        }
      }
    };

    subscribeAndStore();
  }, [user, isSubscribed, toast, VAPID_PUBLIC_KEY]);

  return null; // This component does not render anything
};

export default NotificationSubscriber;
