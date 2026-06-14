import { useState, useMemo } from 'react';
import { Users, Search, Smartphone, Mail, ShieldCheck, Ban, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useUserStore } from '../../store/useUserStore';
import { useSetUserFlag } from '../../hooks/queries/useAdminQuery';

function ChannelIcons({ user }) {
  return (
    <div className="flex items-center gap-1.5">
      {user.push_enabled && (
        <span title={user.has_device ? 'Push enabled (device registered)' : 'Push enabled (no device token)'}>
          <Smartphone size={15} className={user.has_device ? 'text-[#2563EB]' : 'text-text-secondary/40'} />
        </span>
      )}
      {user.whatsapp_enabled && (
        <span title={`WhatsApp: ${user.whatsapp_number || 'no number'}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          </svg>
        </span>
      )}
      {user.email_alerts_enabled && (
        <span title="Email alerts enabled"><Mail size={15} className="text-[#0EA5E9]" /></span>
      )}
      {!user.push_enabled && !user.whatsapp_enabled && !user.email_alerts_enabled && (
        <span className="text-xs text-text-secondary/60">none</span>
      )}
    </div>
  );
}

export function AdminUsersTable({ users, isLoading }) {
  const me = useUserStore(state => state.user);
  const setFlag = useSetUserFlag();
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState(null); // { user, field, value, title, body }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users || [];
    if (!q) return list;
    return list.filter(u =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.display_name || '').toLowerCase().includes(q)
    );
  }, [users, query]);

  const runConfirm = () => {
    if (!confirm) return;
    setFlag.mutate({ user_id: confirm.user.id, field: confirm.field, value: confirm.value });
    setConfirm(null);
  };

  return (
    <div className="bg-white border border-surface-border rounded-[12px] shadow-sm">
      <div className="px-6 py-5 border-b border-surface-border flex items-center gap-3 flex-wrap">
        <Users size={20} className="text-text-primary" />
        <h3 className="text-[16px] font-bold text-text-primary">Users</h3>
        <Badge variant="grey">{(users || []).length}</Badge>
        <div className="ml-auto w-full sm:w-64">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name"
            leftIcon={Search}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b border-surface-border">
              <th className="px-6 py-3">User</th>
              <th className="px-4 py-3">Channels</th>
              <th className="px-4 py-3 text-right">Watchlist</th>
              <th className="px-4 py-3 text-right">Levels</th>
              <th className="px-4 py-3">Last Alert</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-text-secondary">Loading users…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-text-secondary">No users found</td></tr>
            )}
            {filtered.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <tr key={u.id} className={`border-b border-surface-border last:border-b-0 ${u.restricted ? 'bg-signal-redBg/40' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{u.display_name || u.email?.split('@')[0] || 'User'}</span>
                      {u.is_admin && <Badge variant="navy" className="gap-1"><ShieldCheck size={11} /> Admin</Badge>}
                      {u.restricted && <Badge variant="red">Restricted</Badge>}
                      {isSelf && <span className="text-[11px] text-text-secondary">(you)</span>}
                    </div>
                    <div className="text-text-secondary text-[13px]">{u.email}</div>
                  </td>
                  <td className="px-4 py-4"><ChannelIcons user={u} /></td>
                  <td className="px-4 py-4 text-right tabular-nums text-text-primary">{u.watchlist_count}</td>
                  <td className="px-4 py-4 text-right tabular-nums text-text-primary">{u.active_levels}</td>
                  <td className="px-4 py-4 text-text-secondary text-[13px]">
                    {u.last_alert
                      ? <span>{u.last_alert.symbol} · {formatDistanceToNow(new Date(u.last_alert.at), { addSuffix: true })}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-4 text-text-secondary text-[13px] tabular-nums">
                    {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSelf || setFlag.isPending}
                        onClick={() => setConfirm({
                          user: u, field: 'is_admin', value: !u.is_admin,
                          title: u.is_admin ? `Revoke admin from ${u.email}?` : `Grant admin to ${u.email}?`,
                          body: u.is_admin ? 'They will lose access to this admin panel.' : 'They will gain full access to this admin panel and all user data.',
                        })}
                      >
                        {u.is_admin ? 'Revoke admin' : 'Make admin'}
                      </Button>
                      <Button
                        variant={u.restricted ? 'secondary' : 'danger'}
                        size="sm"
                        icon={u.restricted ? CheckCircle2 : Ban}
                        disabled={isSelf || setFlag.isPending}
                        onClick={() => setConfirm({
                          user: u, field: 'restricted', value: !u.restricted,
                          title: u.restricted ? `Unrestrict ${u.email}?` : `Restrict ${u.email}?`,
                          body: u.restricted
                            ? 'They will regain access to the app and resume receiving alerts.'
                            : 'They will be blocked from using the app and will receive no alerts until unrestricted.',
                        })}
                      >
                        {u.restricted ? 'Unrestrict' : 'Restrict'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-text-primary mb-2">{confirm.title}</h3>
            <p className="text-sm text-text-secondary mb-6">{confirm.body}</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={setFlag.isPending}>Cancel</Button>
              <Button
                variant={confirm.field === 'restricted' && confirm.value ? 'danger' : 'primary'}
                onClick={runConfirm}
                disabled={setFlag.isPending}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
