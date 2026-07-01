'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { createConvite, getAllConvites, cancelarConvite } from '@/lib/convites'
import { getAllCondominios } from '@/lib/firestore'
import type { Convite, TipoConvite, UserRole, Condominio } from '@/types'
import { TIPO_CONVITE_LABELS, STATUS_CONVITE_LABELS, ROLE_LABELS } from '@/types'

export default function ConvitesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [convites, setConvites] = useState<Convite[]>([])
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [tipo, setTipo] = useState<TipoConvite>('novo_condominio')
  const [condominioNome, setCondominioNome] = useState('')
  const [condominioId, setCondominioId] = useState('')
  const [role, setRole] = useState<UserRole>('sindico')
  const [emailConvidado, setEmailConvidado] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [linkGerado, setLinkGerado] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) router.replace('/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoadingData(true)
    try {
      const [c, cs] = await Promise.all([getAllConvites(), getAllCondominios()])
      setConvites(c)
      setCondominios(cs)
    } finally {
      setLoadingData(false)
    }
  }

  async function handleCreate() {
    setError('')
    if (tipo === 'novo_condominio' && !condominioNome.trim()) {
      setError('Informe o nome do condomínio.')
      return
    }
    if (tipo === 'usuario_existente' && !condominioId) {
      setError('Selecione o condomínio.')
      return
    }

    setSaving(true)
    try {
      const convite = await createConvite(user!.uid, {
        tipo,
        role,
        ...(tipo === 'novo_condominio' ? { condominioNome: condominioNome.trim() } : {}),
        ...(tipo === 'usuario_existente' ? { condominioId } : {}),
        ...(emailConvidado.trim() ? { emailConvidado: emailConvidado.trim() } : {}),
      })
      setLinkGerado(`${window.location.origin}/convite/${convite.id}`)
      setCondominioNome('')
      setCondominioId('')
      setEmailConvidado('')
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar convite.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelar(token: string) {
    if (!confirm('Cancelar este convite?')) return
    await cancelarConvite(token)
    await load()
  }

  function copiarLink(token: string) {
    const link = `${window.location.origin}/convite/${token}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  if (loading || !user) return null

  return (
    <>
      <Header title="Convites" showBack backHref="/admin" />

      <div className="min-h-screen bg-gray-50 pb-12">

        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Plataforma</p>
            <h1 className="text-2xl font-bold mt-2">Convites</h1>
            <p className="text-sm text-white/80 mt-2">Gere acesso para novos condomínios ou usuários.</p>
          </div>
        </div>

        {/* FORM */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">➕ Novo convite</h2>

          <div className="space-y-4">
            <div>
              <label className="field-label">Tipo</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['novo_condominio', 'usuario_existente'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`h-14 rounded-2xl border-2 text-xs font-medium transition-all ${
                      tipo === t
                        ? 'bg-[#1a2744] border-[#1a2744] text-white'
                        : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    {TIPO_CONVITE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {tipo === 'novo_condominio' ? (
              <div>
                <label className="field-label">Nome do condomínio *</label>
                <input
                  type="text"
                  className="form-input"
                  value={condominioNome}
                  onChange={e => setCondominioNome(e.target.value)}
                  placeholder="Ex: Edifício Aurora"
                />
              </div>
            ) : (
              <div>
                <label className="field-label">Condomínio *</label>
                <select
                  className="form-input"
                  value={condominioId}
                  onChange={e => setCondominioId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {condominios.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="field-label">Cargo do convidado</label>
              <select
                className="form-input"
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
              >
                <option value="sindico">Síndico</option>
                <option value="subsindico">Subsíndico</option>
                <option value="conselheiro">Conselheiro</option>
                <option value="zelador">Zelador</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="field-label">E-mail do convidado (opcional)</label>
              <input
                type="email"
                className="form-input"
                value={emailConvidado}
                onChange={e => setEmailConvidado(e.target.value)}
                placeholder="Deixe em branco para permitir qualquer e-mail"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? 'Gerando...' : '🔗 Gerar convite'}
            </button>

            {linkGerado && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-xs text-green-700 mb-1">Link gerado (válido por 7 dias):</p>
                <p className="text-sm font-mono text-green-800 break-all">{linkGerado}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(linkGerado); alert('Copiado!') }}
                  className="mt-2 text-xs font-semibold text-green-700 underline"
                >
                  Copiar link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LISTA */}
        <div className="px-4 mt-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Convites emitidos
          </h2>

          {loadingData ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : convites.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum convite gerado ainda.</p>
          ) : (
            <div className="space-y-3">
              {convites.map(c => (
                <div key={c.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {TIPO_CONVITE_LABELS[c.tipo]}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.condominioNome || c.condominioId} · {ROLE_LABELS[c.role]}
                      </p>
                      {c.emailConvidado && (
                        <p className="text-xs text-gray-400">{c.emailConvidado}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                      c.status === 'pendente' ? 'bg-amber-50 text-amber-700' :
                      c.status === 'usado'    ? 'bg-green-50 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {STATUS_CONVITE_LABELS[c.status]}
                    </span>
                  </div>
                  {c.status === 'pendente' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => copiarLink(c.id)}
                        className="text-xs font-medium text-[#1a2744] bg-gray-100 px-3 py-1.5 rounded-xl"
                      >
                        Copiar link
                      </button>
                      <button
                        onClick={() => handleCancelar(c.id)}
                        className="text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-xl"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}