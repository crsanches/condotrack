'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import DemandForm from '@/components/demands/DemandForm'

export default function NovaDemandPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <>
      <Header title="Nova demanda" showBack backHref="/dashboard" />
      <DemandForm />
    </>
  )
}
