// Data Model based on Supabase Structure

export enum PastoralType {
  CATEQUESE = 'catequese',
  PERSEVERANCA = 'perseveranca',
  FIEL = 'fiel',
  PASTORAL_CRISTA = 'pastoral_crista',
}

export interface PastoralLabels {
  pastoralNome: string;
  pastoralDescricao: string;
  participante: string;
  participantes: string;
  lider: string;
  lideres: string;
  equipe: string;
  turma: string;
  turmas: string;
  encontro: string;
  encontros: string;
  etapa: string;
  etapas: string;
  coordenador: string;
  novoParticipante: string;
  novoLider: string;
}

export interface PastoralConfig {
  type: PastoralType;
  labels: PastoralLabels;
  icon: string;
  color: string;
  etapasDisponiveis: string[];
}

export enum UserRole {
  COORDENADOR = 'Coordenador',
  LIDER = 'Líder',
  ADMIN = 'Administrador Paroquial',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  parish_id: string;
  paroquia: string;
  comunidade_id?: string;
  comunidade?: string;
  pastoral_type?: PastoralType;
  avatar?: string;
}

export interface Parish {
  id: string;
  name: string;
  slug: string;
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled';
  plan_type: 'trial' | 'basic' | 'premium';
}

export interface Diocese {
  id: string;
  nome: string;
  bispo: string;
}

export interface Paroquia {
  id: string;
  diocese_id: string;
  nome: string;
  endereco: string;
  telefone: string;
}

export interface Comunidade {
  id: string;
  paroquia_id: string;
  nome: string;
  padroeiro: string;
}

export interface EtapaCatequese {
  id: string;
  nome: string; // Ex: Eucaristia I, Crisma
}

export interface Turma {
  id: string;
  comunidade_id: string;
  etapa_id: string;
  etapa_nome?: string; // Helper for UI
  ano: number;
  faixa_etaria: string;
  dia_encontro: string;
  horario: string;
}

export interface ResponsavelSimples {
  nome: string;
  parentesco: string;
  telefone: string;
}

export interface Catequizando {
  id: string;
  turma_id: string;
  nome_completo: string;
  data_nascimento: string;
  telefone?: string; // Telefone do próprio catequizando
  
  // Mantidos para compatibilidade com relatórios legados (pega o 1º da lista)
  nome_responsavel: string; 
  telefone_responsavel: string; 
  
  // Nova estrutura para múltiplos responsáveis
  responsaveis: ResponsavelSimples[];

  sacramentos: {
    batismo: boolean;
    eucaristia: boolean;
    crisma: boolean;
  };
  observacoes_pastorais: string;
  familia_id?: string;
}

export interface Responsavel {
  id: string;
  nome: string;
  parentesco: string; // Pai, Mãe, Padrinho, Avó, Tio...
  telefone: string;
  casado_igreja: boolean;
  sacramentos: {
    batismo: boolean;
    eucaristia: boolean;
    crisma: boolean;
  };
  observacoes: string;
}

export interface Familia {
  id: string;
  sobrenome: string; // Ex: Família Silva
  responsaveis: Responsavel[]; // Lista dinâmica de responsáveis
  endereco: string;
  telefone_principal: string;
  observacoes: string;
}

export interface Catequista {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string; // Novo
  comunidade_id: string;
  turma_id?: string; // Novo - Turma atual
  tempo_servico_anos: number;
  experiencia_anterior: string; // Novo
  observacoes: string; // Novo
}

export enum LiturgicalColor {
  GREEN = 'Tempo Comum',
  PURPLE = 'Advento/Quaresma',
  RED = 'Mártires/Pentecostes',
  WHITE = 'Solenidades'
}

export interface Encontro {
  id: string;
  turma_id: string;
  data: string;
  tema: string;
  cor_liturgica: LiturgicalColor;
  observacoes: string;
  concluido: boolean;
}

export interface Presenca {
  id: string;
  encontro_id: string;
  catequizando_id: string;
  status: 'P' | 'F' | 'J'; // Presente, Falta, Justificada
}

export interface MaterialApoio {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'PDF' | 'LINK' | 'VIDEO' | 'DOC';
  categoria: 'Formação' | 'Liturgia' | 'Dinâmicas' | 'Administrativo';
  url: string;
  data_adicao: string;
}

export enum AvisoPriority {
  LOW = 'Baixa',
  NORMAL = 'Normal',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
  prioridade: AvisoPriority;
}

// Navigation Types
export enum ViewState {
  DASHBOARD = 'dashboard',
  ESTRUTURA = 'estrutura',
  PARTICIPANTES = 'participantes',
  MARKETING = 'marketing',
  LIDERES = 'lideres',
  ENCONTROS = 'encontros',
  IA_ASSISTANT = 'ia_assistant',
  MATERIAIS = 'materiais',
  ESCOLA_FORMACAO = 'escola_formacao',
  RELATORIOS = 'relatorios',
  SUBSCRIPTION = 'subscription',
  ADMIN = 'admin'
}