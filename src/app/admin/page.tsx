'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getAllUsers, updateUser } from '@/lib/firestore'
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

  const [editingUid, setEditingUid] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('conselheiro')
  const [editTelefone, setEditTelefone] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'sindico')) router.replace('/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    if (!user?.condominioId) return
    refreshUsers()
  }, [user?.condominioId])

  const refreshUsers = () => {
    if (!user?.condominioId) return
    getAllUsers(user.condominioId).then(setUsers)
  }

  const toggleActive = async (u: CondoUser) => {
    await updateUser(u.uid, { active: !u.active })
    refreshUsers()
  }

  function openEdit(u: CondoUser) {
    setEditingUid(u.uid)
    setEditName(u.name)
    setEditRole(u.role)
    setEditTelefone(u.telefone || '')
  }

  async function handleEditSave() {
    if (!editingUid || !editName.trim()) return
    setEditSaving(true)
    try {
      await updateUser(editingUid, {
        name: editName.trim(),
        role: editRole,
        telefone: editTelefone.trim() || undefined,
      })
      setEditingUid(null)
      refreshUsers()
    } finally {
      setEditSaving(false)
    }
  }

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
              : '👤 Criar novo usuário'}
          </button>

        </div>

        {/* RESPONSÁVEIS */}
        <div className="px-4 mt-3">

          <button
            onClick={() =>
              router.push('/admin/responsaveis')
            }
            className="
              w-full
              bg-blue-300
              border
              border-blue-200
              rounded-3xl
              p-4
              shadow-sm
              flex
              items-center
              justify-center
              gap-3
              hover:bg-blue-200
              transition-colors
            "
          >
            <span className="text-xl">👥</span>

            <span className="font-medium text-green-900">
              Gerenciar Responsáveis
            </span>

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

                  <option value="zelador">
                    Zelador
                  </option>

                  <option value="outros">
                    Outros
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
                      flex-shrink-0
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

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(u)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700"
                    >
                      ✏️ Editar
                    </button>
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

                </div>
              )
            })}

          </div>

        </div>

      </div>

      {/* MODAL EDITAR */}
      {editingUid && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-[90%] max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Editar usuário</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Nome *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Telefone (WhatsApp)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editTelefone}
                  onChange={e => setEditTelefone(e.target.value)}
                  placeholder="5511999999999"
                />
              </div>
              <div>
                <label className="field-label">Cargo</label>
                <select
                  className="form-input"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                >
                  <option value="sindico">Síndico</option>
                  <option value="subsindico">Subsíndico</option>
                  <option value="conselheiro">Conselheiro</option>
                  <option value="zelador">Zelador</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setEditingUid(null)}>
                Cancelar
              </button>
              <button className="btn-primary flex-1" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}