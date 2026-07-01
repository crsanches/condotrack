'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'
import { createPatrimonio } from '../service'
import { PatrimonioFormData } from '@/types'
import PatrimonioForm from '../PatrimonioForm'

export default function NovoPatrimonioPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (data: PatrimonioFormData) => {
    if (!user?.condominioId) return
    const id = await createPatrimonio(user.condominioId, data)
    router.push(`/patrimonios/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Novo Bem" showBack />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <PatrimonioForm onSubmit={handleSubmit} submitLabel="Cadastrar bem" />
      </main>
    </div>
  )
}