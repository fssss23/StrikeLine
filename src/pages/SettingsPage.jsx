import React, { useState, useEffect } from 'react';
import { Smartphone, Info } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { NotificationChannels } from '../components/settings/NotificationChannels';
import { AlertDefaults } from '../components/settings/AlertDefaults';
import { AccountSection } from '../components/settings/AccountSection';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function SettingsPage() {
  const user = useUserStore(state => state.user);
  const session = useUserStore(state => state.session);
  const [isDirty, setDirty] = useState(false);
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const handleSave = async () => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          push_enabled: localUser.push_enabled,
          whatsapp_enabled: localUser.whatsapp_enabled,
          whatsapp_number: localUser.whatsapp_number,
          email_alerts_enabled: localUser.email_alerts_enabled,
          timezone: localUser.timezone,
          cooldown_minutes: localUser.cooldown_minutes,
          buffer_pct: localUser.buffer_pct
        })
        .eq('id', session.user.id);
        
      if (error) throw error;
      toast.success('Settings saved');
      setDirty(false);
    } catch (err) {
      toast.error(`Failed to save settings: ${err.message}`);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage your notification preferences and account details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        
        {/* Left Column - Forms */}
        <div className="flex flex-col relative pb-24 lg:pb-0">
          <NotificationChannels user={localUser} onChange={(updates) => { setLocalUser({...localUser, ...updates}); setDirty(true); }} />
          <AlertDefaults user={localUser} onChange={(updates) => { setLocalUser({...localUser, ...updates}); setDirty(true); }} />
          <AccountSection user={localUser} onChange={(updates) => { setLocalUser({...localUser, ...updates}); setDirty(true); }} />

          {/* Sticky Save Bar */}
          <div className="fixed bottom-0 left-0 right-0 lg:sticky lg:bottom-0 lg:-mx-6 lg:-mb-6 bg-white/95 backdrop-blur-sm border-t border-surface-border p-4 px-6 mt-8 z-30">
            <div className="flex justify-between items-center max-w-[1200px] mx-auto lg:max-w-none">
              <span className="text-[13px] font-medium text-signal-amber">
                {isDirty ? 'Unsaved changes' : ''}
              </span>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { setLocalUser(user); setDirty(false); }} disabled={!isDirty}>
                  Discard changes
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={!isDirty}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Help Panel */}
        <div className="sticky top-6 bg-white border border-surface-border rounded-[12px] p-5 space-y-6 shadow-sm">
          <h3 className="text-[16px] font-bold text-text-primary">Notification Setup Guide</h3>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Smartphone size={14} />
              </div>
              <h4 className="text-[14px] font-bold text-text-primary">1. Push Notifications</h4>
            </div>
            <p className="text-[13px] text-text-secondary ml-8">
              Install StrikeLine as a PWA on your home screen, then enable push notifications when prompted.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                </svg>
              </div>
              <h4 className="text-[14px] font-bold text-text-primary">2. WhatsApp</h4>
            </div>
            <p className="text-[13px] text-text-secondary ml-8">
              Add +92-XXX-XXXXXXX to your contacts, then verify your number above. You'll receive a one-time code.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
                <Info size={14} />
              </div>
              <h4 className="text-[14px] font-bold text-text-primary">3. Limits & Cooldowns</h4>
            </div>
            <p className="text-[13px] text-text-secondary ml-8">
              The cooldown period prevents alert spam. The buffer helps catch prices that approach but don't exactly hit your level.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
