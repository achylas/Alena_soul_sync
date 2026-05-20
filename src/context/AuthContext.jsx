import { createContext, useContext, useEffect, useState } from 'react'
import * as fbAuth from '../services/firebaseAuth'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = fbAuth.subscribeAuth(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const profile = await fbAuth.getUserProfile(firebaseUser.uid)

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || profile?.displayName || '',
      })
      setLoading(false)
    })

    return unsub
  }, [])

  const value = {
    user,
    loading,
    signup: fbAuth.signup,
    login: fbAuth.login,
    logout: fbAuth.logout,
    resetPassword: fbAuth.resetPassword,
    updateProfile: (updates) =>
      fbAuth.updateUserProfile(user.uid, updates),
    deleteAccount: () => fbAuth.deleteAccount(auth.currentUser),
  }

  return (
    <AuthCtx.Provider value={value}>
      {!loading && children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
