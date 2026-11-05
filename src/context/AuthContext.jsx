import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // session солигдох бүрт profiles хүснэгтээс role-г уншина
  useEffect(() => {
    if (!session) { setRole(null); return }
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => { setRole(data?.role ?? 'user'); setLoading(false) })
  }, [session])

  const value = {
    session, user: session?.user, loading, isAdmin: role === 'admin',
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, full_name) => supabase.auth.signUp({ email, password, options: { data: { full_name } } }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/update-password' }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
