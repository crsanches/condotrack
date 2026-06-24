'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { getDemandStats } from '@/lib/firestore'

interface Stats { total: number; abertas: number; em_andamento: number; concluidas: number }

const menuItems = [
  { href: '/demands/nova', icon: '➕', label: 'Registrar demanda', color: 'text-[#1a2744]' },
  { href: '/demands', icon: '🔍', label: 'Consultar demandas', color: 'text-[#1a2744]' },
  { href: '/demands?mode=update', icon: '✏️', label: 'Atualizar demanda', color: 'text-[#1a2744]' },
  { href: '/demands?mode=delete', icon: '🗑️', label: 'Excluir demanda', color: 'text-amber-600' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (user) getDemandStats().then(setStats)
  }, [user])

  if (loading || !user) return null

  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <Header title="CondoTrack" showLogout />
      
      <div className="min-h-screen bg-gray-50">
  
        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
  
            <div className="flex items-center gap-4">
  
              <div className="w-14 h-14 rounded-full bg-[#e8b84b] flex items-center justify-center text-lg font-bold text-amber-900">
                {initials}
              </div>
  
              <div>
                <p className="text-white/70 text-sm">
                  Bem-vindo
                </p>
  
                <h1 className="text-xl font-bold">
                  {user.name}
                </h1>
  
                <p className="text-sm text-white/80">
                  {user.role === 'sindico'
                    ? 'Síndico'
                    : user.role === 'subsindico'
                    ? 'Subsíndico'
                    : 'Conselheiro'}
                </p>
              </div>
  
            </div>
  
          </div>
        </div>
  
        {/* STATS */}
        {stats && (
          <div className="px-4 mt-4">
  
            <div className="grid grid-cols-3 gap-3">
  
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
  
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Total
                </p>
  
                <p className="text-3xl font-bold text-[#1a2744] mt-1">
                  {stats.total}
                </p>
  
              </div>
  
              <div className="bg-red-50 rounded-3xl p-4 border border-red-100">
  
                <p className="text-xs text-red-400 uppercase tracking-wider">
                  Pendentes
                </p>
  
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {stats.abertas + stats.em_andamento}
                </p>
  
              </div>
  
              <div className="bg-green-50 rounded-3xl p-4 border border-green-100">
  
                <p className="text-xs text-green-500 uppercase tracking-wider">
                  Concluídas
                </p>
  
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {stats.concluidas}
                </p>
  
              </div>
  
            </div>
  
          </div>
        )}
  
        {/* ATALHOS */}
        <div className="px-4 mt-6">
  
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Ações rápidas
          </h2>
  
          <div className="grid grid-cols-2 gap-4">
  
            <button
              onClick={() => router.push('/demands/nova')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="text-4xl mb-3">➕</div>
              <div className="font-semibold text-gray-800">
                Nova Demanda
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Registrar solicitação
              </div>
            </button>
  
            <button
              onClick={() => router.push('/demands')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-semibold text-gray-800">
                Consultar
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Ver todas as demandas
              </div>
            </button>
  
            <button
              onClick={() => router.push('/demands?mode=update')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="text-4xl mb-3">✏️</div>
              <div className="font-semibold text-gray-800">
                Atualizar
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Registrar andamento
              </div>
            </button>
  
            <button
              onClick={() => router.push('/demands?mode=delete')}
              className="bg-amber-50 rounded-3xl p-5 border border-amber-200 text-left"
            >
              <div className="text-4xl mb-3">🗑️</div>
              <div className="font-semibold text-amber-700">
                Excluir
              </div>
              <div className="text-xs text-amber-600 mt-1">
                Remover demanda
              </div>
            </button>
  
          </div>
        </div>
  
        {/* CARD RESUMO */}
        {stats && stats.abertas + stats.em_andamento > 0 && (
          <div className="px-4 mt-5">
  
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-5 text-white shadow-lg">
  
              <div className="text-sm uppercase tracking-wider text-white/80">
                Atenção
              </div>
  
              <div className="text-3xl font-bold mt-1">
                {stats.abertas + stats.em_andamento}
              </div>
  
              <div className="text-sm mt-1">
                demandas aguardando conclusão
              </div>
  
            </div>
  
          </div>
        )}
  
        {/* ADMIN */}
        {user.role === 'sindico' && (
          <div className="px-4 mt-6 pb-8">
  
            <button
              onClick={() => router.push('/admin')}
              className="w-full bg-white rounded-3xl border border-gray-200 p-4 shadow-sm flex items-center justify-center gap-3"
            >
              <span className="text-xl">⚙️</span>
  
              <span className="font-medium text-gray-700">
                Administração de Usuários
              </span>
            </button>
  
          </div>
        )}
  
      </div>
    </>
  )
}
