import { Bell, Smartphone, Mail, CalendarClock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toggle } from '../ui/Toggle';
import { Input } from '../ui/Input';
import { Card, CardHeader } from '../ui/Card';
import { registerPushDevice } from '../../hooks/usePushNotifications';
import { cn } from '../../lib/utils';

function WhatsAppGlyph({ size = 20, color = '#16A34A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

/** One channel row: plate + copy + switch, with optional expanding detail. */
function ChannelRow({ plate, icon, title, description, tone, checked, onChange, children, last, disabled }) {
  return (
    <div className={cn('flex items-start gap-3 md:gap-4 py-4', !last && 'border-b border-surface-hairline')}>
      <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0', plate)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[14.5px] font-bold text-text-primary tracking-tightish">{title}</h4>
        <p className={cn('text-[12.5px] mt-0.5 leading-relaxed', tone || 'text-text-secondary')}>
          {description}
        </p>
        {children}
      </div>
      <div className="shrink-0 pt-1">
        <Toggle checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
}

export function NotificationChannels({ user, onChange }) {
  const pushEnabled = user?.push_enabled ?? false;
  const waEnabled = user?.whatsapp_enabled ?? false;
  const waNumber = user?.whatsapp_number ?? '';
  const emailEnabled = user?.email_alerts_enabled ?? false;
  const digestEnabled = user?.market_digest_enabled ?? false;

  const handlePushToggle = async (checked) => {
    onChange({ push_enabled: checked });
    if (!checked || !user?.id) return;
    // Turning push on needs browser permission + a device token
    const { ok, reason } = await registerPushDevice(user.id);
    if (ok) {
      toast.success('Push notifications enabled on this device');
    } else {
      toast.error(`Push setup incomplete: ${reason}`);
    }
  };

  return (
    <Card>
      <CardHeader icon={Bell} title="Notification Channels" subtitle="Where StrikeLine reaches you when a level is hit" />

      <div className="px-4 md:px-5">
        <ChannelRow
          plate="bg-brand-blueSoft text-brand-blue"
          icon={<Smartphone size={19} />}
          title="Push Notifications"
          description={pushEnabled ? 'Enabled — alerts will be delivered to this device' : 'Enable to receive alerts on this device'}
          tone={pushEnabled ? 'text-signal-green font-medium' : undefined}
          checked={pushEnabled}
          onChange={handlePushToggle}
        />

        <ChannelRow
          plate="bg-signal-greenBg"
          icon={<WhatsAppGlyph />}
          title="WhatsApp"
          description="Instant alerts delivered as a WhatsApp message"
          checked={waEnabled}
          onChange={(checked) => onChange({ whatsapp_enabled: checked })}
        >
          <AnimatePresence initial={false}>
            {waEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-3 flex items-start gap-2">
                  <div className="w-[86px] shrink-0">
                    <select
                      aria-label="Country code"
                      className="h-11 w-full pl-3 pr-7 border border-surface-border rounded-[10px] bg-surface-card text-[14px] text-text-primary shadow-inset outline-none transition-all focus:border-brand-blue focus:shadow-focus"
                      defaultValue="+92"
                    >
                      <option value="+92">+92 🇵🇰</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="300 1234567"
                      value={waNumber}
                      onChange={(e) => onChange({ whatsapp_number: e.target.value })}
                      hint="Without the leading zero, e.g. 3001234567"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ChannelRow>

        <ChannelRow
          plate="bg-[#F0F9FF] text-[#0EA5E9]"
          icon={<Mail size={19} />}
          title="Email"
          description={
            emailEnabled
              ? `Alerts will be sent to ${user?.email || 'your account email'}`
              : 'Enable to receive alerts by email'
          }
          checked={emailEnabled}
          onChange={(checked) => onChange({ email_alerts_enabled: checked })}
        />

        {/* Digest rides on WhatsApp, so it is meaningless without it. The
            toggle is disabled rather than hidden so the feature stays
            discoverable and the reason is visible. */}
        <ChannelRow
          last
          plate="bg-signal-amberBg text-signal-amber"
          icon={<CalendarClock size={19} />}
          title="Daily Market Digest"
          description={
            !waEnabled
              ? 'Turn on WhatsApp above to enable the daily digest'
              : digestEnabled
                ? 'Two WhatsApp summaries each trading day — at the open and at the close'
                : 'One WhatsApp summary at market open and one at close, for up to 10 watchlist symbols'
          }
          tone={!waEnabled ? 'text-text-tertiary' : undefined}
          disabled={!waEnabled}
          checked={digestEnabled && waEnabled}
          onChange={(checked) => onChange({ market_digest_enabled: checked })}
        />
      </div>
    </Card>
  );
}
