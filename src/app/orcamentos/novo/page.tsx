'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { createOrcamento } from '@/lib/firestore'

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [registroSigiloso, setRegistroSigiloso] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
    if (!loading && user && user.role !== 'sindico' && user.role !== 'subsindico') {
      router.replace('/orcamentos')
    }
  }, [user, loading, router])

  async function handleSave() {
    if (!titulo.trim()) { setError('Informe o título do orçamento.'); return }
    if (!descricao.trim()) { setError('Informe a descrição da necessidade/serviço.'); return }

    setSaving(true)
    setError('')

    try {
      const id = await createOrcamento({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        registroSigiloso,
        criadoPor: user!.uid,
        criadoEm: undefined as never, // definido pelo Firestore
      })
      router.replace(`/orcamentos/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
      setSaving(false)
    }
  }

  if (loading || !user) return null

  return (
    <>
      <Header title="Novo orçamento" showBack backHref="/orcamentos" />

      <div className="min-h-screen bg-gray-50 pb-36">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Orçamentos</p>
            <h1 className="text-2xl font-bold mt-2">Novo orçamento</h1>
            <p className="text-sm text-white/80 mt-2">
              Defina o serviço/necessidade e depois adicione as cotações dos fornecedores.
            </p>
          </div>
        </div>

        {/* DADOS GERAIS */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📋 Identificação</h2>
          <div className="space-y-4">

            <div>
              <label className="field-label">Título *</label>
              <input
                type="text"
                className="form-input"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Pintura da fachada 2025"
              />
            </div>

            <div>
              <label className="field-label">Descrição da necessidade / serviço *</label>
              <textarea
                className="form-input min-h-[100px] resize-none"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva o que será contratado, especificações técnicas, área afetada, etc."
              />
            </div>

            {/* SIGILO */}
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-amber-800">🔒 Registro sigiloso</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Visível apenas para membros com acesso a dados sigilosos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegistroSigiloso(v => !v)}
                className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  registroSigiloso ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  registroSigiloso ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

          </div>
        </div>

        <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-700">
            💡 Após salvar, você poderá adicionar as cotações dos fornecedores.
          </p>
        </div>

        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
          <div className="max-w-md mx-auto space-y-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : '✅ Criar orçamento'}
            </button>
            <button onClick={() => router.back()} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>

      </div>
    </>
  )
}