'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/layout/Header'
import { createCotacao, getOrcamento } from '@/lib/firestore'

function formatDoc(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14)
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

export default function NovaCotacaoPage() {
  const router = useRouter()
  const { id: orcamentoId } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  const [tituloOrcamento, setTituloOrcamento] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [contato, setContato] = useState('')
  const [endereco, setEndereco] = useState('')
  const [email, setEmail] = useState('')
  const [site, setSite] = useState('')
  const [tipoServico, setTipoServico] = useState('')
  const [prazo, setPrazo] = useState('')
  const [valor, setValor] = useState('')
  const [condicoesGerais, setCondicoesGerais] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.replace('/auth')
    if (!loading && user && user.role !== 'sindico' && user.role !== 'subsindico') {
      router.replace(`/orcamentos/${orcamentoId}`)
    }
  }, [user, loading, router, orcamentoId])

  useEffect(() => {
    if (!orcamentoId) return
    getOrcamento(orcamentoId).then(o => {
      if (o) setTituloOrcamento(o.titulo)
    })
  }, [orcamentoId])

  async function handleSave() {
    if (!fornecedor.trim()) { setError('Informe o nome do fornecedor.'); return }

    setSaving(true)
    setError('')

    try {
      await createCotacao(orcamentoId, {
        fornecedor: fornecedor.trim(),
        cnpjCpf: cnpjCpf.trim(),
        telefone: telefone.trim(),
        contato: contato.trim(),
        endereco: endereco.trim(),
        email: email.trim(),
        site: site.trim(),
        tipoServico: tipoServico.trim(),
        prazo: prazo.trim(),
        valor: valor ? parseFloat(valor.replace(',', '.')) : null,
        condicoesGerais: condicoesGerais.trim(),
        criadoPor: user!.uid,
      })
      router.replace(`/orcamentos/${orcamentoId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
      setSaving(false)
    }
  }

  if (loading || !user) return null

  return (
    <>
      <Header title="Nova cotação" showBack backHref={`/orcamentos/${orcamentoId}`} />

      <div className="min-h-screen bg-gray-50 pb-36">

        {/* HERO */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4570] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-xs uppercase tracking-widest text-white/70">Orçamentos</p>
            <h1 className="text-2xl font-bold mt-2">Nova cotação</h1>
            {tituloOrcamento && (
              <p className="text-sm text-white/80 mt-1">📋 {tituloOrcamento}</p>
            )}
          </div>
        </div>

        {/* FORNECEDOR */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">🏢 Dados do fornecedor</h2>
          <div className="space-y-4">

            <div>
              <label className="field-label">Nome do fornecedor *</label>
              <input
                type="text"
                className="form-input"
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
                placeholder="Razão social ou nome"
              />
            </div>

            <div>
              <label className="field-label">CNPJ / CPF</label>
              <input
                type="text"
                className="form-input"
                value={cnpjCpf}
                onChange={e => setCnpjCpf(formatDoc(e.target.value))}
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                inputMode="numeric"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Telefone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="field-label">Nome do contato</label>
                <input
                  type="text"
                  className="form-input"
                  value={contato}
                  onChange={e => setContato(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>

            <div>
              <label className="field-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
                inputMode="email"
              />
            </div>

            <div>
              <label className="field-label">Site</label>
              <input
                type="url"
                className="form-input"
                value={site}
                onChange={e => setSite(e.target.value)}
                placeholder="https://www.empresa.com.br"
                inputMode="url"
              />
            </div>

            <div>
              <label className="field-label">Endereço</label>
              <input
                type="text"
                className="form-input"
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

          </div>
        </div>

        {/* PROPOSTA */}
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">💰 Proposta</h2>
          <div className="space-y-4">

            <div>
              <label className="field-label">Tipo de serviço / produto</label>
              <input
                type="text"
                className="form-input"
                value={tipoServico}
                onChange={e => setTipoServico(e.target.value)}
                placeholder="Ex: Pintura em tinta acrílica, 2 demãos"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Valor (R$)</label>
                <input
                  type="text"
                  className="form-input"
                  value={valor}
                  onChange={e => setValor(e.target.value.replace(/[^0-9,.]/g, ''))}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="field-label">Prazo de execução</label>
                <input
                  type="text"
                  className="form-input"
                  value={prazo}
                  onChange={e => setPrazo(e.target.value)}
                  placeholder="Ex: 15 dias úteis"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Condições gerais</label>
              <textarea
                className="form-input min-h-[90px] resize-none"
                value={condicoesGerais}
                onChange={e => setCondicoesGerais(e.target.value)}
                placeholder="Forma de pagamento, garantias, materiais inclusos, exclusões..."
              />
            </div>

          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
          <div className="max-w-md mx-auto space-y-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : '✅ Salvar cotação'}
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