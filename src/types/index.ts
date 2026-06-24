import { Timestamp } from 'firebase/firestore'

export type UserRole = 'sindico' | 'subsindico' | 'conselheiro'

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
}

export interface Responsavel {
  id: string
  nome: string
  email?: string
  role: 'administrativo' | 'operacional'
  active: boolean
}