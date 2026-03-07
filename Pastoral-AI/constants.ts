import { Catequizando, Catequista, Comunidade, Diocese, Encontro, EtapaCatequese, Familia, LiturgicalColor, Paroquia, Presenca, Turma, UserRole, User, MaterialApoio, Aviso, AvisoPriority, PastoralType, PastoralConfig } from './types';

// --- PASTORAL CONFIGURATIONS ---
export const PASTORAL_CONFIGS: Record<PastoralType, PastoralConfig> = {
  [PastoralType.CATEQUESE]: {
    type: PastoralType.CATEQUESE,
    icon: 'BookOpen',
    color: 'blue',
    labels: {
      pastoralNome: 'Catequese',
      pastoralDescricao: 'Gestão da Catequese Paroquial',
      participante: 'Catequizando',
      participantes: 'Catequizandos',
      lider: 'Catequista',
      lideres: 'Catequistas',
      equipe: 'Equipe de Catequese',
      turma: 'Turma',
      turmas: 'Turmas',
      encontro: 'Encontro',
      encontros: 'Encontros',
      etapa: 'Etapa',
      etapas: 'Etapas',
      coordenador: 'Coordenador de Catequese',
      novoParticipante: 'Novo Catequizando',
      novoLider: 'Novo Catequista',
    },
    etapasDisponiveis: ['Pré-Eucaristia', 'Eucaristia I', 'Eucaristia II', 'Perseverança', 'Crisma', 'Catecumenato Adultos'],
  },
  [PastoralType.PERSEVERANCA]: {
    type: PastoralType.PERSEVERANCA,
    icon: 'HeartHandshake',
    color: 'emerald',
    labels: {
      pastoralNome: 'Perseverança',
      pastoralDescricao: 'Gestão da Perseverança Paroquial',
      participante: 'Perseverante',
      participantes: 'Perseverantes',
      lider: 'Animador',
      lideres: 'Animadores',
      equipe: 'Equipe de Perseverança',
      turma: 'Grupo',
      turmas: 'Grupos',
      encontro: 'Encontro',
      encontros: 'Encontros',
      etapa: 'Módulo',
      etapas: 'Módulos',
      coordenador: 'Coordenador de Perseverança',
      novoParticipante: 'Novo Perseverante',
      novoLider: 'Novo Animador',
    },
    etapasDisponiveis: ['Módulo I - Iniciação', 'Módulo II - Aprofundamento', 'Módulo III - Missão', 'Módulo IV - Liderança'],
  },
  [PastoralType.GRUPO_JOVENS]: {
    type: PastoralType.GRUPO_JOVENS,
    icon: 'Users',
    color: 'purple',
    labels: {
      pastoralNome: 'Grupo de Jovens',
      pastoralDescricao: 'Gestão do Grupo de Jovens',
      participante: 'Jovem',
      participantes: 'Jovens',
      lider: 'Coordenador',
      lideres: 'Coordenadores',
      equipe: 'Equipe de Coordenação',
      turma: 'Núcleo',
      turmas: 'Núcleos',
      encontro: 'Encontro',
      encontros: 'Encontros',
      etapa: 'Ciclo',
      etapas: 'Ciclos',
      coordenador: 'Coordenador Geral',
      novoParticipante: 'Novo Jovem',
      novoLider: 'Novo Coordenador',
    },
    etapasDisponiveis: ['Acolhida', 'Formação', 'Missão', 'Liderança Jovem'],
  },
  [PastoralType.PASTORAL_CRISTA]: {
    type: PastoralType.PASTORAL_CRISTA,
    icon: 'Church',
    color: 'amber',
    labels: {
      pastoralNome: 'Pastoral Cristã',
      pastoralDescricao: 'Gestão da Pastoral Cristã',
      participante: 'Participante',
      participantes: 'Participantes',
      lider: 'Agente Pastoral',
      lideres: 'Agentes Pastorais',
      equipe: 'Equipe Pastoral',
      turma: 'Equipe',
      turmas: 'Equipes',
      encontro: 'Reunião',
      encontros: 'Reuniões',
      etapa: 'Fase',
      etapas: 'Fases',
      coordenador: 'Coordenador Pastoral',
      novoParticipante: 'Novo Participante',
      novoLider: 'Novo Agente Pastoral',
    },
    etapasDisponiveis: ['Fase I - Querigma', 'Fase II - Discipulado', 'Fase III - Apostolado', 'Fase IV - Serviço'],
  },
};

// MOCK USERS FOR AUTHENTICATION
export const MOCK_USERS: Record<string, User> = {
  'coord@paroquia.com': {
    id: 'u1',
    name: 'Pe. Antônio / Coord. Lúcia',
    email: 'coord@paroquia.com',
    role: UserRole.COORDENADOR,
    parish_id: 'p1',
    paroquia: 'Paróquia São Francisco de Assis',
    pastoral_type: PastoralType.CATEQUESE,
    avatar: 'L'
  },
  'cat@paroquia.com': {
    id: 'u2',
    name: 'Maria Silva',
    email: 'cat@paroquia.com',
    role: UserRole.LIDER,
    parish_id: 'p1',
    paroquia: 'Paróquia São Francisco de Assis',
    pastoral_type: PastoralType.CATEQUESE,
    avatar: 'M'
  }
};

// Default fallback for types (deprecated usage in login logic, but kept for safe refs)
export const CURRENT_USER = MOCK_USERS['cat@paroquia.com'];

export const MOCK_DIOCESE: Diocese = {
  id: 'd1',
  nome: 'Diocese de Santo Amaro',
  bispo: 'Dom José Negri'
};

export const MOCK_PAROQUIA: Paroquia = {
  id: 'p1',
  diocese_id: 'd1',
  nome: 'Paróquia São Francisco de Assis',
  endereco: 'Rua das Flores, 123',
  telefone: '(11) 5555-1234'
};

export const MOCK_COMUNIDADES: Comunidade[] = [
  { id: 'c1', paroquia_id: 'p1', nome: 'Matriz São Francisco', padroeiro: 'São Francisco' },
  { id: 'c2', paroquia_id: 'p1', nome: 'Capela Santa Clara', padroeiro: 'Santa Clara' }
];

export const MOCK_ETAPAS: EtapaCatequese[] = [
  { id: 'e1', nome: 'Pré-Eucaristia' },
  { id: 'e2', nome: 'Eucaristia I' },
  { id: 'e3', nome: 'Eucaristia II' },
  { id: 'e4', nome: 'Perseverança' },
  { id: 'e5', nome: 'Crisma' },
  { id: 'e6', nome: 'Catecumenato Adultos' },
];

export const MOCK_TURMAS: Turma[] = [
  { id: 't1', comunidade_id: 'c1', etapa_id: 'e3', etapa_nome: 'Eucaristia II', ano: 2024, faixa_etaria: '9-10 anos', dia_encontro: 'Sábado', horario: '09:00' },
  { id: 't2', comunidade_id: 'c1', etapa_id: 'e5', etapa_nome: 'Crisma', ano: 2024, faixa_etaria: '14-16 anos', dia_encontro: 'Domingo', horario: '17:00' },
];

export const MOCK_CATEQUISTAS: Catequista[] = [
  { 
    id: 'cat1', 
    nome: 'Maria Silva', 
    email: 'maria@email.com', 
    telefone: '(11) 99999-9999', 
    data_nascimento: '1980-05-15',
    comunidade_id: 'c1', 
    turma_id: 't1',
    tempo_servico_anos: 5,
    experiencia_anterior: 'Foi catequista de Crisma por 3 anos na Paróquia vizinha.',
    observacoes: 'Muito pontual e organizada. Fez curso de teologia para leigos.'
  },
  { 
    id: 'cat2', 
    nome: 'João Pedro', 
    email: 'joao@email.com', 
    telefone: '(11) 98888-8888', 
    data_nascimento: '1998-10-20',
    comunidade_id: 'c1', 
    turma_id: 't2',
    tempo_servico_anos: 2,
    experiencia_anterior: 'Participou de grupos de jovens e liturgia.',
    observacoes: 'Excelente comunicação com os adolescentes.'
  },
];

export const MOCK_FAMILIAS: Familia[] = [
  { 
    id: 'f1', 
    sobrenome: 'Família Souza', 
    endereco: 'Rua A, 10', 
    telefone_principal: '(11) 99999-1111', 
    observacoes: 'Pais muito presentes.',
    responsaveis: [
      { id: 'r1', nome: 'Ana Souza', parentesco: 'Mãe', telefone: '(11) 99999-1111', casado_igreja: true, sacramentos: { batismo: true, eucaristia: true, crisma: true }, observacoes: '' },
      { id: 'r2', nome: 'José Souza', parentesco: 'Pai', telefone: '(11) 99999-1112', casado_igreja: true, sacramentos: { batismo: true, eucaristia: true, crisma: false }, observacoes: '' }
    ]
  },
  { 
    id: 'f2', 
    sobrenome: 'Família Oliveira', 
    endereco: 'Rua B, 20', 
    telefone_principal: '(11) 99999-2222', 
    observacoes: 'Desejam regularizar casamento.',
    responsaveis: [
      { id: 'r3', nome: 'Carlos Oliveira', parentesco: 'Pai', telefone: '(11) 99999-2222', casado_igreja: false, sacramentos: { batismo: true, eucaristia: false, crisma: false }, observacoes: '' },
      { id: 'r4', nome: 'Marta Oliveira', parentesco: 'Mãe', telefone: '(11) 99999-2223', casado_igreja: false, sacramentos: { batismo: true, eucaristia: true, crisma: true }, observacoes: '' }
    ]
  },
  { 
    id: 'f3', 
    sobrenome: 'Família Santos', 
    endereco: 'Rua C, 30', 
    telefone_principal: '(11) 99999-3333', 
    observacoes: 'Mãe solo.',
    responsaveis: [
       { id: 'r5', nome: 'Fernanda Santos', parentesco: 'Mãe', telefone: '(11) 99999-3333', casado_igreja: false, sacramentos: { batismo: true, eucaristia: true, crisma: true }, observacoes: '' }
    ]
  },
];

// Helper to get current month date for birthday test
const today = new Date();
const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');

export const MOCK_CATEQUIZANDOS: Catequizando[] = [
  { 
    id: 'a1', turma_id: 't1', familia_id: 'f1', nome_completo: 'Lucas Souza', data_nascimento: `2014-${currentMonth}-10`, telefone: '', 
    nome_responsavel: 'Ana Souza', telefone_responsavel: '11999991111', 
    responsaveis: [
      { nome: 'Ana Souza', parentesco: 'Mãe', telefone: '11999991111' },
      { nome: 'José Souza', parentesco: 'Pai', telefone: '11999991112' }
    ],
    sacramentos: { batismo: true, eucaristia: false, crisma: false }, observacoes_pastorais: 'Muito participativo.' 
  },
  { 
    id: 'a2', turma_id: 't1', familia_id: 'f2', nome_completo: 'Beatriz Oliveira', data_nascimento: '2014-08-22', telefone: '', 
    nome_responsavel: 'Carlos Oliveira', telefone_responsavel: '11999992222', 
    responsaveis: [
      { nome: 'Carlos Oliveira', parentesco: 'Pai', telefone: '11999992222' }
    ],
    sacramentos: { batismo: false, eucaristia: false, crisma: false }, observacoes_pastorais: 'Precisa agendar batismo.' 
  },
  { 
    id: 'a3', turma_id: 't1', familia_id: 'f3', nome_completo: 'Gabriel Santos', data_nascimento: `2014-${currentMonth}-28`, telefone: '', 
    nome_responsavel: 'Fernanda Santos', telefone_responsavel: '11999993333', 
    responsaveis: [
      { nome: 'Fernanda Santos', parentesco: 'Mãe', telefone: '11999993333' }
    ],
    sacramentos: { batismo: true, eucaristia: false, crisma: false }, observacoes_pastorais: '' 
  },
  { 
    id: 'a4', turma_id: 't2', familia_id: '', nome_completo: 'Julia Costa', data_nascimento: '2008-03-30', telefone: '11999995555', 
    nome_responsavel: 'Roberto Costa', telefone_responsavel: '11999994444', 
    responsaveis: [
      { nome: 'Roberto Costa', parentesco: 'Pai', telefone: '11999994444' }
    ],
    sacramentos: { batismo: true, eucaristia: true, crisma: false }, observacoes_pastorais: 'Líder nata.' 
  },
];

export const MOCK_ENCONTROS: Encontro[] = [
  { id: 'enc1', turma_id: 't1', data: '2024-05-18', tema: 'A Criação', cor_liturgica: LiturgicalColor.GREEN, observacoes: '', concluido: true },
  { id: 'enc2', turma_id: 't1', data: '2024-05-25', tema: 'Pecado Original', cor_liturgica: LiturgicalColor.GREEN, observacoes: '', concluido: true },
  { id: 'enc3', turma_id: 't1', data: '2024-06-01', tema: 'A Promessa de Salvação', cor_liturgica: LiturgicalColor.GREEN, observacoes: '', concluido: false },
];

export const MOCK_PRESENCAS: Presenca[] = [
  { id: 'p1', encontro_id: 'enc1', catequizando_id: 'a1', status: 'P' },
  { id: 'p2', encontro_id: 'enc1', catequizando_id: 'a2', status: 'F' },
  { id: 'p3', encontro_id: 'enc1', catequizando_id: 'a3', status: 'P' },
];

export const MOCK_MATERIAIS: MaterialApoio[] = [
  { id: 'm1', titulo: 'Catecismo da Igreja Católica (Resumo)', descricao: 'Principais pontos para consulta rápida durante os encontros.', tipo: 'PDF', categoria: 'Formação', url: '#', data_adicao: '2024-01-15' },
  { id: 'm2', titulo: 'Liturgia Diária - CNBB', descricao: 'Link oficial para acesso às leituras do dia.', tipo: 'LINK', categoria: 'Liturgia', url: 'https://liturgiadiaria.cnbb.org.br/', data_adicao: '2024-02-01' },
  { id: 'm3', titulo: 'Dinâmicas para Jovens', descricao: 'Coletânea de 10 dinâmicas de integração para turmas de Crisma.', tipo: 'PDF', categoria: 'Dinâmicas', url: '#', data_adicao: '2024-03-10' },
  { id: 'm4', titulo: 'História da Salvação (Vídeo)', descricao: 'Vídeo explicativo para crianças sobre o Antigo Testamento.', tipo: 'VIDEO', categoria: 'Formação', url: '#', data_adicao: '2024-04-05' },
  { id: 'm5', titulo: 'Ficha de Inscrição 2024', descricao: 'Modelo oficial para novos catequizandos.', tipo: 'DOC', categoria: 'Administrativo', url: '#', data_adicao: '2024-01-10' },
];

export const MOCK_AVISOS: Aviso[] = [
  { id: 'av1', titulo: 'Reunião de Pais', conteudo: 'Sábado, dia 20 às 15h no Salão Paroquial.', data_publicacao: '2024-05-10', prioridade: AvisoPriority.HIGH },
  { id: 'av2', titulo: 'Missa de Entrega', conteudo: 'Lembrar os catequizandos de trazerem suas bíblias no próximo domingo.', data_publicacao: '2024-05-12', prioridade: AvisoPriority.NORMAL }
];