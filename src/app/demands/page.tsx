'use client'

export const dynamic = 'force-dynamic'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDemands } from '@/hooks/useDemands'
import { getAllUsers, getAllResponsaveis, } from '@/lib/firestore'
import Header from '@/components/layout/Header'
import DemandCard from '@/components/demands/DemandCard'
import type {
  CondoUser,
  Responsavel,
  DemandStatus,
  Priority,
  DemandType,
} from '@/types'

function DemandsPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, loading } = useAuth()

  const mode = (params.get('mode') || 'view') as
    | 'view'
    | 'update'
    | 'delete'

  const [users, setUsers] = useState<CondoUser[]>([])
  const [status, setStatus] = useState<DemandStatus | ''>('')
  const [prioridade, setPrioridade] = useState<Priority | ''>('')
  const [tipo, setTipo] = useState<DemandType | ''>('')
  const [responsavel, setResponsavel] = useState('')
  const [responsaveis, setResponsaveis] =
  useState<Responsavel[]>([])

  const {
    demands,
    loading: demandsLoading,
  } = useDemands({
    status: status || undefined,
    prioridade: prioridade || undefined,
    tipo: tipo || undefined,
    responsavel: responsavel || undefined,
  })

  

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    getAllUsers().then(setUsers)
  
    getAllResponsaveis()
      .then(setResponsaveis)
  }, [])

  useEffect(() => {
    if (
      !loading &&
      user &&
      mode === 'delete' &&
      !user.canDelete
    ) {
      router.replace('/demands')
    }
  }, [user, loading, mode, router])

  const title =
    mode === 'update'
      ? 'Atualizar demanda'
      : mode === 'delete'
      ? 'Excluir demanda'
      : 'Consultar demandas'

  if (loading || !user) return null

  const abertas = demands.filter(
    d => d.status === 'aberta'
  ).length

  const andamento = demands.filter(
    d => d.status === 'em_andamento'
  ).length

  const concluidas = demands.filter(
    d => d.status === 'concluida'
  ).length


  

  return (
    <>
      <Header
        title={title}
        showBack
        backHref="/dashboard"
      />

      <div className="min-h-screen bg-gray-50">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">

            <p className="text-xs uppercase tracking-widest text-white/70">
              Gestão de Demandas
            </p>

            <h1 className="text-2xl font-bold mt-2">
              {title}
            </h1>

            <p className="text-sm text-white/80 mt-2">
              {demands.length} demandas encontradas
            </p>

          </div>
        </div>

        {/* RESUMO */}
        <div className="px-4 mt-4">
          <div className="grid grid-cols-3 gap-3">

            <div className="bg-red-50 rounded-3xl p-4 border border-red-100">
              <p className="text-xs text-red-500 uppercase">
                Abertas
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {abertas}
              </p>
            </div>

            <div className="bg-amber-50 rounded-3xl p-4 border border-amber-100">
              <p className="text-xs text-amber-600 uppercase">
                Andamento
              </p>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {andamento}
              </p>
            </div>

            <div className="bg-green-50 rounded-3xl p-4 border border-green-100">
              <p className="text-xs text-green-600 uppercase">
                Concluídas
              </p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {concluidas}
              </p>
            </div>

          </div>
        </div>

        {/* FILTROS */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-4">

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">
              🔎 Filtros
            </h2>

            <button
              onClick={() => {
                setStatus('')
                setPrioridade('')
                setTipo('')
                setResponsavel('')
              }}
              className="text-xs text-[#1a2744] font-medium"
            >
              Limpar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">

            <select
              className="form-input text-sm"
              value={status}
              onChange={e =>
                setStatus(
                  e.target.value as DemandStatus | ''
                )
              }
            >
              <option value="">
                Todos os status
              </option>
              <option value="aberta">
                Aberta
              </option>
              <option value="em_andamento">
                Em andamento
              </option>
              <option value="concluida">
                Concluída
              </option>
            </select>

            <select
              className="form-input text-sm"
              value={prioridade}
              onChange={e =>
                setPrioridade(
                  e.target.value as Priority | ''
                )
              }
            >
              <option value="">
                Toda prioridade
              </option>
              <option value="alta">
                🔥 Alta
              </option>
              <option value="media">
                ⚡ Média
              </option>
              <option value="baixa">
                🌱 Baixa
              </option>
            </select>

            <select
              className="form-input text-sm"
              value={tipo}
              onChange={e =>
                setTipo(
                  e.target.value as DemandType | ''
                )
              }
            >
              <option value="">
                Todos os tipos
              </option>
              <option value="manutencao">
                Manutenção
              </option>
              <option value="administrativo">
                Administrativo
              </option>
              <option value="financeiro">
                Financeiro
              </option>
              <option value="seguranca">
                Segurança
              </option>
              <option value="limpeza">
                Limpeza
              </option>
              <option value="obra">
                Obra
              </option>
              <option value="outro">
                Outro
              </option>
            </select>

            <select
              className="form-input text-sm"
              value={responsavel}
              onChange={e =>
                setResponsavel(e.target.value)
              }
            >
              <option value="">
                Todos responsáveis
              </option>

              {responsaveis.map(r => (
              <option
                key={r.id}
                value={r.id}
              >
                {r.nome}
              </option>
            ))}
            </select>

          </div>
        </div>

        {/* LISTA */}
        <div className="p-4 space-y-4 pb-24">

          {demandsLoading ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
              <p className="text-gray-400">
                Carregando demandas...
              </p>
            </div>
          ) : demands.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center shadow-sm">

              <div className="text-6xl mb-4">
                📭
              </div>

              <h3 className="font-semibold text-gray-700">
                Nenhuma demanda encontrada
              </h3>

              <p className="text-sm text-gray-400 mt-2">
                Tente alterar os filtros
                ou registrar uma nova demanda.
              </p>

            </div>
          ) : (
            demands.map(demand => (
              <DemandCard
                key={demand.id}
                demand={demand}
                users={users}
                mode={mode}
              />
            ))
          )}

        </div>

        {/* FAB */}
        {mode === 'view' && (
          <button
            onClick={() =>
              router.push('/demands/nova')
            }
            className="
              fixed
              bottom-6
              right-6
              w-16
              h-16
              rounded-full
              bg-[#1a2744]
              text-white
              text-3xl
              shadow-xl
              flex
              items-center
              justify-center
            "
          >
            +
          </button>
        )}

      </div>
    </>
  )
}
export default function DemandsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Carregando...
        </div>
      }
    >
      <DemandsPageContent />
    </Suspense>
  )
}