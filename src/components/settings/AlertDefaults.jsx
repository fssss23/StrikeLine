import { Sliders, BellRing, Target, Clock } from 'lucide-react';

// Alert behaviour is now fixed product-wide (handled server-side in
// evaluate-alerts): a 1% approach buffer, an always-delivered exact-level hit,
// and a 90-minute cooldown between repeat heads-ups. There are no longer any
// per-user buffer / cooldown controls — this card just explains the behaviour.
export function AlertDefaults() {
  const rows = [
    {
      icon: <Target size={16} className="text-signal-green" />,
      title: 'Approach buffer · 1%',
      desc: 'You get a heads-up when the live price comes within 1% of any enabled level.',
    },
    {
      icon: <BellRing size={16} className="text-brand-blue" />,
      title: 'Level hit · always delivered',
      desc: 'The moment the price actually crosses a level, the alert is sent — even inside the cooldown.',
    },
    {
      icon: <Clock size={16} className="text-signal-amber" />,
      title: 'Cooldown · 90 minutes',
      desc: 'Repeat approach heads-ups for the same level are spaced at least 90 minutes apart.',
    },
  ];

  return (
    <div className="bg-white border border-surface-border rounded-[12px] shadow-sm mb-6">
      <div className="px-6 py-5 border-b border-surface-border flex items-center gap-2">
        <Sliders size={20} className="text-text-primary" />
        <h3 className="text-[16px] font-bold text-text-primary">Alert Behaviour</h3>
      </div>

      <div className="px-6 flex flex-col">
        {rows.map((r, i) => (
          <div
            key={r.title}
            className={`py-5 flex items-start gap-3${i < rows.length - 1 ? ' border-b border-surface-border' : ''}`}
          >
            <div className="mt-0.5 shrink-0">{r.icon}</div>
            <div>
              <h4 className="text-[14px] font-bold text-text-primary mb-1">{r.title}</h4>
              <p className="text-[13px] text-text-secondary">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
