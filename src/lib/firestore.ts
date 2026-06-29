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
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Demand, DemandUpdate, CondoUser, DemandStatus, Priority, DemandType, Responsavel,TarefaPeriodica,
  RegistroTarefa,
  Contrato,
  StatusTarefa, Cotacao, Orcamento, ObservacaoOrcamento, ResultadoOrcamento} from '@/types'
  import { v4 as uuidv4 } from 'uuid'


   


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
  acessoSigilo?: boolean  
}): Promise<string> {

  const ref = await addDoc(
    collection(db, 'responsaveis'),
    {
      nome: data.nome,
      email: data.email || '',
      role: data.role,
      acessoSigilo: data.acessoSigilo ?? false,  
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
  callback: (demands: Demand[]) => void,
  acessoSigilo = false  
) {
  const q = query(
    collection(db, 'demands'),
    orderBy('dataCriacao', 'desc')
  )

  return onSnapshot(q, (snap) => {
    let demands = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Demand)
    )
      // ── filtro sigilo ──────────────────────────────
      if (!acessoSigilo) {
        demands = demands.filter(d => !d.registroSigiloso)
      }
      // ──────────────────────────────────────────────
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
  registroSigiloso?: boolean 
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
    acessoSigilo?: boolean 
  }
): Promise<void> {

  await updateDoc(
    doc(db, 'responsaveis', id),
    {
      nome: data.nome,
      email: data.email || '',
      role: data.role,
      acessoSigilo: data.acessoSigilo ?? false, 
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

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  if (!ultimoRegistro) {
    return 'nunca_executada'
  }

  const ultima = ultimoRegistro.dataRealizacao.toDate()
  ultima.setHours(0, 0, 0, 0)

  const p = tarefa.periodicidade

  // ==========================================================
  // INTERVALO
  // ==========================================================

  if (p.tipo === 'intervalo') {

    const vencimento = new Date(ultima)
    vencimento.setDate(vencimento.getDate() + p.diasIntervalo)

    if (hoje.getTime() < vencimento.getTime()) {
      return 'em_dia'
    }

    if (hoje.getTime() === vencimento.getTime()) {
      return 'vence_hoje'
    }

    return 'atrasada'
  }

  // ==========================================================
  // MENSAL
  // ==========================================================

  if (p.tipo === 'mensal') {

    const diaHoje = hoje.getDate()

    if (diaHoje < p.diaDoMes) {
      return 'em_dia'
    }

    const executouNesteMes =
      ultima.getMonth() === hoje.getMonth() &&
      ultima.getFullYear() === hoje.getFullYear() &&
      ultima.getDate() >= p.diaDoMes

    if (executouNesteMes) {
      return 'em_dia'
    }

    if (diaHoje === p.diaDoMes) {
      return 'vence_hoje'
    }

    return 'atrasada'
  }

  // ==========================================================
  // SEMANAL
  // ==========================================================

  if (p.tipo === 'semanal') {

    const hojeSemana = hoje.getDay()

    if (!p.diasSemana.includes(hojeSemana)) {

      // Não é dia da tarefa.
      // Se já passou o último dia previsto sem executar, está atrasada.

      const ultimoDia = Math.max(
        ...p.diasSemana.filter(d => d <= hojeSemana),
        -1
      )

      if (ultimoDia === -1) {
        return 'em_dia'
      }

      const referencia = new Date(hoje)
      referencia.setDate(
        hoje.getDate() - (hojeSemana - ultimoDia)
      )
      referencia.setHours(0,0,0,0)

      if (ultima < referencia) {
        return 'atrasada'
      }

      return 'em_dia'
    }

    // Hoje é um dos dias previstos.

    const executouHoje =
      ultima.getTime() === hoje.getTime()

    if (executouHoje) {
      return 'em_dia'
    }

    return 'vence_hoje'
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

export function subscribeToTarefas(
  callback: (tarefas: TarefaPeriodica[]) => void
) {
  const q = query(
    collection(db, 'tarefas_periodicas'),
    orderBy('titulo')
  )

  return onSnapshot(q, snap => {
    callback(
      snap.docs.map(
        d => ({ id: d.id, ...d.data() } as TarefaPeriodica)
      )
    )
  })
}
export function subscribeToRegistros(
  callback: () => void
) {
  return onSnapshot(
    collection(db, 'registros_tarefas'),
    () => callback()
  )
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

//console log
  console.log('Registro criado:', {
    tarefa: data.tarefaTitulo,
    data: data.dataRealizacao.toDate()
  })
  return ref.id
}

// ── Contratos ──────────────────────────────────────────────────────

export async function getAllContratos(acessoSigilo = false): Promise<Contrato[]> {
  const snap = await getDocs(
    query(collection(db, 'contratos'), orderBy('dataVencimento'))
  )
  let contratos = snap.docs.map(d => ({ id: d.id, ...d.data() } as Contrato))

  if (!acessoSigilo) {
    contratos = contratos.filter(c => !c.registroSigiloso)
  }

  return contratos
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



// ── Orçamentos ────────────────────────────────────────────────────────────────
 
export async function createOrcamento(
  data: Omit<Orcamento, 'id' | 'status' | 'resultado' | 'contratoId' | 'concluidoEm' | 'concluidoPor' | 'observacoes' | 'totalCotacoes'>
): Promise<string> {
  const ref = collection(db, 'orcamentos')
  const docRef = await addDoc(ref, {
    ...data,
    status: 'aberto',
    resultado: null,
    contratoId: null,
    concluidoEm: null,
    concluidoPor: null,
    observacoes: [],
    criadoEm: Timestamp.now(),
  })
  return docRef.id
}
 
export async function getAllOrcamentos(): Promise<Orcamento[]> {
  const ref = collection(db,  'orcamentos')
  const snap = await getDocs(query(ref, orderBy('criadoEm', 'desc')))
  const orcamentos: Orcamento[] = []
 
  for (const d of snap.docs) {
    const cotacoesSnap = await getDocs(
      collection(db,  'orcamentos', d.id, 'cotacoes')
    )
    orcamentos.push({
      ...(d.data() as Omit<Orcamento, 'id' | 'totalCotacoes'>),
      id: d.id,
      totalCotacoes: cotacoesSnap.size,
    })
  }
  return orcamentos
}
 
export async function getOrcamento(id: string): Promise<Orcamento | null> {
  const ref = doc(db, 'orcamentos', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { ...(snap.data() as Omit<Orcamento, 'id'>), id: snap.id }
}
 
export async function updateOrcamento(id: string, data: Partial<Orcamento>): Promise<void> {
  const ref = doc(db,  'orcamentos', id)
  await updateDoc(ref, data as any)
}
 
export async function deleteOrcamento(id: string): Promise<void> {
  // Apaga subcoleção de cotações primeiro
  const cotacoesSnap = await getDocs(
    collection(db,  'orcamentos', id, 'cotacoes')
  )
  for (const d of cotacoesSnap.docs) {
    await deleteDoc(d.ref)
  }
  await deleteDoc(doc(db,  'orcamentos', id))
}
 
export async function concluirOrcamento(
  id: string,
  resultado: ResultadoOrcamento,
  concluidoPor: string,
  cotacaoSelecionadaId?: string
): Promise<void> {
  const ref = doc(db,  'orcamentos', id)
  await updateDoc(ref, {
    status: 'concluido',
    resultado,
    concluidoEm: Timestamp.now(),
    concluidoPor,
  })
 
  if (cotacaoSelecionadaId) {
    const cotacoesSnap = await getDocs(
      collection(db,  'orcamentos', id, 'cotacoes')
    )
    for (const d of cotacoesSnap.docs) {
      await updateDoc(d.ref, { selecionada: d.id === cotacaoSelecionadaId })
    }
  }
}
 
export async function addObservacaoOrcamento(
  orcamentoId: string,
  obs: Omit<ObservacaoOrcamento, 'id' | 'criadoEm'>
): Promise<void> {
  const ref = doc(db,  'orcamentos', orcamentoId)
  const novaObs: ObservacaoOrcamento = {
    id: uuidv4(),
    ...obs,
    criadoEm: Timestamp.now(),
  }
  await updateDoc(ref, { observacoes: arrayUnion(novaObs) })
}
 
// ── Cotações ──────────────────────────────────────────────────────────────────
 
export async function createCotacao(
  orcamentoId: string,
  data: Omit<Cotacao, 'id' | 'orcamentoId' | 'selecionada' | 'criadoEm'>
): Promise<string> {
  const ref = collection(db,  'orcamentos', orcamentoId, 'cotacoes')
  const docRef = await addDoc(ref, {
    ...data,
    orcamentoId,
    selecionada: false,
    criadoEm: Timestamp.now(),
  })
  return docRef.id
}
 
export async function getCotacoes(orcamentoId: string): Promise<Cotacao[]> {
  const ref = collection(db,  'orcamentos', orcamentoId, 'cotacoes')
  const snap = await getDocs(query(ref, orderBy('criadoEm', 'asc')))
  return snap.docs.map(d => ({ ...(d.data() as Omit<Cotacao, 'id'>), id: d.id }))
}
 
export async function deleteCotacao(orcamentoId: string, cotacaoId: string): Promise<void> {
  await deleteDoc(
    doc(db, 'orcamentos', orcamentoId, 'cotacoes', cotacaoId)
  )
} 