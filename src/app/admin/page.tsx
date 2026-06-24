'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getAllUsers } from '@/lib/firestore'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import type { CondoUser, UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<CondoUser[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('conselheiro')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'sindico')) router.replace('/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    getAllUsers().then(setUsers)
  }, [])

  const refreshUsers = () => getAllUsers().then(setUsers)

  const handleCreate = async () => {
    if (!name || !email || !password) { setError('Preencha todos os campos.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      })
      
     // const result = await response.json()
     const text = await response.text()

     

      if (!response.ok) {
        throw new Error(text)
      }
      setSuccess(`Usuário ${name} criado com sucesso!`)
      setName(''); setEmail(''); setPassword(''); setRole('conselheiro')
      setShowForm(false)
      refreshUsers()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar usuário.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: CondoUser) => {
    await setDoc(doc(db, 'users', u.uid), { ...u, active: !u.active })
    refreshUsers()
  }
  const ativos = users.filter(u => u.active).length
  const inativos = users.filter(u => !u.active).length
  if (loading || !user) return null

  return (
      <>
  <Header
    title="Administrar usuários"
    showBack
    backHref="/dashboard"
  />

  <div className="min-h-screen bg-gray-50">

    {/* HERO */}
    <div className="px-4 pt-4">
      <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">

        <p className="text-xs uppercase tracking-widest text-white/70">
          Administração
        </p>

        <h1 className="text-2xl font-bold mt-2">
          Usuários do Condomínio
        </h1>

        <p className="text-sm text-white/80 mt-2">
          Gerencie acessos, cargos e permissões.
        </p>

      </div>
    </div>

    {/* RESUMO */}
    <div className="px-4 mt-4">
      <div className="grid grid-cols-3 gap-3">

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase">
            Total
          </p>
          <p className="text-2xl font-bold text-[#1a2744] mt-1">
            {users.length}
          </p>
        </div>

        <div className="bg-green-50 rounded-3xl p-4 border border-green-100">
          <p className="text-xs text-green-600 uppercase">
            Ativos
          </p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {ativos}
          </p>
        </div>

        <div className="bg-gray-100 rounded-3xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">
            Inativos
          </p>
          <p className="text-2xl font-bold text-gray-700 mt-1">
            {inativos}
          </p>
        </div>

      </div>
    </div>

    {/* ALERTAS */}
    <div className="px-4 mt-4">

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

    </div>

    {/* NOVO USUÁRIO */}
    <div className="px-4 mt-4">

      <button
        className="btn-primary"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm
          ? 'Fechar formulário'
          : '➕ Novo usuário'}
      </button>

    </div>

    {/* FORM */}
    {showForm && (
      <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">

        <h2 className="font-semibold text-gray-800 mb-4">
          👤 Criar usuário
        </h2>

        <div className="space-y-4">

          <div>
            <label className="field-label">
              Nome completo
            </label>

            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">
              E-mail
            </label>

            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">
              Senha inicial
            </label>

            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">
              Cargo
            </label>

            <select
              className="form-input"
              value={role}
              onChange={e =>
                setRole(e.target.value as UserRole)
              }
            >
              <option value="sindico">
                Síndico
              </option>

              <option value="subsindico">
                Subsíndico
              </option>

              <option value="conselheiro">
                Conselheiro
              </option>
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving
              ? 'Criando usuário...'
              : 'Criar usuário'}
          </button>

        </div>

      </div>
    )}

    {/* LISTA */}
    <div className="px-4 mt-5 pb-8">

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Usuários cadastrados
      </h2>

      <div className="space-y-3">

        {users.map(u => {

          const initials = u.name
            .split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <div
              key={u.uid}
              className="
                bg-white
                rounded-3xl
                border
                border-gray-100
                shadow-sm
                p-4
                flex
                items-center
                gap-4
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-full
                  bg-[#1a2744]
                  text-white
                  flex
                  items-center
                  justify-center
                  font-bold
                "
              >
                {initials}
              </div>

              <div className="flex-1 min-w-0">

                <p className="font-semibold text-gray-900 truncate">
                  {u.name}
                </p>

                <p className="text-sm text-gray-500 truncate">
                  {u.email}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {ROLE_LABELS[u.role]}
                </p>

              </div>

              {u.uid !== user.uid && (
                <button
                  onClick={() => toggleActive(u)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                    u.active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {u.active
                    ? 'Ativo'
                    : 'Inativo'}
                </button>
              )}

            </div>
          )
        })}

      </div>

    </div>

  </div>
</>
  )
}
