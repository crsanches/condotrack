'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

export default function AuthPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  const handleLogin = async () => {
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao entrar.'
      setError(msg.includes('auth/') ? 'E-mail ou senha incorretos.' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-[#1a2744] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏢</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">CondoTrack</h2>
        <p className="text-sm text-gray-500 mt-1">Gestão de demandas do condomínio</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="field-label">E-mail</label>
          <input
            type="email"
            className="form-input"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div>
          <label className="field-label">Senha</label>
          <input
            type="password"
            className="form-input"
            placeholder="Sua senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          className="btn-primary mt-2"
          onClick={handleLogin}
          disabled={submitting}
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
