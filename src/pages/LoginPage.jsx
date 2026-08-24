import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Zap, Smartphone, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StrikeLineLogo } from '../components/logo/StrikeLineLogo';
import { MarketTicker } from '../components/ticker/MarketTicker';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { SUPPORT_EMAIL, supportMailto } from '../lib/constants';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const FEATURES = [
  { icon: Zap, title: '60-second data refresh', body: 'Live PSX ticks straight from the exchange feed.' },
  { icon: Smartphone, title: 'Push & WhatsApp alerts', body: 'The moment your level is touched, on any device.' },
  { icon: LineChart, title: 'Built for PSX traders', body: 'Support, resistance and breakout levels per security.' },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onLogin = async (data) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error) {
      loginForm.setError('root', { message: error.message });
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  const onSignup = async (data) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { display_name: data.name } }
    });

    if (error) {
      signupForm.setError('root', { message: error.message });
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    const email = loginForm.getValues('email');
    if (!email || !z.string().email().safeParse(email).success) {
      loginForm.setError('email', { message: 'Enter your email address first' });
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) throw error;
      toast.success(`Password reset link sent to ${email}`);
    } catch (err) {
      console.error('Password reset failed:', err.message);
      toast.error(`Couldn't send reset link: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const EyeIcon = showPassword ? EyeOff : Eye;

  const watchPassword = signupForm.watch("password");
  const getStrength = (pass) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length > 5) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
    return s;
  };
  const strength = getStrength(watchPassword);
  const strengthColors = ['bg-surface-border', 'bg-signal-red', 'bg-signal-amber', 'bg-signal-green', 'bg-signal-green'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  // Hard rule: no <form> elements. Enter still submits via the keydown handler.
  const submitOnEnter = (handler) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handler(); }
  };

  return (
    <div className="min-h-[100dvh] flex w-full bg-surface-card">
      {/* ---------------- Brand panel (desktop) ---------------- */}
      <div className="hidden lg:flex flex-col w-[46%] xl:w-1/2 bg-navy-gradient relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: 'radial-gradient(90% 60% at 15% 10%, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0) 65%)' }}
        />

        <div className="p-8 relative">
          <StrikeLineLogo variant="inverse" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-12 xl:px-20 relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blueLight/80 mb-4">
            Pakistan Stock Exchange
          </p>
          <h1 className="text-[40px] xl:text-[46px] font-bold text-text-inverse leading-[1.06] tracking-tightest max-w-[9ch]">
            Never miss a price level again.
          </h1>
          <p className="mt-5 text-white/55 text-[15px] leading-relaxed max-w-sm">
            Real-time PSX alerts delivered straight to your devices, so you can focus on trading
            instead of staring at charts.
          </p>

          <div className="mt-10 flex flex-col gap-5 max-w-sm">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-[11px] bg-white/[0.07] ring-1 ring-inset ring-white/10 flex items-center justify-center text-brand-blueLight shrink-0">
                  <f.icon className="w-[17px] h-[17px]" />
                </div>
                <div>
                  <p className="text-text-inverse text-[14px] font-semibold tracking-tightish">{f.title}</p>
                  <p className="text-white/40 text-[12.5px] mt-0.5">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <MarketTicker className="relative w-full" />
      </div>

      {/* ---------------- Auth panel ---------------- */}
      <div className="w-full lg:w-[54%] xl:w-1/2 flex flex-col relative">
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-10 md:px-16 py-10 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
          <div className="w-full max-w-[392px] mx-auto">
            <div className="lg:hidden mb-8 flex justify-center">
              <StrikeLineLogo variant="full" />
            </div>

            <div className="mb-6">
              <h2 className="text-[24px] font-bold text-text-primary tracking-tighter">
                {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-[13.5px] text-text-secondary mt-1.5">
                {activeTab === 'login'
                  ? 'Sign in to your PSX alert dashboard.'
                  : 'Start tracking PSX levels in under a minute.'}
              </p>
            </div>

            {/* Segmented tab switcher */}
            <div className="flex gap-0.5 bg-surface-muted p-1 rounded-[12px] mb-7 ring-1 ring-inset ring-slate-900/[0.04]">
              {['login', 'signup'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="sl-tap relative flex-1 h-9 rounded-[9px] text-[13px] font-semibold transition-colors"
                >
                  {activeTab === tab && (
                    <motion.span
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-[9px] bg-surface-card shadow-card"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className={activeTab === tab ? 'relative text-brand-navy' : 'relative text-text-secondary'}>
                    {tab === 'login' ? 'Log in' : 'Sign up'}
                  </span>
                </button>
              ))}
            </div>

            {activeTab === 'login' ? (
              <div className="flex flex-col gap-4" onKeyDown={submitOnEnter(loginForm.handleSubmit(onLogin))}>
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  leftIcon={Mail}
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register("email")}
                />

                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    leftIcon={Lock}
                    rightIcon={() => (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="focus:outline-none hover:text-text-primary transition-colors"
                      >
                        <EyeIcon className="w-[18px] h-[18px]" />
                      </button>
                    )}
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register("password")}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resetting}
                      className="text-[12px] font-semibold text-brand-blue hover:text-brand-navy transition-colors disabled:opacity-50"
                    >
                      {resetting ? 'Sending…' : 'Forgot password?'}
                    </button>
                  </div>
                </div>

                {loginForm.formState.errors.root && (
                  <div className="rounded-[10px] bg-signal-redBg ring-1 ring-inset ring-signal-red/15 px-3 py-2.5">
                    <span className="text-signal-red text-[12.5px] font-medium">
                      {loginForm.formState.errors.root.message}
                    </span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  onClick={loginForm.handleSubmit(onLogin)}
                  className="mt-1"
                >
                  Log in
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4" onKeyDown={submitOnEnter(signupForm.handleSubmit(onSignup))}>
                <Input
                  label="Display name"
                  autoComplete="name"
                  leftIcon={User}
                  error={signupForm.formState.errors.name?.message}
                  {...signupForm.register("name")}
                />
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  leftIcon={Mail}
                  error={signupForm.formState.errors.email?.message}
                  {...signupForm.register("email")}
                />
                <div className="flex flex-col gap-2">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    leftIcon={Lock}
                    rightIcon={() => (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="focus:outline-none hover:text-text-primary transition-colors"
                      >
                        <EyeIcon className="w-[18px] h-[18px]" />
                      </button>
                    )}
                    error={signupForm.formState.errors.password?.message}
                    {...signupForm.register("password")}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 h-1 flex-1">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={`flex-1 rounded-full transition-colors duration-300 ${strength >= idx ? strengthColors[strength] : 'bg-surface-border'}`}
                        />
                      ))}
                    </div>
                    {strength > 0 && (
                      <span className="text-[11px] font-semibold text-text-tertiary w-11 text-right">
                        {strengthLabels[strength]}
                      </span>
                    )}
                  </div>
                </div>

                {signupForm.formState.errors.root && (
                  <div className="rounded-[10px] bg-signal-redBg ring-1 ring-inset ring-signal-red/15 px-3 py-2.5">
                    <span className="text-signal-red text-[12.5px] font-medium">
                      {signupForm.formState.errors.root.message}
                    </span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  onClick={signupForm.handleSubmit(onSignup)}
                  className="mt-1"
                >
                  Create account
                </Button>
              </div>
            )}

            {activeTab === 'signup' && (
              <p className="text-center text-[11.5px] text-text-tertiary mt-6 leading-relaxed">
                By signing up you agree to our Terms and Privacy Policy.
              </p>
            )}

            <p className="text-center text-[12px] text-text-tertiary mt-6 pt-6 border-t border-surface-hairline">
              Trouble signing in?{' '}
              <a
                href={supportMailto('StrikeLine — sign-in help')}
                className="font-semibold text-brand-blue hover:text-brand-navy transition-colors break-all"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
