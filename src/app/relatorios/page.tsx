'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'

const GRUPOS: {
  titulo: string
  emoji: string
  itens: { slug: string; label: string; descricao: string }[]
}[] = [
  {
    titulo: 'Pessoas',
    emoji: '👥',
    itens: [
      { slug: 'usuarios',      label: 'Usuários',      descricao: 'Todos os usuários do sistema' },
      { slug: 'responsaveis',  label: 'Responsáveis',  descricao: 'Responsáveis ativos e inativos' },
      { slug: 'fornecedores',  label: 'Fornecedores',  descricao: 'Extraído de contratos e cotações' },
    ],
  },
  {
    titulo: 'Contratos',
    emoji: '📄',
    itens: [
      { slug: 'contratos-ativos-contratacao', label: 'Ativos por contratação',   descricao: 'Contratos ativos, do mais antigo ao mais recente' },
      { slug: 'contratos-ativos-vencimento',  label: 'Ativos por vencimento',    descricao: 'Contratos ativos, do que vence primeiro' },
      { slug: 'contratos-vencendo',           label: 'Vencendo em breve',        descricao: 'Vencendo nos próximos 30, 60 ou 90 dias' },
      { slug: 'contratos-vencidos',           label: 'Contratos vencidos',       descricao: 'Encerrados, do mais recente ao mais antigo' },
    ],
  },
  {
    titulo: 'Tarefas',
    emoji: '✅',
    itens: [
      { slug: 'tarefas-responsavel',       label: 'Por responsável',      descricao: 'Tarefas agrupadas por responsável' },
      { slug: 'tarefas-periodicidade',     label: 'Por periodicidade',    descricao: 'Semanal, mensal e por intervalo' },
      { slug: 'tarefas-atrasadas',         label: 'Atrasadas / pendentes', descricao: 'Nunca executadas e fora do prazo' },
      { slug: 'tarefas-nao-conformidade',  label: 'Não conformidades',    descricao: 'Registros com falhas na execução' },
    ],
  },
  {
    titulo: 'Orçamentos',
    emoji: '💰',
    itens: [
      { slug: 'orcamentos-em-analise',   label: 'Em análise',        descricao: 'Orçamentos abertos aguardando decisão' },
      { slug: 'orcamentos-contratados',  label: 'Contratados',       descricao: 'Orçamentos aprovados e contratados' },
      { slug: 'orcamentos-sem-cotacao',  label: 'Sem cotação',       descricao: 'Abertos sem nenhuma cotação cadastrada' },
    ],
  },
  {
    titulo: 'Demandas',
    emoji: '📋',
    itens: [
      { slug: 'demandas-data',         label: 'Por data de registro',  descricao: 'Todas as demandas, mais recentes primeiro' },
      { slug: 'demandas-prioridade',   label: 'Por prioridade',        descricao: 'Alta → média → baixa, excluindo concluídas' },
      { slug: 'demandas-responsavel',  label: 'Por responsável',       descricao: 'Agrupadas por responsável, sem concluídas' },
      { slug: 'demandas-vencimento',   label: 'Por vencimento',        descricao: 'Com previsão, do mais urgente ao mais distante' },
      { slug: 'demandas-paradas',      label: 'Paradas (+15 dias)',    descricao: 'Em andamento sem nenhuma atualização recente' },
    ],
  },
]

export default function RelatoriosPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
    if (!loading && user) {
      const allowed = ['sindico', 'subsindico', 'conselheiro']
      if (!allowed.includes(user.role)) router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <>
      <Header title="Relatórios" showBack backHref="/dashboard" />

      <div className="min-h-screen bg-gray-50 pb-12">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">CondoTrack</p>
            <h1 className="text-2xl font-bold mt-2">Relatórios</h1>
            <p className="text-sm text-white/80 mt-1">
              Listas e consultas gerenciais
            </p>
          </div>
        </div>

        {/* GRUPOS */}
        {GRUPOS.map(grupo => (
          <div key={grupo.titulo} className="px-4 mt-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {grupo.emoji} {grupo.titulo}
            </h2>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {grupo.itens.map((item, idx) => (
                <button
                  key={item.slug}
                  onClick={() => router.push(`/relatorios/${item.slug}`)}
                  className={`
                    w-full flex items-center justify-between px-5 py-4
                    hover:bg-gray-50 active:bg-gray-100 transition-colors text-left
                    ${idx < grupo.itens.length - 1 ? 'border-b border-gray-50' : ''}
                  `}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.descricao}</p>
                  </div>
                  <span className="text-gray-300 text-lg ml-3">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}

      </div>
    </>
  )
}