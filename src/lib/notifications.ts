
"use server";

import webpush from 'web-push';
import { supabase } from './supabase/client';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn("VAPID keys are not set. Push notifications will not work.");
} else {
    webpush.setVapidDetails(
      'mailto:m.waterspk@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );
}

interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
}

export async function sendNotification(subscription: webpush.PushSubscription, payload: NotificationPayload) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        throw new Error("VAPID keys must be configured to send notifications.");
    }
    
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error: any) {
        console.error('Error sending notification, subscription probably expired', error);
        // If the subscription is expired or invalid, remove it from the database
        if (error.statusCode === 404 || error.statusCode === 410) {
            console.log('Subscription is no longer valid, deleting from DB');
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);
        } else {
            throw error;
        }
    }
}
