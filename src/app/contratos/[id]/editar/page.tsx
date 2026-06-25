'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { getContrato, updateContrato, getAllResponsaveis } from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'
import type { Contrato, Responsavel, StatusContrato } from '@/types'

function tsToInput(ts: unknown): string {
  if (!ts) return ''
  const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
  return d.toISOString().split('T')[0]
}

export default function EditarContratoPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [fornecedor, setFornecedor] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [objeto, setObjeto] = useState('')
  const [valorMensal, setValorMensal] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [diasAvisoRenovacao, setDiasAvisoRenovacao] = useState(30)
  const [status, setStatus] = useState<StatusContrato>('ativo')
  const [responsavelId, setResponsavelId] = useState('')
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
    if (!loading && user && user.role !== 'sindico' && user.role !== 'subsindico') {
      router.replace('/contratos')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!id) return
    Promise.all([getContrato(id), getAllResponsaveis()]).then(([c, resps]) => {
      setResponsaveis(resps)
      if (!c) return
      setContrato(c)
      setFornecedor(c.fornecedor)
      setCnpj(c.cnpj || '')
      setObjeto(c.objeto)
      setValorMensal(c.valorMensal ? String(c.valorMensal) : '')
      setDataInicio(tsToInput(c.dataInicio))
      setDataVencimento(tsToInput(c.dataVencimento))
      setDiasAvisoRenovacao(c.diasAvisoRenovacao)
      setStatus(c.status)
      setResponsavelId(c.responsavelId)
      setObservacoes(c.observacoes || '')
      setLoadingData(false)
    })
  }, [id])

  function formatCnpj(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  async function handleSave() {
    if (!fornecedor.trim()) { setError('Informe o fornecedor.'); return }
    if (!objeto.trim()) { setError('Informe o objeto do contrato.'); return }
    if (!dataInicio) { setError('Informe a data de início.'); return }
    if (!dataVencimento) { setError('Informe a data de vencimento.'); return }
    if (!responsavelId) { setError('Selecione o responsável interno.'); return }

    const responsavel = responsaveis.find(r => r.id === responsavelId)
    if (!responsavel) return

    setSaving(true)
    setError('')

    try {
      await updateContrato(id, {
        fornecedor: fornecedor.trim(),
        cnpj: cnpj.trim() || undefined,
        objeto: objeto.trim(),
        valorMensal: valorMensal ? parseFloat(valorMensal.replace(',', '.')) : undefined,
        dataInicio: Timestamp.fromDate(new Date(dataInicio + 'T12:00:00')),
        dataVencimento: Timestamp.fromDate(new Date(dataVencimento + 'T12:00:00')),
        diasAvisoRenovacao,
        status,
        responsavelId,
        responsavelNome: responsavel.nome,
        observacoes: observacoes.trim() || undefined,
      })
      router.replace(`/contratos/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  if (loadingData) return (
    <>
      <Header title="Editar contrato" showBack backHref={`/contratos/${id}`} />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    </>
  )

  if (!contrato) return null

  return (
    <>
      <Header title="Editar contrato" showBack backHref={`/contratos/${id}`} />

      <div className="min-h-screen bg-gray-50 pb-36">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Editar</p>
            <h1 className="text-xl font-bold mt-2 leading-snug">{contrato.fornecedor}</h1>
            <p className="text-sm text-white/75 mt-1">{contrato.objeto}</p>
          </div>
        </div>

        {/* FORNECEDOR */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">🏢 Fornecedor</h2>
          <div className="space-y-4">

            <div>
              <label className="field-label">Nome do fornecedor *</label>
              <input
                type="text"
                className="form-input"
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">CNPJ</label>
              <input
                type="text"
                className="form-input"
                value={cnpj}
                onChange={e => setCnpj(formatCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="field-label">Objeto do contrato *</label>
              <textarea
                className="form-input min-h-[80px] resize-none"
                value={objeto}
                onChange={e => setObjeto(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Valor mensal (R$)</label>
              <input
                type="text"
                className="form-input"
                value={valorMensal}
                onChange={e => setValorMensal(e.target.value.replace(/[^0-9,\.]/g, ''))}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>

          </div>
        </div>

        {/* VIGÊNCIA */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📅 Vigência</h2>
          <div className="space-y-4">

            <div>
              <label className="field-label">Data de início *</label>
              <input
                type="date"
                className="form-input"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Data de vencimento *</label>
              <input
                type="date"
                className="form-input"
                value={dataVencimento}
                onChange={e => setDataVencimento(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">
                Avisar renovação com antecedência de {diasAvisoRenovacao} dias
              </label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min={7}
                  max={120}
                  step={1}
                  value={diasAvisoRenovacao}
                  onChange={e => setDiasAvisoRenovacao(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-[#1a2744] w-16 text-center">
                  {diasAvisoRenovacao}d
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[15, 30, 45, 60, 90, 120].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDiasAvisoRenovacao(n)}
                    className={`
                      px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                      ${diasAvisoRenovacao === n
                        ? 'bg-[#1a2744] border-[#1a2744] text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600'}
                    `}
                  >
                    {n}d
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* STATUS E RESPONSÁVEL */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📋 Gestão</h2>
          <div className="space-y-4">

            <div>
              <label className="field-label">Status</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(
                  [
                    ['ativo',        '🟢', 'Ativo'    ],
                    ['em_renovacao', '🟡', 'Renovação'],
                    ['encerrado',    '⚫', 'Encerrado'],
                  ] as const
                ).map(([val, icon, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatus(val)}
                    className={`
                      h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1
                      text-xs font-medium transition-all
                      ${status === val
                        ? 'bg-[#1a2744] border-[#1a2744] text-white'
                        : 'bg-white border-gray-200 text-gray-500'}
                    `}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Responsável interno *</label>
              <select
                className="form-input"
                value={responsavelId}
                onChange={e => setResponsavelId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {responsaveis.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Observações</label>
              <textarea
                className="form-input min-h-[80px] resize-none"
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Informações adicionais, cláusulas importantes..."
              />
            </div>

          </div>
        </div>

        {/* ERRO */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
          <div className="max-w-md mx-auto space-y-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Salvando...' : '💾 Salvar alterações'}
            </button>
            <button onClick={() => router.back()} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>

      </div>
    </>
  )
}