'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { getTarefa, updateTarefa, getAllResponsaveis } from '@/lib/firestore'
import type { TarefaPeriodica, Periodicidade, Responsavel } from '@/types'

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

export default function EditarTarefaPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [tarefa, setTarefa] = useState<TarefaPeriodica | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipoPeriod, setTipoPeriod] = useState<'semanal' | 'intervalo' | 'mensal'>('semanal')
  const [diasSemana, setDiasSemana] = useState<number[]>([])
  const [diasIntervalo, setDiasIntervalo] = useState(7)
  const [diaDoMes, setDiaDoMes] = useState(1)
  const [responsavelId, setResponsavelId] = useState('')
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
    if (!loading && user && user.role !== 'sindico' && user.role !== 'subsindico') {
      router.replace('/tarefas')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!id) return
    Promise.all([getTarefa(id), getAllResponsaveis()]).then(([t, resps]) => {
      setResponsaveis(resps)
      if (!t) return
      setTarefa(t)
      setTitulo(t.titulo)
      setDescricao(t.descricao || '')
      setResponsavelId(t.responsavelPadraoId)
      setTipoPeriod(t.periodicidade.tipo)
      if (t.periodicidade.tipo === 'semanal') {
        setDiasSemana(t.periodicidade.diasSemana)
      } else if (t.periodicidade.tipo === 'intervalo') {
        setDiasIntervalo(t.periodicidade.diasIntervalo)
      } else if (t.periodicidade.tipo === 'mensal') {
        setDiaDoMes(t.periodicidade.diaDoMes)
      }
      setLoadingData(false)
    })
  }, [id])

  function toggleDiaSemana(dia: number) {
    setDiasSemana(prev =>
      prev.includes(dia)
        ? prev.filter(d => d !== dia)
        : [...prev, dia].sort((a, b) => a - b)
    )
  }

  async function handleSave() {
    if (!titulo.trim()) { setError('Informe o título.'); return }
    if (!responsavelId) { setError('Selecione o responsável padrão.'); return }
    if (tipoPeriod === 'semanal' && diasSemana.length === 0) {
      setError('Selecione ao menos um dia da semana.')
      return
    }

    const responsavel = responsaveis.find(r => r.id === responsavelId)
    if (!responsavel) return

    let periodicidade: Periodicidade
    if (tipoPeriod === 'semanal') {
      periodicidade = { tipo: 'semanal', diasSemana }
    } else if (tipoPeriod === 'intervalo') {
      periodicidade = { tipo: 'intervalo', diasIntervalo }
    } else {
      periodicidade = { tipo: 'mensal', diaDoMes }
    }

    setSaving(true)
    setError('')

    try {
      await updateTarefa(id, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        periodicidade,
        responsavelPadraoId: responsavelId,
        responsavelPadraoNome: responsavel.nome,
      })
      router.replace(`/tarefas/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null
  if (loadingData) return (
    <>
      <Header title="Editar tarefa" showBack backHref={`/tarefas/${id}`} />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    </>
  )
  if (!tarefa) return null

  return (
    <>
      <Header title="Editar tarefa" showBack backHref={`/tarefas/${id}`} />

      <div className="min-h-screen bg-gray-50 pb-36">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Editar</p>
            <h1 className="text-xl font-bold mt-2 leading-snug">{tarefa.titulo}</h1>
          </div>
        </div>

        {/* IDENTIFICAÇÃO */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📝 Identificação</h2>

          <div className="space-y-4">
            <div>
              <label className="field-label">Título *</label>
              <input
                type="text"
                className="form-input"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Descrição</label>
              <textarea
                className="form-input min-h-[80px] resize-none"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Detalhes ou instruções para execução..."
              />
            </div>

            <div>
              <label className="field-label">Responsável padrão *</label>
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
          </div>
        </div>

        {/* PERIODICIDADE */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">🔁 Periodicidade</h2>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {(
              [
                ['semanal',   '📅', 'Semanal'  ],
                ['intervalo', '🔢', 'Intervalo'],
                ['mensal',    '📆', 'Mensal'   ],
              ] as const
            ).map(([val, icon, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTipoPeriod(val)}
                className={`
                  h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1
                  text-sm font-medium transition-all
                  ${tipoPeriod === val
                    ? 'bg-[#1a2744] border-[#1a2744] text-white'
                    : 'bg-white border-gray-200 text-gray-500'}
                `}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* semanal */}
          {tipoPeriod === 'semanal' && (
            <div>
              <label className="field-label mb-2">Dias da semana *</label>
              <div className="flex gap-2 flex-wrap">
                {DIAS_SEMANA.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDiaSemana(d.value)}
                    className={`
                      w-11 h-11 rounded-xl text-sm font-medium border-2 transition-all
                      ${diasSemana.includes(d.value)
                        ? 'bg-[#1a2744] border-[#1a2744] text-white'
                        : 'bg-white border-gray-200 text-gray-500'}
                    `}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {diasSemana.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {diasSemana.length === 1 ? '1 dia selecionado' : `${diasSemana.length} dias selecionados`}
                </p>
              )}
            </div>
          )}

          {/* intervalo */}
          {tipoPeriod === 'intervalo' && (
            <div>
              <label className="field-label">A cada quantos dias? *</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min={1}
                  max={90}
                  step={1}
                  value={diasIntervalo}
                  onChange={e => setDiasIntervalo(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-[#1a2744] w-16 text-center">
                  {diasIntervalo}d
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                <span>1 dia</span>
                <span>90 dias</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[7, 10, 14, 15, 21, 30, 60, 90].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDiasIntervalo(n)}
                    className={`
                      px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                      ${diasIntervalo === n
                        ? 'bg-[#1a2744] border-[#1a2744] text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600'}
                    `}
                  >
                    {n}d
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* mensal */}
          {tipoPeriod === 'mensal' && (
            <div>
              <label className="field-label">Dia do mês *</label>
              <div className="grid grid-cols-7 gap-1.5 mt-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiaDoMes(d)}
                    className={`
                      h-9 rounded-xl text-xs font-medium border transition-all
                      ${diaDoMes === d
                        ? 'bg-[#1a2744] border-[#1a2744] text-white'
                        : 'bg-white border-gray-200 text-gray-500'}
                    `}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Todo dia {diaDoMes} do mês
              </p>
            </div>
          )}
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
            <button
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>

      </div>
    </>
  )
}