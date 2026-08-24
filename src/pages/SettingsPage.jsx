import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smartphone, Info, MessageCircle, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { NotificationChannels } from '../components/settings/NotificationChannels';
import { AlertDefaults } from '../components/settings/AlertDefaults';
import { AccountSection } from '../components/settings/AccountSection';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { SUPPORT_EMAIL, supportMailto } from '../lib/constants';
import { toast } from 'sonner';

const GUIDE = [
  {
    icon: Smartphone,
    plate: 'bg-brand-blueSoft text-brand-blue',
    title: 'Push notifications',
    body: 'Install StrikeLine to your home screen, then flip the push toggle — your browser will ask for permission once.',
  },
  {
    icon: MessageCircle,
    plate: 'bg-signal-greenBg text-signal-green',
    title: 'WhatsApp',
    body: 'Save the StrikeLine number to your contacts and enter your number above without the leading zero, e.g. 3001234567.',
  },
  {
    icon: Info,
    plate: 'bg-brand-blueSoft text-brand-blue',
    title: 'Alert behaviour',
    body: "Alerts fire within 1% of a level as a heads-up, and again the moment it's actually hit. Repeat heads-ups are spaced at least 90 minutes apart.",
  },
];

export default function SettingsPage() {
  const user = useUserStore(state => state.user);
  const session = useUserStore(state => state.session);
  const refreshProfile = useUserStore(state => state.refreshProfile);
  const [isDirty, setDirty] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    // Only re-sync from the store while there are no unsaved local edits
    if (!isDirty) setLocalUser(user);
  }, [user, isDirty]);

  const handleSave = async () => {
    if (!session || !localUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: localUser.display_name,
          push_enabled: localUser.push_enabled,
          whatsapp_enabled: localUser.whatsapp_enabled,
          whatsapp_number: localUser.whatsapp_number,
          email_alerts_enabled: localUser.email_alerts_enabled,
          market_digest_enabled: localUser.market_digest_enabled,
          timezone: localUser.timezone
        })
        .eq('id', session.user.id);

      if (error) throw error;
      toast.success('Settings saved');
      setDirty(false);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to save settings:', err.message);
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!localUser) {
    return (
      <div className="max-w-[1200px] mx-auto w-full flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-[3px] border-surface-border border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const patch = (updates) => { setLocalUser({ ...localUser, ...updates }); setDirty(true); };

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        subtitle="Choose how StrikeLine reaches you and manage your account."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* ---- Forms ---- */}
        <div className="flex flex-col gap-5 min-w-0">
          <NotificationChannels user={localUser} onChange={patch} />
          <AlertDefaults />
          <AccountSection user={localUser} onChange={patch} />
          {/* Room for the floating save bar on mobile */}
          <div className="h-2 lg:hidden" />
        </div>

        {/* ---- Guide (desktop rail / mobile card) ---- */}
        <aside className="sl-card p-5 lg:sticky lg:top-4 order-first lg:order-none">
          <h3 className="text-[15px] font-bold text-text-primary tracking-tighter mb-4">
            Notification setup guide
          </h3>
          <div className="flex flex-col gap-4">
            {GUIDE.map((g, i) => (
              <div key={g.title} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-7 h-7 rounded-[9px] flex items-center justify-center ${g.plate}`}>
                    <g.icon size={14} />
                  </div>
                  {i < GUIDE.length - 1 && <span className="w-px flex-1 bg-surface-hairline mt-1.5" />}
                </div>
                <div className="min-w-0 pb-1">
                  <h4 className="text-[13.5px] font-bold text-text-primary tracking-tightish mb-1">
                    {g.title}
                  </h4>
                  <p className="text-[12.5px] text-text-secondary leading-relaxed">{g.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-surface-hairline">
            <h4 className="text-[13.5px] font-bold text-text-primary tracking-tightish mb-1">
              Still stuck?
            </h4>
            <p className="text-[12.5px] text-text-secondary leading-relaxed mb-3">
              Email us and we'll get back to you.
            </p>
            <a
              href={supportMailto('StrikeLine support', `Account: ${localUser?.email ?? ''}`)}
              className="sl-tap inline-flex items-center gap-2 h-9 px-3 rounded-[10px] bg-surface-muted text-[12.5px] font-semibold text-text-primary hover:bg-surface-border transition-colors max-w-full"
            >
              <Mail size={14} className="shrink-0 text-text-secondary" />
              <span className="truncate">{SUPPORT_EMAIL}</span>
            </a>
          </div>
        </aside>
      </div>

      {/* ---- Save bar ----
          Floats clear of the pill nav on mobile, above the content on desktop
          (md:left-[248px] keeps it inside the content column, off the sidebar).
          Portalled to <body> so no transformed ancestor can capture it. */}
      {createPortal(
        <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 md:left-[248px] bottom-nav md:bottom-4 z-20 px-3 md:px-8 pointer-events-none"
          >
            <div className="pointer-events-auto mx-auto max-w-[1200px] sl-glass-strong border border-white/70 ring-1 ring-slate-900/[0.05] shadow-pillnav rounded-[16px] px-3.5 py-2.5 flex items-center gap-3">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-signal-amber min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-amber shrink-0 animate-pulse" />
                <span className="truncate">Unsaved changes</span>
              </span>
              <div className="flex gap-2 ml-auto shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setLocalUser(user); setDirty(false); }}
                  disabled={isSaving}
                >
                  Discard
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
