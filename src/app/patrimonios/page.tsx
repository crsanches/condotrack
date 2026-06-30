'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Package, FileText, AlertTriangle } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'
import { getPatrimonios, calcularIdadeEmMeses } from './service'
import {
  Patrimonio,
  ESTADO_CONSERVACAO_COLOR,
  EstadoConservacao,
} from '@/types'

const PODE_CRIAR = ['sindico', 'subsindico']

export default function PatrimoniosPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const podeGerenciar = PODE_CRIAR.includes(user?.role ?? '')

  const carregar = useCallback(async () => {
    
    setLoading(true)
    try {
      const data = await getPatrimonios()
      setPatrimonios(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Categorias distintas para filtro
  const categorias = Array.from(new Set(patrimonios.map(p => p.categoria))).sort()

  const filtrados = patrimonios.filter(p => {
    const termo = busca.toLowerCase()
    const matchBusca =
      !busca ||
      p.nome.toLowerCase().includes(termo) ||
      (p.numeroSerie ?? '').toLowerCase().includes(termo) ||
      (p.modelo ?? '').toLowerCase().includes(termo) ||
      p.setor.toLowerCase().includes(termo)
    const matchCat = !filtroCategoria || p.categoria === filtroCategoria
    const matchEstado = !filtroEstado || p.estadoConservacao === filtroEstado
    return matchBusca && matchCat && matchEstado
  })

  const formatCurrency = (v?: number) =>
    v != null
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—'

  const formatDate = (ts?: { toDate(): Date } | null) =>
    ts ? ts.toDate().toLocaleDateString('pt-BR') : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patrimônio"
        showBack
        
        rightAction={
            podeGerenciar ? (
              <button
                onClick={() => router.push('/patrimonios/novo')}
                className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-3 py-2 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Novo Bem
              </button>
            ) : undefined
          }
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, série, modelo, setor…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os estados</option>
            {['Ótimo', 'Bom', 'Regular', 'Ruim'].map(e => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Contadores */}
        {!loading && (
          <p className="text-sm text-gray-500">
            {filtrados.length} {filtrados.length === 1 ? 'bem encontrado' : 'bens encontrados'}
            {patrimonios.length !== filtrados.length && ` (de ${patrimonios.length} total)`}
          </p>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-gray-300" />
            <p className="font-medium">Nenhum bem cadastrado</p>
            {podeGerenciar && (
              <button
                onClick={() => router.push('/patrimonios/novo')}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Cadastrar primeiro bem
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-500 font-medium">
                    <th className="px-4 py-3">Nome / Categoria</th>
                    <th className="px-4 py-3">Setor</th>
                    <th className="px-4 py-3">Compra</th>
                    <th className="px-4 py-3">Idade</th>
                    <th className="px-4 py-3">Valor Atual</th>
                    <th className="px-4 py-3">Conservação</th>
                    <th className="px-4 py-3">Contrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.map(p => {
                    const idade = calcularIdadeEmMeses(p.dataCompra ?? null)
                    return (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/patrimonios/${p.id}`)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.nome}</p>
                          <p className="text-xs text-gray-400">
                            {p.categoria}
                            {p.numeroSerie && ` · Nº ${p.numeroSerie}`}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.setor}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(p.dataCompra)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {idade != null ? `${idade} meses` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatCurrency(p.valorAtual)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                              ESTADO_CONSERVACAO_COLOR[p.estadoConservacao as EstadoConservacao] ?? ''
                            }`}
                          >
                            {p.estadoConservacao}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.possuiContrato && p.contratoIds?.length > 0 ? (
                            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                              <FileText className="w-3.5 h-3.5" />
                              {p.contratoIds.length === 1
                                ? '1 contrato'
                                : `${p.contratoIds.length} contratos`}
                            </span>
                          ) : p.possuiContrato ? (
                            <span className="flex items-center gap-1 text-xs text-amber-500">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Sem vínculo
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}