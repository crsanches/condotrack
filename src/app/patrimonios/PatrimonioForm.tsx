'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, X, FileText, Search } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import {
  getPatrimonioOpcoes,
  addCategoria,
  addSetor,
  getContratosAtivos,
  ContratoResumo,
} from './service'
import {
  PatrimonioFormData,
  PatrimonioOpcoes,
  ESTADOS_CONSERVACAO,
} from '@/types'

interface Props {
  initialData?: Partial<PatrimonioFormData>
  onSubmit: (data: PatrimonioFormData) => Promise<void>
  submitLabel: string
}

export default function PatrimonioForm({ initialData, onSubmit, submitLabel }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const condominioId = user?.condominioId ?? null

  const [opcoes, setOpcoes] = useState<PatrimonioOpcoes | null>(null)
  const [contratos, setContratos] = useState<ContratoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [buscaContrato, setBuscaContrato] = useState('')

  const [novaCategoria, setNovaCategoria] = useState('')
  const [novoSetor, setNovoSetor] = useState('')
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [showNovoSetor, setShowNovoSetor] = useState(false)

  const [form, setForm] = useState<PatrimonioFormData>({
    nome: '',
    numeroSerie: '',
    categoria: '',
    modelo: '',
    setor: '',
    dataCompra: undefined,
    valorCompra: undefined,
    valorAtual: undefined,
    vidaUtilAnos: undefined,
    estadoConservacao: 'Bom',
    possuiContrato: false,
    contratoIds: [],
    observacoes: '',
    ...initialData,
  })

  useEffect(() => {
    if (!condominioId) return
    getPatrimonioOpcoes(condominioId).then(setOpcoes)
    getContratosAtivos(condominioId).then(setContratos)
  }, [condominioId])

  const set = (field: keyof PatrimonioFormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleDataCompra = (value: string) => {
    if (!value) { set('dataCompra', undefined); return }
    set('dataCompra', Timestamp.fromDate(new Date(value + 'T12:00:00')))
  }

  const dataCompraStr = form.dataCompra
    ? form.dataCompra.toDate().toISOString().substring(0, 10)
    : ''

  const toggleContrato = (id: string) => {
    const atual = form.contratoIds ?? []
    if (atual.includes(id)) {
      set('contratoIds', atual.filter(c => c !== id))
    } else {
      set('contratoIds', [...atual, id])
    }
  }

  const contratosFiltrados = contratos.filter(c =>
    !buscaContrato ||
    c.titulo.toLowerCase().includes(buscaContrato.toLowerCase()) ||
    (c.fornecedor ?? '').toLowerCase().includes(buscaContrato.toLowerCase())
  )

  const handleNovaCategoria = async () => {
    if (!novaCategoria.trim() || !opcoes || !condominioId) return
    const updated = await addCategoria(condominioId, novaCategoria.trim(), opcoes)
    setOpcoes(updated)
    set('categoria', novaCategoria.trim())
    setNovaCategoria('')
    setShowNovaCategoria(false)
  }

  const handleNovoSetor = async () => {
    if (!novoSetor.trim() || !opcoes || !condominioId) return
    const updated = await addSetor(condominioId, novoSetor.trim(), opcoes)
    setOpcoes(updated)
    set('setor', novoSetor.trim())
    setNovoSetor('')
    setShowNovoSetor(false)
  }

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.categoria || !form.setor || !form.estadoConservacao) {
      alert('Preencha os campos obrigatórios: Nome, Categoria, Setor e Estado de Conservação.')
      return
    }
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        contratoIds: form.possuiContrato ? (form.contratoIds ?? []) : [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (!opcoes) return <div className="text-center py-16 text-gray-400">Carregando…</div>

  return (
    <div className="space-y-6">

      {/* ── Identificação ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Identificação</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do bem <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Bomba de Água Principal"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria <span className="text-red-500">*</span>
            </label>
            {showNovaCategoria ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={novaCategoria}
                  onChange={e => setNovaCategoria(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNovaCategoria()}
                  placeholder="Nova categoria…"
                  className="flex-1 border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleNovaCategoria} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salvar</button>
                <button onClick={() => setShowNovaCategoria(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={form.categoria}
                    onChange={e => set('categoria', e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  >
                    <option value="">Selecione…</option>
                    {opcoes.categorias.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => setShowNovaCategoria(true)}
                  title="Adicionar categoria"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo / Fabricante</label>
            <input
              type="text"
              value={form.modelo ?? ''}
              onChange={e => set('modelo', e.target.value)}
              placeholder="Ex: Schneider ME-10"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de série / Tombamento</label>
            <input
              type="text"
              value={form.numeroSerie ?? ''}
              onChange={e => set('numeroSerie', e.target.value)}
              placeholder="Opcional"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setor <span className="text-red-500">*</span>
            </label>
            {showNovoSetor ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={novoSetor}
                  onChange={e => setNovoSetor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNovoSetor()}
                  placeholder="Novo setor…"
                  className="flex-1 border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleNovoSetor} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salvar</button>
                <button onClick={() => setShowNovoSetor(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={form.setor}
                    onChange={e => set('setor', e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  >
                    <option value="">Selecione…</option>
                    {opcoes.setores.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => setShowNovoSetor(true)}
                  title="Adicionar setor"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Dados financeiros ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dados financeiros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de compra</label>
            <input
              type="date"
              value={dataCompraStr}
              onChange={e => handleDataCompra(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor de compra (R$)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.valorCompra ?? ''}
              onChange={e => set('valorCompra', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0,00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor atual (R$)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.valorAtual ?? ''}
              onChange={e => set('valorAtual', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0,00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vida útil (anos)</label>
            <input
              type="number"
              min={1}
              value={form.vidaUtilAnos ?? ''}
              onChange={e => set('vidaUtilAnos', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Ex: 10"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ── Estado de conservação ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Estado de conservação <span className="text-red-500">*</span>
        </h2>
        <div className="flex gap-3 flex-wrap">
          {ESTADOS_CONSERVACAO.map(estado => {
            const ativo = form.estadoConservacao === estado
            const cores: Record<string, string> = {
              Ótimo: ativo ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-400',
              Bom: ativo ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400',
              Regular: ativo ? 'bg-yellow-500 text-white border-yellow-500' : 'border-gray-200 text-gray-600 hover:border-yellow-400',
              Ruim: ativo ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-600 hover:border-red-400',
            }
            return (
              <button
                key={estado}
                type="button"
                onClick={() => set('estadoConservacao', estado)}
                className={`px-5 py-2 rounded-full border-2 text-sm font-medium transition-colors ${cores[estado]}`}
              >
                {estado}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Contrato de manutenção ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contrato de manutenção</h2>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-gray-600">Possui contrato?</span>
            <button
              type="button"
              onClick={() => set('possuiContrato', !form.possuiContrato)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.possuiContrato ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.possuiContrato ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </label>
        </div>

        {form.possuiContrato && (
          <div className="space-y-3">
            {contratos.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                Nenhum contrato cadastrado. Cadastre contratos no módulo <strong>Contratos</strong> e volte para vincular.
              </p>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar contrato…"
                    value={buscaContrato}
                    onChange={e => setBuscaContrato(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contratosFiltrados.map(c => {
                    const selecionado = (form.contratoIds ?? []).includes(c.id)
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selecionado
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => toggleContrato(c.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <FileText className={`w-4 h-4 flex-shrink-0 ${selecionado ? 'text-blue-500' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{c.titulo}</p>
                          {c.fornecedor && <p className="text-xs text-gray-400 truncate">{c.fornecedor}</p>}
                        </div>
                        {c.status && <span className="text-xs text-gray-400 flex-shrink-0">{c.status}</span>}
                      </label>
                    )
                  })}
                </div>
                {(form.contratoIds ?? []).length > 0 && (
                  <p className="text-xs text-blue-600">
                    {(form.contratoIds ?? []).length} contrato(s) vinculado(s)
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Observações ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Observações</h2>
        <textarea
          value={form.observacoes ?? ''}
          onChange={e => set('observacoes', e.target.value)}
          rows={3}
          placeholder="Informações adicionais, histórico, localização exata…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </section>

      {/* ── Ações ── */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </div>
  )
}