import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Mail } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { useUserStore } from '../../store/useUserStore';
import { useRealtimePrices } from '../../hooks/useRealtimePrices';
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { supabase } from '../../lib/supabase';
import { SUPPORT_EMAIL, supportMailto } from '../../lib/constants';

const pageTitles = {
  '/': 'Dashboard',
  '/watchlist': 'Watchlist',
  '/history': 'Alert History',
  '/settings': 'Settings',
  '/admin': 'Admin',
};

export const AppShell = () => {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const user = useUserStore(state => state.user);
  const setSession = useUserStore(state => state.setSession);
  const clearSession = useUserStore(state => state.clearSession);
  const navigate = useNavigate();
  const location = useLocation();

  useRealtimePrices();
  useRealtimeAlerts();
  usePushNotifications();

  useEffect(() => {
    const title = pageTitles[location.pathname];
    document.title = title ? `${title} | StrikeLine` : 'StrikeLine | PSX Price Alerts';
  }, [location.pathname]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await setSession(session);
      } else {
        clearSession();
        navigate('/login', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, clearSession, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Restricted accounts are locked out of the app entirely (set from the admin
  // panel). They can still sign out. Alerts are also skipped server-side.
  if (user?.restricted) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-5">
        <div className="sl-card shadow-lifted p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-12 h-12 rounded-2xl bg-signal-redBg text-signal-red flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tighter mb-2">Account restricted</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-5">
            Your StrikeLine account has been restricted by an administrator. You won't receive
            alerts while this is in effect. If you think this is a mistake, get in touch and
            we'll take a look.
          </p>

          <a
            href={supportMailto('StrikeLine — account restricted', `Account: ${user?.email ?? ''}`)}
            className="sl-tap inline-flex items-center justify-center gap-2 w-full h-11 px-5 text-sm font-semibold rounded-pill bg-brand-blue text-text-inverse shadow-cta hover:bg-brand-blueLight transition-colors mb-2.5"
          >
            <Mail className="w-4 h-4" />
            Contact support
          </a>
          <p className="text-[12px] text-text-tertiary mb-5 break-all">{SUPPORT_EMAIL}</p>

          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }); }}
            className="sl-tap inline-flex items-center justify-center h-10 px-5 text-[13px] font-semibold rounded-pill text-text-secondary hover:bg-surface-muted transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar variant="desktop" />
        <main className="flex-1 overflow-y-auto scroll-touch overscroll-none-y">
          {/* Lives inside the scroll container so content passes under its frost */}
          <TopBar variant="mobile" />
          <div className="px-4 py-5 md:px-8 md:py-7 pb-nav md:pb-8">
            {/* Keyed on the route so each page enters with the same soft rise */}
            <div key={location.pathname} className="animate-fade-up">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
