'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import type { CondoUser } from '@/types'
import { onAuthChange } from '@/lib/auth'
import { getUser } from '@/lib/firestore'

interface AuthContextValue {
  user: CondoUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CondoUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const condoUser = await getUser(firebaseUser.uid)
        setUser(condoUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
