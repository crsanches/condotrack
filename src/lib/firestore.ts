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
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Demand, DemandUpdate, CondoUser, DemandStatus, Priority, DemandType, Responsavel } from '@/types'


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


