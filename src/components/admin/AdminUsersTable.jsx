import { useState, useMemo } from 'react';
import { Users, Search, Smartphone, Mail, ShieldCheck, Ban, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { useUserStore } from '../../store/useUserStore';
import { useSetUserFlag } from '../../hooks/queries/useAdminQuery';
import { cn } from '../../lib/utils';

function ChannelIcons({ user }) {
  return (
    <div className="flex items-center gap-1.5">
      {user.push_enabled && (
        <span title={user.has_device ? 'Push enabled (device registered)' : 'Push enabled (no device token)'}>
          <Smartphone size={15} className={user.has_device ? 'text-brand-blue' : 'text-text-tertiary/40'} />
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
        <span className="text-[11px] text-text-tertiary">none</span>
      )}
    </div>
  );
}

function UserIdentity({ u, isSelf }) {
  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-text-primary text-[13.5px] tracking-tightish">
          {u.display_name || u.email?.split('@')[0] || 'User'}
        </span>
        {u.is_admin && <Badge variant="navy" size="xs"><ShieldCheck size={10} /> Admin</Badge>}
        {u.restricted && <Badge variant="red" size="xs">Restricted</Badge>}
        {isSelf && <span className="text-[10.5px] text-text-tertiary">(you)</span>}
      </div>
      <div className="text-text-secondary text-[12px] truncate mt-0.5">{u.email}</div>
    </>
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

  const adminAction = (u) => ({
    user: u, field: 'is_admin', value: !u.is_admin,
    title: u.is_admin ? `Revoke admin from ${u.email}?` : `Grant admin to ${u.email}?`,
    body: u.is_admin ? 'They will lose access to this admin panel.' : 'They will gain full access to this admin panel and all user data.',
  });

  const restrictAction = (u) => ({
    user: u, field: 'restricted', value: !u.restricted,
    title: u.restricted ? `Unrestrict ${u.email}?` : `Restrict ${u.email}?`,
    body: u.restricted
      ? 'They will regain access to the app and resume receiving alerts.'
      : 'They will be blocked from using the app and will receive no alerts until unrestricted.',
  });

  const emptyMessage = isLoading ? 'Loading users…' : 'No users found';

  return (
    <Card>
      <CardHeader
        icon={Users}
        title="Users"
        subtitle={`${(users || []).length} total`}
        action={
          <div className="w-40 sm:w-56">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              leftIcon={Search}
              className="h-9 text-[13px]"
            />
          </div>
        }
      />

      {/* ---------------- Mobile: cards ---------------- */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-text-secondary">{emptyMessage}</div>
        ) : (
          filtered.map((u) => {
            const isSelf = u.id === me?.id;
            return (
              <div
                key={u.id}
                className={cn(
                  'px-4 py-3.5 border-b border-surface-hairline last:border-b-0',
                  u.restricted && 'bg-signal-redBg/40'
                )}
              >
                <UserIdentity u={u} isSelf={isSelf} />

                <div className="flex items-center gap-4 mt-2.5">
                  <div>
                    <p className="sl-eyebrow mb-0.5">Watchlist</p>
                    <p className="text-[13px] font-bold sl-num text-text-primary">{u.watchlist_count}</p>
                  </div>
                  <div>
                    <p className="sl-eyebrow mb-0.5">Levels</p>
                    <p className="text-[13px] font-bold sl-num text-text-primary">{u.active_levels}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="sl-eyebrow mb-0.5">Channels</p>
                    <ChannelIcons user={u} />
                  </div>
                </div>

                <p className="text-[11.5px] text-text-tertiary mt-2.5">
                  {u.last_alert
                    ? `Last alert: ${u.last_alert.symbol} · ${formatDistanceToNow(new Date(u.last_alert.at), { addSuffix: true })}`
                    : 'No alerts yet'}
                  {u.created_at && ` · joined ${formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}`}
                </p>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="secondary" size="sm" fullWidth
                    disabled={isSelf || setFlag.isPending}
                    onClick={() => setConfirm(adminAction(u))}
                  >
                    {u.is_admin ? 'Revoke admin' : 'Make admin'}
                  </Button>
                  <Button
                    variant={u.restricted ? 'secondary' : 'danger'} size="sm" fullWidth
                    icon={u.restricted ? CheckCircle2 : Ban}
                    disabled={isSelf || setFlag.isPending}
                    onClick={() => setConfirm(restrictAction(u))}
                  >
                    {u.restricted ? 'Unrestrict' : 'Restrict'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- Desktop: table ---------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="bg-surface-sunken border-b border-surface-hairline">
              <th className="px-5 py-2.5 text-left sl-eyebrow">User</th>
              <th className="px-4 py-2.5 text-left sl-eyebrow">Channels</th>
              <th className="px-4 py-2.5 text-right sl-eyebrow">Watchlist</th>
              <th className="px-4 py-2.5 text-right sl-eyebrow">Levels</th>
              <th className="px-4 py-2.5 text-left sl-eyebrow">Last Alert</th>
              <th className="px-4 py-2.5 text-left sl-eyebrow">Joined</th>
              <th className="px-5 py-2.5 text-right sl-eyebrow">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-text-secondary text-[13px]">{emptyMessage}</td></tr>
            )}
            {filtered.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <tr
                  key={u.id}
                  className={cn(
                    'border-b border-surface-hairline last:border-b-0 transition-colors hover:bg-surface-page/60',
                    u.restricted && 'bg-signal-redBg/40'
                  )}
                >
                  <td className="px-5 py-3.5 max-w-[260px]"><UserIdentity u={u} isSelf={isSelf} /></td>
                  <td className="px-4 py-3.5"><ChannelIcons user={u} /></td>
                  <td className="px-4 py-3.5 text-right sl-num text-text-primary font-semibold">{u.watchlist_count}</td>
                  <td className="px-4 py-3.5 text-right sl-num text-text-primary font-semibold">{u.active_levels}</td>
                  <td className="px-4 py-3.5 text-text-secondary text-[12.5px]">
                    {u.last_alert
                      ? <span>{u.last_alert.symbol} · {formatDistanceToNow(new Date(u.last_alert.at), { addSuffix: true })}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-text-secondary text-[12.5px] sl-num">
                    {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost" size="sm"
                        disabled={isSelf || setFlag.isPending}
                        onClick={() => setConfirm(adminAction(u))}
                      >
                        {u.is_admin ? 'Revoke admin' : 'Make admin'}
                      </Button>
                      <Button
                        variant={u.restricted ? 'secondary' : 'danger'} size="sm"
                        icon={u.restricted ? CheckCircle2 : Ban}
                        disabled={isSelf || setFlag.isPending}
                        onClick={() => setConfirm(restrictAction(u))}
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

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        tone={confirm?.field === 'restricted' && confirm?.value ? 'danger' : 'default'}
        title={confirm?.title}
        description={confirm?.body}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(null)} disabled={setFlag.isPending}>
              Cancel
            </Button>
            <Button
              variant={confirm?.field === 'restricted' && confirm?.value ? 'danger' : 'primary'}
              size="sm"
              onClick={runConfirm}
              disabled={setFlag.isPending}
            >
              Confirm
            </Button>
          </>
        }
      />
    </Card>
  );
}
