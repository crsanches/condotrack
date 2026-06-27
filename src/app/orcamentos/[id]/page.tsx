'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import {
  getOrcamento,
  getCotacoes,
  deleteOrcamento,
  deleteCotacao,
  concluirOrcamento,
  addObservacaoOrcamento,
  updateOrcamento,
} from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'
import type { Orcamento, Cotacao, ResultadoOrcamento } from '@/types'

function formatCurrency(v: number | null) {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(ts: Timestamp | undefined | null) {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(ts: Timestamp | undefined | null) {
  if (!ts) return ''
  return ts.toDate().toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrcamentoDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([])
  const [fetching, setFetching] = useState(true)

  // Observação
  const [novaObs, setNovaObs] = useState('')
  const [savingObs, setSavingObs] = useState(false)

  // Modal concluir
  const [showConcluir, setShowConcluir] = useState(false)
  const [resultado, setResultado] = useState<ResultadoOrcamento>('contratado')
  const [cotacaoSelecionadaId, setCotacaoSelecionadaId] = useState('')
  const [savingConcluir, setSavingConcluir] = useState(false)

  // Reabrir
  const [savingReabrir, setSavingReabrir] = useState(false)

  // Delete
  const [showDelete, setShowDelete] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canManage = user?.role === 'sindico' || user?.role === 'subsindico'
  const canSeeSigilo = user?.acessoSigilo === true

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  async function load() {
    const [o, c] = await Promise.all([getOrcamento(id), getCotacoes(id)])
    if (!o || (o.registroSigiloso && !canSeeSigilo)) {
      router.replace('/orcamentos')
      return
    }
    setOrcamento(o)
    setCotacoes(c)
    setFetching(false)
  }

  useEffect(() => {
    if (user) load()
  }, [user, id])

  async function handleAddObs() {
    if (!novaObs.trim() || !orcamento) return
    setSavingObs(true)
    await addObservacaoOrcamento(id, {
      texto: novaObs.trim(),
      autorId: user!.uid,
      autorNome: user!.name || user!.email || 'Usuário',
    })
    setNovaObs('')
    await load()
    setSavingObs(false)
  }

  async function handleConcluir() {
    if (!orcamento) return
    setSavingConcluir(true)
    await concluirOrcamento(id, resultado, user!.uid, cotacaoSelecionadaId || undefined)
    setShowConcluir(false)
    await load()
    setSavingConcluir(false)
  }

  async function handleReabrir() {
    setSavingReabrir(true)
    await updateOrcamento(id, {
      status: 'aberto',
      resultado: null,
      concluidoEm: null,
      concluidoPor: null,
    })
    // Desmarcar cotação selecionada
    for (const c of cotacoes) {
      if (c.selecionada) {
        await fetch(`/api/cotacao-selecionar`, { method: 'POST' }) // placeholder — use deleteCotacao update direto
      }
    }
    await load()
    setSavingReabrir(false)
  }

  async function handleDeleteCotacao(cotacaoId: string) {
    setDeletingId(cotacaoId)
    await deleteCotacao(id, cotacaoId)
    await load()
    setDeletingId(null)
  }

  async function handleDeleteOrcamento() {
    await deleteOrcamento(id)
    router.replace('/orcamentos')
  }

  if (loading || !user || fetching) return null
  if (!orcamento) return null

  const isAberto = orcamento.status === 'aberto'
  const isContratado = orcamento.resultado === 'contratado'
  const obsOrdenadas = [...(orcamento.observacoes || [])].sort(
    (a, b) => b.criadoEm?.toMillis?.() - a.criadoEm?.toMillis?.()
  )

  return (
    <>
      <Header title="Orçamento" showBack backHref="/orcamentos" />

      <div className="min-h-screen bg-gray-50 pb-32">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className={`rounded-3xl p-5 text-white shadow-lg bg-gradient-to-r ${
            isAberto ? 'from-[#1a2744] to-[#2d4570]'
            : isContratado ? 'from-green-800 to-green-600'
            : 'from-gray-700 to-gray-500'
          }`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-white/70">Orçamento</span>
              {orcamento.registroSigiloso && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-amber-400/30 text-amber-200 rounded-full">
                  🔒 Sigiloso
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isAberto ? 'bg-blue-400/30 text-blue-100'
                : isContratado ? 'bg-green-400/30 text-green-100'
                : 'bg-red-400/30 text-red-100'
              }`}>
                {isAberto ? 'Em andamento' : isContratado ? 'Contratado' : 'Não contratado'}
              </span>
            </div>
            <h1 className="text-xl font-bold mt-3 leading-tight">{orcamento.titulo}</h1>
            <p className="text-sm text-white/80 mt-2">{orcamento.descricao}</p>
            <p className="text-xs text-white/50 mt-3">Criado em {formatDate(orcamento.criadoEm)}</p>
          </div>
        </div>

        {/* COTAÇÕES */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">
              💼 Cotações <span className="text-gray-400 font-normal">({cotacoes.length})</span>
            </h2>
            {canManage && isAberto && (
              <button
                onClick={() => router.push(`/orcamentos/${id}/nova-cotacao`)}
                className="text-sm font-semibold text-[#1a2744] bg-gray-100 rounded-xl px-3 py-1.5"
              >
                + Adicionar
              </button>
            )}
          </div>

          {cotacoes.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">🏢</p>
              <p className="text-sm">Nenhuma cotação adicionada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cotacoes.map((c, idx) => (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-4 ${
                    c.selecionada
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                        {c.selecionada && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            ✓ Selecionada
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 mt-1">{c.fornecedor}</p>
                      {c.cnpjCpf && <p className="text-xs text-gray-500">{c.cnpjCpf}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#1a2744]">{formatCurrency(c.valor)}</p>
                      {c.prazo && <p className="text-xs text-gray-500">{c.prazo}</p>}
                    </div>
                  </div>

                  {(c.tipoServico || c.contato || c.telefone || c.email) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      {c.tipoServico && <div><span className="text-gray-400">Serviço: </span>{c.tipoServico}</div>}
                      {c.contato && <div><span className="text-gray-400">Contato: </span>{c.contato}</div>}
                      {c.telefone && <div><span className="text-gray-400">Tel: </span>{c.telefone}</div>}
                      {c.email && <div className="col-span-2"><span className="text-gray-400">E-mail: </span>{c.email}</div>}
                      {c.endereco && <div className="col-span-2"><span className="text-gray-400">End: </span>{c.endereco}</div>}
                      {c.site && <div className="col-span-2"><span className="text-gray-400">Site: </span>{c.site}</div>}
                    </div>
                  )}

                  {c.condicoesGerais && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="text-gray-400">Condições: </span>{c.condicoesGerais}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-400">
                    Adicionado em {formatDate(c.criadoEm)}
                  </div>

                  {canManage && isAberto && (
                    <button
                      onClick={() => handleDeleteCotacao(c.id)}
                      disabled={deletingId === c.id}
                      className="mt-3 text-xs text-red-400 hover:text-red-600"
                    >
                      {deletingId === c.id ? 'Removendo...' : 'Remover cotação'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {cotacoes.length < 3 && isAberto && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
              ⚠️ Recomendado: mínimo de 3 cotações para fins de comprovação.
            </div>
          )}
        </div>

        {/* OBSERVAÇÕES */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📝 Histórico de observações</h2>

          {canManage && (
            <div className="mb-4">
              <textarea
                className="form-input min-h-[80px] resize-none text-sm"
                value={novaObs}
                onChange={e => setNovaObs(e.target.value)}
                placeholder="Registre uma observação, andamento, justificativa..."
              />
              <button
                onClick={handleAddObs}
                disabled={savingObs || !novaObs.trim()}
                className="mt-2 w-full py-2.5 rounded-2xl bg-[#1a2744] text-white text-sm font-semibold disabled:opacity-40"
              >
                {savingObs ? 'Salvando...' : 'Adicionar observação'}
              </button>
            </div>
          )}

          {obsOrdenadas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma observação registrada.</p>
          ) : (
            <div className="space-y-3">
              {obsOrdenadas.map(obs => (
                <div key={obs.id} className="border-l-2 border-[#1a2744]/20 pl-4 py-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{obs.texto}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-[#1a2744]">{obs.autorNome}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">{formatDateTime(obs.criadoEm)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONCLUSÃO */}
        {!isAberto && (
          <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3">
              {isContratado ? '✅ Contratado' : '❌ Não contratado'}
            </h2>
            <p className="text-sm text-gray-500">
              Concluído em {formatDate(orcamento.concluidoEm)}
            </p>
            {isContratado && cotacoes.find(c => c.selecionada) && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-3">
                <p className="text-sm font-semibold text-green-800">
                  Fornecedor selecionado: {cotacoes.find(c => c.selecionada)?.fornecedor}
                </p>
                <p className="text-sm text-green-700">
                  Valor: {formatCurrency(cotacoes.find(c => c.selecionada)?.valor ?? null)}
                </p>
              </div>
            )}
            {canManage && (
              <button
                onClick={handleReabrir}
                disabled={savingReabrir}
                className="mt-4 text-sm text-gray-500 underline"
              >
                {savingReabrir ? 'Reabrindo...' : 'Reabrir orçamento'}
              </button>
            )}
          </div>
        )}

        {/* AÇÕES */}
        {canManage && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
            <div className="max-w-md mx-auto space-y-2">
              {isAberto ? (
                <button
                  onClick={() => setShowConcluir(true)}
                  disabled={cotacoes.length === 0}
                  className="btn-primary disabled:opacity-40"
                >
                  🏁 Concluir orçamento
                </button>
              ) : null}
              <button
                onClick={() => setShowDelete(true)}
                className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold"
              >
                Excluir orçamento
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL CONCLUIR */}
      {showConcluir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">🏁 Concluir orçamento</h3>

            <div>
              <label className="field-label">Resultado</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {(['contratado', 'nao_contratado'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResultado(r)}
                    className={`h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all ${
                      resultado === r
                        ? 'bg-[#1a2744] border-[#1a2744] text-white'
                        : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    <span>{r === 'contratado' ? '✅' : '❌'}</span>
                    <span>{r === 'contratado' ? 'Contratado' : 'Não contratado'}</span>
                  </button>
                ))}
              </div>
            </div>

            {resultado === 'contratado' && cotacoes.length > 0 && (
              <div>
                <label className="field-label">Cotação selecionada (fornecedor contratado)</label>
                <select
                  className="form-input mt-1"
                  value={cotacaoSelecionadaId}
                  onChange={e => setCotacaoSelecionadaId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {cotacoes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fornecedor} — {formatCurrency(c.valor)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConcluir(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConcluir}
                disabled={savingConcluir}
                className="flex-1 py-3 rounded-2xl bg-[#1a2744] text-white text-sm font-semibold disabled:opacity-50"
              >
                {savingConcluir ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">⚠️ Excluir orçamento</h3>
            <p className="text-sm text-gray-600">
              Todas as cotações e observações serão removidas permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteOrcamento}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}