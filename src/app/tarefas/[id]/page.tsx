'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import {
  getTarefa,
  getRegistrosTarefa,
  getUltimoRegistro,
  calcularStatusTarefa,
  updateTarefa,
} from '@/lib/firestore'
import type { TarefaPeriodica, RegistroTarefa, StatusTarefa } from '@/types'
import { NAO_CONFORMIDADE_LABELS, PRIORITY_LABELS } from '@/types'

const STATUS_CONFIG = {
  em_dia:          { label: 'Em dia',         bg: 'bg-green-50',  text: 'text-green-700', dot: 'bg-green-500'  },
  vence_hoje:      { label: 'Vence hoje',      bg: 'bg-amber-50',  text: 'text-amber-700', dot: 'bg-amber-400'  },
  atrasada:        { label: 'Atrasada',        bg: 'bg-red-50',    text: 'text-red-600',   dot: 'bg-red-500'    },
  nunca_executada: { label: 'Nunca executada', bg: 'bg-gray-50',   text: 'text-gray-500',  dot: 'bg-gray-400'   },
}

function descricaoPeriodicidade(tarefa: TarefaPeriodica): string {
  const p = tarefa.periodicidade
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  if (p.tipo === 'semanal') return `Semanal — ${p.diasSemana.map(d => DIAS[d]).join(', ')}`
  if (p.tipo === 'intervalo') return `A cada ${p.diasIntervalo} dias`
  if (p.tipo === 'mensal') return `Todo dia ${p.diaDoMes} do mês`
  return '—'
}

function formatDate(ts: unknown): string {
  if (!ts) return '—'
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  return d.toLocaleDateString('pt-BR')
}

function formatDateTime(ts: unknown): string {
  if (!ts) return '—'
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function TarefaDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [tarefa, setTarefa] = useState<TarefaPeriodica | null>(null)
  const [registros, setRegistros] = useState<RegistroTarefa[]>([])
  const [status, setStatus] = useState<StatusTarefa | null>(null)
  const [fotoAberta, setFotoAberta] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [togglingAtivo, setTogglingAtivo] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!id) return
    load()
  }, [id])

  async function load() {
    setLoadingData(true)
    try {
      const [t, regs, ultimo] = await Promise.all([
        getTarefa(id),
        getRegistrosTarefa(id),
        getUltimoRegistro(id),
      ])
      setTarefa(t)
      setRegistros(regs)
      if (t) setStatus(calcularStatusTarefa(t, ultimo))
    } finally {
      setLoadingData(false)
    }
  }

  async function toggleAtivo() {
    if (!tarefa) return
    setTogglingAtivo(true)
    try {
      await updateTarefa(tarefa.id, { ativo: !tarefa.ativo })
      setTarefa(prev => prev ? { ...prev, ativo: !prev.ativo } : prev)
    } finally {
      setTogglingAtivo(false)
    }
  }

  if (loading || !user) return null
  if (loadingData) return (
    <>
      <Header title="Tarefa" showBack backHref="/tarefas" />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    </>
  )
  if (!tarefa) return (
    <>
      <Header title="Tarefa" showBack backHref="/tarefas" />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Tarefa não encontrada.</p>
      </div>
    </>
  )

  const cfg = status ? STATUS_CONFIG[status] : STATUS_CONFIG.nunca_executada
  const isSindico = user.role === 'sindico' || user.role === 'subsindico'

  return (
    <>
      <Header title="Tarefa" showBack backHref="/tarefas" />

      <div className="min-h-screen bg-gray-50 pb-32">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-white/70">
                  Tarefa periódica
                </p>
                <h1 className="text-xl font-bold mt-2 leading-snug">
                  {tarefa.titulo}
                </h1>
                <p className="text-sm text-white/75 mt-1">
                  {descricaoPeriodicidade(tarefa)}
                </p>
              </div>
              <span className={`
                text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 mt-1
                ${cfg.bg} ${cfg.text}
              `}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            ['Responsável padrão', tarefa.responsavelPadraoNome],
            ['Total de execuções', `${registros.length} registros`],
            ['Última execução', registros[0] ? formatDate(registros[0].dataRealizacao) : 'Nunca executada'],
            ['Status', tarefa.ativo ? 'Ativa' : 'Inativa'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-medium text-gray-700">{value}</span>
            </div>
          ))}
          {tarefa.descricao && (
            <div className="px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-1">Descrição</p>
              <p className="text-sm text-gray-700">{tarefa.descricao}</p>
            </div>
          )}
        </div>

        {/* AÇÕES */}
        <div className="px-4 mt-4 flex gap-2">
          <button
            onClick={() => router.push(`/tarefas/${id}/registrar`)}
            className="flex-1 bg-[#1a2744] text-white rounded-2xl py-3 text-sm font-medium"
          >
            ✅ Registrar execução
          </button>
          {isSindico && (
            <>
              <button
                onClick={() => router.push(`/tarefas/${id}/editar`)}
                className="px-4 bg-gray-100 text-gray-700 rounded-2xl py-3 text-sm font-medium"
              >
                ✏️ Editar
              </button>
              <button
                onClick={toggleAtivo}
                disabled={togglingAtivo}
                className={`px-4 rounded-2xl py-3 text-sm font-medium ${
                  tarefa.ativo
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {tarefa.ativo ? '🚫' : '▶️'}
              </button>
            </>
          )}
        </div>

        {/* HISTÓRICO */}
        <div className="px-4 mt-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Histórico de execuções
          </h2>

          {registros.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm text-gray-400">Nenhuma execução registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registros.map((r, i) => {
                const naoConforme = r.conforme === false

                return (
                  <div
                    key={r.id}
                    className={`
                      bg-white rounded-3xl border shadow-sm overflow-hidden
                      ${naoConforme ? 'border-red-100' : i === 0 ? 'border-green-100' : 'border-gray-100'}
                    `}
                  >
                    {/* barra topo: vermelha se NC, verde se mais recente, cinza caso contrário */}
                    <div className={`h-1 ${naoConforme ? 'bg-red-500' : i === 0 ? 'bg-green-500' : 'bg-gray-100'}`} />

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatDate(r.dataRealizacao)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Registrado em {formatDateTime(r.criadoEm)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {i === 0 && !naoConforme && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                              Mais recente
                            </span>
                          )}
                          {/* Badge de conformidade */}
                          <span className={`
                            text-xs px-2 py-1 rounded-full font-medium
                            ${naoConforme
                              ? 'bg-red-50 text-red-600'
                              : 'bg-green-50 text-green-700'}
                          `}>
                            {naoConforme ? '⚠️ Não conforme' : '✅ Conforme'}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-2">
                        👤 {r.responsavelNome}
                      </div>

                      {/* Detalhes da não conformidade */}
                      {naoConforme && r.naoConformidadeTipo && (
                        <div className="mb-3 bg-red-50 border border-red-100 rounded-2xl p-3 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-red-700">
                              {NAO_CONFORMIDADE_LABELS[r.naoConformidadeTipo]}
                            </span>
                            {r.naoConformidadePrioridade && (
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full font-medium border
                                ${r.naoConformidadePrioridade === 'alta'
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : r.naoConformidadePrioridade === 'media'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'}
                              `}>
                                Prioridade {PRIORITY_LABELS[r.naoConformidadePrioridade]}
                              </span>
                            )}
                          </div>
                          {r.naoConformidadeDetalhe && (
                            <p className="text-xs text-red-600 leading-relaxed">
                              {r.naoConformidadeDetalhe}
                            </p>
                          )}
                        </div>
                      )}

                      {r.observacao && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                          {r.observacao}
                        </p>
                      )}

                      {r.fotoUrl && (
                        <button
                          onClick={() => setFotoAberta(r.fotoUrl!)}
                          className="mt-3 w-full"
                        >
                          <img
                            src={r.fotoUrl}
                            alt="Foto da execução"
                            className="w-full rounded-2xl object-cover max-h-48"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* LIGHTBOX FOTO */}
      {fotoAberta && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoAberta(null)}
        >
          <img
            src={fotoAberta}
            alt="Foto ampliada"
            className="max-w-full max-h-full rounded-2xl object-contain"
          />
          <button
            onClick={() => setFotoAberta(null)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}