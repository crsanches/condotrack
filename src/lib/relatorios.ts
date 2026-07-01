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

export async function relUsuarios(condominioId: string): Promise<CondoUser[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('condominioId', '==', condominioId))
  )
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() } as CondoUser))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function relResponsaveis(condominioId: string): Promise<Responsavel[]> {
  const snap = await getDocs(
    query(collection(db, 'responsaveis'), where('condominioId', '==', condominioId))
  )
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

export async function relFornecedores(condominioId: string): Promise<FornecedorItem[]> {
  const [contratosSnap, orcamentosSnap] = await Promise.all([
    getDocs(query(collection(db, 'contratos'), where('condominioId', '==', condominioId))),
    getDocs(query(collection(db, 'orcamentos'), where('condominioId', '==', condominioId))),
  ])

  const mapa = new Map<string, FornecedorItem>()

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
  condominioId: string,
  ordenarPor: 'contratacao' | 'vencimento',
  acessoSigilo = false
): Promise<Contrato[]> {
  const snap = await getDocs(
    query(collection(db, 'contratos'), where('condominioId', '==', condominioId))
  )
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
  condominioId: string,
  diasFuturo: number,
  acessoSigilo = false
): Promise<Contrato[]> {
  const snap = await getDocs(
    query(collection(db, 'contratos'), where('condominioId', '==', condominioId))
  )
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
  condominioId: string,
  ordem: 'asc' | 'desc' = 'desc',
  acessoSigilo = false
): Promise<Contrato[]> {
  const snap = await getDocs(
    query(collection(db, 'contratos'), where('condominioId', '==', condominioId))
  )
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
async function getTarefasComStatus(condominioId: string): Promise<TarefaComStatus[]> {
  const tarefasSnap = await getDocs(
    query(
      collection(db, 'tarefas_periodicas'),
      where('condominioId', '==', condominioId),
      where('ativo', '==', true)
    )
  )
  const tarefas = tarefasSnap.docs.map(d => ({ id: d.id, ...d.data() } as TarefaPeriodica))
  const tarefaIds = new Set(tarefas.map(t => t.id))

  const registrosSnap = await getDocs(
    query(collection(db, 'registros_tarefas'), orderBy('dataRealizacao', 'desc'))
  )
  const todosRegistros = registrosSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as RegistroTarefa))
    .filter(r => tarefaIds.has(r.tarefaId))

  return tarefas.map(tarefa => {
    const registrosDaTarefa = todosRegistros.filter(r => r.tarefaId === tarefa.id)
    const ultimoRegistro = registrosDaTarefa[0] ?? null
    const status = calcularStatusTarefa(tarefa, ultimoRegistro)
    return { tarefa, status, ultimoRegistro }
  })
}

export async function relTarefasPorResponsavel(condominioId: string): Promise<TarefaComStatus[]> {
  const lista = await getTarefasComStatus(condominioId)
  return lista.sort((a, b) =>
    a.tarefa.responsavelPadraoNome.localeCompare(b.tarefa.responsavelPadraoNome)
  )
}

export async function relTarefasPorPeriodicidade(condominioId: string): Promise<TarefaComStatus[]> {
  const lista = await getTarefasComStatus(condominioId)
  const ordem = { semanal: 0, mensal: 1, intervalo: 2 }
  return lista.sort((a, b) =>
    (ordem[a.tarefa.periodicidade.tipo] ?? 9) - (ordem[b.tarefa.periodicidade.tipo] ?? 9)
  )
}

export async function relTarefasAtrasadas(condominioId: string): Promise<TarefaComStatus[]> {
  const lista = await getTarefasComStatus(condominioId)
  return lista
    .filter(i => i.status === 'atrasada' || i.status === 'nunca_executada')
    .sort((a, b) => {
      if (a.status === b.status) return a.tarefa.titulo.localeCompare(b.tarefa.titulo)
      return a.status === 'nunca_executada' ? -1 : 1
    })
}

export interface RegistroNaoConforme extends RegistroTarefa {
  tarefaTitulo: string
}

export async function relTarefasNaoConformidade(
  condominioId: string,
  periodo?: string
): Promise<RegistroNaoConforme[]> {
  // registros_tarefas não tem condominioId próprio — escopamos via tarefas do condomínio
  const tarefasSnap = await getDocs(
    query(collection(db, 'tarefas_periodicas'), where('condominioId', '==', condominioId))
  )
  const tarefaIds = new Set(tarefasSnap.docs.map(d => d.id))

  const snap = await getDocs(
    query(
      collection(db, 'registros_tarefas'),
      where('conforme', '==', false),
      orderBy('dataRealizacao', 'desc')
    )
  )

  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as RegistroNaoConforme))
    .filter(r => tarefaIds.has(r.tarefaId))

  if (periodo) {
    const corte = periodoParaDate(periodo)
    if (corte) {
      lista = lista.filter(r => timestampToDate(r.dataRealizacao) >= corte)
    }
  }

  return lista
}

// ── Orçamentos ────────────────────────────────────────────────────

export async function relOrcamentosEmAnalise(condominioId: string, acessoSigilo = false): Promise<Orcamento[]> {
  const snap = await getDocs(
    query(collection(db, 'orcamentos'), where('condominioId', '==', condominioId))
  )
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Orcamento))
    .filter(o => o.status === 'aberto')
  if (!acessoSigilo) lista = lista.filter(o => !o.registroSigiloso)
  lista.sort((a, b) => timestampToDate(b.criadoEm).getTime() - timestampToDate(a.criadoEm).getTime())
  return lista
}

export async function relOrcamentosContratados(condominioId: string, acessoSigilo = false): Promise<Orcamento[]> {
  const snap = await getDocs(
    query(collection(db, 'orcamentos'), where('condominioId', '==', condominioId))
  )
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Orcamento))
    .filter(o => o.status === 'concluido' && o.resultado === 'contratado')
  if (!acessoSigilo) lista = lista.filter(o => !o.registroSigiloso)
  lista.sort((a, b) => timestampToDate(b.concluidoEm).getTime() - timestampToDate(a.concluidoEm).getTime())
  return lista
}

export async function relOrcamentosSemCotacao(condominioId: string, acessoSigilo = false): Promise<Orcamento[]> {
  const snap = await getDocs(
    query(collection(db, 'orcamentos'), where('condominioId', '==', condominioId))
  )
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Orcamento))
    .filter(o => o.status === 'aberto')
  if (!acessoSigilo) lista = lista.filter(o => !o.registroSigiloso)
  lista.sort((a, b) => timestampToDate(a.criadoEm).getTime() - timestampToDate(b.criadoEm).getTime())

  const resultado: Orcamento[] = []
  for (const o of lista) {
    const cotSnap = await getDocs(collection(db, 'orcamentos', o.id, 'cotacoes'))
    if (cotSnap.empty) resultado.push(o)
  }
  return resultado
}

// ── Demandas ──────────────────────────────────────────────────────

async function getAllDemandas(condominioId: string, acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  const snap = await getDocs(
    query(collection(db, 'demands'), where('condominioId', '==', condominioId))
  )
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Demand))
    .sort((a, b) => timestampToDate(b.dataCriacao).getTime() - timestampToDate(a.dataCriacao).getTime())

  if (!acessoSigilo) lista = lista.filter(d => !d.registroSigiloso)

  if (periodo) {
    const corte = periodoParaDate(periodo)
    if (corte) lista = lista.filter(d => timestampToDate(d.dataCriacao) >= corte)
  }

  return lista
}

export async function relDemandasPorData(condominioId: string, acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  return getAllDemandas(condominioId, acessoSigilo, periodo)
}

export async function relDemandasPorPrioridade(condominioId: string, acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  const lista = await getAllDemandas(condominioId, acessoSigilo, periodo)
  const ordem = { alta: 0, media: 1, baixa: 2 }
  return lista
    .filter(d => d.status !== 'concluida')
    .sort((a, b) => (ordem[a.prioridade] ?? 9) - (ordem[b.prioridade] ?? 9))
}

export async function relDemandasPorResponsavel(condominioId: string, acessoSigilo = false, periodo?: string): Promise<Demand[]> {
  const lista = await getAllDemandas(condominioId, acessoSigilo, periodo)
  return lista
    .filter(d => d.status !== 'concluida')
    .sort((a, b) => a.responsavelNome.localeCompare(b.responsavelNome))
}

export async function relDemandasPorVencimento(condominioId: string, acessoSigilo = false): Promise<Demand[]> {
  const snap = await getDocs(
    query(collection(db, 'demands'), where('condominioId', '==', condominioId))
  )
  let lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Demand))
    .filter(d => d.status !== 'concluida' && d.dataPrevisao !== null)
    .sort((a, b) => timestampToDate(a.dataPrevisao).getTime() - timestampToDate(b.dataPrevisao).getTime())
  if (!acessoSigilo) lista = lista.filter(d => !d.registroSigiloso)
  return lista
}

export async function relDemandasParadas(condominioId: string, acessoSigilo = false, diasSemUpdate = 15): Promise<Demand[]> {
  const snap = await getDocs(
    query(
      collection(db, 'demands'),
      where('condominioId', '==', condominioId),
      where('status', '==', 'em_andamento')
    )
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
export async function relPatrimonioGeral(condominioId: string): Promise<Patrimonio[]> {
  const snap = await getDocs(
    query(collection(db, 'patrimonios'), where('condominioId', '==', condominioId))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Patrimonio))
    .sort((a, b) => a.nome.localeCompare(b.nome))
}

// ── 2. Bens com contrato vinculado (+ vencimento) ─────────────────────────────
export async function relPatrimonioComContrato(condominioId: string): Promise<PatrimonioComContrato[]> {
  const [patrimoniosSnap, contratosSnap] = await Promise.all([
    getDocs(query(collection(db, 'patrimonios'), where('condominioId', '==', condominioId))),
    getDocs(query(collection(db, 'contratos'), where('condominioId', '==', condominioId))),
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
  patrimoniosSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as Patrimonio))
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .forEach(patrimonio => {
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
export async function relPatrimonioSemContrato(condominioId: string): Promise<Patrimonio[]> {
  const snap = await getDocs(
    query(collection(db, 'patrimonios'), where('condominioId', '==', condominioId))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Patrimonio))
    .filter(p => !p.possuiContrato || !p.contratoIds?.length)
    .sort((a, b) => a.nome.localeCompare(b.nome))
}

// ── 4. Estado de conservação crítico (Regular / Ruim) ─────────────────────────
export async function relPatrimonioConservacaoCritica(condominioId: string): Promise<Patrimonio[]> {
  const snap = await getDocs(
    query(collection(db, 'patrimonios'), where('condominioId', '==', condominioId))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Patrimonio))
    .filter(p => p.estadoConservacao === 'Regular' || p.estadoConservacao === 'Ruim')
    .sort((a, b) => {
      const peso = { Ruim: 0, Regular: 1, Bom: 2, Ótimo: 3 } as Record<string, number>
      return (peso[a.estadoConservacao] ?? 9) - (peso[b.estadoConservacao] ?? 9)
    })
}

// ── 5. Valor patrimonial agrupado por setor ───────────────────────────────────
export async function relPatrimonioValorPorSetor(condominioId: string): Promise<ValorPorSetor[]> {
  const snap = await getDocs(
    query(collection(db, 'patrimonios'), where('condominioId', '==', condominioId))
  )
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