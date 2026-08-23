import { Sliders, BellRing, Target, Clock } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';

// Alert behaviour is now fixed product-wide (handled server-side in
// evaluate-alerts): a 1% approach buffer, an always-delivered exact-level hit,
// and a 90-minute cooldown between repeat heads-ups. There are no longer any
// per-user buffer / cooldown controls — this card just explains the behaviour.
const ROWS = [
  {
    icon: Target,
    plate: 'bg-signal-greenBg text-signal-green',
    title: 'Approach buffer',
    value: '1%',
    desc: 'You get a heads-up when the live price comes within 1% of any enabled level.',
  },
  {
    icon: BellRing,
    plate: 'bg-brand-blueSoft text-brand-blue',
    title: 'Level hit',
    value: 'Always delivered',
    desc: "The moment the price actually crosses a level, the alert is sent — even inside the cooldown.",
  },
  {
    icon: Clock,
    plate: 'bg-signal-amberBg text-signal-amber',
    title: 'Cooldown',
    value: '90 minutes',
    desc: 'Repeat approach heads-ups for the same level are spaced at least 90 minutes apart.',
  },
];

export function AlertDefaults() {
  return (
    <Card>
      <CardHeader icon={Sliders} title="Alert Behaviour" subtitle="Fixed product-wide — no configuration needed" />

      <div className="px-4 md:px-5">
        {ROWS.map((r, i) => (
          <div
            key={r.title}
            className={`py-4 flex items-start gap-3 md:gap-4${i < ROWS.length - 1 ? ' border-b border-surface-hairline' : ''}`}
          >
            <div className={`w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 ${r.plate}`}>
              <r.icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h4 className="text-[14px] font-bold text-text-primary tracking-tightish">{r.title}</h4>
                <span className="text-[12px] font-bold text-text-secondary sl-num">{r.value}</span>
              </div>
              <p className="text-[12.5px] text-text-secondary mt-1 leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
