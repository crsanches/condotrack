'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getDemand, deleteDemand, getAllUsers } from '@/lib/firestore'
import { verifySecondUser } from '@/lib/auth'
import Header from '@/components/layout/Header'
import type { Demand, CondoUser } from '@/types'
import { TIPO_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/types'

export default function DemandDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [demand, setDemand] = useState<Demand | null>(null)
  const [users, setUsers] = useState<CondoUser[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(searchParams.get('delete') === '1')
  const [secondEmail, setSecondEmail] = useState('')
  const [secondPass, setSecondPass] = useState('')
  const [delError, setDelError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!id || !user?.condominioId) return
    getDemand(id).then(setDemand)
    getAllUsers(user.condominioId).then(setUsers)
  }, [id, user?.condominioId])

  const formatDate = (ts: unknown) => {
    if (!ts) return '—'
    const d = (ts as { toDate?: () => Date }).toDate ? (ts as { toDate: () => Date }).toDate() : new Date(ts as string)
    return d.toLocaleDateString('pt-BR')
  }

  const handleDelete = async () => {
    if (!user?.canDelete) return
    setDeleting(true)
    setDelError('')
    try {
      const second = await verifySecondUser(secondEmail, secondPass)
      if (second.uid === user.uid) throw new Error('O segundo usuário deve ser diferente do usuário atual.')
      await deleteDemand(id)
      router.replace('/demands')
    } catch (e: unknown) {
      setDelError(e instanceof Error ? e.message : 'Erro ao verificar segundo usuário.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading || !user || !demand) return null

  const responsavel = users.find(u => u.uid === demand.responsavelNome)
  const prioColors: Record<string, string> = { alta: 'bg-red-500', media: 'bg-amber-400', baixa: 'bg-green-600' }

  return (
    <>
      <Header title="Detalhes da demanda" showBack backHref="/demands" />
      <div className="flex-1 overflow-y-auto pb-8">

        {/* Priority strip */}
        <div className={`h-1 ${prioColors[demand.prioridade]}`} />

        <div className="p-4 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`badge-${demand.status}`}>{STATUS_LABELS[demand.status]}</span>
            <span className={`badge-${demand.prioridade}`}>Prioridade {PRIORITY_LABELS[demand.prioridade]}</span>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{TIPO_LABELS[demand.tipo]}</span>
          </div>

          {/* Título */}
          <h2 className="text-base font-semibold text-gray-900">{demand.titulo}</h2>

          {/* Info grid */}
          <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
            {[
              ['Responsável', responsavel?.name || demand.responsavelNome],
              ['Criada em', formatDate(demand.dataCriacao)],
              ...(demand.dataConclusao ? [['Concluída em', formatDate(demand.dataConclusao)]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-2.5">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-medium text-gray-700">{value}</span>
              </div>
            ))}
          </div>

          {/* Histórico */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Histórico de atualizações</h3>
            <div className="space-y-2">
              {demand.atualizacoes.map((a, i) => {
                const isLast = i === demand.atualizacoes.length - 1
                const autor = users.find(u => u.uid === a.autor)
                return (
                  <div key={i} className={`bg-gray-50 rounded-xl p-3 ${isLast && demand.status === 'concluida' ? 'border-l-2 border-green-500 rounded-l-none' : ''}`}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-gray-400">{formatDate(a.data)}</span>
                      {autor && <span className="text-[11px] text-gray-400">{autor.name}</span>}
                    </div>
                    <p className="text-sm text-gray-700">{a.texto}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button className="btn-secondary" onClick={() => router.push(`/demands/${id}/editar`)}>
              ✏️ Editar / Adicionar atualização
            </button>
            {user.canDelete && (
              <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
                🗑️ Excluir demanda
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta ação não pode ser desfeita. Requer autenticação de um segundo membro autorizado.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="field-label">E-mail do segundo usuário autorizado</label>
                <input type="email" className="form-input" value={secondEmail} onChange={e => setSecondEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="field-label">Senha do segundo usuário</label>
                <input type="password" className="form-input" value={secondPass} onChange={e => setSecondPass(e.target.value)} />
              </div>
              {delError && <p className="text-red-500 text-sm">{delError}</p>}
            </div>
            <div className="space-y-2">
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Verificando...' : 'Confirmar exclusão'}
              </button>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
