import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, CalendarCheck, ClipboardCheck, GraduationCap, FolderOpen, ChevronRight,
  MessageCircle, CheckCircle2, Clock, Inbox, Copy, Check,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { usePastoral } from '../contexts/PastoralContext';
import { Catequizando, Encontro, UserRole, ViewState } from '../types';

/** Turma escolhida fica guardada para abrir a chamada já nela e lembrar na próxima visita. */
export const TURMA_KEY = 'vinculum:turma';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseDay = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);
const fmtDay = (iso: string) => parseDay(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const fmtWeekday = (iso: string) => parseDay(iso).toLocaleDateString('pt-BR', { weekday: 'long' });
const daysAgo = (iso: string) => Math.round((parseDay(todayIso()).getTime() - parseDay(iso).getTime()) / 86_400_000);

const firstName = (n: string) => (n || '').trim().split(/\s+/)[0] || '';
/** Nome para saudação: parte antes de "/" e mantém títulos como "Pe. Antônio", "Ir. Clara". */
const TITULOS = /^(pe|pr|ir|dom|diác|diac|frei|sr|sra|dona|seu|coord)\.?$/i;
const greetingName = (n: string) => {
  const parts = (n || '').split('/')[0].trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1 && TITULOS.test(parts[0])) return `${parts[0]} ${parts[1]}`;
  return parts[0] || '';
};
const initials = (n: string) => (n || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

/** Telefone para WhatsApp: só dígitos, com 55 do Brasil. */
const waPhone = (raw?: string) => {
  const d = (raw || '').replace(/\D/g, '');
  if (!d) return '';
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
};

/** Quem recebe a mensagem: 1º responsável com telefone, senão o próprio catequizando. */
const contactFor = (c: Catequizando) => {
  const resp = (c.responsaveis || []).find(r => r.telefone) ||
    (c.telefone_responsavel ? { nome: c.nome_responsavel, parentesco: '', telefone: c.telefone_responsavel } : null);
  if (resp) return { nome: resp.nome, parentesco: resp.parentesco, telefone: resp.telefone };
  if (c.telefone) return { nome: c.nome_completo, parentesco: '', telefone: c.telefone };
  return null;
};

interface Props {
  setView: (v: ViewState) => void;
}

const HomeTurmas: React.FC<Props> = ({ setView }) => {
  const { turmas, catequizandos, catequistas, encontros, presencas, solicitacoes, loading } = useData();
  const { user } = useAuth();
  const { labels } = usePastoral();
  const isCoordenador = user?.role === UserRole.COORDENADOR || user?.role === UserRole.ADMIN;

  // Catequista vê só a(s) turma(s) dele; coordenador vê todas.
  const visibleTurmas = useMemo(
    () => (isCoordenador ? turmas : turmas.filter(t => catequistas.some(c => c.email === user?.email && c.turma_id === t.id))),
    [isCoordenador, turmas, catequistas, user?.email]
  );

  const [turmaId, setTurmaId] = useState<string>(() => {
    try { return localStorage.getItem(TURMA_KEY) || ''; } catch { return ''; }
  });
  useEffect(() => {
    if (visibleTurmas.length && !visibleTurmas.some(t => t.id === turmaId)) setTurmaId(visibleTurmas[0].id);
  }, [visibleTurmas, turmaId]);
  useEffect(() => {
    try { if (turmaId) localStorage.setItem(TURMA_KEY, turmaId); } catch { /* sem armazenamento: segue sem lembrar */ }
  }, [turmaId]);

  const turma = visibleTurmas.find(t => t.id === turmaId);
  const alunos = useMemo(
    () => catequizandos.filter(c => c.turma_id === turmaId).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo)),
    [catequizandos, turmaId]
  );

  // Último encontro que já aconteceu (data até hoje) e o próximo.
  const { ultimo, proximo } = useMemo(() => {
    const hoje = todayIso();
    const daTurma = encontros.filter(e => e.turma_id === turmaId).sort((a, b) => a.data.localeCompare(b.data));
    const passados = daTurma.filter(e => e.data.slice(0, 10) <= hoje);
    return {
      ultimo: passados[passados.length - 1] as Encontro | undefined,
      proximo: daTurma.find(e => e.data.slice(0, 10) > hoje),
    };
  }, [encontros, turmaId]);

  const chamada = useMemo(() => {
    if (!ultimo) return null;
    const doEncontro = presencas.filter(p => p.encontro_id === ultimo.id);
    const status = new Map(doEncontro.map(p => [p.catequizando_id, p.status]));
    const presentes = alunos.filter(a => status.get(a.id) === 'P');
    const faltas = alunos.filter(a => status.get(a.id) === 'F');
    const justificadas = alunos.filter(a => status.get(a.id) === 'J');
    const semRegistro = alunos.filter(a => !status.has(a.id));
    return { feita: doEncontro.length > 0, presentes, faltas, justificadas, semRegistro };
  }, [ultimo, presencas, alunos]);

  // Contatos já chamados nesta sessão (só para dar retorno visual).
  const [avisados, setAvisados] = useState<Set<string>>(new Set());
  const [copiado, setCopiado] = useState(false);

  const mensagem = (c: Catequizando, contatoNome: string) => {
    const quando = ultimo ? `no encontro de ${fmtDay(ultimo.data)}` : 'no último encontro';
    const prox = turma?.dia_encontro
      ? ` Esperamos ${firstName(c.nome_completo)} no próximo encontro${proximo ? `, ${fmtWeekday(proximo.data)} (${fmtDay(proximo.data)})` : `, ${turma.dia_encontro.toLowerCase()}`}${turma.horario ? ` às ${turma.horario}` : ''}.`
      : '';
    return `Olá, ${firstName(contatoNome)}! Aqui é ${greetingName(user?.name || '')}, da ${labels.pastoralNome || 'catequese'} (${turma?.etapa_nome || labels.turma}). ` +
      `Sentimos falta de ${firstName(c.nome_completo)} ${quando}. Está tudo bem?${prox} Deus abençoe! 🙏`;
  };

  const abrirWhats = (c: Catequizando) => {
    const ct = contactFor(c);
    if (!ct) return;
    const url = `https://wa.me/${waPhone(ct.telefone)}?text=${encodeURIComponent(mensagem(c, ct.nome))}`;
    window.open(url, '_blank', 'noopener');
    setAvisados(prev => new Set(prev).add(c.id));
  };

  const copiarLista = async () => {
    if (!chamada) return;
    const linhas = chamada.faltas.map(c => {
      const ct = contactFor(c);
      return `• ${c.nome_completo}${ct ? ` — ${ct.nome} ${ct.telefone}` : ''}`;
    });
    const texto = `${turma?.etapa_nome || labels.turma} — faltas em ${ultimo ? fmtDay(ultimo.data) : ''}\n${linhas.join('\n')}`;
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sem área de transferência */ }
  };

  const irParaChamada = () => {
    try { if (turmaId) localStorage.setItem(TURMA_KEY, turmaId); } catch { /* ignora */ }
    setView(ViewState.ENCONTROS);
  };

  const total = alunos.length;
  const pct = chamada && total ? Math.round((chamada.presentes.length / total) * 100) : 0;
  const pctColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-28 md:pb-8">
      {/* Saudação + convite discreto à Escola Pastoral */}
      <header className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">Paz e bem,</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{greetingName(user?.name || '')} 👋</h1>
        </div>
        <button
          onClick={() => setView(ViewState.ESCOLA_FORMACAO)}
          className="w-full flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-2.5 text-left hover:bg-amber-50 transition-colors"
        >
          <GraduationCap size={18} className="text-amber-600 shrink-0" />
          <span className="text-sm text-amber-900 flex-1 min-w-0">
            <span className="font-semibold">Escola Pastoral</span>
            <span className="text-amber-800/80"> · formação para catequistas</span>
          </span>
          <span className="text-xs font-semibold text-amber-700 flex items-center gap-0.5 shrink-0">Ver <ChevronRight size={14} /></span>
        </button>
      </header>

      {/* Solicitações pendentes (coordenador) */}
      {isCoordenador && solicitacoes.length > 0 && (
        <button
          onClick={() => setView(ViewState.SOLICITACOES)}
          className="w-full flex items-center gap-3 rounded-2xl bg-white border border-gray-200 px-4 py-3 text-left shadow-sm"
        >
          <span className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><Inbox size={18} /></span>
          <span className="flex-1 text-sm text-gray-800"><b>{solicitacoes.length}</b> {solicitacoes.length === 1 ? 'pedido de matrícula' : 'pedidos de matrícula'} aguardando</span>
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      )}

      {/* Seletor de turma */}
      <section aria-label={labels.turmas}>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">{visibleTurmas.length > 1 ? `Escolha a ${labels.turma.toLowerCase()}` : `Sua ${labels.turma.toLowerCase()}`}</h2>
        {visibleTurmas.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            {loading ? 'Carregando…' : isCoordenador
              ? <>Nenhuma {labels.turma.toLowerCase()} cadastrada. <button className="text-church-600 font-semibold" onClick={() => setView(ViewState.ESTRUTURA)}>Criar {labels.turma.toLowerCase()}</button></>
              : `Você ainda não está vinculado a uma ${labels.turma.toLowerCase()}. Fale com a coordenação.`}
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x pb-1">
            {visibleTurmas.map(t => {
              const ativa = t.id === turmaId;
              const n = catequizandos.filter(c => c.turma_id === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setTurmaId(t.id)}
                  aria-pressed={ativa}
                  className={`snap-start shrink-0 min-w-[150px] rounded-2xl px-4 py-3 text-left transition-all border ${
                    ativa ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-sm leading-tight">{t.etapa_nome || labels.turma}</p>
                  <p className={`text-xs mt-1 ${ativa ? 'text-white/70' : 'text-gray-500'}`}>
                    {[t.dia_encontro, t.horario].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className={`text-xs mt-2 font-medium ${ativa ? 'text-white/90' : 'text-gray-600'}`}>{n} {n === 1 ? labels.participante.toLowerCase() : labels.participantes.toLowerCase()}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {turma && (
        <>
          {/* Resumo da turma */}
          <section className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <Users size={18} className="text-church-600 mb-2" />
                <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{total}</p>
                <p className="text-xs text-gray-500 mt-1.5">{labels.participantes}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <CalendarCheck size={18} className="text-emerald-600 mb-2" />
                <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">
                  {chamada?.feita ? <>{chamada.presentes.length}<span className="text-base font-semibold text-gray-400">/{total}</span></> : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1.5">presentes no último {labels.encontro.toLowerCase()}</p>
              </div>
            </div>

            {ultimo ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-gray-700 font-medium truncate">
                    {fmtDay(ultimo.data)}{ultimo.tema ? ` · ${ultimo.tema}` : ''}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {daysAgo(ultimo.data) === 0 ? 'hoje' : daysAgo(ultimo.data) === 1 ? 'ontem' : `há ${daysAgo(ultimo.data)} dias`}
                  </span>
                </div>
                {chamada?.feita ? (
                  <>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden" role="img" aria-label={`${pct}% de presença`}>
                      <div className={`h-full rounded-full ${pctColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">
                      <b className="text-gray-800">{pct}%</b> de presença
                      {chamada.faltas.length > 0 && <> · <b className="text-rose-600">{chamada.faltas.length}</b> {chamada.faltas.length === 1 ? 'falta' : 'faltas'}</>}
                      {chamada.justificadas.length > 0 && <> · {chamada.justificadas.length} justificada{chamada.justificadas.length > 1 ? 's' : ''}</>}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">A chamada deste {labels.encontro.toLowerCase()} ainda não foi feita.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum {labels.encontro.toLowerCase()} realizado ainda.</p>
            )}

            {proximo && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock size={13} /> Próximo: <b className="text-gray-700">{fmtWeekday(proximo.data)}, {fmtDay(proximo.data)}</b>{turma.horario ? ` às ${turma.horario}` : ''}
              </p>
            )}

            <button
              onClick={irParaChamada}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-church-600 text-white font-semibold py-3.5 hover:bg-church-900 transition-colors"
            >
              <ClipboardCheck size={18} /> {chamada && !chamada.feita ? 'Fazer a chamada' : 'Abrir chamada e encontros'}
            </button>
          </section>

          {/* Quem faltou */}
          {chamada?.feita && (
            <section className="rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-gray-900">Quem faltou</h2>
                  <p className="text-xs text-gray-500">Mande uma mensagem para a família e convide para voltar.</p>
                </div>
                {chamada.faltas.length > 1 && (
                  <button onClick={copiarLista} className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 shrink-0">
                    {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar lista'}
                  </button>
                )}
              </div>

              {chamada.faltas.length === 0 ? (
                <div className="px-5 pb-5 flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 size={18} /> Ninguém faltou. Que bênção!
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {chamada.faltas.map(c => {
                    const ct = contactFor(c);
                    const feito = avisados.has(c.id);
                    return (
                      <li key={c.id} className="px-5 py-3 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 text-sm font-bold flex items-center justify-center shrink-0">{initials(c.nome_completo)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.nome_completo}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {ct ? `${ct.nome}${ct.parentesco ? ` (${ct.parentesco.toLowerCase()})` : ''}` : 'Sem telefone cadastrado'}
                          </p>
                        </div>
                        {ct ? (
                          <button
                            onClick={() => abrirWhats(c)}
                            aria-label={`Enviar WhatsApp para ${ct.nome}`}
                            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                              feito ? 'bg-emerald-50 text-emerald-700' : 'bg-[#25D366] text-white hover:bg-[#1ebe5b]'
                            }`}
                          >
                            {feito ? <Check size={14} /> : <MessageCircle size={14} />} {feito ? 'Enviado' : 'Chamar'}
                          </button>
                        ) : (
                          <button onClick={() => setView(ViewState.PARTICIPANTES)} className="shrink-0 text-xs font-semibold text-church-600">Cadastrar</button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {chamada.semRegistro.length > 0 && (
                <p className="px-5 py-3 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
                  {chamada.semRegistro.length} sem registro na chamada: {chamada.semRegistro.map(c => firstName(c.nome_completo)).join(', ')}.
                </p>
              )}
            </section>
          )}
        </>
      )}

      {/* Material de apoio */}
      <button
        onClick={() => setView(ViewState.MATERIAIS)}
        className="w-full flex items-center gap-3 rounded-2xl bg-white border border-gray-200 px-4 py-3.5 text-left hover:border-gray-300 transition-colors"
      >
        <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FolderOpen size={20} /></span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-gray-900">Material de apoio</span>
          <span className="block text-xs text-gray-500">Roteiros, dinâmicas e liturgia para o encontro</span>
        </span>
        <ChevronRight size={18} className="text-gray-400" />
      </button>
    </div>
  );
};

export default HomeTurmas;
