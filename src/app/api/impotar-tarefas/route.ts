import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebaseAdmin'

type Periodicidade = 'Diária' | 'Mensal' | 'Semestral'

interface Tarefa {
  titulo: string
  periodicidade: Periodicidade
  tipo: string
}

const CONFIG = {
  condominioId: 'DIDkBFJO0SKKZwccTSy8',
  criadoPor: 'D7WrInePEHhpxFGuLLWqNFO19Lo2',
  responsavelPadraoId: 'a3iRyulBssvRLjuIakzl',
  responsavelPadraoNome: 'Tavares - Zelador',
}

function montarPeriodicidade(periodicidade: Periodicidade) {
  switch (periodicidade) {
    case 'Diária':
      return {
        tipo: 'semanal',
        diasSemana: [1, 2, 3, 4, 5],
      }

    case 'Mensal':
      return {
        tipo: 'mensal',
        diaDoMes: 10,
      }

    case 'Semestral':
      return {
        tipo: 'intervalo',
        diasIntervalo: 180,
      }
  }
}

const tarefas: Tarefa[] = [

  { titulo: 'Elevadores', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Bombas', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Interfones', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Portões', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Verificar Ar Condicionado, portas de acesso se fecham, botoeiras gerais', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Passagem de Turno', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Inspecionar Vazamentos geral. Medição diária de consumo água e gás', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Atendimento a prestadores', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Inventário de encomendas (físico e sistema)', periodicidade: 'Diária', tipo: 'Testes gerais' },
  { titulo: 'Demanda de moradores', periodicidade: 'Diária', tipo: 'Testes gerais' },

  { titulo: 'Vazamentos das Caixas da Coberturas', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Tampas das Caixas Fechadas', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Cadeado fechado', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Escadas Desobstruídas e sem sujeiras', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Limpeza do Local Cobertura, Barrilete, Lajes', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Sinais de Vazamentos Cobertura e lajes', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Ruídos no reservatório', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Extravasamento das Caixas Superiores e Inferiores', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Falta de água nas caixas Superiores e Inferiores', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Gotejamentos no encanamentos das caixas, casa de máquinas e bombas', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Furos no telhado ou destelhamento', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Verificar cabos soltos elétricos', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Verificar suportes e sinais de corrosão dos maquinários, estruturas', periodicidade: 'Diária', tipo: 'Inspeções' },
  { titulo: 'Fios do SPDA soltos, corrosão', periodicidade: 'Diária', tipo: 'Inspeções' },

  { titulo: 'Iluminicação e Sensores', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Infiltrações nas paredes, rodapés', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Rachaduras, Manchas no chão', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Portas Corta Fogo, fechamento correto', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Placas de Emergência e Incêndio', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Extintores e adesivos integros', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Escadas de Incêndo desobstruídas', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Corrimões e chão limpos', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Objetos abandonados, calçados, lixos', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },
  { titulo: 'Verificar Odores', periodicidade: 'Diária', tipo: 'Vistoria nos andares' },

  { titulo: 'Nivelamento dos 3 elevadores', periodicidade: 'Diária', tipo: 'Elevadores' },
  { titulo: 'Tem ruídos e vibração anormal', periodicidade: 'Diária', tipo: 'Elevadores' },
  { titulo: 'Iluminação e Botoeiras estão OK', periodicidade: 'Diária', tipo: 'Elevadores' },
  { titulo: 'Espelhos estão ok', periodicidade: 'Diária', tipo: 'Elevadores' },
  { titulo: 'Limpeza Geral', periodicidade: 'Diária', tipo: 'Elevadores' },
  { titulo: 'Testes de Interfones estão ok', periodicidade: 'Diária', tipo: 'Elevadores' },
  { titulo: 'Ventilação estão ok', periodicidade: 'Diária', tipo: 'Elevadores' },

  { titulo: 'Verificar Piscina (tratamento e Limpeza/Translúcidez)', periodicidade: 'Diária', tipo: 'Piscina' },
  { titulo: 'Verificar Nível e Odor', periodicidade: 'Diária', tipo: 'Piscina' },
  { titulo: 'Veificar casa de máquinas (bombas e filtro), temperatura', periodicidade: 'Diária', tipo: 'Piscina' },
  { titulo: 'Verificar vazamentos, vibração, odor na casa de máquinas', periodicidade: 'Diária', tipo: 'Piscina' },
  { titulo: 'Verificar trocador de calor e seu correto funcionamento, temperatura', periodicidade: 'Diária', tipo: 'Piscina' },
  { titulo: 'Verificar válvulas de pressão redutora (2x ao dia)', periodicidade: 'Diária', tipo: 'Piscina' },

  { titulo: 'Verificar nível de óleo do gerador elétrico', periodicidade: 'Diária', tipo: 'Máquinas' },
  { titulo: 'Verificar sinais de vazamento, Limpeza, placas e baterias', periodicidade: 'Diária', tipo: 'Máquinas' },

  { titulo: 'Verificar quadros elétricos geral e reaperto mensal no quadro', periodicidade: 'Diária', tipo: 'Elétrica' },
  { titulo: 'Verificar central de alarme, bateria, alarmes (sirenes)', periodicidade: 'Diária', tipo: 'Elétrica' },

  { titulo: 'Verificar câmeras, interfones, portões de veículos e pedestres', periodicidade: 'Diária', tipo: 'Vistoria Sistemas' },
  { titulo: 'Verificar sistema Nice, quadro de chaves se completo', periodicidade: 'Diária', tipo: 'Vistoria Sistemas' },
  { titulo: "Verificar telefone (WhatsApp), computadores, DVR's", periodicidade: 'Diária', tipo: 'Vistoria Sistemas' },

  { titulo: 'Verificar Lixeiras Internas, Limpeza Geral, Organização, Separação', periodicidade: 'Diária', tipo: 'Vistoria Limpeza' },
  { titulo: 'Acompanhar Limpeza externa e lixo externo', periodicidade: 'Diária', tipo: 'Vistoria Limpeza' },
  { titulo: 'Verificar Jardins Internos e Externos e regando bem de manhã', periodicidade: 'Diária', tipo: 'Vistoria Limpeza' },
  { titulo: 'Coletar restos de folhas, manter a limpeza interna e externa', periodicidade: 'Diária', tipo: 'Vistoria Limpeza' },
  { titulo: 'Verificar Garagem com óleo, água, rachaduras, sujeira, iluminação', periodicidade: 'Diária', tipo: 'Vistoria Limpeza' },
  { titulo: 'Acompanhar e controlar estoque de materias Limpeza, Informática', periodicidade: 'Diária', tipo: 'Vistoria Limpeza' },

  { titulo: "Verificar roupas, uso de EPI's, postura, placas de limpeza", periodicidade: 'Diária', tipo: 'Área comum' },
  { titulo: 'Fazer check list dos espaços', periodicidade: 'Diária', tipo: 'Área comum' },
  { titulo: 'Acompanhar diariamente equipamento de ginástica, brinquedoteca', periodicidade: 'Diária', tipo: 'Área comum' },
  { titulo: 'Verificar se falta material, iluminação, brinquedos, banheiros, limpeza', periodicidade: 'Diária', tipo: 'Área comum' },
  { titulo: 'Verificar se TV, Ar Condicionado, Filtros, portas, janelas estão OK', periodicidade: 'Diária', tipo: 'Área comum' },
  { titulo: 'Verificar geladeiras, mesas, cadeiras, poltronas, sofás, copa', periodicidade: 'Diária', tipo: 'Área comum' },
  { titulo: 'Verificar Espelhos, objetos abandonados, playground (teste de molas)', periodicidade: 'Diária', tipo: 'Área comum' },
    // ===== ROTINAS MENSAIS =====

    { titulo: 'Teste com carga no gerador', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Teste de central de alarme incêndio', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Testes nos sensores anti esmagamento', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Inspeção em todas as caixas de esgoto', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Inspeção em todas as caixas de gordura', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Inspeção de telhados minucioso', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Inspeção e lubrificação de portas / dobradiças', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Inspeção em todos os brinquedos e quadra', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Testes em Iluminações de Emergência', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Limpeza técnica na casa de máquinas', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Reuniões mensais e semanais com equipe', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Manutenção de Bombas e Válvulas', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Manutenção de Portões Veículos e Pedestres', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Manutenção de Tags, Cerca Elétrica', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Manutenção dos 3 Elevadores', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Manutenção do Sistema de Alarme e Central', periodicidade: 'Mensal', tipo: 'Inspeções' },
    { titulo: 'Inspeção e Manutenção Telhados e Lajes', periodicidade: 'Mensal', tipo: 'Inspeções' },
  
    // ===== ROTINAS SEMESTRAIS =====
  
    { titulo: 'Laudo SPDA', periodicidade: 'Semestral', tipo: 'Inspeções' },
    { titulo: 'Dedetização, Desratização, Descarrapato', periodicidade: 'Semestral', tipo: 'Inspeções' },
    { titulo: 'Limpeza de Caixa D`agua', periodicidade: 'Semestral', tipo: 'Inspeções' },
    { titulo: 'Limpeza de Placas Solares', periodicidade: 'Semestral', tipo: 'Inspeções' },
    { titulo: 'Manutenção do Sistema de Incêndio', periodicidade: 'Semestral', tipo: 'Inspeções' },
  
  ]
  async function importar() {

    console.log('')
    console.log('==========================================')
    console.log('IMPORTANDO TAREFAS PERIÓDICAS')
    console.log('==========================================')
  
    let inseridas = 0
  
    for (const tarefa of tarefas) {
  
      await adminDb.collection('tarefas_periodicas').add({
  
        ativo: true,
  
        condominioId: CONFIG.condominioId,
  
        criadoEm: Timestamp.now(),
  
        criadoPor: CONFIG.criadoPor,
  
        titulo: `${tarefa.tipo} - ${tarefa.titulo}`,
  
        descricao: `Efetuar ${tarefa.tipo} - ${tarefa.titulo}.`,
  
        periodicidade: montarPeriodicidade(
          tarefa.periodicidade
        ),
  
        responsavelPadraoId: CONFIG.responsavelPadraoId,
  
        responsavelPadraoNome: CONFIG.responsavelPadraoNome,
  
      })
  
      inseridas++
  
      console.log(`✔ ${inseridas} - ${tarefa.tipo} - ${tarefa.titulo}`)
  
    }
  
    console.log('')
    console.log('==========================================')
    console.log('IMPORTAÇÃO FINALIZADA')
    console.log('==========================================')
    console.log(`Total de tarefas importadas: ${inseridas}`)
    console.log('==========================================')
  }
  
  importar()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })