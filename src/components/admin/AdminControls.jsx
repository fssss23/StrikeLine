import { useState } from 'react';
import { Power, MessageSquareOff, ShieldAlert } from 'lucide-react';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useSetSetting } from '../../hooks/queries/useAdminQuery';

// One high-impact global toggle with a confirmation step.
function ControlRow({ icon, title, description, enabled, activeLabel, offLabel, activeVariant, onConfirm, confirmWhen, confirmTitle, confirmBody, pending }) {
  const [confirming, setConfirming] = useState(false);

  const requestToggle = (next) => {
    // Only confirm the "dangerous" direction (e.g. turning WhatsApp off / pausing)
    if (next === confirmWhen) setConfirming(true);
    else onConfirm(next);
  };

  return (
    <>
      <div className="flex items-start gap-4 py-5 border-b border-surface-border last:border-b-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${enabled ? 'bg-signal-greenBg text-signal-green' : 'bg-signal-redBg text-signal-red'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[15px] font-bold text-text-primary">{title}</h4>
            <Badge variant={enabled ? (activeVariant || 'green') : 'red'}>
              {enabled ? activeLabel : offLabel}
            </Badge>
          </div>
          <p className="text-[13px] text-text-secondary">{description}</p>
        </div>
        <div className="shrink-0 mt-1">
          <Toggle checked={enabled} onChange={requestToggle} disabled={pending} />
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-text-primary mb-2">{confirmTitle}</h3>
            <p className="text-sm text-text-secondary mb-6">{confirmBody}</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>Cancel</Button>
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => { onConfirm(confirmWhen); setConfirming(false); }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
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
    <div className="bg-white border border-surface-border rounded-[12px] shadow-sm">
      <div className="px-6 py-5 border-b border-surface-border flex items-center gap-2">
        <Power size={20} className="text-text-primary" />
        <h3 className="text-[16px] font-bold text-text-primary">Global Alert Controls</h3>
      </div>

      <div className="px-6">
        <ControlRow
          icon={<MessageSquareOff size={20} />}
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
          icon={<ShieldAlert size={20} />}
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
    </div>
  );
}
