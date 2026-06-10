import React, { useState } from 'react';
import { Bell, Smartphone, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toggle } from '../ui/Toggle';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function NotificationChannels({ user, isDirty, setDirty }) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [waEnabled, setWaEnabled] = useState(false);
  const [waVerified, setWaVerified] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const handleToggle = (setter) => (checked) => {
    setter(checked);
    setDirty(true);
  };

  const handleVerify = async () => {
    setWaLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setWaLoading(false);
    setWaVerified(true);
    setDirty(true);
  };

  return (
    <div className="bg-white border border-surface-border rounded-[12px] shadow-sm mb-6">
      <div className="px-6 py-5 border-b border-surface-border flex items-center gap-2">
        <Bell size={20} className="text-text-primary" />
        <h3 className="text-[16px] font-bold text-text-primary">Notification Channels</h3>
      </div>

      <div className="px-6 flex flex-col">
        {/* Push row */}
        <div className="flex items-start gap-4 py-5 border-b border-surface-border">
          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Smartphone size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-bold text-text-primary mb-1">Push Notifications</h4>
            {pushEnabled ? (
              <p className="text-[13px] text-signal-green font-medium">
                Connected — iPhone 14 Pro
                <span className="text-brand-blue ml-3 hover:underline cursor-pointer">Send test</span>
              </p>
            ) : (
              <p className="text-[13px] text-text-secondary">Enable to receive alerts on your mobile device</p>
            )}
          </div>
          <div className="shrink-0 mt-1">
            <Toggle checked={pushEnabled} onChange={handleToggle(setPushEnabled)} />
          </div>
        </div>

        {/* WhatsApp row */}
        <div className="flex items-start gap-4 py-5 border-b border-surface-border">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-bold text-text-primary mb-1">WhatsApp</h4>
            <p className="text-[13px] text-text-secondary">Instant alerts via WhatsApp message</p>
            
            <AnimatePresence>
              {waEnabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3"
                >
                  {waVerified ? (
                    <p className="text-[13px] text-text-secondary mt-1">
                      Verified: +92 300 1234567 
                      <span className="text-brand-blue ml-3 hover:underline cursor-pointer">Change number</span>
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-[90px]">
                        <select className="h-[40px] w-full px-3 border border-surface-border rounded-[8px] bg-white text-[14px] text-text-primary outline-none focus:border-brand-blue">
                          <option>+92 🇵🇰</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <Input placeholder="300 1234567" />
                      </div>
                      <Button variant="secondary" onClick={handleVerify} disabled={waLoading}>
                        {waLoading ? '...' : 'Verify'}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="shrink-0 mt-1">
            <Toggle checked={waEnabled} onChange={handleToggle(setWaEnabled)} />
          </div>
        </div>

        {/* Email row */}
        <div className="flex items-start gap-4 py-5">
          <div className="w-10 h-10 rounded-full bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-bold text-text-primary mb-1">Email</h4>
            {emailEnabled ? (
              <p className="text-[13px] text-text-secondary font-medium">
                Alerts will be sent to {user?.email || 'user@example.com'}
                <span className="text-brand-blue ml-3 hover:underline cursor-pointer">Change email</span>
              </p>
            ) : (
              <p className="text-[13px] text-text-secondary">Enable to receive alerts via email</p>
            )}
          </div>
          <div className="shrink-0 mt-1">
            <Toggle checked={emailEnabled} onChange={handleToggle(setEmailEnabled)} />
          </div>
        </div>
      </div>
    </div>
  );
}
