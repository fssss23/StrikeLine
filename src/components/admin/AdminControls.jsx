import { useState } from 'react';
import { Power, MessageSquareOff, ShieldAlert } from 'lucide-react';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { useSetSetting } from '../../hooks/queries/useAdminQuery';
import { cn } from '../../lib/utils';

// One high-impact global toggle with a confirmation step.
function ControlRow({ icon, title, description, enabled, activeLabel, offLabel, activeVariant, onConfirm, confirmWhen, confirmTitle, confirmBody, pending, last }) {
  const [confirming, setConfirming] = useState(false);

  const requestToggle = (next) => {
    // Only confirm the "dangerous" direction (e.g. turning WhatsApp off / pausing)
    if (next === confirmWhen) setConfirming(true);
    else onConfirm(next);
  };

  return (
    <>
      <div className={cn('flex items-start gap-3 md:gap-4 py-4', !last && 'border-b border-surface-hairline')}>
        <div
          className={cn(
            'w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0',
            enabled ? 'bg-signal-greenBg text-signal-green' : 'bg-signal-redBg text-signal-red'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-[14.5px] font-bold text-text-primary tracking-tightish">{title}</h4>
            <Badge variant={enabled ? (activeVariant || 'green') : 'red'}>
              {enabled ? activeLabel : offLabel}
            </Badge>
          </div>
          <p className="text-[12.5px] text-text-secondary leading-relaxed">{description}</p>
        </div>
        <div className="shrink-0 pt-1">
          <Toggle checked={enabled} onChange={requestToggle} disabled={pending} />
        </div>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        tone="danger"
        title={confirmTitle}
        description={confirmBody}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() => { onConfirm(confirmWhen); setConfirming(false); }}
            >
              Confirm
            </Button>
          </>
        }
      />
    </>
  );
}

export function AdminControls({ settings }) {
  const setSetting = useSetSetting();
  // Local optimistic mirror so the toggle feels instant; overview refetch reconciles
  const [local, setLocal] = useState(null);
  const current = local ?? settings ?? { whatsapp_enabled: true, alerts_paused: false };

  const apply = (key, value) => {
    setLocal({ ...current, [key]: value });
    setSetting.mutate({ key, value });
  };

  const waOn = current.whatsapp_enabled !== false;
  const paused = current.alerts_paused === true;

  return (
    <Card>
      <CardHeader icon={Power} title="Global Alert Controls" subtitle="Kill switches — these affect every user" />

      <div className="px-4 md:px-5">
        <ControlRow
          icon={<MessageSquareOff size={19} />}
          title="WhatsApp Alerts"
          description="Master switch for WhatsApp dispatch across every user. Push and in-app alerts are unaffected."
          enabled={waOn}
          activeLabel="Active"
          offLabel="Off"
          pending={setSetting.isPending}
          confirmWhen={false}
          confirmTitle="Turn off WhatsApp alerts?"
          confirmBody="No WhatsApp messages will be sent to any user until you turn this back on. Push and in-app alerts keep working."
          onConfirm={(next) => apply('whatsapp_enabled', next)}
        />

        <ControlRow
          last
          icon={<ShieldAlert size={19} />}
          title="Pause All Alerts"
          description="Emergency stop. Halts every channel (WhatsApp + push) for all users while on."
          enabled={!paused}
          activeLabel="Running"
          offLabel="Paused"
          activeVariant="green"
          pending={setSetting.isPending}
          confirmWhen={false}
          confirmTitle="Pause all alert delivery?"
          confirmBody="Alert evaluation will be halted entirely for every user and channel until you resume. Use this only for incidents."
          onConfirm={(next) => apply('alerts_paused', !next)}
        />
      </div>
    </Card>
  );
}
