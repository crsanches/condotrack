import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import { getUser } from './firestore'
import type { CondoUser } from '@/types'
import { deleteApp } from 'firebase/app'

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
