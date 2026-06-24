'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import {
    getAllResponsaveis,
    createResponsavel,
    updateResponsavel,
    inativarResponsavel,
  } from '@/lib/firestore'
import type { Responsavel } from '@/types'

export default function ResponsaveisPage() {
  const [responsaveis, setResponsaveis] =
    useState<Responsavel[]>([])

  const [loading, setLoading] =
    useState(true)

  const [showForm, setShowForm] =
    useState(false)
  
  const [nome, setNome] =
    useState('')
  
  const [email, setEmail] =
    useState('')
  
  const [role, setRole] =
    useState<'administrativo' | 'operacional'>(
      'operacional'
    )
  
  const [saving, setSaving] =
    useState(false)

    const [editingId, setEditingId] =
    useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data =
        await getAllResponsaveis()

      setResponsaveis(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {

    if (!nome.trim()) return
  
    setSaving(true)
  
    try {
  
      if (editingId) {
  
        await updateResponsavel(
          editingId,
          {
            nome: nome.trim(),
            email: email.trim(),
            role,
          }
        )
  
      } else {
  
        await createResponsavel({
          nome: nome.trim(),
          email: email.trim(),
          role,
        })
  
      }
  
      setNome('')
      setEmail('')
      setRole('operacional')
  
      setEditingId(null)
  
      setShowForm(false)
  
      await load()
  
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header
        title="Responsáveis"
        showBack
        backHref="/admin"
      />

      <div className="min-h-screen bg-gray-50">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-5 text-white shadow-lg">

            <p className="text-xs uppercase tracking-widest text-white/70">
              Administração
            </p>

            <h1 className="text-2xl font-bold mt-2">
              Responsáveis
            </h1>

            <p className="text-sm text-white/80 mt-2">
              {responsaveis.length} responsáveis cadastrados
            </p>

          </div>
        </div>

        {/* BOTÃO NOVO */}
        <div className="px-4 mt-4">

        <button
            onClick={() => setShowForm(true)}
            className="
                w-full
                bg-[#1a2744]
                text-white
                rounded-3xl
                p-4
                font-medium
            "
            >
            ➕ Novo Responsável
            </button>

        </div>

        {/* LISTA */}
        <div className="px-4 mt-4 pb-8">

          {loading ? (

            <div className="bg-white rounded-3xl p-6 text-center">
              Carregando...
            </div>

          ) : (

            <div className="space-y-3">

              {responsaveis.map(r => (

                <div
                  key={r.id}
                  className="
                    bg-white
                    rounded-3xl
                    border
                    border-gray-100
                    shadow-sm
                    p-4
                  "
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="font-semibold text-gray-900">
                        {r.nome}
                      </div>

                      {r.email && (
                        <div className="text-sm text-gray-500">
                          {r.email}
                        </div>
                      )}

                      <div className="text-xs text-gray-400 mt-1">
                        {r.role}
                      </div>
                      <div className="flex gap-2 mt-3">

                        <button
                        onClick={() => {

                            setEditingId(r.id)

                            setNome(r.nome)

                            setEmail(r.email || '')

                            setRole(r.role)

                            setShowForm(true)
                        }}
                        className="
                            px-3
                            py-2
                            rounded-xl
                            bg-blue-100
                            text-blue-800
                            text-xs
                            font-medium
                        "
                        >
                        ✏️ Editar
                        </button>

                        <button
                        onClick={async () => {

                            if (
                            !confirm(
                                `Inativar ${r.nome}?`
                            )
                            ) return

                            await inativarResponsavel(
                            r.id
                            )

                            await load()
                        }}
                        className="
                            px-3
                            py-2
                            rounded-xl
                            bg-red-100
                            text-red-700
                            text-xs
                            font-medium
                        "
                        >
                        🚫 Inativar
                        </button>

                        </div>
                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

{/* MODAL NOVO RESPONSÁVEL */}
{showForm && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-3xl p-6 w-[90%] max-w-md shadow-xl">

      <h2 className="text-xl font-semibold mb-4">
            {editingId
        ? 'Editar Responsável'
        : 'Novo Responsável'}
      </h2>

      <div className="space-y-4">

        <div>
          <label className="field-label">
            Nome *
          </label>

          <input
            type="text"
            className="form-input"
            value={nome}
            onChange={(e) =>
              setNome(e.target.value)
            }
          />
        </div>

        <div>
          <label className="field-label">
            Email
          </label>

          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </div>

        <div>
          <label className="field-label">
            Tipo
          </label>

          <select
            className="form-input"
            value={role}
            onChange={(e) =>
              setRole(
                e.target.value as
                  | 'administrativo'
                  | 'operacional'
              )
            }
          >
            <option value="operacional">
              Operacional
            </option>

            <option value="administrativo">
              Administrativo
            </option>
          </select>
        </div>

      </div>

      <div className="flex gap-3 mt-6">

        <button
          type="button"
          onClick={() => {
            setShowForm(false)
            setNome('')
            setEmail('')
            setRole('operacional')
          }}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="btn-primary flex-1"
        >
          {saving
            ? 'Salvando...'
            : 'Salvar'}
        </button>

      </div>

    </div>

  </div>
)}

      </div>
    </>

  )
}