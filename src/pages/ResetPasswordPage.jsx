import { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { StrikeLineLogo } from '../components/logo/StrikeLineLogo';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import { SUPPORT_EMAIL, supportMailto } from '../lib/constants';

const MIN_LENGTH = 6;

function strengthOf(pass) {
  if (!pass) return 0;
  let s = 0;
  if (pass.length > 5) s += 1;
  if (/[A-Z]/.test(pass)) s += 1;
  if (/[0-9]/.test(pass)) s += 1;
  if (/[^A-Za-z0-9]/.test(pass)) s += 1;
  return s;
}

const STRENGTH_COLORS = ['bg-surface-border', 'bg-signal-red', 'bg-signal-amber', 'bg-signal-green', 'bg-signal-green'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/**
 * Landing screen for a password-reset link.
 *
 * supabase-js consumes the #access_token in the link and signs the user in
 * before this renders, so there is already a valid session here — updateUser
 * is all that's needed. App.jsx routes here whenever isRecovering is set, which
 * is what stops the recovery session from silently dropping into the dashboard.
 */
export default function ResetPasswordPage() {
  const endRecovery = useUserStore(state => state.endRecovery);
  const recoveryError = useUserStore(state => state.recoveryError);
  const session = useUserStore(state => state.session);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const EyeIcon = show ? EyeOff : Eye;
  const strength = strengthOf(password);

  const linkDead = !!recoveryError || session === null;

  const handleSubmit = async () => {
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      toast.success('Password updated — you are signed in');
      endRecovery();
      // Drop the #access_token fragment so a refresh doesn't re-enter recovery
      window.history.replaceState(null, '', '/');
    } catch (err) {
      console.error('Password update failed:', err.message);
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-surface-page flex items-center justify-center p-5">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <StrikeLineLogo variant="full" />
        </div>

        <div className="sl-card shadow-lifted p-6 md:p-7 animate-scale-in">
          {linkDead ? (
            <>
              <div className="w-11 h-11 rounded-[14px] bg-signal-redBg text-signal-red flex items-center justify-center mb-4">
                <AlertTriangle className="w-[21px] h-[21px]" />
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tighter mb-2">
                This reset link has expired
              </h1>
              <p className="text-[13.5px] text-text-secondary leading-relaxed mb-6">
                {recoveryError || 'Reset links can only be used once, and they expire after a short time. Request a fresh one from the login page.'}
              </p>
              <Button variant="primary" size="lg" fullWidth onClick={() => { endRecovery(); window.location.assign('/login'); }}>
                Back to sign in
              </Button>
            </>
          ) : (
            <>
              <div className="w-11 h-11 rounded-[14px] bg-brand-blueSoft text-brand-blue flex items-center justify-center mb-4">
                <ShieldCheck className="w-[21px] h-[21px]" />
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tighter mb-1.5">
                Choose a new password
              </h1>
              <p className="text-[13.5px] text-text-secondary leading-relaxed mb-6">
                {session?.user?.email
                  ? <>Setting a new password for <span className="font-semibold text-text-primary">{session.user.email}</span>.</>
                  : 'Pick something you have not used before.'}
              </p>

              <div className="flex flex-col gap-4" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}>
                <div className="flex flex-col gap-2">
                  <Input
                    label="New password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    leftIcon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    rightIcon={() => (
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        aria-label={show ? 'Hide password' : 'Show password'}
                        className="focus:outline-none hover:text-text-primary transition-colors"
                      >
                        <EyeIcon className="w-[18px] h-[18px]" />
                      </button>
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 h-1 flex-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors duration-300 ${strength >= i ? STRENGTH_COLORS[strength] : 'bg-surface-border'}`}
                        />
                      ))}
                    </div>
                    {strength > 0 && (
                      <span className="text-[11px] font-semibold text-text-tertiary w-11 text-right">
                        {STRENGTH_LABELS[strength]}
                      </span>
                    )}
                  </div>
                </div>

                <Input
                  label="Confirm new password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  leftIcon={Lock}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={confirm && password !== confirm ? 'Passwords do not match' : undefined}
                />

                {error && (
                  <div className="rounded-[10px] bg-signal-redBg ring-1 ring-inset ring-signal-red/15 px-3 py-2.5">
                    <span className="text-signal-red text-[12.5px] font-medium">{error}</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={saving}
                  onClick={handleSubmit}
                  className="mt-1"
                >
                  {saving ? 'Saving…' : 'Update password'}
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[12px] text-text-tertiary mt-6">
          Need a hand?{' '}
          <a
            href={supportMailto('StrikeLine — password reset help')}
            className="font-semibold text-brand-blue hover:text-brand-navy transition-colors break-all"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
