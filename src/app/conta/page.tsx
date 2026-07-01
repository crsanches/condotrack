'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { changePassword } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { ROLE_LABELS } from '@/types'

export default function ContaPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  async function handleChangePassword() {
    setError('')
    setSuccess('')
    if (!senhaAtual) { setError('Informe sua senha atual.'); return }
    if (novaSenha.length < 6) { setError('A nova senha deve ter ao menos 6 caracteres.'); return }
    if (novaSenha !== confirmaSenha) { setError('As senhas não coincidem.'); return }

    setSaving(true)
    try {
      await changePassword(senhaAtual, novaSenha)
      setSuccess('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmaSenha('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar senha.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  return (
    <>
      <Header title="Minha conta" showBack backHref="/dashboard" />

      <div className="min-h-screen bg-gray-50 pb-12">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Conta</p>
            <h1 className="text-xl font-bold mt-2">{user.name}</h1>
            <p className="text-sm text-white/80 mt-1">{user.email}</p>
            <p className="text-xs text-white/60 mt-1">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        </div>

        {/* ALTERAR SENHA */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">🔒 Alterar senha</h2>

          <div className="space-y-4">
            <div>
              <label className="field-label">Senha atual</label>
              <input
                type="password"
                className="form-input"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Nova senha</label>
              <input
                type="password"
                className="form-input"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Confirmar nova senha</label>
              <input
                type="password"
                className="form-input"
                value={confirmaSenha}
                onChange={e => setConfirmaSenha(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button onClick={handleChangePassword} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}