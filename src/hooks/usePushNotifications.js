import { useEffect } from 'react';
import { requestFirebaseToken, onMessageListener, messaging } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

// Requests notification permission + an FCM token and stores it on the
// user's profile. Called from the Settings push toggle; returns { ok, reason }
// so the UI can surface the outcome honestly.
export const registerPushDevice = async (userId) => {
  if (!messaging) return { ok: false, reason: 'push is not configured in this build' };
  if (typeof Notification === 'undefined') return { ok: false, reason: 'this browser does not support notifications' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'notification permission was denied' };

  const token = await requestFirebaseToken();
  if (!token) return { ok: false, reason: 'could not get a device token' };

  const { error } = await supabase
    .from('user_profiles')
    .update({ fcm_token: token })
    .eq('id', userId);
  if (error) return { ok: false, reason: error.message };

  return { ok: true };
};

export const usePushNotifications = () => {
  const session = useUserStore(state => state.session);

  useEffect(() => {
    if (!session || !messaging) return;
    // Silent token refresh on login — never prompts; the permission request
    // happens from the Settings toggle (registerPushDevice) instead
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    registerPushDevice(session.user.id).catch((err) =>
      console.error('FCM token refresh failed:', err.message)
    );

    let cancelled = false;
    const listen = async () => {
      while (!cancelled) {
        try {
          const payload = await onMessageListener();
          if (payload) console.log('Push received in foreground', payload);
        } catch (err) {
          console.error('FCM foreground listener error', err);
          break;
        }
      }
    };
    listen();

    return () => { cancelled = true; };
  }, [session]);
};
