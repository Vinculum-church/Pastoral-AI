import React, { useState } from 'react';
import { Inbox, CheckCircle, XCircle, User, Phone, Mail, Calendar, ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usePastoral } from '../contexts/PastoralContext';
import { Solicitacao } from '../types';

const SolicitacoesView: React.FC = () => {
  const { solicitacoes, turmas, aprovarSolicitacao, rejeitarSolicitacao } = useData();
  const { labels } = usePastoral();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTurma, setSelectedTurma] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAprovar = async (sol: Solicitacao) => {
    const turmaId = selectedTurma[sol.id];
    if (!turmaId) return;
    setProcessing(sol.id);
    try {
      await aprovarSolicitacao(sol, turmaId);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejeitar = async (id: string) => {
    setProcessing(id);
    try {
      await rejeitarSolicitacao(id);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('T')[0].split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Inbox className="mr-2 text-church-600" />
          Solicitações de Matrícula
        </h2>
        <span className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 font-bold">
          {solicitacoes.length} pendente{solicitacoes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-gray-400">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Inbox size={40} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600">Nenhuma Solicitação Pendente</h3>
          <p className="text-sm mt-2 max-w-xs text-center">
            Quando um fiel solicitar matrícula pelo portal, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitacoes.map(sol => {
            const isExpanded = expandedId === sol.id;
            const isProcessing = processing === sol.id;

            return (
              <div key={sol.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-church-50 border border-church-100 flex items-center justify-center text-church-700 font-bold text-lg">
                      {sol.nome_completo.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{sol.nome_completo}</h3>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center"><Mail size={12} className="mr-1" />{sol.email_fiel}</span>
                        <span className="flex items-center"><Calendar size={12} className="mr-1" />{formatDate(sol.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data de Nascimento</p>
                          <p className="text-sm font-medium text-gray-800">{formatDate(sol.data_nascimento) || 'Não informada'}</p>
                        </div>
                        {sol.telefone && (
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Telefone</p>
                            <p className="text-sm font-medium text-gray-800 flex items-center"><Phone size={14} className="mr-1.5 text-gray-400" />{sol.telefone}</p>
                          </div>
                        )}
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sacramentos</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {sol.sacramentos.batismo && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Batismo</span>}
                            {sol.sacramentos.eucaristia && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Eucaristia</span>}
                            {sol.sacramentos.crisma && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">Crisma</span>}
                            {!sol.sacramentos.batismo && !sol.sacramentos.eucaristia && !sol.sacramentos.crisma && (
                              <span className="text-xs text-gray-400 italic">Nenhum</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Responsáveis</p>
                          {sol.responsaveis.length > 0 ? sol.responsaveis.map((r, i) => (
                            <div key={i} className="flex items-center space-x-2 text-sm mb-1.5 last:mb-0">
                              <User size={14} className="text-gray-400 shrink-0" />
                              <span className="font-medium text-gray-800">{r.nome}</span>
                              {r.parentesco && <span className="text-gray-400">({r.parentesco})</span>}
                              {r.telefone && <span className="text-gray-500">• {r.telefone}</span>}
                            </div>
                          )) : <p className="text-sm text-gray-400 italic">Não informado</p>}
                        </div>
                        {sol.observacoes && (
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Observações</p>
                            <p className="text-sm text-gray-700">{sol.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 p-4 bg-church-50 rounded-xl border border-church-100">
                      <label className="block text-xs font-bold text-church-800 mb-2 flex items-center">
                        <BookOpen size={14} className="mr-1.5" />
                        Atribuir {labels.turma} para aprovar
                      </label>
                      <select
                        value={selectedTurma[sol.id] || ''}
                        onChange={e => setSelectedTurma(prev => ({ ...prev, [sol.id]: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-church-200 rounded-xl focus:ring-2 focus:ring-church-500 outline-none bg-white text-sm font-medium"
                      >
                        <option value="">Selecione a {labels.turma.toLowerCase()}...</option>
                        {turmas.map(t => (
                          <option key={t.id} value={t.id}>{t.etapa_nome} - {t.dia_encontro}</option>
                        ))}
                      </select>

                      {turmas.length === 0 && (
                        <div className="mt-2 flex items-start text-xs text-amber-700">
                          <AlertCircle size={14} className="mr-1.5 mt-0.5 shrink-0" />
                          Nenhuma {labels.turma.toLowerCase()} cadastrada. Crie uma na seção Estrutura.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleAprovar(sol)}
                        disabled={!selectedTurma[sol.id] || isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-40 shadow-lg shadow-emerald-100"
                      >
                        <CheckCircle size={18} /> Aprovar e Matricular
                      </button>
                      <button
                        onClick={() => handleRejeitar(sol.id)}
                        disabled={isProcessing}
                        className="px-6 flex items-center justify-center gap-2 bg-white text-red-600 border-2 border-red-200 py-3 rounded-xl font-bold hover:bg-red-50 transition-all disabled:opacity-40"
                      >
                        <XCircle size={18} /> Rejeitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolicitacoesView;
