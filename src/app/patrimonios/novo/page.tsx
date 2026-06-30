'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createPatrimonio } from '../service'
import { PatrimonioFormData } from '@/types'
import PatrimonioForm from '../PatrimonioForm'

export default function NovoPatrimonioPage() {
  const router = useRouter()

  const handleSubmit = async (data: PatrimonioFormData) => {
    const id = await createPatrimonio(data)
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