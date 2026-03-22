import React from 'react';

/** Renderiza texto com formatação estilo Markdown (headers, negrito, listas) */
const RoteiroViewer: React.FC<{ content: string; className?: string; onEmptyEdit?: () => void }> = ({ content, className = '', onEmptyEdit }) => {
  if (!content.trim()) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400 italic text-sm mb-3">
          Nenhum roteiro definido.
        </p>
        {onEmptyEdit && (
          <button
            type="button"
            onClick={onEmptyEdit}
            className="text-church-600 hover:text-church-700 font-medium text-sm"
          >
            Clique aqui para editar
          </button>
        )}
      </div>
    );
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1.5 my-3 text-gray-700 pl-2">
          {listItems.map((item, i) => (
            <li key={i} className="leading-relaxed">{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partKey = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/\*(.+?)\*/);
      let match = boldMatch;
      let isBold = true;
      if (italicMatch && (!boldMatch || italicMatch.index! <= boldMatch.index!)) {
        match = italicMatch;
        isBold = false;
      }
      if (match) {
        const before = remaining.slice(0, match.index);
        if (before) parts.push(<span key={partKey++}>{before}</span>);
        parts.push(
          isBold ? (
            <strong key={partKey++} className="font-semibold text-gray-900">{match[1]}</strong>
          ) : (
            <em key={partKey++} className="italic">{match[1]}</em>
          )
        );
        remaining = remaining.slice((match.index ?? 0) + match[0].length);
      } else {
        parts.push(<span key={partKey++}>{remaining}</span>);
        break;
      }
    }
    return <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={key++} className="h-3" />);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={key++} className="text-sm font-bold text-church-700 mt-4 mb-2 first:mt-0">
          {formatInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-base font-bold text-church-800 mt-5 mb-2 first:mt-0 border-b border-church-100 pb-1">
          {formatInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-lg font-bold text-church-900 mt-6 mb-2 first:mt-0">
          {formatInline(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const item = trimmed.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
      listItems.push(item);
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-gray-700 leading-relaxed my-2">
          {formatInline(trimmed)}
        </p>
      );
    }
  }
  flushList();

  return (
    <div className={`prose prose-sm max-w-none font-serif text-gray-800 ${className}`}>
      <div className="space-y-0.5">{elements}</div>
    </div>
  );
};

export default RoteiroViewer;
