import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  CondoUser,
  Responsavel,
  Contrato,
  TarefaPeriodica,
  RegistroTarefa,
  Orcamento,
  Demand,
  Cotacao,
} from '@/types'
import { calcularStatusTarefa } from './firestore'

import type { Patrimonio } from '@/types'





// ── Helpers ───────────────────────────────────────────────────────

export function timestampToDate(ts: unknown): Date {
  if (!ts) return new Date(0)
  if ((ts as { toDate?: () => Date }).toDate) return (ts as { toDate: () => Date }).toDate()
  return new Date(ts as string)
}

export function periodoParaDate(periodo: string): Date | null {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  switch (periodo) {
    case '30':  { const d = new Date(hoje); d.setDate(d.getDate() - 30);   return d }
    case '90':  { const d = new Date(hoje); d.setDate(d.getDate() - 90);   return d }
    case '180': { const d = new Date(hoje); d.setDate(d.getDate() - 180);  return d }
    case 'ano': { const d = new Date(hoje); d.setFullYear(d.getFullYear() - 1); return d }
    default: return null
  }
}

// ── Pessoas ───────────────────────────────────────────────────────

export async function relUsuarios(): Promise<CondoUser[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() } as CondoUser))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function relResponsaveis(): Promise<Responsavel[]> {
  const snap = await getDocs(collection(db, 'responsaveis'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Responsavel))
    .sort((a, b) => a.nome.localeCompare(b.nome))
}

export interface FornecedorItem {
  nome: string
  cnpj?: string
  origem: 'contrato' | 'cotacao'
  origemId: string
  origemTitulo: string
}

export async function relFornecedores(): Promise<FornecedorItem[]> {
  const [contratosSnap, orcamentosSnap] = await Promise.all([
    getDocs(collection(db, 'contratos')),
    getDocs(collection(db, 'orcamentos')),
  ])

  const mapa = new Map<string, FornecedorItem>()

  // De contratos
  for (const d of contratosSnap.docs) {
    const c = d.data() as Contrato
    const chave = (c.cnpj || c.fornecedor).toLowerCase()
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        nome: c.fornecedor,
        cnpj: c.cnpj,
        origem: 'contrato',
        origemId: d.id,
        origemTitulo: c.objeto,
      })
    }
  }

  // De cotações
  for (const od of orcamentosSnap.docs) {
    const o = od.data() as Orcamento
    const cotacoesSnap = await getDocs(collection(db, 'orcamentos', od.id, 'cotacoes'))
    for (const cd of cotacoesSnap.docs) {
      const cot = cd.data() as Cotacao
      if (!cot.fornecedor) continue
      const chave = (cot.cnpjCpf || cot.fornecedor).toLowerCase()
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          nome: cot.fornecedor,
          cnpj: cot.cnpjCpf,
          origem: 'cotacao',
          origemId: od.id,
          origemTitulo: o.titulo,
        })
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome))
}

// ── Contratos ─────────────────────────────────────────────────────

export async function relContratosAtivos(
  ordenarPor: 'contratacao' | 'vencimento',
  acessoSigilo = false
): Promise<Contrato[]> {
  const snap = await getDocs(collection(db, 'contratos'))
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Contrato))
    .filter(c => c.status === 'ativo' || c.status === 'em_renovacao')

  if (!acessoSigilo) lista = lista.filter(c => !c.registroSigiloso)

  if (ordenarPor === 'contratacao') {
    lista.sort((a, b) =>
      timestampToDate(a.dataInicio).getTime() - timestampToDate(b.dataInicio).getTime()
    )
  } else {
    lista.sort((a, b) =>
      timestampToDate(a.dataVencimento).getTime() - timestampToDate(b.dataVencimento).getTime()
    )
  }
  return lista
}

export async function relContratosVencendo(
  diasFuturo: number,
  acessoSigilo = false
): Promise<Contrato[]> {
  const snap = await getDocs(collection(db, 'contratos'))
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const limite = new Date(hoje); limite.setDate(limite.getDate() + diasFuturo)

  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Contrato))
    .filter(c => {
      if (c.status === 'encerrado') return false
      const venc = timestampToDate(c.dataVencimento)
      return venc >= hoje && venc <= limite
    })

  if (!acessoSigilo) lista = lista.filter(c => !c.registroSigiloso)

  lista.sort((a, b) =>
    timestampToDate(a.dataVencimento).getTime() - timestampToDate(b.dataVencimento).getTime()
  )
  return lista
}

export async function relContratosVencidos(
  ordem: 'asc' | 'desc' = 'desc',
  acessoSigilo = false
): Promise<Contrato[]> {
  const snap = await getDocs(collection(db, 'contratos'))
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)

  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Contrato))
    .filter(c => timestampToDate(c.dataVencimento) < hoje)

  if (!acessoSigilo) lista = lista.filter(c => !c.registroSigiloso)

  lista.sort((a, b) => {
    const diff = timestampToDate(a.dataVencimento).getTime() - timestampToDate(b.dataVencimento).getTime()
    return ordem === 'desc' ? -diff : diff
  })
  return lista
}

// ── Tarefas ───────────────────────────────────────────────────────

export interface TarefaComStatus {
  tarefa: TarefaPeriodica
  status: 'em_dia' | 'vence_hoje' | 'atrasada' | 'nunca_executada'
  ultimoRegistro: RegistroTarefa | null
}

async function getTarefasComStatus(): Promise<TarefaComStatus[]> {
  const tarefasSnap = await getDocs(
    query(collection(db, 'tarefas_periodicas'), where('ativo', '==', true))
  )
  const tarefas = tarefasSnap.docs.map(d => ({ id: d.id, ...d.data() } as TarefaPeriodica))

  const registrosSnap = await getDocs(
    query(collection(db, 'registros_tarefas'), orderBy('dataRealizacao', 'desc'))
  )
  const todosRegistros = registrosSnap.docs.map(d => ({ id: d.id, ...d.data() } as RegistroTarefa))

  return tarefas.map(tarefa => {
    const registrosDaTarefa = todosRegistros.filter(r => r.tarefaId === tarefa.id)
    const ultimoRegistro = registrosDaTarefa[0] ?? null
    const status = calcularStatusTarefa(tarefa, ultimoRegistro)
    return { tarefa, status, ultimoRegistro }
  })
}

export async function relTarefasPorResponsavel(): Promise<TarefaComStatus[]> {
  const lista = await getTarefasComStatus()
  return lista.sort((a, b) =>
    a.tarefa.responsavelPadraoNome.localeCompare(b.tarefa.responsavelPadraoNome)
  )
}

export async function relTarefasPorPeriodicidade(): Promise<TarefaComStatus[]> {
  const lista = await getTarefasComStatus()
  const ordem = { semanal: 0, mensal: 1, intervalo: 2 }
  return lista.sort((a, b) =>
    (ordem[a.tarefa.periodicidade.tipo] ?? 9) - (ordem[b.tarefa.periodicidade.tipo] ?? 9)
  )
}

export async function relTarefasAtrasadas(): Promise<TarefaComStatus[]> {
  const lista = await getTarefasComStatus()
  return lista
    .filter(i => i.status === 'atrasada' || i.status === 'nunca_executada')
    .sort((a, b) => {
      // nunca_executada primeiro, depois atrasada
      if (a.status === b.status) return a.tarefa.titulo.localeCompare(b.tarefa.titulo)
      return a.status === 'nunca_executada' ? -1 : 1
    })
}

export interface RegistroNaoConforme extends RegistroTarefa {
  tarefaTitulo: string
}

export async function relTarefasNaoConformidade(periodo?: string): Promise<RegistroNaoConforme[]> {
  const snap = await getDocs(
    query(
      collection(db, 'registros_tarefas'),
      where('conforme', '==', false),
      orderBy('dataRealizacao', 'desc')
    )
  )

  let lista = snap.docs.map(d => ({ id: d.id, ...d.data() } as RegistroNaoConforme))

  if (periodo) {
    const corte = periodoParaDate(periodo)
    if (corte) {
      lista = lista.filter(r => timestampToDate(r.dataRealizacao) >= corte)
    }
  }

  return lista
}

// ── Orçamentos ────────────────────────────────────────────────────

export async function relOrcamentosEmAnalise(acessoSigilo = false): Promise<Orcamento[]> {
  const snap = await getDocs(collection(db, 'orcamentos'))
  snap.docs.forEach(d => console.log(d.id, d.data()))
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Orcamento))
    .filter(o => o.status === 'aberto')
  if (!acessoSigilo) lista = lista.filter(o => !o.registroSigiloso)
  lista.sort((a, b) => timestampToDate(b.criadoEm).getTime() - timestampToDate(a.criadoEm).getTime())
  return lista
}

export async function relOrcamentosContratados(acessoSigilo = false): Promise<Orcamento[]> {
  const snap = await getDocs(collection(db, 'orcamentos'))
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Orcamento))
    .filter(o => o.status === 'concluido' && o.resultado === 'contratado')
  if (!acessoSigilo) lista = lista.filter(o => !o.registroSigiloso)
  lista.sort((a, b) => timestampToDate(b.concluidoEm).getTime() - timestampToDate(a.concluidoEm).getTime())
  return lista
}

export async function relOrcamentosSemCotacao(acessoSigilo = false): Promise<Orcamento[]> {
  const snap = await getDocs(collection(db, 'orcamentos'))
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Orcamento))
    .filter(o => o.status === 'aberto')
  if (!acessoSigilo) lista = lista.filter(o => !o.registroSigiloso)
  lista.sort((a, b) => timestampToDate(a.criadoEm).getTime() - timestampToDate(b.criadoEm).getTime())

  // filtra só os que não têm cotação
  const resultado: Orcamento[] = []
  for (const o of lista) {
    const cotSnap = await getDocs(collection(db, 'orcamentos', o.id, 'cotacoes'))
    if (cotSnap.empty) resultado.push(o)
  }
  return resultado
}

// ── Demandas ──────────────────────────────────────────────────────

async function getAllDemandas(acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  const snap = await getDocs(
    query(collection(db, 'demands'), orderBy('dataCriacao', 'desc'))
  )
  let lista = snap.docs.map(d => ({ id: d.id, ...d.data() } as Demand))
  if (!acessoSigilo) lista = lista.filter(d => !d.registroSigiloso)

  if (periodo) {
    const corte = periodoParaDate(periodo)
    if (corte) lista = lista.filter(d => timestampToDate(d.dataCriacao) >= corte)
  }

  return lista
}

export async function relDemandasPorData(acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  return getAllDemandas(acessoSigilo, periodo)
}

export async function relDemandasPorPrioridade(acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  const lista = await getAllDemandas(acessoSigilo, periodo)
  const ordem = { alta: 0, media: 1, baixa: 2 }
  return lista
    .filter(d => d.status !== 'concluida')
    .sort((a, b) => (ordem[a.prioridade] ?? 9) - (ordem[b.prioridade] ?? 9))
}

export async function relDemandasPorResponsavel(acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  const lista = await getAllDemandas(acessoSigilo, periodo)
  return lista
    .filter(d => d.status !== 'concluida')
    .sort((a, b) => a.responsavelNome.localeCompare(b.responsavelNome))
}

export async function relDemandasPorVencimento(acessoSigilo = false): Promise<Demand[]> {
  const snap = await getDocs(
    query(collection(db, 'demands'), orderBy('dataPrevisao', 'asc'))
  )
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Demand))
    .filter(d => d.status !== 'concluida' && d.dataPrevisao !== null)
  if (!acessoSigilo) lista = lista.filter(d => !d.registroSigiloso)
  return lista
}

export async function relDemandasParadas(acessoSigilo = false, diasSemUpdate = 15): Promise<Demand[]> {
  const snap = await getDocs(
    query(collection(db, 'demands'), where('status', '==', 'em_andamento'))
  )
  let lista = snap.docs.map(d => ({ id: d.id, ...d.data() } as Demand))
  if (!acessoSigilo) lista = lista.filter(d => !d.registroSigiloso)

  const corte = new Date()
  corte.setDate(corte.getDate() - diasSemUpdate)

  return lista
    .filter(d => {
      const atualizacoes = d.atualizacoes ?? []
      if (atualizacoes.length === 0) return true
      const ultima = atualizacoes[atualizacoes.length - 1]
      return timestampToDate(ultima.data) < corte
    })
    .sort((a, b) => {
      // mais paradas primeiro
      const aUlt = (a.atualizacoes ?? []).at(-1)
      const bUlt = (b.atualizacoes ?? []).at(-1)
      return timestampToDate(aUlt?.data).getTime() - timestampToDate(bUlt?.data).getTime()
    })
}

// ── Relatorios de patrimonio ──────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Adicionar este bloco ao arquivo @/lib/relatorios.ts existente
// ─────────────────────────────────────────────────────────────────────────────


// Reaproveita o resumo de contrato já usado no módulo de patrimônio
export interface ContratoVinculoResumo {
  id: string
  fornecedor: string
  objeto: string
  dataVencimento: unknown
  status: string
}

export interface PatrimonioComContrato {
  patrimonio: Patrimonio
  contrato: ContratoVinculoResumo | null
}

export interface ValorPorSetor {
  setor: string
  totalItens: number
  valorTotal: number
}

// ── 1. Lista geral de bens ────────────────────────────────────────────────────
export async function relPatrimonioGeral(): Promise<Patrimonio[]> {
  const q = query(collection(db, 'patrimonios'), orderBy('nome', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patrimonio))
}

// ── 2. Bens com contrato vinculado (+ vencimento) ─────────────────────────────
export async function relPatrimonioComContrato(): Promise<PatrimonioComContrato[]> {
  const [patrimoniosSnap, contratosSnap] = await Promise.all([
    getDocs(query(collection(db, 'patrimonios'), orderBy('nome', 'asc'))),
    getDocs(collection(db, 'contratos')),
  ])

  const contratosMap = new Map<string, ContratoVinculoResumo>()
  contratosSnap.docs.forEach(d => {
    const data = d.data()
    contratosMap.set(d.id, {
      id: d.id,
      fornecedor: data.fornecedor ?? '—',
      objeto: data.objeto ?? '—',
      dataVencimento: data.dataVencimento,
      status: data.status ?? '—',
    })
  })

  const resultado: PatrimonioComContrato[] = []
  patrimoniosSnap.docs.forEach(d => {
    const patrimonio = { id: d.id, ...d.data() } as Patrimonio
    if (patrimonio.possuiContrato && patrimonio.contratoIds?.length) {
      patrimonio.contratoIds.forEach(cid => {
        const contrato = contratosMap.get(cid) ?? null
        resultado.push({ patrimonio, contrato })
      })
    }
  })

  return resultado
}

// ── 3. Bens sem contrato ──────────────────────────────────────────────────────
export async function relPatrimonioSemContrato(): Promise<Patrimonio[]> {
  const q = query(collection(db, 'patrimonios'), orderBy('nome', 'asc'))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Patrimonio))
    .filter(p => !p.possuiContrato || !p.contratoIds?.length)
}

// ── 4. Estado de conservação crítico (Regular / Ruim) ─────────────────────────
export async function relPatrimonioConservacaoCritica(): Promise<Patrimonio[]> {
  const q = query(collection(db, 'patrimonios'), orderBy('nome', 'asc'))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Patrimonio))
    .filter(p => p.estadoConservacao === 'Regular' || p.estadoConservacao === 'Ruim')
    .sort((a, b) => {
      // Ruim primeiro, depois Regular
      const peso = { Ruim: 0, Regular: 1, Bom: 2, Ótimo: 3 } as Record<string, number>
      return (peso[a.estadoConservacao] ?? 9) - (peso[b.estadoConservacao] ?? 9)
    })
}

// ── 5. Valor patrimonial agrupado por setor ───────────────────────────────────
export async function relPatrimonioValorPorSetor(): Promise<ValorPorSetor[]> {
  const q = query(collection(db, 'patrimonios'), orderBy('setor', 'asc'))
  const snap = await getDocs(q)
  const grupos = new Map<string, ValorPorSetor>()

  snap.docs.forEach(d => {
    const p = { id: d.id, ...d.data() } as Patrimonio
    const atual = grupos.get(p.setor) ?? { setor: p.setor, totalItens: 0, valorTotal: 0 }
    atual.totalItens += 1
    atual.valorTotal += p.valorAtual ?? 0
    grupos.set(p.setor, atual)
  })

  return Array.from(grupos.values()).sort((a, b) => b.valorTotal - a.valorTotal)
}