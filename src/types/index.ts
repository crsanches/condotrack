import { Timestamp } from 'firebase/firestore'


export type UserRole = 'sindico' | 'subsindico' | 'conselheiro' | 'zelador'| 'outros'

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
}

// ── Contratos ──────────────────────────────────────────────────────

export type StatusContrato = 'ativo' | 'encerrado' | 'em_renovacao'

export interface Contrato {
  id: string
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