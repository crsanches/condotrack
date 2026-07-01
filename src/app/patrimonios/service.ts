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

const opcoesDocRef = (condominioId: string) => doc(db, 'patrimonioOpcoes', condominioId)

// ─── Patrimônios ─────────────────────────────────────────────────────────────

export async function getPatrimonios(condominioId: string): Promise<Patrimonio[]> {
  const q = query(
    collection(db, 'patrimonios'),
    where('condominioId', '==', condominioId),
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

export async function createPatrimonio(
  condominioId: string,
  data: PatrimonioFormData
): Promise<string> {
  // Remove campos undefined (Firestore não aceita undefined)
  const limpo = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )
  const ref = await addDoc(collection(db, 'patrimonios'), {
    ...limpo,
    condominioId,
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
  // Remove campos undefined (Firestore não aceita undefined em updateDoc)
  const limpo = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )
  await updateDoc(doc(db, 'patrimonios', id), {
    ...limpo,
    atualizadoEm: serverTimestamp(),
  })
}

export async function deletePatrimonio(id: string): Promise<void> {
  await deleteDoc(doc(db, 'patrimonios', id))
}

// ─── Opções (categorias + setores) ───────────────────────────────────────────

export async function getPatrimonioOpcoes(condominioId: string): Promise<PatrimonioOpcoes> {
  const snap = await getDoc(opcoesDocRef(condominioId))
  if (snap.exists()) return snap.data() as PatrimonioOpcoes
  const defaults: PatrimonioOpcoes = {
    id: condominioId,
    categorias: CATEGORIAS_DEFAULT,
    setores: SETORES_DEFAULT,
  }
  await setDoc(opcoesDocRef(condominioId), defaults)
  return defaults
}

export async function addCategoria(
  condominioId: string,
  nova: string,
  opcoes: PatrimonioOpcoes
): Promise<PatrimonioOpcoes> {
  const updated = {
    ...opcoes,
    categorias: [...opcoes.categorias, nova].sort(),
  }
  await setDoc(opcoesDocRef(condominioId), updated)
  return updated
}

export async function addSetor(
  condominioId: string,
  novo: string,
  opcoes: PatrimonioOpcoes
): Promise<PatrimonioOpcoes> {
  const updated = {
    ...opcoes,
    setores: [...opcoes.setores, novo].sort(),
  }
  await setDoc(opcoesDocRef(condominioId), updated)
  return updated
}

// ─── Contratos disponíveis ───────────────────────────────────────────────────

export interface ContratoResumo {
  id: string
  titulo: string
  fornecedor?: string
  status?: string
}

export async function getContratosAtivos(condominioId: string): Promise<ContratoResumo[]> {
  const q = query(
    collection(db, 'contratos'),
    where('condominioId', '==', condominioId),
    orderBy('fornecedor', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      titulo: data.objeto ?? data.titulo ?? '(sem descrição)',
      fornecedor: data.fornecedor,
      status: data.status,
    }
  })
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