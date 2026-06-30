/**
 * Rota temporária para remover patrimônios duplicados.
 * 
 * Critério: agrupa por `nome` exato. Para cada grupo com mais de 1 documento,
 * mantém o que foi criado primeiro (criadoEm mais antigo) e apaga os demais —
 * MAS só apaga duplicatas que ainda parecem "intactas" (não editadas manualmente):
 * sem numeroSerie, sem dataCompra, sem valorCompra/valorAtual, estadoConservacao === 'Bom',
 * possuiContrato === false.
 * 
 * Isso evita apagar por engano um item que você já começou a editar no app.
 * 
 * Como usar:
 * 1. Salve como src/app/api/limpar-duplicados-patrimonio/route.ts
 * 2. Acesse no navegador: http://localhost:3000/api/limpar-duplicados-patrimonio
 * 3. Confira o retorno JSON com o resumo
 * 4. DELETE este arquivo depois de usar
 */

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

function pareceIntacto(data: Record<string, unknown>): boolean {
  return (
    !data.numeroSerie &&
    !data.dataCompra &&
    !data.valorCompra &&
    !data.valorAtual &&
    !data.modelo &&
    data.estadoConservacao === 'Bom' &&
    data.possuiContrato === false
  )
}

export async function GET() {
  const snap = await adminDb.collection('patrimonios').get()

  const grupos = new Map<string, { id: string; data: Record<string, unknown> }[]>()

  snap.docs.forEach(doc => {
    const data = doc.data()
    const nome = data.nome as string
    if (!grupos.has(nome)) grupos.set(nome, [])
    grupos.get(nome)!.push({ id: doc.id, data })
  })

  const paraApagar: string[] = []
  const mantidos: string[] = []
  const ignoradosPorEdicao: string[] = []

  for (const [nome, docs] of Array.from(grupos.entries())) {
    if (docs.length <= 1) {
      mantidos.push(nome)
      continue
    }

    // Separa os que parecem intactos (candidatos a duplicata) dos editados
    const intactos = docs.filter(d => pareceIntacto(d.data))
    const editados = docs.filter(d => !pareceIntacto(d.data))

    if (editados.length > 0) {
      // Há pelo menos 1 editado: mantém todos os editados, apaga só os intactos extras
      editados.forEach(d => mantidos.push(d.id))
      intactos.forEach(d => paraApagar.push(d.id))
      ignoradosPorEdicao.push(nome)
    } else {
      // Nenhum editado: mantém 1 (o de criadoEm mais antigo), apaga o resto
      const ordenados = [...intactos].sort((a, b) => {
        const ta = (a.data.criadoEm as { toMillis?: () => number })?.toMillis?.() ?? 0
        const tb = (b.data.criadoEm as { toMillis?: () => number })?.toMillis?.() ?? 0
        return ta - tb
      })
      mantidos.push(ordenados[0].id)
      ordenados.slice(1).forEach(d => paraApagar.push(d.id))
    }
  }

  // Apaga em lotes de 450 (limite do batch é 500)
  const chunks: string[][] = []
  for (let i = 0; i < paraApagar.length; i += 450) {
    chunks.push(paraApagar.slice(i, i + 450))
  }

  for (const chunk of chunks) {
    const batch = adminDb.batch()
    chunk.forEach(id => batch.delete(adminDb.collection('patrimonios').doc(id)))
    await batch.commit()
  }

  return NextResponse.json({
    ok: true,
    totalAntes: snap.size,
    totalApagado: paraApagar.length,
    totalRestante: snap.size - paraApagar.length,
    gruposComEdicaoPreservada: ignoradosPorEdicao,
  })
}