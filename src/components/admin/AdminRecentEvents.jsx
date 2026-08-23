import { History } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';

const STATUS_VARIANT = { sent: 'green', failed: 'red', skipped: 'grey', pending: 'amber' };
const LEVEL_VARIANT = { support: 'green', resistance: 'red', breakout: 'amber' };

export function AdminRecentEvents({ events, isLoading }) {
  const list = events || [];
  const emptyMessage = isLoading ? 'Loading…' : 'No alerts yet';

  return (
    <Card>
      <CardHeader icon={History} title="Recent Alerts" subtitle="Across all users" />

      {/* ---------------- Mobile: cards ---------------- */}
      <div className="md:hidden">
        {list.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-text-secondary">{emptyMessage}</div>
        ) : (
          list.map((e) => (
            <div key={e.id} className="px-4 py-3 border-b border-surface-hairline last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[13px] font-bold text-text-primary">{e.symbol}</span>
                  <Badge variant={LEVEL_VARIANT[e.level_type] || 'grey'} size="xs" className="capitalize">
                    {e.level_type}
                  </Badge>
                </div>
                <Badge variant={STATUS_VARIANT[e.push_status] || 'grey'} size="xs" className="capitalize shrink-0">
                  {e.push_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <span className="text-[11.5px] text-text-secondary truncate">{e.email}</span>
                <span className="text-[11.5px] sl-num text-text-primary shrink-0">
                  {e.actual_price} <span className="text-text-tertiary">/ {e.level_value}</span>
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary sl-num mt-1">
                {format(new Date(e.triggered_at), 'MMM d, HH:mm')}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ---------------- Desktop: table ---------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-surface-sunken border-b border-surface-hairline">
              <th className="px-5 py-2.5 text-left sl-eyebrow">Time</th>
              <th className="px-4 py-2.5 text-left sl-eyebrow">User</th>
              <th className="px-4 py-2.5 text-left sl-eyebrow">Symbol</th>
              <th className="px-4 py-2.5 text-left sl-eyebrow">Level</th>
              <th className="px-4 py-2.5 text-right sl-eyebrow">Price / Level</th>
              <th className="px-5 py-2.5 text-left sl-eyebrow">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-text-secondary text-[13px]">{emptyMessage}</td></tr>
            )}
            {list.map((e) => (
              <tr key={e.id} className="border-b border-surface-hairline last:border-b-0 hover:bg-surface-page/60 transition-colors">
                <td className="px-5 py-3 text-text-secondary text-[12.5px] sl-num whitespace-nowrap">
                  {format(new Date(e.triggered_at), 'MMM d, HH:mm')}
                </td>
                <td className="px-4 py-3 text-text-secondary text-[12.5px]">{e.email}</td>
                <td className="px-4 py-3 font-bold text-text-primary text-[13px]">{e.symbol}</td>
                <td className="px-4 py-3">
                  <Badge variant={LEVEL_VARIANT[e.level_type] || 'grey'} className="capitalize">{e.level_type}</Badge>
                </td>
                <td className="px-4 py-3 text-right sl-num text-text-primary font-semibold">
                  {e.actual_price} <span className="text-text-tertiary font-normal">/ {e.level_value}</span>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={STATUS_VARIANT[e.push_status] || 'grey'} className="capitalize">{e.push_status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
