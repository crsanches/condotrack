'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { getContrato, updateContrato } from '@/lib/firestore'
import type { Contrato, StatusContrato } from '@/types'

const STATUS_CONFIG: Record<StatusContrato, { label: string; bg: string; text: string }> = {
  ativo:        { label: 'Ativo',        bg: 'bg-green-50',  text: 'text-green-700' },
  em_renovacao: { label: 'Em renovação', bg: 'bg-amber-50',  text: 'text-amber-700' },
  encerrado:    { label: 'Encerrado',    bg: 'bg-gray-50',   text: 'text-gray-500'  },
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

export default function ContratoDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [registroSigiloso, setRegistroSigiloso] = useState(false)  // ← novo

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
      const c = await getContrato(id)
      setContrato(c)
      setRegistroSigiloso(c?.registroSigiloso ?? false)  // ← novo
    } finally {
      setLoadingData(false)
    }
  }

  async function handleStatusChange(novoStatus: StatusContrato) {
    if (!contrato) return
    setUpdatingStatus(true)
    try {
      await updateContrato(id, { status: novoStatus })
      setContrato(prev => prev ? { ...prev, status: novoStatus } : prev)
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleToggleSigilo() {
    if (!contrato) return
    const novo = !registroSigiloso
    setRegistroSigiloso(novo)
    await updateContrato(id, { registroSigiloso: novo })
    setContrato(prev => prev ? { ...prev, registroSigiloso: novo } : prev)
  }

  if (loading || !user) return null

  if (loadingData) return (
    <>
      <Header title="Contrato" showBack backHref="/contratos" />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    </>
  )

  if (!contrato) return (
    <>
      <Header title="Contrato" showBack backHref="/contratos" />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Contrato não encontrado.</p>
      </div>
    </>
  )

  const isSindico = user.role === 'sindico' || user.role === 'subsindico'
  const cfg = STATUS_CONFIG[contrato.status]
  const dias = diasParaVencer(contrato.dataVencimento)
  const vencido = dias < 0
  const vencendoEmBreve = !vencido && dias <= contrato.diasAvisoRenovacao

  return (
    <>
      <Header title="Contrato" showBack backHref="/contratos" />

      <div className="min-h-screen bg-gray-50 pb-32">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className={`rounded-3xl p-5 text-white shadow-lg ${
            vencido          ? 'bg-gradient-to-r from-red-600 to-red-700'     :
            vencendoEmBreve  ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
            'bg-gradient-to-r from-[#1a2744] to-[#2d4570]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-white/70">Contrato</p>
                <h1 className="text-xl font-bold mt-2 leading-snug">{contrato.fornecedor}</h1>
                <p className="text-sm text-white/75 mt-1">{contrato.objeto}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
                {registroSigiloso && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
                    🔒 Sigiloso
                  </span>
                )}
              </div>
            </div>

            {(vencido || vencendoEmBreve) && (
              <div className="mt-3 bg-white/20 rounded-2xl px-4 py-2 text-sm font-medium">
                {vencido
                  ? `🚨 Vencido há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? 's' : ''}`
                  : `⚠️ Vence em ${dias} dia${dias > 1 ? 's' : ''}`}
              </div>
            )}
          </div>
        </div>

        {/* DADOS PRINCIPAIS */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            ['Fornecedor',    contrato.fornecedor],
            ['CNPJ',          contrato.cnpj || '—'],
            ['Objeto',        contrato.objeto],
            ['Valor mensal',  formatCurrency(contrato.valorMensal)],
            ['Responsável',   contrato.responsavelNome],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-medium text-gray-700 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>

        {/* VIGÊNCIA */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs text-gray-400 mb-0.5">Início</p>
            <p className="text-sm font-medium text-gray-800">{formatDate(contrato.dataInicio)}</p>
          </div>
          <div className={`px-4 py-3 border-b border-gray-50 ${vencido ? 'bg-red-50' : vencendoEmBreve ? 'bg-amber-50' : ''}`}>
            <p className="text-xs text-gray-400 mb-0.5">Vencimento</p>
            <p className={`text-sm font-medium ${vencido ? 'text-red-600' : vencendoEmBreve ? 'text-amber-700' : 'text-gray-800'}`}>
              {formatDate(contrato.dataVencimento)}
              {vencido && <span className="ml-2 text-xs">({Math.abs(dias)} dias atraso)</span>}
              {vencendoEmBreve && <span className="ml-2 text-xs">(em {dias} dias)</span>}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Aviso de renovação</p>
            <p className="text-sm font-medium text-gray-800">{contrato.diasAvisoRenovacao} dias antes do vencimento</p>
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        {contrato.observacoes && (
          <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-2">Observações</p>
            <p className="text-sm text-gray-700">{contrato.observacoes}</p>
          </div>
        )}

        {/* SIGILO — só síndico pode alterar */}
        {isSindico && (
          <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-amber-800">🔒 Registro sigiloso</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Visível apenas para membros com acesso a dados sigilosos
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleSigilo}
                className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  registroSigiloso ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  registroSigiloso ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* ALTERAR STATUS */}
        {isSindico && (
          <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Alterar status</h2>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['ativo',        '🟢', 'Ativo'     ],
                  ['em_renovacao', '🟡', 'Renovação' ],
                  ['encerrado',    '⚫', 'Encerrado' ],
                ] as const
              ).map(([val, icon, label]) => (
                <button
                  key={val}
                  onClick={() => handleStatusChange(val)}
                  disabled={updatingStatus || contrato.status === val}
                  className={`
                    h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1
                    text-xs font-medium transition-all
                    ${contrato.status === val
                      ? 'bg-[#1a2744] border-[#1a2744] text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}
                  `}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AÇÕES */}
        {isSindico && (
          <div className="px-4 mt-4">
            <button
              onClick={() => router.push(`/contratos/${id}/editar`)}
              className="w-full bg-gray-100 text-gray-700 rounded-2xl py-3 text-sm font-medium"
            >
              ✏️ Editar contrato
            </button>
          </div>
        )}

        {/* RODAPÉ INFO */}
        <div className="mx-4 mt-4">
          <p className="text-xs text-gray-300 text-center">
            Cadastrado em {formatDate(contrato.criadoEm)}
          </p>
        </div>

      </div>
    </>
  )
}