import { useEffect } from 'react';
import { requestFirebaseToken, onMessageListener, messaging } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

export const usePushNotifications = () => {
  const session = useUserStore(state => state.session);

  useEffect(() => {
    if (!session || !messaging) return;

    const registerToken = async () => {
      try {
        const token = await requestFirebaseToken();
        if (token) {
          await supabase.from('user_profiles')
            .update({ fcm_token: token })
            .eq('id', session.user.id);
        }
      } catch (error) {
        console.error("Failed to register FCM token", error);
      }
    };

    registerToken();

    const listenForMessages = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          console.log("Received push notification in foreground", payload);
        }
        listenForMessages(); // keep listening
      } catch (err) {
        console.error("FCM foreground listener error", err);
      }
    };

    listenForMessages();
  }, [session]);
};
