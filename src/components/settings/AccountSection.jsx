import { useState } from 'react';
import { User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';

const TIMEZONES = [
  { value: 'Asia/Karachi', label: '(UTC+5:00) Pakistan Standard Time' },
  { value: 'UTC', label: '(UTC+0:00) Coordinated Universal Time' },
  { value: 'Asia/Dubai', label: '(UTC+4:00) Gulf Standard Time' },
  { value: 'Europe/London', label: '(UTC+0/+1) London' },
  { value: 'America/New_York', label: '(UTC-5:00) Eastern Time' },
];

export function AccountSection({ user, onChange }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) throw error;
      toast.success(`Password reset link sent to ${user.email}`);
    } catch (err) {
      console.error('Password reset failed:', err.message);
      toast.error(`Failed to send reset link: ${err.message}`);
    } finally {
      setResetSending(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Full account deletion (data + auth user) via the delete-account edge
      // function; falls back to client-side data deletion if it isn't deployed
      const { data, error: fnError } = await supabase.functions.invoke('delete-account');

      if (data?.deleted) {
        toast.success('Your account has been permanently deleted.');
      } else {
        if (fnError) console.warn('delete-account function unavailable, deleting data only:', fnError.message);
        // RLS restricts each delete to the current user's rows
        const results = await Promise.all([
          supabase.from('alert_events').delete().eq('user_id', userId),
          supabase.from('alert_rules').delete().eq('user_id', userId),
          supabase.from('watchlist_items').delete().eq('user_id', userId),
        ]);
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;
        toast.success('All your data has been deleted. Signing out…');
      }

      await supabase.auth.signOut();
    } catch (err) {
      console.error('Account data deletion failed:', err.message);
      toast.error(`Failed to delete data: ${err.message}`);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader icon={User} title="Account Details" subtitle={user?.email} />

        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <Input
              label="Display name"
              value={user?.display_name ?? ''}
              placeholder="Your name"
              onChange={(e) => onChange({ display_name: e.target.value })}
            />
            <Input label="Email" value={user?.email ?? ''} disabled readOnly />
          </div>

          <div className="pt-5 border-t border-surface-hairline grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-text-primary tracking-tightish">Password</span>
              <Button
                variant="secondary"
                size="md"
                onClick={handlePasswordReset}
                disabled={resetSending}
                className="justify-start"
              >
                {resetSending ? 'Sending…' : 'Send password reset email'}
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-text-primary tracking-tightish">Time zone</span>
              <select
                className="w-full h-11 pl-3.5 pr-8 border border-surface-border rounded-[10px] bg-surface-card text-[14px] text-text-primary shadow-inset outline-none transition-all focus:border-brand-blue focus:shadow-focus"
                value={user?.timezone ?? 'Asia/Karachi'}
                onChange={(e) => onChange({ timezone: e.target.value })}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <p className="text-[11.5px] text-text-tertiary">PSX trading hours are always shown in PKT</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="bg-surface-card rounded-xcard border border-signal-red/25 shadow-card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-9 h-9 rounded-[11px] bg-signal-redBg text-signal-red flex items-center justify-center shrink-0">
          <Trash2 size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-bold text-text-primary tracking-tightish">Delete my data</h4>
          <p className="text-[12.5px] text-text-secondary mt-0.5 leading-relaxed">
            Permanently remove your watchlist, alert rules, and alert history.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} className="shrink-0">
          Delete data
        </Button>
      </div>

      <Modal
        open={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        tone="danger"
        title="Delete all your data?"
        description="This cannot be undone. All your alerts, rules, and watchlist data will be permanently removed and you will be signed out."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteConfirmText !== 'DELETE'}
              loading={isDeleting}
              onClick={handleDeleteData}
            >
              {isDeleting ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </>
        }
      >
        <Input
          label='Type "DELETE" to confirm'
          value={deleteConfirmText}
          onChange={e => setDeleteConfirmText(e.target.value)}
          placeholder="DELETE"
          autoCapitalize="characters"
        />
      </Modal>
    </>
  );
}
