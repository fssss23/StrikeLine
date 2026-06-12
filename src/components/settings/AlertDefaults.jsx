import { Sliders } from 'lucide-react';

export function AlertDefaults({ user, onChange }) {
  const cooldown = user?.cooldown_minutes ?? 240;
  const buffer = user?.buffer_pct ?? 0.5;

  const formatCooldown = (mins) => {
    if (mins < 60) return `${mins} minutes`;
    const hrs = mins / 60;
    return `${hrs} hour${hrs > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-white border border-surface-border rounded-[12px] shadow-sm mb-6">
      <div className="px-6 py-5 border-b border-surface-border flex items-center gap-2">
        <Sliders size={20} className="text-text-primary" />
        <h3 className="text-[16px] font-bold text-text-primary">Default Alert Behaviour</h3>
      </div>

      <div className="px-6 flex flex-col">
        {/* Cooldown Period */}
        <div className="py-5 border-b border-surface-border">
          <div className="mb-4">
            <h4 className="text-[14px] font-bold text-text-primary mb-1">Cooldown Period</h4>
            <p className="text-[13px] text-text-secondary">Minimum time before the same level triggers again</p>
          </div>

          <input
            type="range" min="30" max="1440" step="30"
            value={cooldown}
            onChange={(e) => onChange({ cooldown_minutes: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer custom-slider mb-2"
            style={{ backgroundSize: `${((cooldown - 30) / 1410) * 100}% 100%` }}
          />
          <p className="text-[12px] text-brand-navy font-bold">{formatCooldown(cooldown)} between repeat alerts</p>
        </div>

        {/* Notification Buffer */}
        <div className="py-5">
          <div className="mb-4">
            <h4 className="text-[14px] font-bold text-text-primary mb-1">Notification Buffer</h4>
            <p className="text-[13px] text-text-secondary">Alert fires when price comes within X% of your level</p>
          </div>

          <input
            type="range" min="0" max="2" step="0.1"
            value={buffer}
            onChange={(e) => onChange({ buffer_pct: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer custom-slider mb-2"
            style={{ backgroundSize: `${(buffer / 2) * 100}% 100%` }}
          />
          <p className="text-[12px] text-brand-navy font-bold">Alerts fire within ±{buffer.toFixed(1)}% of target level</p>
        </div>
      </div>
    </div>
  );
}
