'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getDemand } from '@/lib/firestore'
import Header from '@/components/layout/Header'
import DemandForm from '@/components/demands/DemandForm'
import type { Demand } from '@/types'

export default function EditarDemandPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [demand, setDemand] =
    useState<Demand | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (id) {
      getDemand(id).then(setDemand)
    }
  }, [id])

  if (loading || !user) return null

  if (!demand) {
    return (
      <>
        <Header title="Editar demanda" showBack />

        <div className="min-h-screen bg-gray-50 p-4">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-pulse">

            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6" />

            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-32 bg-gray-100 rounded-xl" />
            </div>

          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Editar demanda" showBack />

      <div className="bg-gray-50 min-h-screen">

        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">

            <p className="text-xs uppercase tracking-widest text-white/70">
              Edição
            </p>

            <h1 className="text-xl font-bold mt-2">
              {demand.titulo}
            </h1>

            <p className="text-xs text-white/60 mt-2">
              Protocolo #{demand.id.slice(0, 8)}
            </p>

          </div>
        </div>

        <DemandForm existing={demand} />

      </div>
    </>
  )
}