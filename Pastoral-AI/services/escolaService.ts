import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CONTEUDOS_PADRAO, ConteudoEscola, TipoConteudo } from '../escola/catalogo';

/**
 * Dados da Escola Pastoral no banco:
 *  - escola_conteudos: conteúdos criados pelo admin + "ocultar" itens do catálogo base
 *  - escola_acessos:   segmentos liberados pelo coordenador para cada líder
 * Sem banco configurado (modo demonstração) tudo fica no navegador.
 * Se as tabelas ainda não existirem, o app mostra só o catálogo base e avisa o admin.
 */

export interface LinhaConteudo {
  id: string;
  segmento_id: string;
  titulo: string;
  tipo: TipoConteudo;
  url: string;
  descricao?: string | null;
  ordem?: number | null;
  ativo?: boolean | null;
  oculta_padrao_id?: string | null;
}

export interface AcessoEscola {
  id: string;
  comunidade_id: string;
  lider_email: string;
  segmento_id: string;
}

const DEMO_CONTEUDOS = 'pastoriai_demo_escola_conteudos';
const DEMO_ACESSOS = 'pastoriai_demo_escola_acessos';
const usaBanco = () => isSupabaseConfigured() && !!supabase;

const lerLocal = <T,>(chave: string): T[] => {
  try { return JSON.parse(localStorage.getItem(chave) || '[]'); } catch { return []; }
};
const gravarLocal = (chave: string, v: unknown) => {
  try { localStorage.setItem(chave, JSON.stringify(v)); } catch (_) {}
};
const novoId = () => (crypto as any).randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function carregarLinhas(): Promise<{ linhas: LinhaConteudo[]; bancoPronto: boolean }> {
  if (!usaBanco()) return { linhas: lerLocal<LinhaConteudo>(DEMO_CONTEUDOS), bancoPronto: true };
  const { data, error } = await supabase!.from('escola_conteudos').select('*').order('ordem', { ascending: true });
  if (error) return { linhas: [], bancoPronto: false };
  return { linhas: (data || []) as LinhaConteudo[], bancoPronto: true };
}

/** Soma o catálogo base com o que o admin criou/escondeu no painel. */
export function montarConteudos(linhas: LinhaConteudo[]): ConteudoEscola[] {
  const ocultos = new Set(linhas.filter(l => l.oculta_padrao_id).map(l => l.oculta_padrao_id as string));
  const base = CONTEUDOS_PADRAO.filter(c => !ocultos.has(c.id));
  const extras: ConteudoEscola[] = linhas
    .filter(l => !l.oculta_padrao_id && l.ativo !== false)
    .map(l => ({
      id: l.id, segmento_id: l.segmento_id, titulo: l.titulo, tipo: l.tipo, url: l.url,
      descricao: l.descricao || undefined, ordem: 1000 + (l.ordem || 0), padrao: false,
    }));
  return [...base, ...extras].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

// ─── Admin (desenvolvedor) ──────────────────────────────────────────────────

type Token = () => Promise<string | null>;

async function mutacaoAdmin(getToken: Token, action: 'insert' | 'update' | 'delete', data?: any, id?: string) {
  const token = await getToken();
  if (!token) throw new Error('Sessão expirada. Entre de novo.');
  const res = await fetch('/api/admin/mutation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ table: 'escola_conteudos', action, data, id }),
  });
  const r = await res.json().catch(() => ({}));
  if (!res.ok || r.error) throw new Error(r.error || `Erro ${res.status}`);
  return r.data;
}

export async function criarConteudo(getToken: Token, c: Omit<LinhaConteudo, 'id'>): Promise<void> {
  if (!usaBanco()) {
    gravarLocal(DEMO_CONTEUDOS, [...lerLocal<LinhaConteudo>(DEMO_CONTEUDOS), { ...c, id: novoId(), ativo: true }]);
    return;
  }
  await mutacaoAdmin(getToken, 'insert', { ...c, ativo: true });
}

export async function editarConteudo(getToken: Token, id: string, dados: Partial<LinhaConteudo>): Promise<void> {
  if (!usaBanco()) {
    gravarLocal(DEMO_CONTEUDOS, lerLocal<LinhaConteudo>(DEMO_CONTEUDOS).map(l => (l.id === id ? { ...l, ...dados } : l)));
    return;
  }
  await mutacaoAdmin(getToken, 'update', dados, id);
}

export async function removerConteudo(getToken: Token, id: string): Promise<void> {
  if (!usaBanco()) {
    gravarLocal(DEMO_CONTEUDOS, lerLocal<LinhaConteudo>(DEMO_CONTEUDOS).filter(l => l.id !== id));
    return;
  }
  await mutacaoAdmin(getToken, 'delete', undefined, id);
}

/** Esconde um item do catálogo base (os arquivos que vieram junto com o app). */
export async function ocultarPadrao(getToken: Token, padraoId: string, segmentoId: string): Promise<void> {
  await criarConteudo(getToken, { segmento_id: segmentoId, titulo: '(oculto)', tipo: 'link', url: '', oculta_padrao_id: padraoId });
}

/** Mostra de novo um item do catálogo base. */
export async function reexibirPadrao(getToken: Token, linhas: LinhaConteudo[], padraoId: string): Promise<void> {
  for (const l of linhas.filter(x => x.oculta_padrao_id === padraoId)) await removerConteudo(getToken, l.id);
}

const LIMITE_ARQUIVO = 45 * 1024 * 1024;

/** Envia PDF/PPTX/imagem para o bucket público "escola" e devolve a URL. */
export async function enviarArquivo(file: File, segmentoId: string): Promise<string> {
  if (file.size > LIMITE_ARQUIVO) throw new Error('Arquivo muito grande (máx. 45 MB).');
  if (!usaBanco()) {
    // Demonstração: o arquivo só existe nesta aba do navegador
    return URL.createObjectURL(file);
  }
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${segmentoId}/${novoId()}.${ext}`;
  const { error } = await supabase!.storage.from('escola').upload(path, file, {
    contentType: file.type || undefined,
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message.includes('not found') ? 'O depósito de arquivos "escola" ainda não existe no banco (aplique a migração da Escola Pastoral).' : error.message);
  return supabase!.storage.from('escola').getPublicUrl(path).data.publicUrl;
}

// ─── Acessos liberados pelo coordenador ─────────────────────────────────────

export async function carregarAcessos(comunidadeId: string): Promise<{ acessos: AcessoEscola[]; bancoPronto: boolean }> {
  if (!usaBanco()) return { acessos: lerLocal<AcessoEscola>(DEMO_ACESSOS), bancoPronto: true };
  if (!comunidadeId) return { acessos: [], bancoPronto: true };
  const { data, error } = await supabase!.from('escola_acessos').select('*').eq('comunidade_id', comunidadeId);
  if (error) return { acessos: [], bancoPronto: false };
  return { acessos: (data || []) as AcessoEscola[], bancoPronto: true };
}

export async function liberarAcesso(comunidadeId: string, liderEmail: string, segmentoId: string, porUsuarioId: string): Promise<void> {
  const email = liderEmail.trim().toLowerCase();
  if (!usaBanco()) {
    const atual = lerLocal<AcessoEscola>(DEMO_ACESSOS);
    if (!atual.some(a => a.lider_email === email && a.segmento_id === segmentoId)) {
      gravarLocal(DEMO_ACESSOS, [...atual, { id: novoId(), comunidade_id: comunidadeId, lider_email: email, segmento_id: segmentoId }]);
    }
    return;
  }
  const { error } = await supabase!.from('escola_acessos').upsert(
    { comunidade_id: comunidadeId, lider_email: email, segmento_id: segmentoId, liberado_por: porUsuarioId },
    { onConflict: 'comunidade_id,lider_email,segmento_id' },
  );
  if (error) throw new Error(error.message);
}

export async function revogarAcesso(comunidadeId: string, liderEmail: string, segmentoId: string): Promise<void> {
  const email = liderEmail.trim().toLowerCase();
  if (!usaBanco()) {
    gravarLocal(DEMO_ACESSOS, lerLocal<AcessoEscola>(DEMO_ACESSOS).filter(a => !(a.lider_email === email && a.segmento_id === segmentoId)));
    return;
  }
  const { error } = await supabase!.from('escola_acessos').delete()
    .eq('comunidade_id', comunidadeId).eq('lider_email', email).eq('segmento_id', segmentoId);
  if (error) throw new Error(error.message);
}
