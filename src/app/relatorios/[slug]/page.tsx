'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import {
  relUsuarios,
  relResponsaveis,
  relFornecedores,
  relContratosAtivos,
  relContratosVencendo,
  relContratosVencidos,
  relTarefasPorResponsavel,
  relTarefasPorPeriodicidade,
  relTarefasAtrasadas,
  relTarefasNaoConformidade,
  relOrcamentosEmAnalise,
  relOrcamentosContratados,
  relOrcamentosSemCotacao,
  relDemandasPorData,
  relDemandasPorPrioridade,
  relDemandasPorResponsavel,
  relDemandasPorVencimento,
  relDemandasParadas,
  timestampToDate,
  type FornecedorItem,
  type TarefaComStatus,
  type RegistroNaoConforme,
} from '@/lib/relatorios'
import type { CondoUser, Responsavel, Contrato, Orcamento, Demand } from '@/types'
import {
  ROLE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TIPO_LABELS,
  NAO_CONFORMIDADE_LABELS,
} from '@/types'

// ── Helpers de formatação ─────────────────────────────────────────

function fmtDate(ts: unknown): string {
  if (!ts) return '—'
  const d = timestampToDate(ts)
  if (d.getTime() === 0) return '—'
  return d.toLocaleDateString('pt-BR')
}

function fmtMoeda(v?: number | null): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function isVencido(ts: unknown): boolean {
  if (!ts) return false
  return timestampToDate(ts) < new Date()
}

function diasRestantes(ts: unknown): number {
  const d = timestampToDate(ts)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - hoje.getTime()) / 86400000)
}

// ── Config por slug ───────────────────────────────────────────────

const TITULOS: Record<string, string> = {
  'usuarios':                     'Usuários',
  'responsaveis':                 'Responsáveis',
  'fornecedores':                 'Fornecedores',
  'contratos-ativos-contratacao': 'Contratos ativos — por contratação',
  'contratos-ativos-vencimento':  'Contratos ativos — por vencimento',
  'contratos-vencendo':           'Contratos vencendo em breve',
  'contratos-vencidos':           'Contratos vencidos',
  'tarefas-responsavel':          'Tarefas — por responsável',
  'tarefas-periodicidade':        'Tarefas — por periodicidade',
  'tarefas-atrasadas':            'Tarefas atrasadas / pendentes',
  'tarefas-nao-conformidade':     'Não conformidades',
  'orcamentos-em-analise':        'Orçamentos em análise',
  'orcamentos-contratados':       'Orçamentos contratados',
  'orcamentos-sem-cotacao':       'Orçamentos sem cotação',
  'demandas-data':                'Demandas — por data',
  'demandas-prioridade':          'Demandas — por prioridade',
  'demandas-responsavel':         'Demandas — por responsável',
  'demandas-vencimento':          'Demandas — por vencimento',
  'demandas-paradas':             'Demandas paradas (+15 dias)',
}

const COM_PERIODO = new Set([
  'tarefas-nao-conformidade',
  'demandas-data',
  'demandas-prioridade',
  'demandas-responsavel',
])

const COM_ORDEM = new Set(['contratos-vencidos'])
const COM_DIAS_VENCENDO = new Set(['contratos-vencendo'])

// ── Componentes de linha ──────────────────────────────────────────

function Linha({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3
        ${onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}
      `}
    >
      {children}
    </div>
  )
}

function Cabecalho({ cols }: { cols: string[] }) {
  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
      {cols.map(c => (
        <span key={c} className="text-[10px] font-semibold text-gray-400 uppercase">{c}</span>
      ))}
    </div>
  )
}

function Vazio() {
  return (
    <div className="py-12 text-center">
      <p className="text-4xl mb-2">📭</p>
      <p className="text-sm text-gray-400">Nenhum registro encontrado.</p>
    </div>
  )
}

// ── Badge helpers ─────────────────────────────────────────────────

function BadgePrioridade({ p }: { p: string }) {
  const cls = p === 'alta' ? 'bg-red-50 text-red-600' : p === 'media' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{PRIORITY_LABELS[p as keyof typeof PRIORITY_LABELS] ?? p}</span>
}

function BadgeStatus({ s }: { s: string }) {
  const cls = s === 'aberta' ? 'bg-red-50 text-red-600' : s === 'em_andamento' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s}</span>
}

function BadgeRole({ r }: { r: string }) {
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r}</span>
}

function BadgeStatusTarefa({ s }: { s: string }) {
  const map: Record<string, string> = {
    em_dia: 'bg-green-50 text-green-700',
    vence_hoje: 'bg-amber-50 text-amber-700',
    atrasada: 'bg-red-50 text-red-600',
    nunca_executada: 'bg-gray-100 text-gray-500',
  }
  const label: Record<string, string> = {
    em_dia: 'Em dia', vence_hoje: 'Vence hoje', atrasada: 'Atrasada', nunca_executada: 'Nunca executada',
  }
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[s] ?? 'bg-gray-100 text-gray-500'}`}>{label[s] ?? s}</span>
}

function BadgeContrato({ s }: { s: string }) {
  const map: Record<string, string> = { ativo: 'bg-green-50 text-green-700', encerrado: 'bg-gray-100 text-gray-500', em_renovacao: 'bg-amber-50 text-amber-700' }
  const label: Record<string, string> = { ativo: 'Ativo', encerrado: 'Encerrado', em_renovacao: 'Em renovação' }
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[s] ?? ''}`}>{label[s] ?? s}</span>
}

function descPeriodicidade(tarefa: TarefaComStatus['tarefa']): string {
  const p = tarefa.periodicidade
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  if (p.tipo === 'semanal') return `Semanal — ${p.diasSemana.map(d => DIAS[d]).join(', ')}`
  if (p.tipo === 'intervalo') return `A cada ${p.diasIntervalo} dias`
  if (p.tipo === 'mensal') return `Dia ${p.diaDoMes} do mês`
  return '—'
}

// ── Renderizadores por slug ───────────────────────────────────────

function ListaUsuarios({ dados }: { dados: CondoUser[] }) {
  const [expandido, setExpandido] = useState<string | null>(null)
  if (!dados.length) return <Vazio />
  return (
    <>
      <Cabecalho cols={['Nome', 'Perfil', 'Ativo']} />
      {dados.map(u => (
        <div key={u.uid}>
          <Linha onClick={() => setExpandido(expandido === u.uid ? null : u.uid)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
            </div>
            <BadgeRole r={u.role} />
            <span className={`text-xs font-medium ${u.active ? 'text-green-600' : 'text-gray-400'}`}>
              {u.active ? 'Ativo' : 'Inativo'}
            </span>
          </Linha>
          {expandido === u.uid && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 space-y-1">
              <p><span className="font-semibold">UID:</span> {u.uid}</p>
              <p><span className="font-semibold">Sigilo:</span> {u.acessoSigilo ? 'Sim' : 'Não'}</p>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

function ListaResponsaveis({ dados }: { dados: Responsavel[] }) {
  const [expandido, setExpandido] = useState<string | null>(null)
  if (!dados.length) return <Vazio />
  return (
    <>
      <Cabecalho cols={['Nome', 'Tipo', 'Ativo']} />
      {dados.map(r => (
        <div key={r.id}>
          <Linha onClick={() => setExpandido(expandido === r.id ? null : r.id)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{r.nome}</p>
              {r.email && <p className="text-xs text-gray-400 truncate">{r.email}</p>}
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
              {r.role}
            </span>
            <span className={`text-xs font-medium ${r.active ? 'text-green-600' : 'text-gray-400'}`}>
              {r.active ? 'Ativo' : 'Inativo'}
            </span>
          </Linha>
          {expandido === r.id && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 space-y-1">
              <p><span className="font-semibold">Sigilo:</span> {r.acessoSigilo ? 'Sim' : 'Não'}</p>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

function ListaFornecedores({ dados, router }: { dados: FornecedorItem[]; router: ReturnType<typeof useRouter> }) {
  if (!dados.length) return <Vazio />
  return (
    <>
      <Cabecalho cols={['Fornecedor', 'CNPJ/CPF', 'Origem']} />
      {dados.map((f, i) => (
        <Linha
          key={i}
          onClick={() =>
            router.push(f.origem === 'contrato' ? `/contratos/${f.origemId}` : `/orcamentos/${f.origemId}`)
          }
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{f.nome}</p>
            <p className="text-xs text-gray-400 truncate">{f.origemTitulo}</p>
          </div>
          <span className="text-xs text-gray-500 shrink-0">{f.cnpj || '—'}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            f.origem === 'contrato' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
          }`}>
            {f.origem === 'contrato' ? 'Contrato' : 'Cotação'}
          </span>
        </Linha>
      ))}
    </>
  )
}

function ListaContratos({ dados, router }: { dados: Contrato[]; router: ReturnType<typeof useRouter> }) {
  if (!dados.length) return <Vazio />
  return (
    <>
      <Cabecalho cols={['Fornecedor / Objeto', 'Vencimento', 'Valor', 'Status']} />
      {dados.map(c => {
        const vencendo = diasRestantes(c.dataVencimento)
        return (
          <Linha key={c.id} onClick={() => router.push(`/contratos/${c.id}`)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{c.fornecedor}</p>
              <p className="text-xs text-gray-400 truncate">{c.objeto}</p>
              <p className="text-xs text-gray-400 mt-0.5">Início: {fmtDate(c.dataInicio)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xs font-medium ${isVencido(c.dataVencimento) ? 'text-red-600' : vencendo <= 30 ? 'text-amber-600' : 'text-gray-600'}`}>
                {fmtDate(c.dataVencimento)}
              </p>
              <p className="text-xs text-gray-400">{fmtMoeda(c.valorMensal)}/mês</p>
              <div className="mt-1"><BadgeContrato s={c.status} /></div>
            </div>
          </Linha>
        )
      })}
    </>
  )
}

function ListaTarefas({ dados, router }: { dados: TarefaComStatus[]; router: ReturnType<typeof useRouter> }) {
  if (!dados.length) return <Vazio />
  let grupoAtual = ''
  return (
    <>
      {dados.map((item, i) => {
        // Cabeçalho de grupo (responsável ou periodicidade)
        const grupoNovo = item.tarefa.responsavelPadraoNome || descPeriodicidade(item.tarefa).split(' — ')[0]
        const mostrarGrupo = grupoNovo !== grupoAtual
        if (mostrarGrupo) grupoAtual = grupoNovo

        return (
          <div key={item.tarefa.id}>
            {mostrarGrupo && i > 0 && <div className="h-px bg-gray-100 mx-4" />}
            <Linha onClick={() => router.push(`/tarefas/${item.tarefa.id}`)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.tarefa.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">{descPeriodicidade(item.tarefa)}</p>
                <p className="text-xs text-gray-400">
                  👤 {item.tarefa.responsavelPadraoNome}
                  {item.ultimoRegistro && ` · Última: ${fmtDate(item.ultimoRegistro.dataRealizacao)}`}
                </p>
              </div>
              <BadgeStatusTarefa s={item.status} />
            </Linha>
          </div>
        )
      })}
    </>
  )
}

function ListaNaoConformidades({ dados, router }: { dados: RegistroNaoConforme[]; router: ReturnType<typeof useRouter> }) {
  if (!dados.length) return <Vazio />
  const PRIO_CLS: Record<string, string> = {
    alta: 'bg-red-50 text-red-600',
    media: 'bg-amber-50 text-amber-700',
    baixa: 'bg-gray-50 text-gray-600',
  }
  return (
    <>
      <Cabecalho cols={['Tarefa / Tipo', 'Data', 'Responsável', 'Prioridade']} />
      {dados.map(r => (
        <Linha key={r.id} onClick={() => router.push(`/tarefas/${r.tarefaId}`)}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{r.tarefaTitulo}</p>
            <p className="text-xs text-gray-400 truncate">
              {r.naoConformidadeTipo ? NAO_CONFORMIDADE_LABELS[r.naoConformidadeTipo] : '—'}
            </p>
          </div>
          <span className="text-xs text-gray-500 shrink-0">{fmtDate(r.dataRealizacao)}</span>
          <span className="text-xs text-gray-500 shrink-0 truncate max-w-[80px]">{r.responsavelNome}</span>
          {r.naoConformidadePrioridade && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${PRIO_CLS[r.naoConformidadePrioridade] ?? ''}`}>
              {PRIORITY_LABELS[r.naoConformidadePrioridade]}
            </span>
          )}
        </Linha>
      ))}
    </>
  )
}

function ListaOrcamentos({ dados, router }: { dados: Orcamento[]; router: ReturnType<typeof useRouter> }) {
  if (!dados.length) return <Vazio />
  return (
    <>
      <Cabecalho cols={['Título', 'Criado em', 'Cotações', 'Status']} />
      {dados.map(o => (
        <Linha key={o.id} onClick={() => router.push(`/orcamentos/${o.id}`)}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{o.titulo}</p>
            <p className="text-xs text-gray-400 truncate">{o.descricao}</p>
          </div>
          <span className="text-xs text-gray-500 shrink-0">{fmtDate(o.criadoEm)}</span>
          <span className="text-xs text-gray-500 shrink-0">{o.totalCotacoes ?? 0}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            o.resultado === 'contratado' ? 'bg-green-50 text-green-700' :
            o.status === 'aberto'        ? 'bg-amber-50 text-amber-700' :
                                           'bg-gray-100 text-gray-500'
          }`}>
            {o.resultado === 'contratado' ? 'Contratado' : o.status === 'aberto' ? 'Em análise' : 'Não contratado'}
          </span>
        </Linha>
      ))}
    </>
  )
}

function ListaDemandas({ dados, router }: { dados: Demand[]; router: ReturnType<typeof useRouter> }) {
  if (!dados.length) return <Vazio />
  return (
    <>
      <Cabecalho cols={['Demanda', 'Registro', 'Previsão', 'Prior.']} />
      {dados.map(d => (
        <Linha key={d.id} onClick={() => router.push(`/demands/${d.id}`)}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{d.titulo}</p>
            <p className="text-xs text-gray-400 truncate">
              {TIPO_LABELS[d.tipo]} · {d.responsavelNome}
            </p>
            <div className="mt-0.5"><BadgeStatus s={d.status} /></div>
          </div>
          <span className="text-xs text-gray-500 shrink-0">{fmtDate(d.dataCriacao)}</span>
          <span className={`text-xs shrink-0 ${isVencido(d.dataPrevisao) ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            {fmtDate(d.dataPrevisao)}
          </span>
          <BadgePrioridade p={d.prioridade} />
        </Linha>
      ))}
    </>
  )
}

// ── Filtros ───────────────────────────────────────────────────────

function FiltroPeriodo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mx-4 mt-4 flex gap-2 flex-wrap">
      {[
        { v: '',    l: 'Tudo'       },
        { v: '30',  l: 'Últimos 30d' },
        { v: '90',  l: 'Últimos 90d' },
        { v: '180', l: 'Últimos 180d' },
        { v: 'ano', l: 'Último ano'  },
      ].map(({ v, l }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            value === v
              ? 'bg-[#1a2744] border-[#1a2744] text-white'
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function FiltroOrdem({ value, onChange }: { value: 'asc' | 'desc'; onChange: (v: 'asc' | 'desc') => void }) {
  return (
    <div className="mx-4 mt-4 flex gap-2">
      <button
        onClick={() => onChange('desc')}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${value === 'desc' ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'bg-white border-gray-200 text-gray-600'}`}
      >
        Mais recente primeiro
      </button>
      <button
        onClick={() => onChange('asc')}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${value === 'asc' ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'bg-white border-gray-200 text-gray-600'}`}
      >
        Mais antigo primeiro
      </button>
    </div>
  )
}

function FiltroDiasVencendo({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mx-4 mt-4 flex gap-2">
      {[30, 60, 90].map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${value === d ? 'bg-[#1a2744] border-[#1a2744] text-white' : 'bg-white border-gray-200 text-gray-600'}`}
        >
          {d} dias
        </button>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────

export default function RelatorioSlugPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const { user, loading } = useAuth()

  const [dados, setDados] = useState<unknown[]>([])
  const [carregando, setCarregando] = useState(true)
  const [periodo, setPeriodo] = useState('')
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc')
  const [diasVencendo, setDiasVencendo] = useState(30)

  const acessoSigilo = user?.acessoSigilo ?? false

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
    if (!loading && user) {
      const allowed = ['sindico', 'subsindico', 'conselheiro']
      if (!allowed.includes(user.role)) router.replace('/dashboard')
    }
  }, [user, loading, router])

  const carregar = useCallback(async () => {
    if (!user) return
    setCarregando(true)
    try {
      let resultado: unknown[] = []
      switch (slug) {
        case 'usuarios':                     resultado = await relUsuarios(); break
        case 'responsaveis':                 resultado = await relResponsaveis(); break
        case 'fornecedores':                 resultado = await relFornecedores(); break
        case 'contratos-ativos-contratacao': resultado = await relContratosAtivos('contratacao', acessoSigilo); break
        case 'contratos-ativos-vencimento':  resultado = await relContratosAtivos('vencimento', acessoSigilo); break
        case 'contratos-vencendo':           resultado = await relContratosVencendo(diasVencendo, acessoSigilo); break
        case 'contratos-vencidos':           resultado = await relContratosVencidos(ordem, acessoSigilo); break
        case 'tarefas-responsavel':          resultado = await relTarefasPorResponsavel(); break
        case 'tarefas-periodicidade':        resultado = await relTarefasPorPeriodicidade(); break
        case 'tarefas-atrasadas':            resultado = await relTarefasAtrasadas(); break
        case 'tarefas-nao-conformidade':     resultado = await relTarefasNaoConformidade(periodo || undefined); break
        case 'orcamentos-em-analise':        resultado = await relOrcamentosEmAnalise(acessoSigilo); break
        case 'orcamentos-contratados':       resultado = await relOrcamentosContratados(acessoSigilo); break
        case 'orcamentos-sem-cotacao':       resultado = await relOrcamentosSemCotacao(acessoSigilo); break
        case 'demandas-data':                resultado = await relDemandasPorData(acessoSigilo, periodo || undefined); break
        case 'demandas-prioridade':          resultado = await relDemandasPorPrioridade(acessoSigilo, periodo || undefined); break
        case 'demandas-responsavel':         resultado = await relDemandasPorResponsavel(acessoSigilo, periodo || undefined); break
        case 'demandas-vencimento':          resultado = await relDemandasPorVencimento(acessoSigilo); break
        case 'demandas-paradas':             resultado = await relDemandasParadas(acessoSigilo); break
      }
      setDados(resultado)
    } finally {
      setCarregando(false)
    }
  }, [slug, user, periodo, ordem, diasVencendo, acessoSigilo])

  useEffect(() => { carregar() }, [carregar])

  if (loading || !user) return null

  const titulo = TITULOS[slug] ?? 'Relatório'
  const comPeriodo = COM_PERIODO.has(slug)
  const comOrdem = COM_ORDEM.has(slug)
  const comDiasVencendo = COM_DIAS_VENCENDO.has(slug)

  function renderLista() {
    if (carregando) return (
      <div className="py-12 text-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )

    const props = { router }

    switch (slug) {
      case 'usuarios':
        return <ListaUsuarios dados={dados as CondoUser[]} />
      case 'responsaveis':
        return <ListaResponsaveis dados={dados as Responsavel[]} />
      case 'fornecedores':
        return <ListaFornecedores dados={dados as FornecedorItem[]} {...props} />
      case 'contratos-ativos-contratacao':
      case 'contratos-ativos-vencimento':
      case 'contratos-vencendo':
      case 'contratos-vencidos':
        return <ListaContratos dados={dados as Contrato[]} {...props} />
      case 'tarefas-responsavel':
      case 'tarefas-periodicidade':
      case 'tarefas-atrasadas':
        return <ListaTarefas dados={dados as TarefaComStatus[]} {...props} />
      case 'tarefas-nao-conformidade':
        return <ListaNaoConformidades dados={dados as RegistroNaoConforme[]} {...props} />
      case 'orcamentos-em-analise':
      case 'orcamentos-contratados':
      case 'orcamentos-sem-cotacao':
        return <ListaOrcamentos dados={dados as Orcamento[]} {...props} />
      case 'demandas-data':
      case 'demandas-prioridade':
      case 'demandas-responsavel':
      case 'demandas-vencimento':
      case 'demandas-paradas':
        return <ListaDemandas dados={dados as Demand[]} {...props} />
      default:
        return <Vazio />
    }
  }

  return (
    <>
      <Header title={titulo} showBack backHref="/relatorios" />

      <div className="min-h-screen bg-gray-50 pb-12">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Relatório</p>
            <h1 className="text-xl font-bold mt-1 leading-snug">{titulo}</h1>
            {!carregando && (
              <p className="text-sm text-white/75 mt-1">
                {dados.length} {dados.length === 1 ? 'registro' : 'registros'}
              </p>
            )}
          </div>
        </div>

        {/* FILTROS */}
        {comPeriodo && <FiltroPeriodo value={periodo} onChange={setPeriodo} />}
        {comOrdem && <FiltroOrdem value={ordem} onChange={setOrdem} />}
        {comDiasVencendo && <FiltroDiasVencendo value={diasVencendo} onChange={setDiasVencendo} />}

        {/* LISTA */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {renderLista()}
        </div>

      </div>
    </>
  )
}