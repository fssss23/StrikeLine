import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AlertHistoryPage from './pages/AlertHistoryPage'
import WatchlistPage from './pages/WatchlistPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { SecurityDrawer } from './components/drawer/SecurityDrawer'
import { StrikeLineLogo } from './components/logo/StrikeLineLogo'
import { useUserStore } from './store/useUserStore'

// ProtectedRoute removed as logic is handled at the App and Router level.

// Admin-only gate: non-admins are bounced to the dashboard. user (with the
// merged is_admin profile flag) is always populated once session is truthy.
function AdminRoute({ children }) {
  const user = useUserStore(state => state.user)
  return user?.is_admin ? children : <Navigate to="/" replace />
}

/** Cold-boot screen shown while the initial session resolves. */
function BootScreen() {
  return (
    <div className="min-h-[100dvh] bg-surface-page flex flex-col items-center justify-center gap-6">
      <div className="animate-fade-in">
        <StrikeLineLogo variant="full" />
      </div>
      <div className="h-[3px] w-32 rounded-full bg-surface-border overflow-hidden">
        <div
          className="h-full w-1/3 rounded-full bg-brand-blue"
          style={{ animation: 'bootSlide 1.1s cubic-bezier(0.65,0,0.35,1) infinite' }}
        />
      </div>
      <style>{`
        @keyframes bootSlide {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const session = useUserStore(state => state.session)
  const isRecovering = useUserStore(state => state.isRecovering)
  const initializeAuth = useUserStore(state => state.initializeAuth)

  useEffect(() => {
    const subscription = initializeAuth()
    return () => subscription?.unsubscribe()
  }, [initializeAuth])

  if (session === undefined) return <BootScreen />

  // A recovery link signs the user in before we get here, so this check has to
  // come BEFORE the normal session routing — otherwise the reset lands on the
  // dashboard and there is no way to actually set a new password.
  if (isRecovering) {
    return (
      <QueryClientProvider client={queryClient}>
        <ResetPasswordPage />
        <Toaster position="bottom-right" richColors />
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            session ? <Navigate to="/" replace /> : <LoginPage />
          } />
          <Route path="/" element={
            session ? <AppShell /> : <Navigate to="/login" replace />
          }>
            <Route index element={<DashboardPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="history" element={<AlertHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SecurityDrawer />
        {/* Toasts clear the floating pill nav on mobile (nav is ~76px tall) */}
        <Toaster
          position="bottom-right"
          richColors
          mobileOffset={{ bottom: '92px', left: '12px', right: '12px' }}
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontSize: '13.5px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
