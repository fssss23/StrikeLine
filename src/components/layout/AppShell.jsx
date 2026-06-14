import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { useUserStore } from '../../store/useUserStore';
import { useRealtimePrices } from '../../hooks/useRealtimePrices';
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { supabase } from '../../lib/supabase';

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
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className="bg-white border border-signal-red/30 rounded-[12px] shadow-sm p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-text-primary mb-2">Account restricted</h1>
          <p className="text-sm text-text-secondary mb-6">
            Your StrikeLine account has been restricted by an administrator. You won't receive
            alerts while this is in effect. Please contact support if you think this is a mistake.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }); }}
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-sm bg-brand-blue text-text-inverse hover:bg-brand-blue/90 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
