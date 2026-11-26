/**
 * Escola Pastoral Permanente — catálogo base.
 *
 * Os segmentos e os materiais já produzidos (apostilas em PDF e slides em PPTX)
 * ficam aqui e os arquivos em /public/escola. O administrador (desenvolvedor)
 * acrescenta, troca ou esconde conteúdos pelo painel /admin → Escola Pastoral;
 * essas mudanças ficam no banco (tabela escola_conteudos) e são somadas a este catálogo.
 */

export type PastoralEscola = 'todos' | 'catequese' | 'pastoral_crista';

export type TipoConteudo = 'apostila' | 'slides' | 'video' | 'link' | 'texto';

export interface ConteudoEscola {
  id: string;
  segmento_id: string;
  titulo: string;
  tipo: TipoConteudo;
  url: string;
  descricao?: string;
  ordem?: number;
  /** true quando veio do catálogo base (arquivo no app); false quando foi criado no painel */
  padrao?: boolean;
}

export interface SegmentoEscola {
  id: string;
  nome: string;
  pastoral: PastoralEscola;
  publico: string;
  descricao: string;
  /** Nomes de etapa/turma que liberam este segmento automaticamente para o líder */
  etapas: string[];
  /** Classe Tailwind de cor do cartão */
  cor: string;
  emoji: string;
  emPreparacao?: boolean;
}

/** Arquitetura comum a todas as etapas (vale para todo segmento). */
export const CAPITULOS = [
  { n: 1, titulo: 'Identidade e missão', resumo: 'Quem é este segmento? Para que existe?' },
  { n: 2, titulo: 'Conteúdo doutrinal e espiritual', resumo: 'O que precisa crer, entender e viver neste caminho.' },
  { n: 3, titulo: 'Querigma e mistagogia aplicados', resumo: 'Como anunciar Jesus e introduzir no mistério.' },
  { n: 4, titulo: 'Guia anual de encontros', resumo: 'Roteiros prontos (8 a 12 encontros).' },
  { n: 5, titulo: 'Guia prático de serviço', resumo: 'Passo a passo concreto do trabalho.' },
  { n: 6, titulo: 'Integração com as pastorais', resumo: 'Como esta etapa conversa com as outras pastorais.' },
  { n: 7, titulo: 'Síntese e envio', resumo: 'Exame pessoal, compromisso e oração.' },
];

export const SEGMENTOS: SegmentoEscola[] = [
  {
    id: 'fundamentos', nome: 'Fundamentos da Iniciação à Vida Cristã', pastoral: 'todos',
    publico: 'Todos os catequistas e agentes', emoji: '✝️', cor: 'from-church-700 to-church-900',
    descricao: 'Módulo-base: Jesus vivo hoje, o querigma, o que a Igreja diz sobre a catequese, as etapas ao longo da vida, a mistagogia nos encontros e o catequista como discípulo missionário.',
    etapas: [],
  },
  {
    id: 'sementinha', nome: 'Sementinha', pastoral: 'catequese', publico: 'Crianças pequenas (pré-catequese)',
    emoji: '🌱', cor: 'from-emerald-600 to-emerald-800',
    descricao: 'Primeiros passos da fé com as crianças pequenas: acolhida, encantamento e a descoberta de Deus que ama.',
    etapas: ['sementinha'],
  },
  {
    id: 'etapa1', nome: '1ª Etapa', pastoral: 'catequese', publico: 'Crianças de 7 anos',
    emoji: '📘', cor: 'from-sky-600 to-sky-800',
    descricao: 'Iniciação: conhecer Jesus, a família de Deus e a oração do dia a dia.',
    etapas: ['1ª etapa', '1a etapa', 'primeira etapa', 'etapa 1'],
  },
  {
    id: 'etapa2', nome: '2ª Etapa', pastoral: 'catequese', publico: 'Crianças de 8 anos',
    emoji: '📗', cor: 'from-teal-600 to-teal-800',
    descricao: 'Aprofundamento: a Palavra de Deus, os sacramentos e a vida em comunidade.',
    etapas: ['2ª etapa', '2a etapa', 'segunda etapa', 'etapa 2'],
  },
  {
    id: 'eucaristia', nome: '1ª Eucaristia', pastoral: 'catequese', publico: 'Preparação para a Primeira Comunhão',
    emoji: '🍞', cor: 'from-amber-600 to-amber-800',
    descricao: 'Preparação para a Primeira Comunhão: a Missa, a Eucaristia e o encontro pessoal com Jesus.',
    etapas: ['1ª eucaristia', 'primeira eucaristia', 'eucaristia', 'primeira comunhão', '1ª comunhão'],
  },
  {
    id: 'perseveranca', nome: 'Perseverança', pastoral: 'catequese', publico: 'Adolescentes de 10 a 14 anos',
    emoji: '🔥', cor: 'from-orange-600 to-red-700',
    descricao: 'Continuidade depois da Eucaristia: identidade cristã, vida de oração e participação na comunidade.',
    etapas: ['perseverança', 'perseveranca'],
  },
  {
    id: 'crisma', nome: 'Crisma', pastoral: 'catequese', publico: 'Jovens de 14 anos ou mais',
    emoji: '🕊️', cor: 'from-rose-600 to-rose-800',
    descricao: 'Preparação para o sacramento da Confirmação: o Espírito Santo, a missão e o compromisso na Igreja.',
    etapas: ['crisma', 'confirmação'],
  },
  {
    id: 'circulo-biblico', nome: 'Círculo Bíblico', pastoral: 'pastoral_crista', publico: 'Grupos de reflexão e famílias',
    emoji: '📖', cor: 'from-indigo-600 to-indigo-800',
    descricao: 'A Palavra rezada em pequenos grupos: método, roteiros e condução dos encontros nas casas.',
    etapas: ['círculo bíblico', 'circulo biblico'],
  },
  { id: 'liturgia', nome: 'Liturgia', pastoral: 'pastoral_crista', publico: 'Leitores, salmistas, comentadores, ministros e coroinhas', emoji: '🕯️', cor: 'from-purple-600 to-purple-800', descricao: 'Identidade, conteúdo bíblico-litúrgico, guia anual e guia prático de proclamação e serviço ao altar.', etapas: ['liturgia'], emPreparacao: true },
  { id: 'musica', nome: 'Música Litúrgica', pastoral: 'pastoral_crista', publico: 'Ministérios de música', emoji: '🎵', cor: 'from-fuchsia-600 to-fuchsia-800', descricao: 'Critérios da música litúrgica, guia anual e guia prático de escolha de cantos.', etapas: ['música', 'musica'], emPreparacao: true },
  { id: 'familiar', nome: 'Pastoral Familiar', pastoral: 'pastoral_crista', publico: 'Casais e famílias', emoji: '👨‍👩‍👧‍👦', cor: 'from-pink-600 to-pink-800', descricao: 'Doutrina sobre matrimônio e família, guia anual e guia prático.', etapas: ['familiar', 'família'], emPreparacao: true },
  { id: 'juventude', nome: 'Juventude', pastoral: 'pastoral_crista', publico: 'Grupos de jovens', emoji: '🤝', cor: 'from-cyan-600 to-cyan-800', descricao: 'Querigma jovem, guia anual e guia prático de grupos.', etapas: ['juventude', 'jovens'], emPreparacao: true },
  { id: 'caridade', nome: 'Caridade e Pastoral Social', pastoral: 'pastoral_crista', publico: 'Agentes da caridade', emoji: '❤️', cor: 'from-red-600 to-red-800', descricao: 'Doutrina Social da Igreja, guia anual e guia prático de visitação.', etapas: ['caridade', 'social'], emPreparacao: true },
  { id: 'missoes', nome: 'Evangelização e Missões', pastoral: 'pastoral_crista', publico: 'Missionários', emoji: '🌍', cor: 'from-lime-600 to-lime-800', descricao: 'Querigma e missão, guia anual e guia prático de missão.', etapas: ['missões', 'missoes', 'evangelização'], emPreparacao: true },
  { id: 'espiritualidade', nome: 'Espiritualidade e Oração', pastoral: 'pastoral_crista', publico: 'Grupos de oração', emoji: '🙏', cor: 'from-violet-600 to-violet-800', descricao: 'Vida de oração, retiros e acompanhamento espiritual.', etapas: ['oração', 'espiritualidade'], emPreparacao: true },
  { id: 'acolhida', nome: 'Acolhida e Dízimo', pastoral: 'pastoral_crista', publico: 'Equipes de acolhida e dízimo', emoji: '💒', cor: 'from-yellow-600 to-yellow-800', descricao: 'Espiritualidade da acolhida, guia anual e guia prático do serviço.', etapas: ['acolhida', 'dízimo', 'dizimo'], emPreparacao: true },
  { id: 'comunicacao', nome: 'Comunicação e Presença Digital', pastoral: 'pastoral_crista', publico: 'Pascom', emoji: '📱', cor: 'from-slate-600 to-slate-800', descricao: 'Comunicação da paróquia, redes sociais e presença digital.', etapas: ['comunicação', 'pascom'], emPreparacao: true },
];

const f = (arquivo: string) => `/escola/${arquivo}`;

export const CONTEUDOS_PADRAO: ConteudoEscola[] = [
  { id: 'p-fund-pdf', segmento_id: 'fundamentos', titulo: 'Fundamentos da IVC — apostila', tipo: 'apostila', url: f('fundamentos-ivc.pdf') },
  { id: 'p-fund-ppt', segmento_id: 'fundamentos', titulo: 'Fundamentos da IVC — slides', tipo: 'slides', url: f('fundamentos-ivc.pptx') },

  { id: 'p-sem-pdf', segmento_id: 'sementinha', titulo: 'Apostila Sementinha', tipo: 'apostila', url: f('sementinha-apostila.pdf') },
  { id: 'p-sem-ppt', segmento_id: 'sementinha', titulo: 'Formação Paroquial Sementinha — slides', tipo: 'slides', url: f('sementinha-formacao.pptx') },

  { id: 'p-e1-pdf', segmento_id: 'etapa1', titulo: 'Apostila 1ª Etapa', tipo: 'apostila', url: f('etapa1-apostila.pdf') },
  { id: 'p-e1-ppt1', segmento_id: 'etapa1', titulo: '1ª Etapa (7 anos) — slides', tipo: 'slides', url: f('etapa1-7anos.pptx') },
  { id: 'p-e1-ppt2', segmento_id: 'etapa1', titulo: 'Catequese 1ª Etapa — formação do catequista', tipo: 'slides', url: f('etapa1-catequese.pptx') },

  { id: 'p-e2-pdf', segmento_id: 'etapa2', titulo: 'Apostila 2ª Etapa', tipo: 'apostila', url: f('etapa2-apostila.pdf') },
  { id: 'p-e2-ppt1', segmento_id: 'etapa2', titulo: '2ª Etapa (8 anos) — slides', tipo: 'slides', url: f('etapa2-8anos.pptx') },
  { id: 'p-e2-ppt2', segmento_id: 'etapa2', titulo: 'Catequese 2ª Etapa — formação do catequista', tipo: 'slides', url: f('etapa2-catequese.pptx') },

  { id: 'p-euc-ppt', segmento_id: 'eucaristia', titulo: 'Primeira Comunhão — slides', tipo: 'slides', url: f('eucaristia-primeira-comunhao.pptx') },

  { id: 'p-per-ppt1', segmento_id: 'perseveranca', titulo: 'Perseverança (10 a 14 anos) — slides', tipo: 'slides', url: f('perseveranca-10-14.pptx') },
  { id: 'p-per-ppt2', segmento_id: 'perseveranca', titulo: 'Perseverança — formação do catequista', tipo: 'slides', url: f('perseveranca-formacao.pptx') },

  { id: 'p-cri-ppt', segmento_id: 'crisma', titulo: 'Crisma (14 anos ou mais) — slides', tipo: 'slides', url: f('crisma-14mais.pptx') },

  { id: 'p-cb-pdf', segmento_id: 'circulo-biblico', titulo: 'Apostila Círculo Bíblico', tipo: 'apostila', url: f('circulo-biblico-apostila.pdf') },
  { id: 'p-cb-ppt', segmento_id: 'circulo-biblico', titulo: 'Círculo Bíblico — slides', tipo: 'slides', url: f('circulo-biblico.pptx') },
].map((c, i) => ({ ...c, ordem: i, padrao: true }) as ConteudoEscola);

export const TIPO_LABEL: Record<TipoConteudo, string> = {
  apostila: 'Apostila (PDF)',
  slides: 'Slides',
  video: 'Vídeo',
  link: 'Link',
  texto: 'Texto',
};

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Descobre o segmento de uma turma pelo nome da etapa (ex.: "1ª Etapa" → etapa1). */
export function segmentoDaEtapa(etapaNome?: string): string | null {
  if (!etapaNome) return null;
  const alvo = semAcento(etapaNome);
  for (const s of SEGMENTOS) {
    if (s.etapas.some(e => alvo === semAcento(e) || alvo.includes(semAcento(e)))) return s.id;
  }
  return null;
}

/**
 * Converte um link de vídeo em endereço para <iframe>.
 * Aceita YouTube (watch, youtu.be, shorts, live), Vimeo e Google Drive.
 * Retorna null para links que não são de vídeo conhecido (por segurança não incorporamos qualquer site).
 */
export function urlVideoIncorporavel(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1).split('/')[0]}`;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.searchParams.get('v')) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}`;
      const m = u.pathname.match(/^\/(shorts|live|embed)\/([^/?]+)/);
      if (m) return `https://www.youtube-nocookie.com/embed/${m[2]}`;
      if (u.searchParams.get('list')) return `https://www.youtube-nocookie.com/embed/videoseries?list=${u.searchParams.get('list')}`;
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === 'player.vimeo.com') return u.toString();
    if (host === 'drive.google.com') {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
  } catch (_) {}
  return null;
}

/** Endereço absoluto do arquivo (o visualizador de slides da Microsoft precisa de URL pública). */
export function urlAbsoluta(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
