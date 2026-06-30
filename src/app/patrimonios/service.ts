import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Patrimonio,
  PatrimonioFormData,
  PatrimonioOpcoes,
  CATEGORIAS_DEFAULT,
  SETORES_DEFAULT,
} from '@/types'

const CONDO_ID = 'default'
const opcoesDocRef = () => doc(db, 'patrimonioOpcoes', CONDO_ID)

// ─── Patrimônios ─────────────────────────────────────────────────────────────

export async function getPatrimonios(): Promise<Patrimonio[]> {
  const q = query(
    collection(db, 'patrimonios'),
    orderBy('nome', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patrimonio))
}

export async function getPatrimonio(id: string): Promise<Patrimonio | null> {
  const snap = await getDoc(doc(db, 'patrimonios', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Patrimonio
}

export async function createPatrimonio(data: PatrimonioFormData): Promise<string> {
  const ref = await addDoc(collection(db, 'patrimonios'), {
    ...data,
    contratoIds: data.contratoIds ?? [],
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return ref.id
}

export async function updatePatrimonio(
  id: string,
  data: Partial<PatrimonioFormData>
): Promise<void> {
  await updateDoc(doc(db, 'patrimonios', id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  })
}

export async function deletePatrimonio(id: string): Promise<void> {
  await deleteDoc(doc(db, 'patrimonios', id))
}

// ─── Opções (categorias + setores) ───────────────────────────────────────────

export async function getPatrimonioOpcoes(): Promise<PatrimonioOpcoes> {
  const snap = await getDoc(opcoesDocRef())
  if (snap.exists()) return snap.data() as PatrimonioOpcoes
  const defaults: PatrimonioOpcoes = {
    id: CONDO_ID,
    categorias: CATEGORIAS_DEFAULT,
    setores: SETORES_DEFAULT,
  }
  await setDoc(opcoesDocRef(), defaults)
  return defaults
}

export async function addCategoria(
  nova: string,
  opcoes: PatrimonioOpcoes
): Promise<PatrimonioOpcoes> {
  const updated = {
    ...opcoes,
    categorias: [...opcoes.categorias, nova].sort(),
  }
  await setDoc(opcoesDocRef(), updated)
  return updated
}

export async function addSetor(
  novo: string,
  opcoes: PatrimonioOpcoes
): Promise<PatrimonioOpcoes> {
  const updated = {
    ...opcoes,
    setores: [...opcoes.setores, novo].sort(),
  }
  await setDoc(opcoesDocRef(), updated)
  return updated
}

// ─── Contratos disponíveis ───────────────────────────────────────────────────

export interface ContratoResumo {
  id: string
  titulo: string
  fornecedor?: string
  status?: string
}

export async function getContratosAtivos(): Promise<ContratoResumo[]> {
  const q = query(
    collection(db, 'contratos'),
    orderBy('titulo', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    titulo: d.data().titulo ?? '(sem título)',
    fornecedor: d.data().fornecedor,
    status: d.data().status,
  }))
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

export function calcularIdadeEmMeses(dataCompra?: { toDate(): Date } | null): number | null {
  if (!dataCompra) return null
  const hoje = new Date()
  const compra = dataCompra.toDate()
  return (
    (hoje.getFullYear() - compra.getFullYear()) * 12 +
    (hoje.getMonth() - compra.getMonth())
  )
}