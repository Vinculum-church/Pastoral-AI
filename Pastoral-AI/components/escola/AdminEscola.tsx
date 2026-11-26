import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Upload, Loader2, AlertCircle, CheckCircle, Pencil, X, Save } from 'lucide-react';
import { SEGMENTOS, CONTEUDOS_PADRAO, TipoConteudo, TIPO_LABEL, ConteudoEscola, urlVideoIncorporavel } from '../../escola/catalogo';
import {
  carregarLinhas, LinhaConteudo, criarConteudo, editarConteudo, removerConteudo,
  ocultarPadrao, reexibirPadrao, enviarArquivo,
} from '../../services/escolaService';
import VisualizadorConteudo, { IconeTipo } from './VisualizadorConteudo';

const VAZIO = { tipo: 'video' as TipoConteudo, titulo: '', descricao: '', url: '' };

/** Aba "Escola Pastoral" do painel /admin: o desenvolvedor cria, edita e esconde conteúdos. */
const AdminEscola: React.FC<{ getSessionToken: () => Promise<string | null> }> = ({ getSessionToken }) => {
  const [linhas, setLinhas] = useState<LinhaConteudo[]>([]);
  const [bancoPronto, setBancoPronto] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [segId, setSegId] = useState(SEGMENTOS[0].id);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [previa, setPrevia] = useState<ConteudoEscola | null>(null);

  const recarregar = async () => {
    const r = await carregarLinhas();
    setLinhas(r.linhas);
    setBancoPronto(r.bancoPronto);
    setCarregando(false);
  };
  useEffect(() => { recarregar(); }, []);

  const seg = SEGMENTOS.find(s => s.id === segId)!;
  const ocultos = useMemo(() => new Set(linhas.filter(l => l.oculta_padrao_id).map(l => l.oculta_padrao_id)), [linhas]);
  const padroes = CONTEUDOS_PADRAO.filter(c => c.segmento_id === segId);
  const extras = linhas.filter(l => l.segmento_id === segId && !l.oculta_padrao_id);
  const contaPorSeg = (id: string) =>
    CONTEUDOS_PADRAO.filter(c => c.segmento_id === id && !ocultos.has(c.id)).length +
    linhas.filter(l => l.segmento_id === id && !l.oculta_padrao_id && l.ativo !== false).length;

  const avisar = (m: string) => { setOk(m); setErro(''); setTimeout(() => setOk(''), 3500); };
  const falhar = (e: any) => { setErro(e?.message || String(e)); setOk(''); };

  const limparForm = () => { setForm(VAZIO); setArquivo(null); setEditandoId(null); };

  const precisaArquivoOuUrl = form.tipo === 'apostila' || form.tipo === 'slides';
  const videoInvalido = form.tipo === 'video' && form.url.trim() !== '' && !urlVideoIncorporavel(form.url);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!form.titulo.trim()) return falhar('Dê um título ao conteúdo.');
    if (form.tipo === 'texto' && !form.descricao.trim()) return falhar('Escreva o texto.');
    if (form.tipo !== 'texto' && !arquivo && !form.url.trim()) return falhar(precisaArquivoOuUrl ? 'Envie um arquivo ou cole o link.' : 'Cole o link.');
    if (videoInvalido) return falhar('Use um link do YouTube, Vimeo ou Google Drive.');
    setSalvando(true);
    try {
      let url = form.url.trim();
      if (arquivo) url = await enviarArquivo(arquivo, segId);
      const dados = { segmento_id: segId, tipo: form.tipo, titulo: form.titulo.trim(), descricao: form.descricao.trim() || null, url };
      if (editandoId) await editarConteudo(getSessionToken, editandoId, dados);
      else await criarConteudo(getSessionToken, { ...dados, ordem: extras.length });
      limparForm();
      await recarregar();
      avisar(editandoId ? 'Conteúdo atualizado.' : 'Conteúdo publicado na Escola.');
    } catch (err) { falhar(err); } finally { setSalvando(false); }
  };

  const editar = (l: LinhaConteudo) => {
    setEditandoId(l.id);
    setForm({ tipo: l.tipo, titulo: l.titulo, descricao: l.descricao || '', url: l.url });
    setArquivo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const excluir = async (l: LinhaConteudo) => {
    if (!window.confirm(`Excluir "${l.titulo}" da Escola?`)) return;
    try { await removerConteudo(getSessionToken, l.id); await recarregar(); avisar('Conteúdo excluído.'); } catch (e) { falhar(e); }
  };

  const alternarPadrao = async (c: ConteudoEscola) => {
    try {
      if (ocultos.has(c.id)) { await reexibirPadrao(getSessionToken, linhas, c.id); avisar('Material visível de novo.'); }
      else { await ocultarPadrao(getSessionToken, c.id, c.segmento_id); avisar('Material escondido dos usuários.'); }
      await recarregar();
    } catch (e) { falhar(e); }
  };

  return (
    <div className="space-y-5">
      {!carregando && !bancoPronto && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm flex gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>As tabelas da Escola ainda não existem no banco. Rode no Supabase o arquivo <b>backend/migrations/add_escola_formacao.sql</b>. Até lá, os usuários veem só os materiais que vêm com o app.</p>
        </div>
      )}
      {erro && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex gap-2"><AlertCircle size={18} className="shrink-0" /> {erro}</div>}
      {ok && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm flex gap-2"><CheckCircle size={18} className="shrink-0" /> {ok}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* Segmentos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 h-fit lg:sticky lg:top-4">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Segmentos</p>
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {SEGMENTOS.map(s => (
              <button key={s.id} onClick={() => { setSegId(s.id); limparForm(); }}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors ${segId === s.id ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{s.emoji}</span>
                <span className="flex-1 truncate">{s.nome}</span>
                <span className="text-[11px] text-gray-400">{contaPorSeg(s.id)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Formulário */}
          <form onSubmit={salvar} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editandoId ? 'Editar conteúdo' : 'Novo conteúdo'} · <span className="text-amber-700">{seg.nome}</span></h3>
              {editandoId && <button type="button" onClick={limparForm} className="text-sm text-gray-500 flex items-center gap-1"><X size={16} /> Cancelar</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['video', 'apostila', 'slides', 'link', 'texto'] as TipoConteudo[]).map(t => (
                <button type="button" key={t} onClick={() => { setForm(f => ({ ...f, tipo: t })); setArquivo(null); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border ${form.tipo === t ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}>
                  <IconeTipo tipo={t} size={16} /> {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
            <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título (ex.: Vídeo do Iuri — Como conduzir o 1º encontro)"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            {form.tipo === 'texto' ? (
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={8} placeholder="Escreva o texto de formação…"
                className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            ) : (
              <>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} disabled={!!arquivo}
                  placeholder={form.tipo === 'video' ? 'Link do vídeo (YouTube, Vimeo ou Google Drive)' : form.tipo === 'link' ? 'https://…' : 'Link do arquivo (ou envie abaixo)'}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-50" />
                {videoInvalido && <p className="text-xs text-red-600">Esse link não é de vídeo do YouTube, Vimeo ou Google Drive.</p>}
                {form.tipo === 'video' && urlVideoIncorporavel(form.url) && (
                  <div className="aspect-video max-w-md rounded-xl overflow-hidden bg-black">
                    <iframe src={urlVideoIncorporavel(form.url)!} title="Prévia" className="w-full h-full" allowFullScreen />
                  </div>
                )}
                {precisaArquivoOuUrl && (
                  <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-amber-300">
                    <Upload size={20} className="text-amber-600" />
                    <span className="text-sm text-gray-600 flex-1 truncate">{arquivo ? arquivo.name : `Enviar ${form.tipo === 'apostila' ? 'PDF' : 'PPTX ou PDF'} do computador`}</span>
                    {arquivo && <button type="button" onClick={e => { e.preventDefault(); setArquivo(null); }} className="text-gray-400"><X size={16} /></button>}
                    <input type="file" className="hidden" accept={form.tipo === 'apostila' ? 'application/pdf,.pdf' : '.ppt,.pptx,.pdf,application/pdf'}
                      onChange={e => { setArquivo(e.target.files?.[0] || null); e.target.value = ''; }} />
                  </label>
                )}
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição curta (opcional)"
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
              </>
            )}
            <button type="submit" disabled={salvando || !bancoPronto}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 disabled:opacity-50">
              {salvando ? <Loader2 size={18} className="animate-spin" /> : editandoId ? <Save size={18} /> : <Plus size={18} />}
              {editandoId ? 'Salvar alterações' : 'Publicar na Escola'}
            </button>
          </form>

          {/* Conteúdos do segmento */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            <p className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conteúdos de {seg.nome}</p>
            {padroes.length === 0 && extras.length === 0 && <p className="px-5 py-4 text-sm text-gray-500">Nenhum conteúdo ainda.</p>}
            {padroes.map(c => {
              const oculto = ocultos.has(c.id);
              return (
                <div key={c.id} className={`px-5 py-3 flex items-center gap-3 ${oculto ? 'opacity-50' : ''}`}>
                  <IconeTipo tipo={c.tipo} className="text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.titulo}</p>
                    <p className="text-[11px] text-gray-400">Arquivo do app {oculto && '· escondido'}</p>
                  </div>
                  <button onClick={() => setPrevia(c)} className="p-2 text-gray-400 hover:text-amber-700" title="Ver"><Eye size={16} /></button>
                  <button onClick={() => alternarPadrao(c)} disabled={!bancoPronto} className="p-2 text-gray-400 hover:text-amber-700 disabled:opacity-40" title={oculto ? 'Mostrar de novo' : 'Esconder dos usuários'}>
                    {oculto ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              );
            })}
            {extras.map(l => (
              <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                <IconeTipo tipo={l.tipo} className="text-amber-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.titulo}</p>
                  <p className="text-[11px] text-gray-400">{TIPO_LABEL[l.tipo]} · criado no painel</p>
                </div>
                <button onClick={() => setPrevia({ id: l.id, segmento_id: l.segmento_id, titulo: l.titulo, tipo: l.tipo, url: l.url, descricao: l.descricao || undefined })} className="p-2 text-gray-400 hover:text-amber-700" title="Ver"><Eye size={16} /></button>
                <button onClick={() => editar(l)} className="p-2 text-gray-400 hover:text-amber-700" title="Editar"><Pencil size={16} /></button>
                <button onClick={() => excluir(l)} className="p-2 text-gray-400 hover:text-red-600" title="Excluir"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {previa && <VisualizadorConteudo conteudo={previa} onClose={() => setPrevia(null)} />}
    </div>
  );
};

export default AdminEscola;
