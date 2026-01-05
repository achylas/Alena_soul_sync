import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as auth from '../services/auth'
import { clearSessions } from '../services/storage'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    const email = localStorage.getItem('mh_current_user_email')
    if (email) {
      const u = auth.getUserByEmail(email)
      if (u) setUser({ email: u.email, displayName: u.displayName })
    }
  }, [])
  const value = useMemo(() => ({
    user,
    async signup(payload) {
      const u = await auth.signup(payload)
      localStorage.setItem('mh_current_user_email', u.email)
      setUser({ email: u.email, displayName: u.displayName })
      return u
    },
    async login(email, password) {
      const u = await auth.login(email, password)
      localStorage.setItem('mh_current_user_email', u.email)
      setUser({ email: u.email, displayName: u.displayName })
      return u
    },
    logout() {
      localStorage.removeItem('mh_current_user_email')
      setUser(null)
    },
    async resetPassword(email, answer, newPassword) {
      return auth.resetPassword(email, answer, newPassword)
    },
    async updateProfile(updates) {
      const updated = await auth.updateProfile(user.email, updates)
      setUser({ email: updated.email, displayName: updated.displayName })
      return updated
    },
    async deleteAccount() {
      if (!user) return
      await auth.deleteAccount(user.email)
      clearSessions(user.email)
      localStorage.removeItem('mh_current_user_email')
      setUser(null)
      return true
    }
  }), [user])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
