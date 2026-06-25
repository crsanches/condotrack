'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import {
  getTarefa,
  createRegistroTarefa,
  getAllResponsaveis,
} from '@/lib/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Timestamp } from 'firebase/firestore'
import type { TarefaPeriodica, Responsavel } from '@/types'

export default function RegistrarTarefaPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [tarefa, setTarefa] = useState<TarefaPeriodica | null>(null)
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [responsavelId, setResponsavelId] = useState('')
  const [dataRealizacao, setDataRealizacao] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [observacao, setObservacao] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!id) return
    getTarefa(id).then(t => {
      setTarefa(t)
      if (t) setResponsavelId(t.responsavelPadraoId)
    })
    getAllResponsaveis().then(setResponsaveis)
  }, [id])

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  function removerFoto() {
    setFoto(null)
    setFotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!responsavelId) { setError('Selecione o responsável.'); return }
    if (!dataRealizacao) { setError('Informe a data de realização.'); return }
    if (!tarefa || !user) return

    setSaving(true)
    setError('')

    try {
      let fotoUrl: string | undefined

      if (foto) {
        const storageRef = ref(
          storage,
          `fotos/tarefas/${tarefa.id}/${Date.now()}_${foto.name}`
        )
        await uploadBytes(storageRef, foto)
        fotoUrl = await getDownloadURL(storageRef)
      }

      const responsavel = responsaveis.find(r => r.id === responsavelId)

      await createRegistroTarefa({
        tarefaId: tarefa.id,
        tarefaTitulo: tarefa.titulo,
        dataRealizacao: Timestamp.fromDate(
          new Date(dataRealizacao + 'T12:00:00')
        ),
        responsavelId,
        responsavelNome: responsavel?.nome || '',
        observacao: observacao.trim() || undefined,
        ...(fotoUrl ? { fotoUrl } : {}),  // ← só inclui se existir
      })

      router.replace(`/tarefas/${tarefa.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user || !tarefa) return null

  return (
    <>
      <Header title="Registrar execução" showBack backHref={`/tarefas/${id}`} />

      <div className="min-h-screen bg-gray-50 pb-36">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">
              Registro de execução
            </p>
            <h1 className="text-xl font-bold mt-2 leading-snug">
              {tarefa.titulo}
            </h1>
            {tarefa.descricao && (
              <p className="text-sm text-white/75 mt-2">
                {tarefa.descricao}
              </p>
            )}
          </div>
        </div>

        {/* DADOS */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">📋 Dados da execução</h2>

          <div>
            <label className="field-label">Data de realização *</label>
            <input
              type="date"
              className="form-input"
              value={dataRealizacao}
              onChange={e => setDataRealizacao(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Responsável *</label>
            <select
              className="form-input"
              value={responsavelId}
              onChange={e => setResponsavelId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {responsaveis.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Observação</label>
            <textarea
              className="form-input min-h-[100px] resize-none"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Descreva como foi a execução, problemas encontrados..."
            />
          </div>
        </div>

        {/* FOTO */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📷 Foto (opcional)</h2>

          {fotoPreview ? (
            <div className="relative">
              <img
                src={fotoPreview}
                alt="Preview"
                className="w-full rounded-2xl object-cover max-h-64"
              />
              <button
                onClick={removerFoto}
                className="
                  absolute top-2 right-2
                  bg-red-500 text-white
                  rounded-full w-8 h-8
                  flex items-center justify-center
                  text-sm font-bold shadow-md
                "
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="
                w-full border-2 border-dashed border-gray-200
                rounded-2xl p-8
                flex flex-col items-center justify-center gap-2
                text-gray-400 hover:border-gray-300 hover:bg-gray-50
                transition-all
              "
            >
              <span className="text-4xl">📷</span>
              <span className="text-sm font-medium">Toque para adicionar foto</span>
              <span className="text-xs">JPG, PNG até 10MB</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFotoChange}
          />
        </div>

        {/* ERRO */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
          <div className="max-w-md mx-auto space-y-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Salvando...' : '✅ Confirmar execução'}
            </button>
            <button
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>

      </div>
    </>
  )
}