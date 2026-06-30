'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Pencil, Trash2, Package, FileText, Calendar,
  DollarSign, Clock, Shield, MapPin, Hash, AlertTriangle,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'
import {
  getPatrimonio,
  updatePatrimonio,
  deletePatrimonio,
  getContratosAtivos,
  calcularIdadeEmMeses,
  ContratoResumo,
} from '../service'
import { Patrimonio, ESTADO_CONSERVACAO_COLOR, EstadoConservacao, PatrimonioFormData } from '@/types'
import PatrimonioForm from '../PatrimonioForm'

const PODE_GERENCIAR = ['sindico', 'subsindico']

export default function PatrimonioDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [patrimonio, setPatrimonio] = useState<Patrimonio | null>(null)
  const [contratos, setContratos] = useState<ContratoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const podeGerenciar = PODE_GERENCIAR.includes(user?.role ?? '')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [p, cs] = await Promise.all([
        getPatrimonio(id),
        getContratosAtivos(),
      ])
      setPatrimonio(p)
      setContratos(cs)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  const handleUpdate = async (data: PatrimonioFormData) => {
    await updatePatrimonio(id, data)
    setEditando(false)
    carregar()
  }

  const handleDelete = async () => {
    await deletePatrimonio(id)
    router.push('/patrimonios')
  }

  const formatCurrency = (v?: number) =>
    v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'

  const formatDate = (ts?: { toDate(): Date } | null) =>
    ts ? ts.toDate().toLocaleDateString('pt-BR') : '—'

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Patrimônio" showBack />
      <div className="text-center py-20 text-gray-400">Carregando…</div>
    </div>
  )

  if (!patrimonio) return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Patrimônio" showBack />
      <div className="text-center py-20 text-gray-400">Bem não encontrado.</div>
    </div>
  )

  const idade = calcularIdadeEmMeses(patrimonio.dataCompra ?? null)
  const contratosVinculados = contratos.filter(c => (patrimonio.contratoIds ?? []).includes(c.id))

  if (editando) {
    const initialData: Partial<PatrimonioFormData> = {
      nome: patrimonio.nome,
      numeroSerie: patrimonio.numeroSerie,
      categoria: patrimonio.categoria,
      modelo: patrimonio.modelo,
      setor: patrimonio.setor,
      dataCompra: patrimonio.dataCompra,
      valorCompra: patrimonio.valorCompra,
      valorAtual: patrimonio.valorAtual,
      vidaUtilAnos: patrimonio.vidaUtilAnos,
      estadoConservacao: patrimonio.estadoConservacao,
      possuiContrato: patrimonio.possuiContrato,
      contratoIds: patrimonio.contratoIds,
      observacoes: patrimonio.observacoes,
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Editar Bem" showBack />
        <main className="max-w-3xl mx-auto px-4 py-6">
          <PatrimonioForm
            initialData={initialData}
            onSubmit={handleUpdate}
            submitLabel="Salvar alterações"
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={patrimonio.nome}
        showBack
        rightAction={
          podeGerenciar ? (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-3 py-2 rounded-xl"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          ) : undefined
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* ── Cabeçalho resumo ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{patrimonio.nome}</h1>
                <p className="text-sm text-gray-500">{patrimonio.categoria} · {patrimonio.setor}</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${
              ESTADO_CONSERVACAO_COLOR[patrimonio.estadoConservacao as EstadoConservacao] ?? ''
            }`}>
              {patrimonio.estadoConservacao}
            </span>
          </div>
        </div>

        {/* ── Identificação ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identificação</h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Hash className="w-4 h-4" />} label="Número de série" value={patrimonio.numeroSerie || '—'} />
            <InfoItem icon={<Package className="w-4 h-4" />} label="Modelo / Fabricante" value={patrimonio.modelo || '—'} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Setor" value={patrimonio.setor} />
            <InfoItem icon={<Shield className="w-4 h-4" />} label="Categoria" value={patrimonio.categoria} />
          </dl>
        </div>

        {/* ── Dados financeiros ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Dados financeiros</h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Data de compra" value={formatDate(patrimonio.dataCompra)} />
            <InfoItem icon={<Clock className="w-4 h-4" />} label="Idade" value={idade != null ? `${idade} meses` : '—'} />
            <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Valor de compra" value={formatCurrency(patrimonio.valorCompra)} />
            <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Valor atual" value={formatCurrency(patrimonio.valorAtual)} />
            <InfoItem icon={<Clock className="w-4 h-4" />} label="Vida útil" value={patrimonio.vidaUtilAnos ? `${patrimonio.vidaUtilAnos} anos` : '—'} />
            {patrimonio.valorCompra && patrimonio.valorAtual && (
              <InfoItem
                icon={<DollarSign className="w-4 h-4" />}
                label="Depreciação acumulada"
                value={formatCurrency(patrimonio.valorCompra - patrimonio.valorAtual)}
              />
            )}
          </dl>
        </div>

        {/* ── Contratos de manutenção ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contrato de manutenção</h2>
          {!patrimonio.possuiContrato ? (
            <p className="text-sm text-gray-400">Sem contrato de manutenção associado.</p>
          ) : contratosVinculados.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p>Este bem está marcado como "possui contrato", mas nenhum contrato foi vinculado. Edite o bem para vincular.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contratosVinculados.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.titulo}</p>
                    {c.fornecedor && <p className="text-xs text-gray-500 truncate">{c.fornecedor}</p>}
                  </div>
                  {c.status && <span className="text-xs text-gray-500 flex-shrink-0">{c.status}</span>}
                  <button
                    onClick={() => router.push(`/contratos/${c.id}`)}
                    className="text-xs text-blue-600 hover:underline flex-shrink-0"
                  >
                    Ver contrato →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Observações ── */}
        {patrimonio.observacoes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Observações</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{patrimonio.observacoes}</p>
          </div>
        )}

        {/* ── Metadados ── */}
        <div className="text-xs text-gray-400 text-right px-1">
          Cadastrado em {formatDate(patrimonio.criadoEm)} · Atualizado em {formatDate(patrimonio.atualizadoEm)}
        </div>

        {/* ── Excluir ── */}
        {podeGerenciar && (
          <div className="pt-2 pb-8">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir bem
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">Confirma exclusão? Esta ação não pode ser desfeita.</p>
                <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:text-red-800">Excluir</button>
                <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <span className="text-gray-300">{icon}</span>
        {label}
      </dt>
      <dd className="text-sm text-gray-800 font-medium">{value}</dd>
    </div>
  )
}