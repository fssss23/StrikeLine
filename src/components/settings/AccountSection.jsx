import { useState } from 'react';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
        redirectTo: window.location.origin + '/login'
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
      <div className="bg-white border border-surface-border rounded-[12px] shadow-sm mb-6">
        <div className="px-6 py-5 border-b border-surface-border flex items-center gap-2">
          <User size={20} className="text-text-primary" />
          <h3 className="text-[16px] font-bold text-text-primary">Account Details</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-2">Display Name</label>
              <Input
                value={user?.display_name ?? ''}
                placeholder="Your name"
                onChange={(e) => onChange({ display_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-2">Email</label>
              <Input value={user?.email ?? ''} disabled readOnly />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-surface-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-semibold text-text-primary mb-2">Password</label>
                <Button variant="secondary" size="sm" onClick={handlePasswordReset} disabled={resetSending}>
                  {resetSending ? 'Sending…' : 'Send password reset email'}
                </Button>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-text-primary mb-2">Time Zone</label>
                <select
                  className="w-full h-[40px] px-3 border border-surface-border rounded-[8px] bg-white text-[14px] text-text-primary outline-none focus:border-brand-blue"
                  value={user?.timezone ?? 'Asia/Karachi'}
                  onChange={(e) => onChange({ timezone: e.target.value })}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-text-secondary mt-1">PSX trading hours are shown in PKT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-signal-red/30 rounded-[12px] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-[14px] font-bold text-text-primary">Delete My Data</h4>
          <p className="text-[13px] text-text-secondary">Permanently delete your watchlist, alert rules, and alert history.</p>
        </div>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Data
        </Button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete all your data?</h3>
            <p className="text-sm text-text-secondary mb-4">
              This action cannot be undone. All your alerts, rules, and watchlist data will be permanently removed and you will be signed out.
            </p>
            <label className="block text-[13px] font-semibold text-text-primary mb-2">
              Type "DELETE" to confirm
            </label>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mb-6"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</Button>
              <Button
                variant="danger"
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                onClick={handleDeleteData}
              >
                {isDeleting ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
