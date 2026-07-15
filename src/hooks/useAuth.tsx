'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import type { CondoUser } from '@/types'
import { onAuthChange } from '@/lib/auth'
import { getUser } from '@/lib/firestore'

interface AuthContextValue {
  user: CondoUser | null
  loading: boolean

  isSuperAdmin: boolean
  isManager: boolean

  permissions: {
    manageBudgets: boolean
    manageContracts: boolean
    manageDemands: boolean
    manageTasks: boolean
    manageUsers: boolean
    managePlatform: boolean
  }
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,

  isSuperAdmin: false,
  isManager: false,

  permissions: {
    manageBudgets: false,
    manageContracts: false,
    manageDemands: false,
    manageTasks: false,
    manageUsers: false,
    managePlatform: false,
  },
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

  const isManager =
    isSuperAdmin ||
    user?.role === 'sindico' ||
    user?.role === 'subsindico'
  
  const permissions = {
    manageBudgets: isManager,
    manageContracts: isManager,
    manageDemands: isManager,
    manageTasks: isManager,
    manageUsers: isManager,
    managePlatform: isSuperAdmin,
  }

  return (
<AuthContext.Provider
  value={{
    user,
    loading,

    isSuperAdmin,
    isManager,

    permissions,
  }}
>      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}