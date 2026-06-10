import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AlertHistoryPage from './pages/AlertHistoryPage'
import SettingsPage from './pages/SettingsPage'
import { SecurityDrawer } from './components/drawer/SecurityDrawer'
import { useUserStore } from './store/useUserStore'

// ProtectedRoute removed as logic is handled at the App and Router level.

export default function App() {
  const session = useUserStore(state => state.session)
  const initializeAuth = useUserStore(state => state.initializeAuth)

  useEffect(() => {
    const subscription = initializeAuth()
    return () => subscription?.unsubscribe()
  }, [initializeAuth])

  if (session === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8F9FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 32, height: 32, border: '3px solid #E4E7ED',
          borderTopColor: '#0D2F55', borderRadius: '50%',
          animation: 'spin 600ms linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
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
            <Route path="history" element={<AlertHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SecurityDrawer />
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </QueryClientProvider>
  )
}
