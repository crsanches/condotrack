'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import type { CondoUser } from '@/types'
import { onAuthChange } from '@/lib/auth'
import { getUser } from '@/lib/firestore'

interface AuthContextValue {
  user: CondoUser | null
  loading: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isSuperAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CondoUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const condoUser = await getUser(firebaseUser.uid)
          setUser(condoUser)
        } catch (err) {
          console.error('Erro ao buscar usuário:', err)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <AuthContext.Provider value={{ user, loading, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}