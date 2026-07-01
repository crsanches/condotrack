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
    if (!user?.condominioId) {
      setDemands([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeToDemands(
      user.condominioId,
      filters,
      (data) => {
        setDemands(data)
        setLoading(false)
      },
      user?.acessoSigilo ?? false
    )
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.condominioId,
    filters.status,
    filters.prioridade,
    filters.tipo,
    filters.responsavel,
    user?.acessoSigilo,
  ])

  return { demands, loading }
}