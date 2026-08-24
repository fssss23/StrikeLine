import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Read the recovery marker at MODULE LOAD, before supabase-js finishes
// detectSessionInUrl and strips the hash. A password-reset link arrives as
// #access_token=...&type=recovery, and supabase-js signs the user straight in
// — without this flag the app would drop them on the dashboard with no way to
// actually set a new password, which is exactly what used to happen.
const initialHash = typeof window !== 'undefined' ? window.location.hash : ''
const startedInRecovery = initialHash.includes('type=recovery')

// Expired or already-used links come back as #error=...&error_description=...
const hashError = (() => {
  if (!initialHash.startsWith('#')) return null
  const params = new URLSearchParams(initialHash.slice(1))
  const desc = params.get('error_description')
  return desc ? desc.replace(/\+/g, ' ') : null
})()

// An EXPIRED or already-used link comes back with #error=... and NO
// type=recovery, so it must also put the app in recovery mode — otherwise the
// user is bounced to /login and never learns why the link failed. Scoped to
// the reset route so an unrelated auth error can't hijack the app.
const onResetRoute = typeof window !== 'undefined' &&
  window.location.pathname === '/reset-password'

export const useUserStore = create((set, get) => ({
  session: undefined,
  user: null, // this will hold the joined session user + profile data
  isAuthenticated: false,
  isRecovering: startedInRecovery || (!!hashError && onResetRoute),
  recoveryError: startedInRecovery ? null : hashError,
  
  initializeAuth: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      get().setSession(data.session ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Backstop for the module-load hash check above: supabase-js fires
        // this once it has parsed a recovery link.
        if (event === 'PASSWORD_RECOVERY') set({ isRecovering: true })
        get().setSession(session ?? null)
      }
    )

    return subscription
  },

  /** Called once the new password has been saved. */
  endRecovery: () => set({ isRecovering: false, recoveryError: null }),

  setSession: async (session) => {
    if (!session) {
      set({ session: null, user: null, isAuthenticated: false })
      return
    }

    try {
      // Fetch user profile from Supabase
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      if (error) {
        console.error('Error fetching user profile:', error)
      }

      set({ 
        session, 
        user: { ...session.user, ...(profile || {}) }, 
        isAuthenticated: true 
      })
    } catch (err) {
      console.error('Unexpected error in setSession:', err)
      set({ session, user: session.user, isAuthenticated: true })
    }
  },
  
  refreshProfile: async () => {
    const session = get().session
    if (!session) return
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error refreshing user profile:', error)
        return
      }
      set({ user: { ...session.user, ...(profile || {}) } })
    } catch (err) {
      console.error('Unexpected error refreshing profile:', err)
    }
  },

  clearSession: () => {
    set({ session: null, user: null, isAuthenticated: false, isRecovering: false })
  }
}))
