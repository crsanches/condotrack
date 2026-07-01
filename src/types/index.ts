import { Timestamp } from 'firebase/firestore'



// ── SUBSTITUIR o UserRole existente por este: ─────────────────────────────────
export type UserRole = 'super_admin' | 'sindico' | 'subsindico' | 'conselheiro' | 'zelador' | 'outros'
 
export type DemandType =
  | 'manutencao'
  | 'administrativo'
  | 'financeiro'
  | 'seguranca'
  | 'limpeza'
  | 'obra'
  | 'outro'

export type DemandStatus = 'aberta' | 'em_andamento' | 'concluida'

export type Priority = 'alta' | 'media' | 'baixa'

export interface CondoUser {
  uid: string
  name: string
  email: string
  role: UserRole
  canDelete: boolean
  active: boolean
  acessoSigilo?: boolean
  condominioId: string | null   // null somente para super_admin
  telefone?: string             // formato: 5511999999999 (DDI+DDD+número, só dígitos)
  telefoneVerificado?: boolean
  criadoEm?: Timestamp
  criadoPor?: string
}

export interface DemandUpdate {
  data: Timestamp
  texto: string
  autor: string // uid
  autorName?: string
}

export interface Demand {
  id: string

  titulo: string
  tipo: DemandType
  prioridade: Priority

  responsavelId: string
  responsavelNome: string

  status: DemandStatus

  dataCriacao: Timestamp
  dataPrevisao: Timestamp | null
  dataConclusao: Timestamp | null

  criadoPor: string

  atualizacoes: DemandUpdate[]

  registroSigiloso?: boolean 
}

export const TIPO_LABELS: Record<DemandType, string> = {
  manutencao: 'Manutenção',
  administrativo: 'Administrativo',
  financeiro: 'Financeiro',
  seguranca: 'Segurança',
  limpeza: 'Limpeza',
  obra: 'Obra',
  outro: 'Outro',
}

export const STATUS_LABELS: Record<DemandStatus, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Administrador da Plataforma',
  sindico: 'Síndico',
  subsindico: 'Subsíndico',
  conselheiro: 'Conselheiro',
  zelador: 'Zelador',
  outros: 'Outros',
}

export interface Responsavel {
  id: string
  nome: string
  email?: string
  role: 'administrativo' | 'operacional'
  active: boolean
  acessoSigilo?: boolean 
}

// ── Tarefas Periódicas ─────────────────────────────────────────────

export type PeriodicidadeTipo = 'semanal' | 'intervalo' | 'mensal'

export interface PeriodicidadeSemanal {
  tipo: 'semanal'
  diasSemana: number[] // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
}

export interface PeriodicidadeIntervalo {
  tipo: 'intervalo'
  diasIntervalo: number // a cada N dias
}

export interface PeriodicidadeMensal {
  tipo: 'mensal'
  diaDoMes: number // 1–31
}

export type Periodicidade =
  | PeriodicidadeSemanal
  | PeriodicidadeIntervalo
  | PeriodicidadeMensal

export interface TarefaPeriodica {
  id: string
  condominioId: string  
  titulo: string
  descricao?: string
  periodicidade: Periodicidade
  responsavelPadraoId: string
  responsavelPadraoNome: string
  ativo: boolean
  criadoEm: Timestamp
  criadoPor: string
}

export type StatusTarefa = 'em_dia' | 'vence_hoje' | 'atrasada' | 'nunca_executada'

export type NaoConformidadeTipo =
  | 'equipamento_defeito'
  | 'falta_material'
  | 'servico_incompleto'
  | 'acesso_negado'
  | 'fora_do_prazo'
  | 'outro'

export const NAO_CONFORMIDADE_LABELS: Record<NaoConformidadeTipo, string> = {
  equipamento_defeito: 'Equipamento com defeito',
  falta_material:      'Falta de material',
  servico_incompleto:  'Serviço incompleto',
  acesso_negado:       'Acesso negado',
  fora_do_prazo:       'Fora do prazo',
  outro:               'Outro',
}

export interface RegistroTarefa {
  id: string
  tarefaId: string
  tarefaTitulo: string
  dataRealizacao: Timestamp
  responsavelId: string
  responsavelNome: string
  observacao?: string
  fotoUrl?: string
  criadoEm: Timestamp
  // Conformidade
  conforme: boolean
  naoConformidadeTipo?: NaoConformidadeTipo
  naoConformidadePrioridade?: Priority
  naoConformidadeDetalhe?: string
}

// ── Contratos ──────────────────────────────────────────────────────

export type StatusContrato = 'ativo' | 'encerrado' | 'em_renovacao'

export interface Contrato {
  id: string
  condominioId: string
  fornecedor: string
  cnpj?: string
  objeto: string
  valorMensal?: number
  dataInicio: Timestamp
  dataVencimento: Timestamp
  diasAvisoRenovacao: number
  status: StatusContrato
  responsavelId: string
  responsavelNome: string
  observacoes?: string
  criadoEm: Timestamp
  criadoPor: string
  registroSigiloso?: boolean 
}




export interface ObservacaoOrcamento {
  id: string
  texto: string
  autorId: string
  autorNome: string
  criadoEm: Timestamp
}

export type StatusOrcamento = 'aberto' | 'concluido'
export type ResultadoOrcamento = 'contratado' | 'nao_contratado'

export interface Orcamento {
  id: string
  condominioId: string
  titulo: string
  descricao: string
  status: StatusOrcamento
  resultado: ResultadoOrcamento | null
  contratoId: string | null
  registroSigiloso: boolean
  observacoes: ObservacaoOrcamento[]
  criadoPor: string
  criadoEm: Timestamp
  concluidoEm: Timestamp | null
  concluidoPor: string | null
  totalCotacoes?: number
}

export interface Cotacao {
  id: string
  orcamentoId: string
  fornecedor: string
  cnpjCpf: string
  telefone: string
  contato: string
  endereco: string
  email: string
  site: string
  tipoServico: string
  prazo: string
  valor: number | null
  condicoesGerais: string
  selecionada: boolean
  criadoPor: string
  criadoEm: Timestamp
}

// ── Patrimônio ──────────────────────────────────────────────────────

export type EstadoConservacao = 'Ótimo' | 'Bom' | 'Regular' | 'Ruim'

export interface Patrimonio {
  id: string
  condominioId: string

  // Identificação
  nome: string
  numeroSerie?: string
  categoria: string
  modelo?: string
  setor: string

  // Financeiro / temporal
  dataCompra?: Timestamp
  valorCompra?: number
  valorAtual?: number
  vidaUtilAnos?: number

  // Estado
  estadoConservacao: EstadoConservacao

  // Contrato de manutenção
  possuiContrato: boolean
  contratoIds: string[]

  // Extra
  observacoes?: string

  criadoEm: Timestamp
  atualizadoEm: Timestamp
}

export type PatrimonioFormData = Omit<Patrimonio, 'id' | 'criadoEm' | 'atualizadoEm' | 'condominioId'>

// Opções gerenciáveis por condomínio
export interface PatrimonioOpcoes {
  id: string // = condominioId
  categorias: string[]
  setores: string[]
}

export const CATEGORIAS_DEFAULT = [
  'Mobiliário',
  'Equipamento Elétrico',
  'Equipamento de Segurança',
  'Ferramenta',
  'Veículo',
  'TI / Informática',
  'Hidráulico',
  'Elevador',
  'Climatização',
  'Estrutura',
  'Outro',
]

export const SETORES_DEFAULT = [
  'Portaria',
  'Salão de Festas',
  'Piscina',
  'Jardim / Área Externa',
  'Academia',
  'Subsolo / Garagem',
  'Cobertura',
  'Hall / Circulação',
  'Administração',
  'Playground',
  'Outro',
]

export const ESTADOS_CONSERVACAO: EstadoConservacao[] = ['Ótimo', 'Bom', 'Regular', 'Ruim']

export const ESTADO_CONSERVACAO_COLOR: Record<EstadoConservacao, string> = {
  Ótimo: 'bg-green-100 text-green-800',
  Bom: 'bg-blue-100 text-blue-800',
  Regular: 'bg-yellow-100 text-yellow-800',
  Ruim: 'bg-red-100 text-red-800',
}


// criado para gerar diversos condominios
export type CondominioStatus = 'trial' | 'ativo' | 'suspenso' | 'cancelado'
export type PlanoTipo = 'gratis' | 'basico' | 'profissional' | 'enterprise'
 
export interface Condominio {
  id: string
  nome: string
  cnpj?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  telefone?: string
  emailContato?: string
  status: CondominioStatus
  plano: PlanoTipo
  criadoEm: Timestamp
  criadoPor: string
  trialExpiraEm?: Timestamp
}
 
export const CONDOMINIO_STATUS_LABELS: Record<CondominioStatus, string> = {
  trial: 'Em avaliação',
  ativo: 'Ativo',
  suspenso: 'Suspenso',
  cancelado: 'Cancelado',
}
 
export const PLANO_LABELS: Record<PlanoTipo, string> = {
  gratis: 'Grátis',
  basico: 'Básico',
  profissional: 'Profissional',
  enterprise: 'Enterprise',
}

// ── Convites ──────────────────────────────────────────────────────

export type TipoConvite = 'novo_condominio' | 'usuario_existente'
export type StatusConvite = 'pendente' | 'usado' | 'expirado' | 'cancelado'

export interface Convite {
  id: string                    // = token, também é o docId
  tipo: TipoConvite
  status: StatusConvite

  // Preenchido quando tipo = 'novo_condominio' (nome sugerido do condomínio)
  condominioNome?: string

  // Preenchido sempre: se 'usuario_existente', já vem definido na criação;
  // se 'novo_condominio', é preenchido no momento em que o convite é aceito
  condominioId?: string

  role: UserRole
  emailConvidado?: string       // opcional — trava o convite a um e-mail específico

  criadoPor: string             // uid do super_admin que gerou
  criadoEm: Timestamp
  expiraEm: Timestamp

  usadoEm?: Timestamp
  usadoPor?: string              // uid do CondoUser criado a partir do convite
}

export const TIPO_CONVITE_LABELS: Record<TipoConvite, string> = {
  novo_condominio: 'Novo condomínio',
  usuario_existente: 'Usuário em condomínio existente',
}

export const STATUS_CONVITE_LABELS: Record<StatusConvite, string> = {
  pendente: 'Pendente',
  usado: 'Usado',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
}