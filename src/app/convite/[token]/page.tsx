'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getConvite, conviteValido } from '@/lib/convites'
import { signupComConvite } from '@/lib/auth'
import type { Convite } from '@/types'
import { TIPO_CONVITE_LABELS, ROLE_LABELS } from '@/types'

export default function ConvitePage() {
  const router = useRouter()
  const { token } = useParams<{ token: string }>()

  const [convite, setConvite] = useState<Convite | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroInicial, setErroInicial] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!token) return
    getConvite(token).then(c => {
      if (!c) { setErroInicial('Convite não encontrado.'); setCarregando(false); return }
      const check = conviteValido(c)
      if (!check.valido) { setErroInicial(check.motivo || 'Convite inválido.'); setCarregando(false); return }
      setConvite(c)
      if (c.emailConvidado) setEmail(c.emailConvidado)
      setCarregando(false)
    })
  }, [token])

  async function handleSubmit() {
    setErro('')
    if (!name.trim()) { setErro('Informe seu nome.'); return }
    if (!email.trim()) { setErro('Informe seu e-mail.'); return }
    if (password.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setErro('As senhas não coincidem.'); return }
    if (!convite) return

    setSubmitting(true)
    try {
      await signupComConvite(convite, {
        name: name.trim(),
        email: email.trim(),
        password,
        telefone: telefone.trim() || undefined,
      })
      router.replace('/dashboard')
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar conta.')
    } finally {
      setSubmitting(false)
    }
  }

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Carregando convite...</p>
    </div>
  )

  if (erroInicial) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center max-w-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="font-semibold text-gray-800">{erroInicial}</p>
        <p className="text-sm text-gray-400 mt-2">Entre em contato com quem enviou este link.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm mx-auto w-full">

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#1a2744] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Bem-vindo ao CondoTrack</h1>
          <p className="text-sm text-gray-500 mt-1">
            {convite?.tipo === 'novo_condominio'
              ? `Você está criando o acesso para "${convite.condominioNome}"`
              : `Você foi convidado como ${ROLE_LABELS[convite!.role]}`}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="field-label">Nome completo</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">E-mail</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={!!convite?.emailConvidado}
            />
          </div>
          <div>
            <label className="field-label">Telefone (WhatsApp)</label>
            <input
              type="tel"
              className="form-input"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="5511999999999"
            />
          </div>
          <div>
            <label className="field-label">Senha</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Confirmar senha</label>
            <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>

          {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

          <button className="btn-primary mt-2" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </div>
      </div>
    </div>
  )
}