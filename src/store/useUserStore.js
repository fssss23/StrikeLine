import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useUserStore = create((set, get) => ({
  session: undefined,
  user: null, // this will hold the joined session user + profile data
  isAuthenticated: false,
  
  initializeAuth: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      get().setSession(data.session ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        get().setSession(session ?? null)
      }
    )

    return subscription
  },

  setSession: async (session) => {
    if (!session) {
      set({ session: null, user: null, isAuthenticated: false })
      return
    }

    // Fetch user profile from Supabase
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    set({ 
      session, 
      user: { ...session.user, ...profile }, 
      isAuthenticated: true 
    })
  },
  
  clearSession: () => {
    set({ session: null, user: null, isAuthenticated: false })
  }
}))
