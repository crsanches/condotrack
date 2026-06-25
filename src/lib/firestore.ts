import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  limit as firestoreLimit, 
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Demand, DemandUpdate, CondoUser, DemandStatus, Priority, DemandType, Responsavel,TarefaPeriodica,
  RegistroTarefa,
  Contrato,
  StatusTarefa, } from '@/types'



// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<CondoUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as CondoUser) : null
}

export async function getAllUsers(): Promise<CondoUser[]> {
  const snap = await getDocs(query(collection(db, 'users'), where('active', '==', true)))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as CondoUser))
}


// ── Responsáveis ─────────────────────────────────────────────────────────────────────
export async function getAllResponsaveis(): Promise<Responsavel[]> {
  const snap = await getDocs(
    query(
      collection(db, 'responsaveis'),
      where('active', '==', true)
    )
  )

  return snap.docs.map(
    d =>
      ({
        id: d.id,
        ...d.data(),
      }) as Responsavel
  )
}



// ── Criar Responsáveis ─────────────────────────────────────────────────────────────────────
export async function createResponsavel(data: {
  nome: string
  email?: string
  role: 'administrativo' | 'operacional'
}): Promise<string> {

  const ref = await addDoc(
    collection(db, 'responsaveis'),
    {
      nome: data.nome,
      email: data.email || '',
      role: data.role,
      active: true,
    }
  )

  return ref.id
}

// ── Demands ───────────────────────────────────────────────────────────────────

export interface DemandFilters {
  status?: DemandStatus
  prioridade?: Priority
  tipo?: DemandType
  responsavel?: string
}

export function subscribeToDemands(
  filters: DemandFilters,
  callback: (demands: Demand[]) => void
) {
  const q = query(
    collection(db, 'demands'),
    orderBy('dataCriacao', 'desc')
  )

  return onSnapshot(q, (snap) => {
    let demands = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Demand)
    )

    if (filters.status) {
      demands = demands.filter(
        d => d.status === filters.status
      )
    }

    if (filters.prioridade) {
      demands = demands.filter(
        d => d.prioridade === filters.prioridade
      )
    }

    if (filters.tipo) {
      demands = demands.filter(
        d => d.tipo === filters.tipo
      )
    }

    if (filters.responsavel) {
      demands = demands.filter(
        d => d.responsavelId === filters.responsavel
      )
    }

    callback(demands)
  })
}

export async function getDemand(id: string): Promise<Demand | null> {
  const snap = await getDoc(doc(db, 'demands', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Demand) : null
}

export interface CreateDemandData {
  titulo: string
  tipo: DemandType
  prioridade: Priority
  responsavelId: string
  responsavelNome: string
  status: DemandStatus
  dataPrevisao: Timestamp | null
  dataConclusao: Timestamp | null
  criadoPor: string
  primeiraAtualizacao?: string
}

export async function createDemand(data: CreateDemandData): Promise<string> {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, 'demands'), {
    ...data,
    dataCriacao: now,
    atualizacoes: [
      {
        data: now,
        texto: data.primeiraAtualizacao || 'Demanda registrada.',
        autor: data.criadoPor,
      },
    ],
  })
  return ref.id
}

export async function updateDemand(
  id: string,
  data: Partial<Omit<Demand, 'id' | 'atualizacoes' | 'dataCriacao'>>
): Promise<void> {
  await updateDoc(doc(db, 'demands', id), data)
}

export async function addUpdate(
  id: string,
  update: Omit<DemandUpdate, 'data'>,
  currentUpdates: DemandUpdate[]
): Promise<void> {
  const newUpdate: DemandUpdate = { ...update, data: Timestamp.now() }
  await updateDoc(doc(db, 'demands', id), {
    atualizacoes: [...currentUpdates, newUpdate],
  })
}

export async function deleteDemand(id: string): Promise<void> {
  await deleteDoc(doc(db, 'demands', id))
}

export async function getDemandStats(): Promise<{
  total: number
  abertas: number
  em_andamento: number
  concluidas: number
}> {
  const snap = await getDocs(collection(db, 'demands'))
  const demands = snap.docs.map((d) => d.data() as Demand)
  return {
    total: demands.length,
    abertas: demands.filter((d) => d.status === 'aberta').length,
    em_andamento: demands.filter((d) => d.status === 'em_andamento').length,
    concluidas: demands.filter((d) => d.status === 'concluida').length,
  }
}

export async function updateResponsavel(
  id: string,
  data: {
    nome: string
    email?: string
    role: 'administrativo' | 'operacional'
  }
): Promise<void> {

  await updateDoc(
    doc(db, 'responsaveis', id),
    {
      nome: data.nome,
      email: data.email || '',
      role: data.role,
    }
  )
}

export async function inativarResponsavel(
  id: string
): Promise<void> {

  await updateDoc(
    doc(db, 'responsaveis', id),
    {
      active: false,
    }
  )
}

export async function getRecentDemands(limit = 5): Promise<Demand[]> {
  const q = query(
    collection(db, 'demands'),
    orderBy('dataCriacao', 'desc'),
    firestoreLimit(limit)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Demand))
}

export function calcularStatusTarefa(
  tarefa: TarefaPeriodica,
  ultimoRegistro: RegistroTarefa | null
): StatusTarefa {
  if (!ultimoRegistro) return 'nunca_executada'

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const ultima = ultimoRegistro.dataRealizacao.toDate()
  ultima.setHours(0, 0, 0, 0)

  const p = tarefa.periodicidade

  if (p.tipo === 'intervalo') {
    const proxima = new Date(ultima)
    proxima.setDate(proxima.getDate() + p.diasIntervalo)
    if (proxima < hoje) return 'atrasada'
    if (proxima.getTime() === hoje.getTime()) return 'vence_hoje'
    return 'em_dia'
  }

  if (p.tipo === 'mensal') {
    const proxima = new Date(ultima)
    proxima.setMonth(proxima.getMonth() + 1)
    proxima.setDate(p.diaDoMes)
    if (proxima < hoje) return 'atrasada'
    if (proxima.getTime() === hoje.getTime()) return 'vence_hoje'
    return 'em_dia'
  }

  if (p.tipo === 'semanal') {
    // verifica se hoje é um dos dias previstos e já foi executada esta semana
    const diaSemanaHoje = hoje.getDay()
    const diasOrdenados = [...p.diasSemana].sort((a, b) => a - b)

    // acha o último dia previsto até hoje
    const ultimoDiaPrevisto = diasOrdenados
      .filter(d => d <= diaSemanaHoje)
      .at(-1)

    if (ultimoDiaPrevisto === undefined) {
      // o próximo dia previsto é na semana que vem — verifica semana passada
      const ultimoDiaSemanaPassada = diasOrdenados.at(-1)!
      const referencia = new Date(hoje)
      referencia.setDate(hoje.getDate() - (7 - ultimoDiaSemanaPassada + diaSemanaHoje))
      referencia.setHours(0, 0, 0, 0)
      if (ultima < referencia) return 'atrasada'
      return 'em_dia'
    }

    const referencia = new Date(hoje)
    referencia.setDate(hoje.getDate() - (diaSemanaHoje - ultimoDiaPrevisto))
    referencia.setHours(0, 0, 0, 0)

    if (ultima < referencia) return 'atrasada'
    if (diaSemanaHoje === ultimoDiaPrevisto && ultima.getTime() === referencia.getTime()) return 'vence_hoje'
    return 'em_dia'
  }

  return 'em_dia'
}

// ── Tarefas Periódicas ─────────────────────────────────────────────

export async function getAllTarefas(): Promise<TarefaPeriodica[]> {
  const snap = await getDocs(
    query(collection(db, 'tarefas_periodicas'), orderBy('titulo'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TarefaPeriodica))
}

export async function getTarefa(id: string): Promise<TarefaPeriodica | null> {
  const snap = await getDoc(doc(db, 'tarefas_periodicas', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as TarefaPeriodica) : null
}

export async function createTarefa(
  data: Omit<TarefaPeriodica, 'id' | 'criadoEm'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'tarefas_periodicas'), {
    ...data,
    criadoEm: Timestamp.now(),
  })
  return ref.id
}

export async function updateTarefa(
  id: string,
  data: Partial<Omit<TarefaPeriodica, 'id' | 'criadoEm'>>
): Promise<void> {
  await updateDoc(doc(db, 'tarefas_periodicas', id), data)
}

// ── Registros de Tarefas ───────────────────────────────────────────

export async function getRegistrosTarefa(tarefaId: string): Promise<RegistroTarefa[]> {
  const snap = await getDocs(
    query(
      collection(db, 'registros_tarefas'),
      where('tarefaId', '==', tarefaId),
      orderBy('dataRealizacao', 'desc')
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as RegistroTarefa))
}

export async function getUltimoRegistro(tarefaId: string): Promise<RegistroTarefa | null> {
  const snap = await getDocs(
    query(
      collection(db, 'registros_tarefas'),
      where('tarefaId', '==', tarefaId),
      orderBy('dataRealizacao', 'desc'),
      firestoreLimit(1)
    )
  )
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as RegistroTarefa
}

export async function createRegistroTarefa(
  data: Omit<RegistroTarefa, 'id' | 'criadoEm'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'registros_tarefas'), {
    ...data,
    criadoEm: Timestamp.now(),
  })
  return ref.id
}

// ── Contratos ──────────────────────────────────────────────────────

export async function getAllContratos(): Promise<Contrato[]> {
  const snap = await getDocs(
    query(collection(db, 'contratos'), orderBy('dataVencimento'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Contrato))
}

export async function getContrato(id: string): Promise<Contrato | null> {
  const snap = await getDoc(doc(db, 'contratos', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Contrato) : null
}

export async function createContrato(
  data: Omit<Contrato, 'id' | 'criadoEm'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'contratos'), {
    ...data,
    criadoEm: Timestamp.now(),
  })
  return ref.id
}

export async function updateContrato(
  id: string,
  data: Partial<Omit<Contrato, 'id' | 'criadoEm'>>
): Promise<void> {
  await updateDoc(doc(db, 'contratos', id), data)
}