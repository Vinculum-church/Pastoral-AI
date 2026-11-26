import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Lock, ChevronLeft, ChevronRight, Unlock, Loader2, ShieldCheck, Users, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { SEGMENTOS, CAPITULOS, ConteudoEscola, SegmentoEscola, segmentoDaEtapa, TipoConteudo } from '../escola/catalogo';
import { carregarLinhas, montarConteudos, carregarAcessos, liberarAcesso, revogarAcesso, AcessoEscola } from '../services/escolaService';
import VisualizadorConteudo, { IconeTipo } from './escola/VisualizadorConteudo';

type Motivo = 'todos' | 'coordenacao' | 'turma' | 'liberado' | 'admin';

const MOTIVO_TEXTO: Record<Motivo, string> = {
  todos: 'Para todos',
  coordenacao: 'Sua coordenação',
  turma: 'Sua turma',
  liberado: 'Liberado pelo coordenador',
  admin: 'Administrador',
};

const SECOES: { tipo: TipoConteudo; titulo: string }[] = [
  { tipo: 'apostila', titulo: 'Apostilas' },
  { tipo: 'slides', titulo: 'Slides para os encontros' },
  { tipo: 'video', titulo: 'Vídeos explicativos' },
  { tipo: 'texto', titulo: 'Textos' },
  { tipo: 'link', titulo: 'Material de apoio' },
];

const EscolaFormacaoView: React.FC = () => {
  const { user } = useAuth();
  const { catequistas, turmas } = useData();
  const [conteudos, setConteudos] = useState<ConteudoEscola[]>(() => montarConteudos([]));
  const [acessos, setAcessos] = useState<AcessoEscola[]>([]);
  const [bancoAcessosPronto, setBancoAcessosPronto] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [segAberto, setSegAberto] = useState<SegmentoEscola | null>(null);
  const [aberto, setAberto] = useState<ConteudoEscola | null>(null);
  const [painelAcesso, setPainelAcesso] = useState(false);
  const [salvandoAcesso, setSalvandoAcesso] = useState<string | null>(null);
  const [erroAcesso, setErroAcesso] = useState('');

  const isAdmin = user?.role === UserRole.ADMIN;
  const isCoord = user?.role === UserRole.COORDENADOR;
  const comunidadeId = user?.comunidade_id || '';
  const minhaPastoral = user?.pastoral_type === 'pastoral_crista' ? 'pastoral_crista' : 'catequese';
  const meuEmail = (user?.email || '').toLowerCase();

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [{ linhas }, ac] = await Promise.all([carregarLinhas(), carregarAcessos(comunidadeId)]);
      if (!vivo) return;
      setConteudos(montarConteudos(linhas));
      setAcessos(ac.acessos);
      setBancoAcessosPronto(ac.bancoPronto);
      setCarregando(false);
    })();
    return () => { vivo = false; };
  }, [comunidadeId]);

  // Ao abrir/fechar um segmento, volta ao topo (no celular quem rola é a página; no computador, o <main>)
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, [segAberto]);

  // Segmento da turma de um líder (pelo e-mail cadastrado na equipe)
  const segmentoDoLider = (email: string): string | null => {
    const lider = catequistas.find(c => (c.email || '').toLowerCase() === email.toLowerCase());
    const turma = lider?.turma_id ? turmas.find(t => t.id === lider.turma_id) : undefined;
    return segmentoDaEtapa(turma?.etapa_nome);
  };

  /** Por que este usuário pode ver o segmento (ou null se está fechado). */
  const motivoAcesso = (s: SegmentoEscola): Motivo | null => {
    if (isAdmin) return 'admin';
    if (s.pastoral === 'todos') return 'todos';
    if (isCoord) return s.pastoral === minhaPastoral ? 'coordenacao' : (acessos.some(a => a.lider_email === meuEmail && a.segmento_id === s.id) ? 'liberado' : null);
    if (segmentoDoLider(meuEmail) === s.id) return 'turma';
    if (acessos.some(a => a.lider_email === meuEmail && a.segmento_id === s.id)) return 'liberado';
    return null;
  };

  const porSegmento = useMemo(() => {
    const m: Record<string, ConteudoEscola[]> = {};
    for (const c of conteudos) (m[c.segmento_id] ||= []).push(c);
    return m;
  }, [conteudos]);

  const grupos: { titulo: string; itens: SegmentoEscola[] }[] = [
    { titulo: 'Formação de base', itens: SEGMENTOS.filter(s => s.pastoral === 'todos') },
    { titulo: 'Catequese', itens: SEGMENTOS.filter(s => s.pastoral === 'catequese') },
    { titulo: 'Pastorais', itens: SEGMENTOS.filter(s => s.pastoral === 'pastoral_crista') },
  ];

  const toggleAcesso = async (email: string, segId: string, ligado: boolean) => {
    if (!comunidadeId || !user) return;
    setErroAcesso('');
    setSalvandoAcesso(email);
    try {
      if (ligado) await revogarAcesso(comunidadeId, email, segId);
      else await liberarAcesso(comunidadeId, email, segId, user.id);
      const ac = await carregarAcessos(comunidadeId);
      setAcessos(ac.acessos);
    } catch (e: any) {
      setErroAcesso(e.message || 'Não foi possível salvar.');
    } finally {
      setSalvandoAcesso(null);
    }
  };

  // ─── Detalhe do segmento ─────────────────────────────────────────────────
  if (segAberto) {
    const s = segAberto;
    const motivo = motivoAcesso(s);
    const itens = porSegmento[s.id] || [];
    const equipe = catequistas.filter(c => c.email);

    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => { setSegAberto(null); setPainelAcesso(false); }} className="flex items-center gap-1 text-sm font-semibold text-church-700 hover:text-church-900 -ml-1">
          <ChevronLeft size={18} /> Escola Pastoral
        </button>

        <div className={`rounded-3xl bg-gradient-to-br ${s.cor} text-white p-6 md:p-8 shadow-lg`}>
          <div className="flex items-start gap-4">
            <div className="text-4xl leading-none">{s.emoji}</div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">{s.publico}</p>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold leading-tight mt-1">{s.nome}</h2>
              {motivo && <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold bg-white/15 rounded-full px-2.5 py-1"><Unlock size={12} /> {MOTIVO_TEXTO[motivo]}</span>}
            </div>
          </div>
        </div>

        {!motivo ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <Lock size={32} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900">Este segmento ainda não está liberado para você</h3>
            <p className="text-sm text-gray-500 mt-1">Peça ao coordenador da sua comunidade para liberar o acesso.</p>
          </div>
        ) : (
          <>
            {/* Apresentação geral */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
              <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Apresentação geral</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.descricao}</p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CAPITULOS.map(c => (
                  <div key={c.n} className="flex gap-3 items-start bg-marfim-claro rounded-xl p-3">
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-church-700 text-gold-200 text-xs font-bold flex items-center justify-center">{c.n}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{c.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.resumo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {itens.length === 0 && (
              <div className="bg-gold-50 border border-gold-200 rounded-2xl p-5 text-sm text-gray-700 flex gap-3">
                <Sparkles size={20} className="text-gold-600 shrink-0" />
                <p>{s.emPreparacao ? 'Os materiais deste segmento estão em preparação.' : 'Ainda não há materiais neste segmento.'} Assim que forem publicados, aparecem aqui.</p>
              </div>
            )}

            {SECOES.map(sec => {
              const lista = itens.filter(i => i.tipo === sec.tipo);
              if (lista.length === 0) return null;
              return (
                <section key={sec.tipo}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{sec.titulo}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lista.map(c => (
                      <button key={c.id} onClick={() => setAberto(c)}
                        className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:bg-church-50 transition-all p-4 flex items-center gap-4 group">
                        <div className="p-3 rounded-xl bg-church-50 text-church-700 shrink-0 group-hover:bg-church-100"><IconeTipo tipo={c.tipo} size={22} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 leading-snug">{c.titulo}</p>
                          {c.descricao && c.tipo !== 'texto' && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.descricao}</p>}
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-church-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        {/* Coordenador libera este segmento para membros da equipe */}
        {isCoord && s.pastoral !== 'todos' && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <button onClick={() => setPainelAcesso(v => !v)} className="w-full flex items-center justify-between gap-3 text-left">
              <span className="flex items-center gap-2 font-semibold text-gray-900"><Users size={18} className="text-church-600" /> Quem da equipe acessa este segmento</span>
              <ChevronRight size={18} className={`text-gray-400 transition-transform ${painelAcesso ? 'rotate-90' : ''}`} />
            </button>
            {painelAcesso && (
              <div className="mt-4 space-y-2">
                {!bancoAcessosPronto && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">A liberação de acesso precisa da atualização do banco (migração da Escola Pastoral). Por enquanto cada líder vê o segmento da própria turma.</p>
                )}
                {erroAcesso && <p className="text-xs text-red-600">{erroAcesso}</p>}
                {equipe.length === 0 && <p className="text-sm text-gray-500">Nenhum membro da equipe com e-mail cadastrado.</p>}
                {equipe.map(c => {
                  const email = c.email.toLowerCase();
                  const pelaTurma = segmentoDoLider(email) === s.id;
                  const liberado = acessos.some(a => a.lider_email === email && a.segmento_id === s.id);
                  const ligado = pelaTurma || liberado;
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                      <div className="w-9 h-9 rounded-full bg-church-100 text-church-700 font-bold text-sm flex items-center justify-center shrink-0">{c.nome.charAt(0)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                        <p className="text-[11px] text-gray-500 truncate">{pelaTurma ? 'Acesso pela turma' : liberado ? 'Liberado por você' : 'Sem acesso'}</p>
                      </div>
                      <button
                        disabled={pelaTurma || salvandoAcesso === email || !bancoAcessosPronto}
                        onClick={() => toggleAcesso(email, s.id, liberado)}
                        aria-pressed={ligado}
                        className={`shrink-0 w-12 h-7 rounded-full relative transition-colors ${ligado ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-60`}
                        title={pelaTurma ? 'Já tem acesso pela turma' : ligado ? 'Retirar acesso' : 'Liberar acesso'}
                      >
                        <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center transition-all ${ligado ? 'left-[22px]' : 'left-0.5'}`}>
                          {salvandoAcesso === email ? <Loader2 size={12} className="animate-spin text-gray-400" /> : ligado ? <Check size={12} className="text-emerald-600" /> : null}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {aberto && <VisualizadorConteudo conteudo={aberto} onClose={() => setAberto(null)} />}
      </div>
    );
  }

  // ─── Lista de segmentos ──────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <GraduationCap size={28} className="text-church-600" />
          Escola Pastoral de Formação
        </h2>
        <p className="text-gray-500 text-sm mt-1">Apostilas, slides e vídeos de cada segmento. Toque em um segmento para abrir.</p>
      </div>

      {isAdmin && (
        <div className="bg-church-50 border border-church-200 rounded-2xl p-4 text-sm text-church-900 flex gap-3 items-start">
          <ShieldCheck size={20} className="text-church-600 shrink-0 mt-0.5" />
          <p>Você está como administrador: vê todos os segmentos. Para acrescentar ou trocar conteúdos, use o painel <a href="/admin" className="font-semibold underline">/admin → Escola Pastoral</a>.</p>
        </div>
      )}

      {carregando && <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> Carregando conteúdos…</div>}

      {grupos.map(g => (
        <section key={g.titulo}>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{g.titulo}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {g.itens.map(s => {
              const motivo = motivoAcesso(s);
              const qtd = (porSegmento[s.id] || []).length;
              return (
                <button key={s.id} onClick={() => setSegAberto(s)}
                  className={`relative text-left rounded-2xl p-4 flex items-center gap-4 transition-all border ${motivo
                    ? 'bg-white border-gray-100 shadow-sm hover:shadow-md active:scale-[.99]'
                    : 'bg-gray-50 border-gray-200 opacity-80'}`}>
                  <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${s.cor} flex items-center justify-center text-2xl shadow-sm ${motivo ? '' : 'grayscale opacity-60'}`}>{s.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 leading-snug">{s.nome}</p>
                    <p className="text-xs text-gray-500 truncate">{s.publico}</p>
                    <p className="text-[11px] mt-1 font-medium">
                      {motivo
                        ? <span className="text-emerald-700">{qtd > 0 ? `${qtd} ${qtd === 1 ? 'material' : 'materiais'}` : (s.emPreparacao ? 'Em preparação' : 'Sem materiais ainda')}</span>
                        : <span className="text-gray-400 inline-flex items-center gap-1"><Lock size={11} /> Peça ao coordenador</span>}
                    </p>
                  </div>
                  {motivo ? <ChevronRight size={18} className="text-gray-300 shrink-0" /> : <Lock size={18} className="text-gray-300 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default EscolaFormacaoView;
