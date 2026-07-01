'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { getAllOrcamentos } from '@/lib/firestore'
import type { Orcamento } from '@/types'

function statusLabel(o: Orcamento) {
  if (o.status === 'aberto') return { text: 'Aberto', color: 'bg-blue-100 text-blue-700' }
  if (o.resultado === 'contratado') return { text: 'Contratado', color: 'bg-green-100 text-green-700' }
  return { text: 'Não contratado', color: 'bg-red-100 text-red-600' }
}

export default function OrcamentosPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [fetching, setFetching] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'aberto' | 'concluido'>('todos')

  const canManage = user?.role === 'sindico' || user?.role === 'subsindico'
  const canSeeSigilo = user?.acessoSigilo === true

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!user?.condominioId) return
    getAllOrcamentos(user.condominioId).then(data => {
      const visible = data.filter(o => !o.registroSigiloso || canSeeSigilo)
      setOrcamentos(visible)
      setFetching(false)
    })
  }, [user?.condominioId, canSeeSigilo])

  
  const filtered = orcamentos.filter(o => filtro === 'todos' || o.status === filtro)
  const totalAbertos = orcamentos.filter(o => o.status === 'aberto').length

  if (loading || !user) return null

  return (
    <>
     
     <Header
        title="Orçamentos"
        showBack
        backHref="/"
        rightAction={
          canManage ? (
            <button
              onClick={() => router.push('/orcamentos/novo')}
              className="px-4 h-10 rounded-xl bg-[#1a2744] text-white text-sm font-semibold"
            >
              + Novo
            </button>
          ) : undefined
        }
      />
      <div className="min-h-screen bg-gray-50 pb-32">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Financeiro</p>
            <h1 className="text-2xl font-bold mt-2">Orçamentos</h1>
            <p className="text-sm text-white/80 mt-1">
              Pesquisa de preços e histórico de contratações
            </p>
            <div className="flex gap-3 mt-4">
              <div className="bg-white/10 rounded-2xl px-4 py-2 text-center">
                <p className="text-xl font-bold">{orcamentos.length}</p>
                <p className="text-xs text-white/70">Total</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-2 text-center">
                <p className="text-xl font-bold">{totalAbertos}</p>
                <p className="text-xs text-white/70">Em andamento</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTRO */}
        <div className="px-4 mt-4 flex gap-2">
          {(['todos', 'aberto', 'concluido'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-all ${
                filtro === f
                  ? 'bg-[#1a2744] border-[#1a2744] text-white'
                  : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'aberto' ? 'Abertos' : 'Concluídos'}
            </button>
          ))}
        </div>

        {/* LISTA */}
        <div className="px-4 mt-4 space-y-3">
          {fetching ? (
            <div className="text-center py-12 text-gray-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 text-sm">Nenhum orçamento encontrado.</p>
              {canManage && (
                <button
                  onClick={() => router.push('/orcamentos/novo')}
                  className="mt-4 text-[#1a2744] font-semibold text-sm underline"
                >
                  Criar primeiro orçamento
                </button>
              )}
            </div>
          ) : (
            filtered.map(o => {
              const badge = statusLabel(o)
              return (
                <button
                  key={o.id}
                  onClick={() => router.push(`/orcamentos/${o.id}`)}
                  className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}>
                          {badge.text}
                        </span>
                        {o.registroSigiloso && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            🔒 Sigiloso
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 mt-2 leading-tight">{o.titulo}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{o.descricao}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="bg-gray-50 rounded-2xl px-3 py-2 text-center">
                        <p className="text-lg font-bold text-[#1a2744]">{o.totalCotacoes ?? 0}</p>
                        <p className="text-xs text-gray-500">cotações</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    {o.criadoEm?.toDate?.()?.toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </div>
                </button>
              )
            })
          )}
        </div>

        

      </div>
    </>
  )
}