import { useRouter } from 'next/navigation'
import type { Demand, CondoUser } from '@/types'
import {
  TIPO_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/types'

interface DemandCardProps {
  demand: Demand
  users: CondoUser[]
  mode?: 'view' | 'update' | 'delete'
  compact?: boolean
}

export default function DemandCard({
  demand,
  mode = 'view',
  compact = false,
}: DemandCardProps)
 {
  const router = useRouter()

  const lastUpd =
    demand.atualizacoes[
      demand.atualizacoes.length - 1
    ]

  const href =
    mode === 'update'
      ? `/demands/${demand.id}/editar`
      : mode === 'delete'
      ? `/demands/${demand.id}?delete=1`
      : `/demands/${demand.id}`

  const formatDate = (
    ts: { toDate?: () => Date } | string | null
  ) => {
    if (!ts) return '—'

    const d =
      typeof ts === 'string'
        ? new Date(ts)
        : ts.toDate
        ? ts.toDate()
        : new Date()

    return d.toLocaleDateString('pt-BR')
  }

  const priorityConfig = {
    alta: {
      color: 'bg-red-500',
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: '🔥',
    },
    media: {
      color: 'bg-amber-400',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: '⚡',
    },
    baixa: {
      color: 'bg-green-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: '🌱',
    },
  }

  const statusConfig = {
    aberta: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: '🔴',
    },
    em_andamento: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: '🟡',
    },
    concluida: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: '🟢',
    },
  }

  const prio = priorityConfig[demand.prioridade]
  const status = statusConfig[demand.status]

  if (compact) {
    return (
      <div
        onClick={() => router.push(href)}
        className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          shadow-sm
          p-3
          cursor-pointer
        "
      >
        <div className="flex items-start justify-between">
  
          <div className="flex-1 min-w-0">
  
            <div className="flex items-center gap-2">
  
              <span
                className={`
                  px-2
                  py-1
                  rounded-full
                  text-[10px]
                  font-bold
                  ${prio.bg}
                  ${prio.text}
                `}
              >
                {prio.icon}
              </span>
  
              <div className="font-semibold text-gray-900 truncate">
                {demand.titulo}
              </div>
  
            </div>
  
            <div className="text-xs text-gray-500 mt-2">
              👤 {demand.responsavelNome || 'Sem responsável'}
              {' • '}
              📅 {formatDate(demand.dataCriacao)}
            </div>
  
          </div>
  
          <div
            className={`
              ml-3
              px-2
              py-1
              rounded-full
              text-xs
              font-medium
              ${status.bg}
              ${status.text}
            `}
          >
            {status.icon}
          </div>
  
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => router.push(href)}
      className="
        bg-white
        rounded-3xl
        border
        border-gray-100
        shadow-sm
        hover:shadow-md
        transition-all
        cursor-pointer
        overflow-hidden
      "
    >
      <div className={`h-1.5 ${prio.color}`} />

      <div className="p-4">

        <div className="flex items-start justify-between gap-3">

          <div className="flex-1">

            <h3 className="font-semibold text-gray-900 text-base leading-snug">
              {demand.titulo}
            </h3>

            <p className="text-xs text-gray-400 mt-1">
              #{demand.id.slice(0, 6)}
            </p>

          </div>

          <div
            className={`
              px-3
              py-1
              rounded-full
              text-xs
              font-semibold
              ${prio.bg}
              ${prio.text}
            `}
          >
            {prio.icon} {PRIORITY_LABELS[demand.prioridade]}
          </div>

        </div>

        <div className="flex flex-wrap gap-2 mt-4">

          <span
            className={`
              px-3
              py-1
              rounded-full
              text-xs
              font-medium
              ${status.bg}
              ${status.text}
            `}
          >
            {status.icon} {STATUS_LABELS[demand.status]}
          </span>

          <span
            className="
              px-3
              py-1
              rounded-full
              bg-gray-100
              text-gray-600
              text-xs
              font-medium
            "
          >
            {TIPO_LABELS[demand.tipo]}
          </span>

        </div>

        <div className="mt-4 space-y-2 text-sm">

          <div className="flex items-center gap-2 text-gray-600">
            <span>👤</span>
            <span>
              {demand.responsavelNome || 'Não informado'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <span>📅</span>
            <span>
              Criada em {formatDate(demand.dataCriacao)}
            </span>
          </div>

        </div>

        {lastUpd && (
          <div
            className="
              mt-4
              bg-gray-50
              rounded-2xl
              p-3
              border
              border-gray-100
            "
          >
            <p className="text-xs text-gray-400 mb-1">
              Última atualização
            </p>

            <p className="text-sm text-gray-700 line-clamp-2">
              {lastUpd.texto}
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">

          <span className="text-sm font-medium text-[#1a2744]">
            {mode === 'update'
              ? 'Atualizar →'
              : mode === 'delete'
              ? 'Excluir →'
              : 'Ver detalhes →'}
          </span>

        </div>

      </div>
    </div>
  )
}