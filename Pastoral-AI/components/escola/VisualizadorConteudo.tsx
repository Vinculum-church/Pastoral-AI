import React from 'react';
import { X, Download, ExternalLink, FileText, Presentation, PlayCircle, Link as LinkIcon, AlignLeft } from 'lucide-react';
import { ConteudoEscola, urlVideoIncorporavel, urlAbsoluta, TIPO_LABEL } from '../../escola/catalogo';

export const IconeTipo: React.FC<{ tipo: ConteudoEscola['tipo']; size?: number; className?: string }> = ({ tipo, size = 20, className }) => {
  const I = tipo === 'apostila' ? FileText : tipo === 'slides' ? Presentation : tipo === 'video' ? PlayCircle : tipo === 'texto' ? AlignLeft : LinkIcon;
  return <I size={size} className={className} />;
};

const ehLocal = () => ['localhost', '127.0.0.1'].includes(window.location.hostname);

/** Mostra apostila (PDF), slides (PPTX via visualizador do Office), vídeo (iframe) ou texto. */
const VisualizadorConteudo: React.FC<{ conteudo: ConteudoEscola; onClose: () => void }> = ({ conteudo, onClose }) => {
  const { tipo, url, titulo } = conteudo;
  const abs = url ? urlAbsoluta(url) : '';
  const ehPptx = /\.(pptx?|ppsx?)(\?|$)/i.test(url);
  const ehPdf = /\.pdf(\?|$)/i.test(url) || tipo === 'apostila';

  let corpo: React.ReactNode = null;
  if (tipo === 'video') {
    const emb = urlVideoIncorporavel(url);
    corpo = emb ? (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
        <iframe src={emb} title={titulo} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
      </div>
    ) : (
      <p className="text-sm text-gray-600">Este link não é de um vídeo do YouTube, Vimeo ou Google Drive. Abra pelo botão abaixo.</p>
    );
  } else if (tipo === 'texto') {
    corpo = <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">{conteudo.descricao}</div>;
  } else if (tipo === 'slides' && ehPptx) {
    corpo = ehLocal() ? (
      <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
        Os slides abrem aqui dentro quando o app está publicado. No computador local, use “Baixar”.
      </p>
    ) : (
      <div className="w-full h-[60vh] md:h-[70vh] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(abs)}`} title={titulo} className="w-full h-full" allowFullScreen />
      </div>
    );
  } else if (ehPdf) {
    corpo = (
      <>
        <div className="hidden md:block w-full h-[70vh] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <iframe src={abs} title={titulo} className="w-full h-full" />
        </div>
        <p className="md:hidden text-sm text-gray-600">No celular a apostila abre no leitor de PDF do aparelho. Toque em “Abrir”.</p>
      </>
    );
  } else {
    corpo = <p className="text-sm text-gray-600">Abra o conteúdo pelo botão abaixo.</p>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-6" onClick={onClose}>
      <div className="bg-white w-full md:max-w-5xl rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
          <div className="p-2 rounded-xl bg-church-50 text-church-700 shrink-0"><IconeTipo tipo={tipo} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold-700">{TIPO_LABEL[tipo]}</p>
            <h3 className="font-serif font-semibold text-gray-900 leading-tight truncate">{titulo}</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><X size={22} /></button>
        </div>
        <div className="p-4 md:p-6 space-y-4">
          {conteudo.descricao && tipo !== 'texto' && <p className="text-sm text-gray-600">{conteudo.descricao}</p>}
          {corpo}
          {url && tipo !== 'texto' && (
            <div className="flex flex-wrap gap-2">
              <a href={abs} target="_blank" rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-church-700 text-white font-semibold text-sm hover:bg-church-800">
                <ExternalLink size={18} /> Abrir
              </a>
              {tipo !== 'video' && tipo !== 'link' && (
                <a href={abs} download
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">
                  <Download size={18} /> Baixar
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizadorConteudo;
