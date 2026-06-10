import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { useUserStore } from '../../store/useUserStore';
import { useRealtimePrices } from '../../hooks/useRealtimePrices';
import { supabase } from '../../lib/supabase';

export const AppShell = () => {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const setSession = useUserStore(state => state.setSession);
  const clearSession = useUserStore(state => state.clearSession);
  const navigate = useNavigate();

  // Step 8 substitution
  useRealtimePrices();

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
