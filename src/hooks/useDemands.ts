'use client'

import { useState, useEffect } from 'react'
import { subscribeToDemands, type DemandFilters } from '@/lib/firestore'
import type { Demand } from '@/types'

export function useDemands(filters: DemandFilters = {}) {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeToDemands(filters, (data) => {
      setDemands(data)
      setLoading(false)
    })
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.prioridade,
    filters.tipo,
    filters.responsavel,
  ])

  return { demands, loading }
}
