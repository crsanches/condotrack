'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { getAllContratos, updateContrato } from '@/lib/firestore'
import type { Contrato, StatusContrato } from '@/types'

const STATUS_CONFIG: Record<StatusContrato, { label: string; bg: string; text: string; border: string }> = {
  ativo:        { label: 'Ativo',         bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-100' },
  em_renovacao: { label: 'Em renovação',  bg: 'bg-amber-50',  text: 'text-amber-700', border: 'border-amber-100' },
  encerrado:    { label: 'Encerrado',     bg: 'bg-gray-50',   text: 'text-gray-500',  border: 'border-gray-200'  },
}

function formatDate(ts: unknown): string {
  if (!ts) return '—'
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  return d.toLocaleDateString('pt-BR')
}

function formatCurrency(value?: number): string {
  if (!value) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function diasParaVencer(ts: unknown): number {
  if (!ts) return Infinity
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function badgeVencimento(contrato: Contrato): { label: string; bg: string; text: string } | null {
  if (contrato.status === 'encerrado') return null
  const dias = diasParaVencer(contrato.dataVencimento)
  if (dias < 0)
    return { label: 'Vencido',           bg: 'bg-red-100',    text: 'text-red-700'    }
  if (dias <= contrato.diasAvisoRenovacao)
    return { label: `Vence em ${dias}d`,  bg: 'bg-amber-100',  text: 'text-amber-700'  }
  return null
}

type FiltroStatus = StatusContrato | ''
type FiltroVenc   = 'todos' | 'vencendo' | 'vencido'

export default function ContratosPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('')
  const [filtroVenc, setFiltroVenc] = useState<FiltroVenc>('todos')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoadingData(true)
    try {
      const data =  await getAllContratos(user?.acessoSigilo ?? false)
      setContratos(data)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || !user) return null

  const isSindico = user.role === 'sindico' || user.role === 'subsindico'

  const filtrados = contratos.filter(c => {
    if (filtroStatus && c.status !== filtroStatus) return false
    if (filtroVenc === 'vencendo') {
      const dias = diasParaVencer(c.dataVencimento)
      if (dias < 0 || dias > c.diasAvisoRenovacao) return false
    }
    if (filtroVenc === 'vencido') {
      if (diasParaVencer(c.dataVencimento) >= 0) return false
    }
    return true
  })

  const counts = {
    ativos:       contratos.filter(c => c.status === 'ativo').length,
    renovacao:    contratos.filter(c => c.status === 'em_renovacao').length,
    encerrados:   contratos.filter(c => c.status === 'encerrado').length,
    vencendo:     contratos.filter(c => {
      const dias = diasParaVencer(c.dataVencimento)
      return c.status !== 'encerrado' && dias >= 0 && dias <= c.diasAvisoRenovacao
    }).length,
    vencidos:     contratos.filter(c => {
      return c.status !== 'encerrado' && diasParaVencer(c.dataVencimento) < 0
    }).length,
  }

  return (
    <>
      <Header title="Contratos" showBack backHref="/dashboard" />

      <div className="min-h-screen bg-gray-50">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Gestão</p>
            <h1 className="text-2xl font-bold mt-2">Contratos</h1>
            <p className="text-sm text-white/80 mt-2">{contratos.length} contratos cadastrados</p>
          </div>
        </div>

        {/* RESUMO */}
        <div className="px-4 mt-4 grid grid-cols-3 gap-2">
          {([
            ['ativos',     'Ativos',      'text-green-700', 'bg-green-50',  'border-green-100',  'ativo'        ],
            ['renovacao',  'Renovação',   'text-amber-700', 'bg-amber-50',  'border-amber-100',  'em_renovacao' ],
            ['encerrados', 'Encerrados',  'text-gray-500',  'bg-gray-50',   'border-gray-200',   'encerrado'    ],
          ] as const).map(([key, label, textCls, bgCls, borderCls, statusVal]) => (
            <button
              key={key}
              onClick={() => setFiltroStatus(filtroStatus === statusVal ? '' : statusVal)}
              className={`
                rounded-2xl p-3 border text-center transition-all
                ${bgCls} ${borderCls}
                ${filtroStatus === statusVal ? 'ring-2 ring-[#1a2744]' : ''}
              `}
            >
              <p className={`text-xl font-bold ${textCls}`}>{counts[key]}</p>
              <p className={`text-[10px] uppercase font-medium ${textCls}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* ALERTAS VENCIMENTO */}
        {(counts.vencidos > 0 || counts.vencendo > 0) && (
          <div className="px-4 mt-3 space-y-2">
            {counts.vencidos > 0 && (
              <button
                onClick={() => setFiltroVenc(filtroVenc === 'vencido' ? 'todos' : 'vencido')}
                className={`
                  w-full flex items-center justify-between
                  bg-red-50 border border-red-200 rounded-2xl px-4 py-3
                  ${filtroVenc === 'vencido' ? 'ring-2 ring-red-400' : ''}
                `}
              >
                <span className="text-sm font-medium text-red-700">
                  🚨 {counts.vencidos} contrato{counts.vencidos > 1 ? 's' : ''} vencido{counts.vencidos > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-red-500">
                  {filtroVenc === 'vencido' ? 'Limpar' : 'Ver'}
                </span>
              </button>
            )}
            {counts.vencendo > 0 && (
              <button
                onClick={() => setFiltroVenc(filtroVenc === 'vencendo' ? 'todos' : 'vencendo')}
                className={`
                  w-full flex items-center justify-between
                  bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3
                  ${filtroVenc === 'vencendo' ? 'ring-2 ring-amber-400' : ''}
                `}
              >
                <span className="text-sm font-medium text-amber-700">
                  ⚠️ {counts.vencendo} contrato{counts.vencendo > 1 ? 's' : ''} vencendo em breve
                </span>
                <span className="text-xs text-amber-500">
                  {filtroVenc === 'vencendo' ? 'Limpar' : 'Ver'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* BOTÃO NOVO */}
        {isSindico && (
          <div className="px-4 mt-4">
            <button
              onClick={() => router.push('/contratos/novo')}
              className="w-full bg-[#1a2744] text-white rounded-3xl p-4 font-medium"
            >
              ➕ Novo contrato
            </button>
          </div>
        )}

        {/* LISTA */}
        <div className="px-4 mt-4 pb-24 space-y-3">
          {loadingData ? (
            <div className="bg-white rounded-3xl p-10 text-center">
              <p className="text-gray-400">Carregando contratos...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
              <div className="text-5xl mb-3">📄</div>
              <p className="font-semibold text-gray-700">Nenhum contrato encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Tente outro filtro ou cadastre um novo contrato.</p>
            </div>
          ) : (
            filtrados.map(c => {
              const cfg = STATUS_CONFIG[c.status]
              const badge = badgeVencimento(c)
              const dias = diasParaVencer(c.dataVencimento)

              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/contratos/${c.id}`)}
                  className={`
                    bg-white rounded-3xl border shadow-sm overflow-hidden cursor-pointer
                    ${badge?.bg === 'bg-red-100' ? 'border-red-200' :
                      badge?.bg === 'bg-amber-100' ? 'border-amber-200' :
                      cfg.border}
                  `}
                >
                  {/* barra topo colorida */}
                  <div className={`h-1 ${
                    badge?.bg === 'bg-red-100'   ? 'bg-red-500'   :
                    badge?.bg === 'bg-amber-100' ? 'bg-amber-400' :
                    c.status === 'ativo'         ? 'bg-green-500' :
                    c.status === 'em_renovacao'  ? 'bg-amber-400' :
                    'bg-gray-300'
                  }`} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{c.fornecedor}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{c.objeto}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {badge && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-xl p-2">
                        <p className="text-[10px] text-gray-400 uppercase">Valor/mês</p>
                        <p className="text-xs font-semibold text-gray-700 mt-0.5">
                          {formatCurrency(c.valorMensal)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2">
                        <p className="text-[10px] text-gray-400 uppercase">Início</p>
                        <p className="text-xs font-semibold text-gray-700 mt-0.5">
                          {formatDate(c.dataInicio)}
                        </p>
                      </div>
                      <div className={`rounded-xl p-2 ${
                        dias < 0              ? 'bg-red-50'    :
                        dias <= c.diasAvisoRenovacao ? 'bg-amber-50'  :
                        'bg-gray-50'
                      }`}>
                        <p className="text-[10px] text-gray-400 uppercase">Vencimento</p>
                        <p className={`text-xs font-semibold mt-0.5 ${
                          dias < 0              ? 'text-red-600'   :
                          dias <= c.diasAvisoRenovacao ? 'text-amber-700' :
                          'text-gray-700'
                        }`}>
                          {formatDate(c.dataVencimento)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">👤 {c.responsavelNome}</span>
                      <span className="text-xs font-medium text-[#1a2744]">Ver detalhes →</span>
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