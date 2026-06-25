'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { getDemandStats, getRecentDemands, getAllTarefas, getUltimoRegistro, calcularStatusTarefa } from '@/lib/firestore'
import type { Demand } from '@/types'

interface Stats { total: number; abertas: number; em_andamento: number; concluidas: number }

const formatDate = (ts: unknown) => {
  if (!ts) return '—'
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  return d.toLocaleDateString('pt-BR')
}

const isLate = (ts: unknown) => {
  if (!ts) return false
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  return d < new Date()
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentDemands, setRecentDemands] = useState<Demand[]>([])
  const [tarefasAtrasadas, setTarefasAtrasadas] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getDemandStats().then(setStats)
    getRecentDemands(5).then(setRecentDemands)
    loadTarefasStatus()
  }, [user])

  async function loadTarefasStatus() {
    const tarefas = await getAllTarefas()
    const ativas = tarefas.filter(t => t.ativo)
    const statuses = await Promise.all(
      ativas.map(async t => {
        const ultimo = await getUltimoRegistro(t.id)
        return calcularStatusTarefa(t, ultimo)
      })
    )
    setTarefasAtrasadas(
      statuses.filter(s => s === 'atrasada' || s === 'nunca_executada').length
    )
  }

  if (loading || !user) return null

  const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const settingsMenu = (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(v => !v)}
        className="text-xs font-medium bg-white/20 text-white px-3 py-2 rounded-xl whitespace-nowrap"
      >
        👥 Cadastros
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 min-w-[210px]">
            <button
              onClick={() => { setMenuOpen(false); router.push('/admin') }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-2xl"
            >
              👤 Cadastrar usuários
            </button>
            <button
              onClick={() => { setMenuOpen(false); router.push('/admin/responsaveis') }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded-b-2xl"
            >
              👥 Gerenciar responsáveis
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      <Header
        title="CondoTrack"
        showLogout
        rightAction={user.role === 'sindico' ? settingsMenu : undefined}
      />

      <div className="min-h-screen bg-gray-50">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e8b84b] flex items-center justify-center text-lg font-bold text-amber-900">
                {initials}
              </div>
              <div>
                <p className="text-white/70 text-sm">Bem-vindo</p>
                <h1 className="text-xl font-bold">{user.name}</h1>
                <p className="text-sm text-white/80">
                  {user.role === 'sindico' ? 'Síndico' : user.role === 'subsindico' ? 'Subsíndico' : 'Conselheiro'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STATS DEMANDAS */}
        {stats && (
          <div className="px-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total</p>
                <p className="text-3xl font-bold text-[#1a2744] mt-1">{stats.total}</p>
              </div>
              <div className="bg-red-50 rounded-3xl p-4 border border-red-100">
                <p className="text-xs text-red-400 uppercase tracking-wider">Pendentes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.abertas + stats.em_andamento}</p>
              </div>
              <div className="bg-green-50 rounded-3xl p-4 border border-green-100">
                <p className="text-xs text-green-500 uppercase tracking-wider">Concluídas</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{stats.concluidas}</p>
              </div>
            </div>
          </div>
        )}

        {/* DEMANDAS RECENTES */}
        <div className="px-4 mt-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Demandas recentes
          </h2>
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_72px_52px] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
              {['Registro', 'Demanda', 'Vencimento', 'Prior.'].map(h => (
                <span key={h} className="text-[10px] font-semibold text-gray-400 uppercase">{h}</span>
              ))}
            </div>
            {recentDemands.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Nenhuma demanda registrada.
              </div>
            ) : (
              recentDemands.map(d => (
                <div
                  key={d.id}
                  onClick={() => router.push(`/demands/${d.id}`)}
                  className="grid grid-cols-[80px_1fr_72px_52px] gap-2 px-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
                >
                  <span className="text-[11px] text-gray-400">{formatDate(d.dataCriacao)}</span>
                  <span className="text-[12px] font-medium text-gray-800 truncate">{d.titulo}</span>
                  <span className={`text-[11px] ${isLate(d.dataPrevisao) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {formatDate(d.dataPrevisao)}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full text-center
                    ${d.prioridade === 'alta' ? 'bg-red-50 text-red-600' :
                      d.prioridade === 'media' ? 'bg-amber-50 text-amber-600' :
                      'bg-green-50 text-green-700'}`}>
                    {d.prioridade === 'alta' ? 'Alta' : d.prioridade === 'media' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

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
              <div className="font-semibold text-gray-800">Nova Demanda</div>
              <div className="text-xs text-gray-500 mt-1">Registrar solicitação</div>
            </button>

            <button
              onClick={() => router.push('/demands')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-semibold text-gray-800">Consultar</div>
              <div className="text-xs text-gray-500 mt-1">Ver todas as demandas</div>
            </button>

            <button
              onClick={() => router.push('/tarefas')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="text-4xl mb-3">✅</div>
              <div className="font-semibold text-gray-800">Tarefas</div>
              <div className="text-xs text-gray-500 mt-1">
                {tarefasAtrasadas > 0
                  ? <span className="text-red-500 font-medium">{tarefasAtrasadas} pendente{tarefasAtrasadas > 1 ? 's' : ''}</span>
                  : 'Manutenção periódica'}
              </div>
            </button>

            <button
              onClick={() => router.push('/contratos')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="text-4xl mb-3">📄</div>
              <div className="font-semibold text-gray-800">Contratos</div>
              <div className="text-xs text-gray-500 mt-1">Fornecedores e vencimentos</div>
            </button>

            <button
              onClick={() => router.push('/demands?mode=update')}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-left"
            >
              <div className="text-4xl mb-3">✏️</div>
              <div className="font-semibold text-gray-800">Atualizar</div>
              <div className="text-xs text-gray-500 mt-1">Registrar andamento</div>
            </button>

            <button
              onClick={() => router.push('/demands?mode=delete')}
              className="bg-amber-50 rounded-3xl p-5 border border-amber-200 text-left"
            >
              <div className="text-4xl mb-3">🗑️</div>
              <div className="font-semibold text-amber-700">Excluir</div>
              <div className="text-xs text-amber-600 mt-1">Remover demanda</div>
            </button>

          </div>
        </div>

        {/* CARD ALERTA DEMANDAS */}
        {stats && stats.abertas + stats.em_andamento > 0 && (
          <div className="px-4 mt-5">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-5 text-white shadow-lg">
              <div className="text-sm uppercase tracking-wider text-white/80">Atenção</div>
              <div className="text-3xl font-bold mt-1">{stats.abertas + stats.em_andamento}</div>
              <div className="text-sm mt-1">demandas aguardando conclusão</div>
            </div>
          </div>
        )}

        {/* CARD ALERTA TAREFAS */}
        {tarefasAtrasadas > 0 && (
          <div className="px-4 mt-3">
            <button
              onClick={() => router.push('/tarefas')}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg text-left"
            >
              <div className="text-sm uppercase tracking-wider text-white/80">Tarefas</div>
              <div className="text-3xl font-bold mt-1">{tarefasAtrasadas}</div>
              <div className="text-sm mt-1">
                tarefa{tarefasAtrasadas > 1 ? 's' : ''} atrasada{tarefasAtrasadas > 1 ? 's' : ''} ou nunca executada{tarefasAtrasadas > 1 ? 's' : ''}
              </div>
            </button>
          </div>
        )}

        <div className="pb-8" />

      </div>
    </>
  )
}