import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import { getUser } from './firestore'

import { deleteApp } from 'firebase/app'

import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { Convite, CondoUser } from '@/types'
import { conviteValido, marcarConviteUsado } from './convites'

export async function signupComConvite(
  convite: Convite,
  dados: {
    name: string
    email: string
    password: string
    telefone?: string
  }
): Promise<CondoUser> {
  const check = conviteValido(convite)
  if (!check.valido) throw new Error(check.motivo)

  if (convite.emailConvidado && convite.emailConvidado.toLowerCase() !== dados.email.toLowerCase()) {
    throw new Error('Este convite foi emitido para outro e-mail.')
  }

  const cred = await createUserWithEmailAndPassword(auth, dados.email, dados.password)

  let condominioId = convite.condominioId

  if (convite.tipo === 'novo_condominio') {
    const condRef = await addDoc(collection(db, 'condominios'), {
      nome: convite.condominioNome || 'Novo Condomínio',
      status: 'trial',
      plano: 'gratis',
      criadoEm: Timestamp.now(),
      criadoPor: cred.user.uid,
    })
    condominioId = condRef.id
  }

  if (!condominioId) throw new Error('Convite inválido: condomínio não definido.')

  const novoUsuario: Omit<CondoUser, 'uid'> = {
    name: dados.name,
    email: dados.email,
    role: convite.role,
    canDelete: convite.role === 'sindico',
    active: true,
    condominioId,
    ...(dados.telefone ? { telefone: dados.telefone, telefoneVerificado: false } : {}),
    criadoEm: Timestamp.now(),
    criadoPor: convite.criadoPor,
  }

  await setDoc(doc(db, 'users', cred.user.uid), novoUsuario)
  await marcarConviteUsado(convite.id, cred.user.uid)

  return { uid: cred.user.uid, ...novoUsuario }
}

export async function changePassword(
  senhaAtual: string,
  novaSenha: string
): Promise<void> {
  const current = auth.currentUser
  if (!current || !current.email) throw new Error('Nenhum usuário autenticado.')

  const credential = EmailAuthProvider.credential(current.email, senhaAtual)
  try {
    await reauthenticateWithCredential(current, credential)
  } catch {
    throw new Error('Senha atual incorreta.')
  }

  await updatePassword(current, novaSenha)
}


export async function login(email: string, password: string): Promise<CondoUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const user = await getUser(cred.user.uid)
  if (!user) throw new Error('Usuário não encontrado no sistema.')
  if (!user.active) throw new Error('Usuário inativo. Contate o síndico.')
  return user
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// Verifica senha de um segundo usuário sem fazer logout do atual
// Usa uma segunda instância do auth (workaround seguro para client-side)
export async function verifySecondUser(email: string, password: string): Promise<CondoUser> {
  const { initializeApp } = await import('firebase/app')
  const { getAuth, signInWithEmailAndPassword: signIn } = await import('firebase/auth')

  // Cria app temporário para não interferir na sessão atual
  const tempApp = initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    `temp-${Date.now()}`
  )
  const tempAuth = getAuth(tempApp)

  try {
    const cred = await signIn(tempAuth, email, password)
    const user = await getUser(cred.user.uid)
    if (!user) throw new Error('Usuário não encontrado.')
    if (!user.canDelete) throw new Error('Este usuário não tem permissão para autorizar exclusões.')
    return user
  } finally {
    await tempAuth.signOut()
    await deleteApp(tempApp)
  }
}
