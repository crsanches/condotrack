'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeToDemands, type DemandFilters } from '@/lib/firestore'
import type { Demand } from '@/types'

export function useDemands(filters: DemandFilters = {}) {
  const { user } = useAuth()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeToDemands(
      filters,
      (data) => {
        setDemands(data)
        setLoading(false)
      },
      user?.acessoSigilo ?? false   // ← novo
    )
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.prioridade,
    filters.tipo,
    filters.responsavel,
    user?.acessoSigilo,   // ← novo
  ])

  return { demands, loading }
}