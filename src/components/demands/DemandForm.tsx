'use client'


import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  createDemand,
  updateDemand,
  addUpdate,
  getAllResponsaveis,
  createResponsavel,
} from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'
import type {
  Demand,
  DemandType,
  Priority,
  DemandStatus,
  Responsavel,
} from '@/types'

interface DemandFormProps {
  existing?: Demand | null
}

const toInputDate = (ts: unknown): string => {
  if (!ts) return ''
  try {
    const d = (ts as { toDate?: () => Date }).toDate?.() ?? new Date(ts as string)
    return d.toISOString().split('T')[0]
  } catch { return '' }
}

const toTs = (val: string): Timestamp | null =>
  val ? Timestamp.fromDate(new Date(val + 'T12:00:00')) : null

export default function DemandForm({ existing }: DemandFormProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [titulo, setTitulo] = useState(existing?.titulo || '')
  const [tipo, setTipo] = useState<DemandType | ''>(existing?.tipo || '')
  const [prioridade, setPrioridade] = useState<Priority | ''>(existing?.prioridade || '')
  const [status, setStatus] = useState<DemandStatus>(existing?.status || 'aberta')
  const [dataPrevisao, setDataPrevisao] = useState(toInputDate(existing?.dataPrevisao))
  const [dataConclusao, setDataConclusao] = useState(toInputDate(existing?.dataConclusao))
  const [newUpdate, setNewUpdate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'concluida' && !dataConclusao) {
      setDataConclusao(new Date().toISOString().split('T')[0])
    }
  }, [status])


  const [responsaveis, setResponsaveis] =
  useState<Responsavel[]>([])

  const [responsavelId, setResponsavelId] =
  useState('')

  const [showNovoResponsavel, setShowNovoResponsavel] =
  useState(false)

  const [novoResponsavel, setNovoResponsavel] =
  useState('')


const [registroSigiloso, setRegistroSigiloso] = useState(existing?.registroSigiloso ?? false)


  useEffect(() => {
    if (!user?.condominioId) return
    getAllResponsaveis(user.condominioId).then(data => {
      setResponsaveis(data)
    })
  }, [user?.condominioId])

  useEffect(() => {
    if (existing?.responsavelId) {
      setResponsavelId(existing.responsavelId)
    }
  }, [existing])

  const handleNovoResponsavel = async () => {

    if (!novoResponsavel.trim() || !user?.condominioId) return
  
    try {
  
      const novoId = await createResponsavel(user.condominioId, {
        nome: novoResponsavel.trim(),
        role: 'operacional',
      })
  
      const novoItem: Responsavel = {
        id: novoId,
        nome: novoResponsavel.trim(),
        role: 'operacional',
        active: true,
      }
  
      setResponsaveis(prev => [
        ...prev,
        novoItem,
      ])
  
      setResponsavelId(novoId)
  
      setNovoResponsavel('')
  
      setShowNovoResponsavel(false)
  
    } catch (error) {
      console.error(
        'Erro ao criar responsável:',
        error
      )
    }
  }

  const handleSave = async () => {
    if (!titulo.trim()) { setError('Informe o título da demanda.'); return }
    if (!tipo) { setError('Selecione o tipo.'); return }
    if (!prioridade) { setError('Selecione a prioridade.'); return }
    if (!responsavelId) {
      setError('Selecione o responsável.')
      return
    }
    if (!user) return
    if (!user.condominioId) { setError('Condomínio não identificado.'); return }

    setSaving(true)
    setError('')
    const responsavelSelecionado =
    responsaveis.find(
      r => r.id === responsavelId
    )
    try {
      if (existing) {
        await updateDemand(existing.id, {
          titulo: titulo.trim(),
          tipo,
          prioridade,
          responsavelId,
          responsavelNome:
          responsavelSelecionado?.nome || '',
          status,
          dataPrevisao: toTs(dataPrevisao),
          dataConclusao: toTs(dataConclusao),
          registroSigiloso,
        })
        if (newUpdate.trim()) {
          await addUpdate(existing.id, { texto: newUpdate.trim(), autor: user.uid }, existing.atualizacoes)
        }
      } else {
        await createDemand(user.condominioId, {
          titulo: titulo.trim(),
          tipo: tipo as DemandType,
          prioridade: prioridade as Priority,
          responsavelId,
          responsavelNome:
          responsavelSelecionado?.nome || '',
          status,
          dataPrevisao: toTs(dataPrevisao),
          dataConclusao: toTs(dataConclusao),
          criadoPor: user.uid,
          primeiraAtualizacao: newUpdate.trim() || undefined,
          registroSigiloso,
        })
      }
      router.back()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const prioOpts: { value: Priority; label: string; color: string }[] = [
    { value: 'alta', label: 'Alta', color: 'border-red-400 text-red-600 bg-red-50' },
    { value: 'media', label: 'Média', color: 'border-amber-400 text-amber-600 bg-amber-50' },
    { value: 'baixa', label: 'Baixa', color: 'border-green-500 text-green-700 bg-green-50' },
  ]

  const statusOpts: { value: DemandStatus; label: string; emoji: string }[] = [
    { value: 'aberta', label: 'Aberta', emoji: '🔵' },
    { value: 'em_andamento', label: 'Em andamento', emoji: '🟡' },
    { value: 'concluida', label: 'Concluída', emoji: '🟢' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-36">
  
      {/* HEADER */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-[#1a2744] to-[#2c4270] rounded-3xl p-5 text-white shadow-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            {existing ? 'Editar Demanda' : 'Nova Demanda'}
          </p>
  
          <h1 className="text-2xl font-bold mt-2">
            {titulo || 'Nova solicitação'}
          </h1>
  
          <p className="text-sm text-white/80 mt-2">
            Gerencie atividades, acompanhe responsáveis e registre atualizações.
          </p>
        </div>
      </div>
  
      {/* IDENTIFICAÇÃO */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📝 Identificação
        </h2>
  
        <div className="space-y-4">
  
          <div>
            <label className="field-label">
              Título da demanda <span className="text-red-500">*</span>
            </label>
  
            <input
              type="text"
              className="form-input text-base"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Infiltração na cobertura"
            />
          </div>
  
          <div>
            <label className="field-label">
              Tipo <span className="text-red-500">*</span>
            </label>
  
            <select
              className="form-input"
              value={tipo}
              onChange={e => setTipo(e.target.value as DemandType)}
            >
              <option value="">Selecione o tipo...</option>
              <option value="manutencao">🔧 Manutenção</option>
              <option value="administrativo">📋 Administrativo</option>
              <option value="financeiro">💰 Financeiro</option>
              <option value="seguranca">🔒 Segurança</option>
              <option value="limpeza">🧹 Limpeza</option>
              <option value="obra">🏗️ Obra</option>
              <option value="outro">📌 Outro</option>
            </select>
          </div>

          {/* SIGILO */}
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div>
            <p className="text-sm font-semibold text-amber-800">🔒 Registro sigiloso</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Visível apenas para membros com acesso a dados sigilosos
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRegistroSigiloso(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
              registroSigiloso ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
              registroSigiloso ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
  
          <div>

            
  <label className="field-label">
    Responsável <span className="text-red-500">*</span>
  </label>

  <select
    className="form-input"
    value={responsavelId}
    onChange={(e) => setResponsavelId(e.target.value)}
  >
    <option value="">
      Selecione um responsável
    </option>

    {responsaveis.map((r) => (
      <option
        key={r.id}
        value={r.id}
      >
        {r.nome}
      </option>
    ))}
  </select>

  <div className="mt-2">
    <button
      type="button"
      onClick={() =>
        setShowNovoResponsavel(true)
      }
      className="
        text-sm
        text-[#1a2744]
        font-medium
        hover:underline
      "
    >
      ➕ Cadastrar novo responsável
    </button>
  </div>

</div>
        </div>
      </div>
  
      {/* PRIORIDADE */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🚨 Prioridade
        </h2>
  
        <div className="grid grid-cols-3 gap-3">
  
          <button
            type="button"
            onClick={() => setPrioridade('alta')}
            className={`h-16 rounded-2xl border-2 font-semibold transition-all ${
              prioridade === 'alta'
                ? 'bg-red-50 border-red-400 text-red-600 shadow-md'
                : 'border-gray-200 text-gray-500 bg-white'
            }`}
          >
            🔥 Alta
          </button>
  
          <button
            type="button"
            onClick={() => setPrioridade('media')}
            className={`h-16 rounded-2xl border-2 font-semibold transition-all ${
              prioridade === 'media'
                ? 'bg-amber-50 border-amber-400 text-amber-600 shadow-md'
                : 'border-gray-200 text-gray-500 bg-white'
            }`}
          >
            ⚡ Média
          </button>
  
          <button
            type="button"
            onClick={() => setPrioridade('baixa')}
            className={`h-16 rounded-2xl border-2 font-semibold transition-all ${
              prioridade === 'baixa'
                ? 'bg-green-50 border-green-500 text-green-700 shadow-md'
                : 'border-gray-200 text-gray-500 bg-white'
            }`}
          >
            🌱 Baixa
          </button>
  
        </div>
      </div>
  
      {/* STATUS */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📊 Status
        </h2>
  
        <div className="grid grid-cols-3 gap-3">
          {statusOpts.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`h-20 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                status === opt.value
                  ? 'bg-[#1a2744] text-white border-[#1a2744] shadow-md'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-xs font-medium">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
  
        <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 p-3">
          <div className="text-xs text-blue-500 uppercase font-semibold">
            Resumo atual
          </div>
  
          <div className="mt-1 text-sm text-gray-700">
            Status: <strong>{status.replace('_', ' ')}</strong>
          </div>
  
          <div className="text-sm text-gray-700">
            Prioridade: <strong>{prioridade || 'não definida'}</strong>
          </div>
        </div>
      </div>
  
      {/* DATAS */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📅 Datas
        </h2>
  
        <div className="space-y-4">
  
          <div>
            <label className="field-label">
              Previsão de conclusão
            </label>
  
            <input
              type="date"
              className="form-input"
              value={dataPrevisao}
              onChange={e => setDataPrevisao(e.target.value)}
            />
          </div>
  
          {status === 'concluida' && (
            <div>
              <label className="field-label">
                Data de conclusão real
              </label>
  
              <input
                type="date"
                className="form-input"
                value={dataConclusao}
                onChange={e => setDataConclusao(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
  
      {/* ATUALIZAÇÃO */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          💬 {existing ? 'Nova atualização' : 'Descrição inicial'}
        </h2>
  
        <textarea
          className="form-input min-h-[140px] resize-none"
          value={newUpdate}
          onChange={e => setNewUpdate(e.target.value)}
          placeholder={
            existing
              ? 'Descreva o andamento da demanda...'
              : 'Detalhe a solicitação...'
          }
        />
  
        <div className="text-right text-xs text-gray-400 mt-2">
          {newUpdate.length} caracteres
        </div>
      </div>
  
      {/* ERRO */}
      {error && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* MODAL NOVO RESPONSÁVEL */}
{showNovoResponsavel && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-3xl p-6 w-[90%] max-w-md shadow-xl">

      <h3 className="text-lg font-semibold mb-4">
        Novo responsável
      </h3>

      <input
        type="text"
        className="form-input"
        value={novoResponsavel}
        onChange={(e) =>
          setNovoResponsavel(e.target.value)
        }
        placeholder="Digite o nome"
      />

      <div className="flex gap-2 mt-4">

        <button
          type="button"
          onClick={() => {
            setShowNovoResponsavel(false)
            setNovoResponsavel('')
          }}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleNovoResponsavel}
          className="btn-primary flex-1"
        >
          Salvar
        </button>

      </div>

    </div>

  </div>
)}
  
      {/* FOOTER FIXO */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
        <div className="max-w-md mx-auto space-y-2">
  
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? 'Salvando...'
              : existing
                ? '💾 Salvar alterações'
                : '✅ Registrar demanda'}
          </button>
  
          <button
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </button>
  
        </div>
      </div>
  
    </div>
  )
}