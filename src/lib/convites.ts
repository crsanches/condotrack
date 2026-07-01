import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    Timestamp,
  } from 'firebase/firestore'
  import { db } from './firebase'
  import type { Convite, TipoConvite, UserRole } from '@/types'
  
  function gerarToken(): string {
    // token opaco, url-safe, sem depender de libs externas
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  }
  
  const DIAS_EXPIRACAO = 7
  
  export async function createConvite(
    criadoPor: string,
    data: {
      tipo: TipoConvite
      role: UserRole
      condominioNome?: string   // obrigatório se tipo = 'novo_condominio'
      condominioId?: string     // obrigatório se tipo = 'usuario_existente'
      emailConvidado?: string
    }
  ): Promise<Convite> {
    const token = gerarToken()
    const agora = Timestamp.now()
    const expira = Timestamp.fromDate(
      new Date(Date.now() + DIAS_EXPIRACAO * 24 * 60 * 60 * 1000)
    )
  
    const convite: Convite = {
      id: token,
      tipo: data.tipo,
      status: 'pendente',
      role: data.role,
      criadoPor,
      criadoEm: agora,
      expiraEm: expira,
      ...(data.condominioNome ? { condominioNome: data.condominioNome } : {}),
      ...(data.condominioId ? { condominioId: data.condominioId } : {}),
      ...(data.emailConvidado ? { emailConvidado: data.emailConvidado } : {}),
    }
  
    await setDoc(doc(db, 'convites', token), convite)
    return convite
  }
  
  export async function getConvite(token: string): Promise<Convite | null> {
    const snap = await getDoc(doc(db, 'convites', token))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Convite) : null
  }
  
  export async function getAllConvites(): Promise<Convite[]> {
    const snap = await getDocs(collection(db, 'convites'))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Convite))
      .sort((a, b) => b.criadoEm.toMillis() - a.criadoEm.toMillis())
  }
  
  export async function cancelarConvite(token: string): Promise<void> {
    await updateDoc(doc(db, 'convites', token), { status: 'cancelado' })
  }
  
  export function conviteValido(convite: Convite): { valido: boolean; motivo?: string } {
    if (convite.status === 'usado') return { valido: false, motivo: 'Este convite já foi utilizado.' }
    if (convite.status === 'cancelado') return { valido: false, motivo: 'Este convite foi cancelado.' }
    if (convite.expiraEm.toMillis() < Date.now()) return { valido: false, motivo: 'Este convite expirou.' }
    return { valido: true }
  }
  
  export async function marcarConviteUsado(token: string, usadoPor: string): Promise<void> {
    await updateDoc(doc(db, 'convites', token), {
      status: 'usado',
      usadoEm: Timestamp.now(),
      usadoPor,
    })
  }