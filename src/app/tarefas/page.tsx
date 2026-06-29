'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import {
  getAllTarefas,
  getUltimoRegistro,
  calcularStatusTarefa,
  subscribeToTarefas,
  subscribeToRegistros, 
} from '@/lib/firestore'
import type { TarefaPeriodica, RegistroTarefa, StatusTarefa } from '@/types'



interface TarefaComStatus {
  tarefa: TarefaPeriodica
  ultimoRegistro: RegistroTarefa | null
  status: StatusTarefa
}

const STATUS_CONFIG = {
  em_dia:          { label: 'Em dia',         bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100',  dot: 'bg-green-500'  },
  vence_hoje:      { label: 'Vence hoje',      bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100',  dot: 'bg-amber-400'  },
  atrasada:        { label: 'Atrasada',        bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100',    dot: 'bg-red-500'    },
  nunca_executada: { label: 'Nunca executada', bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-100',   dot: 'bg-gray-400'   },
}

function descricaoPeriodicidade(tarefa: TarefaPeriodica): string {
  const p = tarefa.periodicidade
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  if (p.tipo === 'semanal') return `Semanal — ${p.diasSemana.map(d => DIAS[d]).join(', ')}`
  if (p.tipo === 'intervalo') return `A cada ${p.diasIntervalo} dias`
  if (p.tipo === 'mensal') return `Todo dia ${p.diaDoMes}`
  return '—'
}

function formatDate(ts: unknown): string {
  if (!ts) return '—'
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  return d.toLocaleDateString('pt-BR')
}

export default function TarefasPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const [itens, setItens] = useState<TarefaComStatus[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<StatusTarefa | ''>('')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  const load = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    try {
      const tarefas = await getAllTarefas()
      const itensComStatus = await Promise.all(
        tarefas
          .filter(t => t.ativo)
          .map(async tarefa => {
            const ultimoRegistro = await getUltimoRegistro(tarefa.id)
            const status = calcularStatusTarefa(tarefa, ultimoRegistro)
            return { tarefa, ultimoRegistro, status }
          })
      )
      const ordemStatus: StatusTarefa[] = ['atrasada', 'vence_hoje', 'nunca_executada', 'em_dia']
      itensComStatus.sort(
        (a, b) => ordemStatus.indexOf(a.status) - ordemStatus.indexOf(b.status)
      )
      setItens(itensComStatus)
    } finally {
      setLoadingData(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
  
    load()
  
    const unsubTarefas = subscribeToTarefas(() => {
      load()
    })
  
    const unsubRegistros = subscribeToRegistros(() => {
      load()
    })
  
    return () => {
      unsubTarefas()
      unsubRegistros()
    }
  }, [user, load])

  useEffect(() => {
    function handleFocus() {
      load()
    }
  
    window.addEventListener('focus', handleFocus)
  
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [load])

  if (loading || !user) return null

  const filtrados = filtroStatus
    ? itens.filter(i => i.status === filtroStatus)
    : itens

  const counts = {
    atrasada:        itens.filter(i => i.status === 'atrasada').length,
    vence_hoje:      itens.filter(i => i.status === 'vence_hoje').length,
    nunca_executada: itens.filter(i => i.status === 'nunca_executada').length,
    em_dia:          itens.filter(i => i.status === 'em_dia').length,
  }

  const isSindico = user.role === 'sindico' || user.role === 'subsindico'

  return (
    <>
      <Header title="Tarefas" showBack backHref="/dashboard" />

      <div className="min-h-screen bg-gray-50">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Manutenção</p>
            <h1 className="text-2xl font-bold mt-2">Tarefas Periódicas</h1>
            <p className="text-sm text-white/80 mt-2">{itens.length} tarefas ativas</p>
          </div>
        </div>

        {/* RESUMO */}
        <div className="px-4 mt-4 grid grid-cols-4 gap-2">
          {(
            [
              ['atrasada',        'Atrasadas', 'text-red-600',   'bg-red-50',   'border-red-100'   ],
              ['vence_hoje',      'Hoje',       'text-amber-600', 'bg-amber-50', 'border-amber-100' ],
              ['nunca_executada', 'Pendentes',  'text-gray-500',  'bg-gray-50',  'border-gray-100'  ],
              ['em_dia',          'Em dia',     'text-green-700', 'bg-green-50', 'border-green-100' ],
            ] as const
          ).map(([key, label, textCls, bgCls, borderCls]) => (
            <button
              key={key}
              onClick={() => setFiltroStatus(filtroStatus === key ? '' : key)}
              className={`
                rounded-2xl p-3 border text-center transition-all
                ${bgCls} ${borderCls}
                ${filtroStatus === key ? 'ring-2 ring-[#1a2744]' : ''}
              `}
            >
              <p className={`text-xl font-bold ${textCls}`}>{counts[key]}</p>
              <p className={`text-[10px] uppercase font-medium ${textCls}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* BOTÃO NOVA TAREFA */}
        {isSindico && (
          <div className="px-4 mt-4">
            <button
              onClick={() => router.push('/tarefas/nova')}
              className="w-full bg-[#1a2744] text-white rounded-3xl p-4 font-medium"
            >
              ➕ Nova tarefa periódica
            </button>
          </div>
        )}

        {/* LISTA */}
        <div className="px-4 mt-4 pb-24 space-y-3">
          {loadingData ? (
            <div className="bg-white rounded-3xl p-10 text-center">
              <p className="text-gray-400">Carregando tarefas...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-semibold text-gray-700">Nenhuma tarefa aqui</p>
              <p className="text-sm text-gray-400 mt-1">Tente outro filtro</p>
            </div>
          ) : (
            filtrados.map(({ tarefa, ultimoRegistro, status }) => {
              const cfg = STATUS_CONFIG[status]
              return (
                <div
                  key={tarefa.id}
                  className={`bg-white rounded-3xl border ${cfg.border} shadow-sm overflow-hidden`}
                >
                  <div className={`h-1 ${cfg.dot}`} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{tarefa.titulo}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{descricaoPeriodicidade(tarefa)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>👤 {tarefa.responsavelPadraoNome}</span>
                      {ultimoRegistro && (
                        <span>🕒 Última: {formatDate(ultimoRegistro.dataRealizacao)}</span>
                      )}
                    </div>

                    {tarefa.descricao && (
                      <p className="mt-2 text-xs text-gray-400 line-clamp-2">{tarefa.descricao}</p>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => router.push(`/tarefas/${tarefa.id}/registrar`)}
                        className="flex-1 bg-[#1a2744] text-white rounded-2xl py-2.5 text-sm font-medium"
                      >
                        ✅ Registrar execução
                      </button>
                      <button
                        onClick={() => router.push(`/tarefas/${tarefa.id}`)}
                        className="px-4 bg-gray-100 text-gray-700 rounded-2xl py-2.5 text-sm font-medium"
                      >
                        Histórico
                      </button>
                      {isSindico && (
                        <button
                          onClick={() => router.push(`/tarefas/${tarefa.id}/editar`)}
                          className="px-4 bg-gray-100 text-gray-700 rounded-2xl py-2.5 text-sm font-medium"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </>
  )
}