import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'




const itens = [
    // ── SALÃO DE JOGOS ──────────────────────────────────────────────────────────
    { nome: 'Mesa com cadeiras (conjunto 8 lugares)', quantidade: 2, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Mesa de bilhar', quantidade: 1, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Mesa de pebolim', quantidade: 1, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Estante com vasos decorativos', quantidade: 1, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Televisão Samsung', quantidade: 1, setor: 'Salão de Festas', categoria: 'Equipamento Elétrico' },
    { nome: 'Ar-condicionado', quantidade: 1, setor: 'Salão de Festas', categoria: 'Climatização' },
    { nome: 'Quadro decorativo', quantidade: 1, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Taco de bilhar', quantidade: 4, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Bola de bilhar azul', quantidade: 5, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Bola de bilhar amarela', quantidade: 5, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Bola de bilhar branca', quantidade: 1, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Bola de bilhar colorida', quantidade: 8, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Bola de pebolim', quantidade: 3, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Lustre', quantidade: 2, setor: 'Salão de Festas', categoria: 'Equipamento Elétrico' },
   
    // ── ZELADORIA ───────────────────────────────────────────────────────────────
    { nome: 'Impressora HP', quantidade: 1, setor: 'Administração', categoria: 'TI / Informática' },
    { nome: 'Notebook Dell', quantidade: 1, setor: 'Administração', categoria: 'TI / Informática' },
    { nome: 'Mesa', quantidade: 2, setor: 'Administração', categoria: 'Mobiliário' },
    { nome: 'Cadeira', quantidade: 2, setor: 'Administração', categoria: 'Mobiliário' },
    { nome: 'Arco de serra', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Grifo', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Jogo de chave Allen', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Jogo de broca', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Armário', quantidade: 1, setor: 'Administração', categoria: 'Mobiliário' },
    { nome: 'Armário de arquivo', quantidade: 2, setor: 'Administração', categoria: 'Mobiliário' },
    { nome: 'Luminária da garagem', quantidade: 13, setor: 'Subsolo / Garagem', categoria: 'Equipamento Elétrico' },
    { nome: 'Alicate de bico', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Alicate de corte', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Alicate universal', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Refil de filtro da portaria', quantidade: 3, setor: 'Portaria', categoria: 'Outro' },
    { nome: 'Chave de fenda', quantidade: 3, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Chave Philips', quantidade: 2, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Chave de boca', quantidade: 4, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Luminária das escadas', quantidade: 3, setor: 'Hall / Circulação', categoria: 'Equipamento Elétrico' },
    { nome: 'Lâmpada de emergência', quantidade: 6, setor: 'Hall / Circulação', categoria: 'Equipamento Elétrico' },
    { nome: 'Marreta', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Trena', quantidade: 1, setor: 'Administração', categoria: 'Ferramenta' },
    { nome: 'Pilha palito Duracell', quantidade: 11, setor: 'Administração', categoria: 'Outro' },
    { nome: 'Pilha AA Duracell', quantidade: 3, setor: 'Administração', categoria: 'Outro' },
    { nome: 'Sensor de presença da garagem', quantidade: 1, setor: 'Subsolo / Garagem', categoria: 'Equipamento de Segurança' },
    { nome: 'Sensor de presença da escadaria', quantidade: 1, setor: 'Hall / Circulação', categoria: 'Equipamento de Segurança' },
    { nome: 'Sensor de presença do hall', quantidade: 5, setor: 'Hall / Circulação', categoria: 'Equipamento de Segurança' },
    { nome: 'Correia dos exaustores', quantidade: 1, setor: 'Administração', categoria: 'Outro' },
   
    // ── BRINQUEDOTECA ───────────────────────────────────────────────────────────
    { nome: 'Ar-condicionado', quantidade: 1, setor: 'Playground', categoria: 'Climatização' },
    { nome: 'Mesa pequena com cadeiras (conjunto 3 lugares)', quantidade: 1, setor: 'Playground', categoria: 'Mobiliário' },
    { nome: 'Fogão de brinquedo', quantidade: 1, setor: 'Playground', categoria: 'Outro' },
    { nome: 'Piscina de bolinha', quantidade: 1, setor: 'Playground', categoria: 'Outro' },
   
    // ── ACADEMIA ────────────────────────────────────────────────────────────────
    { nome: 'Esteira Life Fitness', quantidade: 3, setor: 'Academia', categoria: 'Equipamento Elétrico' },
    { nome: 'Bicicleta ergométrica Life Fitness', quantidade: 2, setor: 'Academia', categoria: 'Equipamento Elétrico' },
    { nome: 'Elíptico Life Fitness', quantidade: 1, setor: 'Academia', categoria: 'Equipamento Elétrico' },
    { nome: 'Lower Body Exercise', quantidade: 1, setor: 'Academia', categoria: 'Mobiliário' },
    { nome: 'Aparelho para abdômen e pernas', quantidade: 1, setor: 'Academia', categoria: 'Mobiliário' },
    { nome: 'Ar-condicionado', quantidade: 3, setor: 'Academia', categoria: 'Climatização' },
    { nome: 'Televisão Samsung', quantidade: 1, setor: 'Academia', categoria: 'Equipamento Elétrico' },
    { nome: 'Bebedouro IBBL', quantidade: 1, setor: 'Academia', categoria: 'Equipamento Elétrico' },
    { nome: 'Jump (cama elástica pequena)', quantidade: 2, setor: 'Academia', categoria: 'Mobiliário' },
    { nome: 'Bola de pilates', quantidade: 3, setor: 'Academia', categoria: 'Outro' },
    { nome: 'Roda abdominal', quantidade: 1, setor: 'Academia', categoria: 'Outro' },
    { nome: 'Halteres (conjunto 1kg a 10kg)', quantidade: 10, setor: 'Academia', categoria: 'Outro' },
   
    // ── PISCINA ─────────────────────────────────────────────────────────────────
    { nome: 'Aquecedor de piscina', quantidade: 1, setor: 'Piscina', categoria: 'Hidráulico' },
    { nome: 'Sofá de 1 lugar', quantidade: 3, setor: 'Piscina', categoria: 'Mobiliário' },
    { nome: 'Sofá de 2 lugares', quantidade: 2, setor: 'Piscina', categoria: 'Mobiliário' },
    { nome: 'Espreguiçadeira', quantidade: 11, setor: 'Piscina', categoria: 'Mobiliário' },
    { nome: 'Colchonete', quantidade: 2, setor: 'Piscina', categoria: 'Outro' },
    { nome: 'Almofada', quantidade: 2, setor: 'Piscina', categoria: 'Outro' },
   
    // ── CHURRASQUEIRA ───────────────────────────────────────────────────────────
    { nome: 'Mesa de madeira com cadeiras (conjunto 8 lugares)', quantidade: 1, setor: 'Jardim / Área Externa', categoria: 'Mobiliário' },
    { nome: 'Kit pizza (5 peças)', quantidade: 1, setor: 'Jardim / Área Externa', categoria: 'Outro' },
    { nome: 'Geladeira', quantidade: 1, setor: 'Jardim / Área Externa', categoria: 'Equipamento Elétrico' },
    { nome: 'Televisão Samsung', quantidade: 1, setor: 'Jardim / Área Externa', categoria: 'Equipamento Elétrico' },
    { nome: 'Vaso decorativo', quantidade: 5, setor: 'Jardim / Área Externa', categoria: 'Outro' },
    { nome: 'Bebedouro', quantidade: 1, setor: 'Jardim / Área Externa', categoria: 'Equipamento Elétrico' },
   
    // ── SALÃO DE FESTAS ─────────────────────────────────────────────────────────
    { nome: 'Mesa de centro', quantidade: 3, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Sofá fixo', quantidade: 1, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Almofada cinza', quantidade: 10, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Ar-condicionado', quantidade: 2, setor: 'Salão de Festas', categoria: 'Climatização' },
    { nome: 'Televisão', quantidade: 1, setor: 'Salão de Festas', categoria: 'Equipamento Elétrico' },
    { nome: 'Quadro decorativo', quantidade: 4, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Vaso grande decorativo', quantidade: 4, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Luminária pendente', quantidade: 3, setor: 'Salão de Festas', categoria: 'Equipamento Elétrico' },
    { nome: 'Vaso branco decorativo', quantidade: 2, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Aparador', quantidade: 1, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Mesa de centro adicional', quantidade: 1, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Micro-ondas', quantidade: 1, setor: 'Salão de Festas', categoria: 'Equipamento Elétrico' },
    { nome: 'Geladeira', quantidade: 1, setor: 'Salão de Festas', categoria: 'Equipamento Elétrico' },
    { nome: 'Cooktop', quantidade: 1, setor: 'Salão de Festas', categoria: 'Equipamento Elétrico' },
    { nome: 'Lixeira', quantidade: 4, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Cortina', quantidade: 6, setor: 'Salão de Festas', categoria: 'Mobiliário' },
    { nome: 'Dispenser', quantidade: 2, setor: 'Salão de Festas', categoria: 'Outro' },
    { nome: 'Assento', quantidade: 2, setor: 'Salão de Festas', categoria: 'Mobiliário' },
  ]

export async function GET() {
  const batch = adminDb.batch()
  let count = 0

  for (const item of itens) {
    for (let i = 1; i <= item.quantidade; i++) {
      const nome = item.quantidade > 1 ? `${item.nome} (${i}/${item.quantidade})` : item.nome
      const ref = adminDb.collection('patrimonios').doc()
      batch.set(ref, {
        nome,
        categoria: item.categoria,
        setor: item.setor,
        estadoConservacao: 'Bom',
        possuiContrato: false,
        contratoIds: [],
        criadoEm: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp(),
      })
      count++
    }
  }

  await batch.commit()
  return NextResponse.json({ ok: true, total: count })
}