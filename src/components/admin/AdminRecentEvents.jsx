import { History } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/Badge';

const STATUS_VARIANT = { sent: 'green', failed: 'red', skipped: 'grey', pending: 'amber' };
const LEVEL_VARIANT = { support: 'green', resistance: 'red', breakout: 'amber' };

export function AdminRecentEvents({ events, isLoading }) {
  const list = events || [];

  return (
    <div className="bg-white border border-surface-border rounded-[12px] shadow-sm">
      <div className="px-6 py-5 border-b border-surface-border flex items-center gap-2">
        <History size={20} className="text-text-primary" />
        <h3 className="text-[16px] font-bold text-text-primary">Recent Alerts</h3>
        <span className="text-[13px] text-text-secondary ml-1">(all users)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b border-surface-border">
              <th className="px-6 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3 text-right">Price / Level</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-text-secondary">Loading…</td></tr>
            )}
            {!isLoading && list.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-text-secondary">No alerts yet</td></tr>
            )}
            {list.map((e) => (
              <tr key={e.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-6 py-3 text-text-secondary text-[13px] tabular-nums whitespace-nowrap">
                  {format(new Date(e.triggered_at), 'MMM d, HH:mm')}
                </td>
                <td className="px-4 py-3 text-text-secondary text-[13px]">{e.email}</td>
                <td className="px-4 py-3 font-semibold text-text-primary">{e.symbol}</td>
                <td className="px-4 py-3">
                  <Badge variant={LEVEL_VARIANT[e.level_type] || 'grey'} className="capitalize">{e.level_type}</Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                  {e.actual_price} <span className="text-text-secondary">/ {e.level_value}</span>
                </td>
                <td className="px-6 py-3">
                  <Badge variant={STATUS_VARIANT[e.push_status] || 'grey'} className="capitalize">{e.push_status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
