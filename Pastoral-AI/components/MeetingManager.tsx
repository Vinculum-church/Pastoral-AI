import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, CheckCircle, Clock, FileText, ChevronRight, Plus, X, Users, Check, AlertCircle, BookOpen, Sparkles, Loader2, Save, Printer, Edit3, Wand2, ArrowRight, Book, Feather, Eye, Pencil } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { usePastoral } from '../contexts/PastoralContext';
import { Encontro, LiturgicalColor, Presenca, UserRole } from '../types';
import { getLiturgicalSuggestions, LiturgySuggestion, generateMeetingScript } from '../services/geminiService';
import RoteiroViewer from './RoteiroViewer';

const MeetingManager: React.FC = () => {
  const { turmas, encontros, catequizandos, catequistas, presencas, addEncontro, updatePresenca, updateEncontro, paroquia } = useData();
  const { user } = useAuth();
  const { labels } = usePastoral();

  const isCoordenador = user?.role === UserRole.COORDENADOR || user?.role === UserRole.ADMIN;

  const visibleTurmas = isCoordenador
    ? turmas
    : turmas.filter(t => catequistas.some(c => c.email === user?.email && c.turma_id === t.id));
  
  const [selectedTurma, setSelectedTurma] = useState(visibleTurmas[0]?.id || '');
  const [selectedEncontro, setSelectedEncontro] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [isChamadaMode, setIsChamadaMode] = useState(false);

  useEffect(() => {
    if (visibleTurmas.length > 0 && !visibleTurmas.find(t => t.id === selectedTurma)) {
      setSelectedTurma(visibleTurmas[0].id);
    }
  }, [visibleTurmas, selectedTurma]);

  // Liturgy Preview State (AI)
  const [aiSuggestion, setAiSuggestion] = useState<LiturgySuggestion | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  
  // Custom Script Generation State
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Form State for New Meeting
  const [newEncontro, setNewEncontro] = useState({
    data: '',
    tema: '',
    cor_liturgica: LiturgicalColor.GREEN,
    observacoes: ''
  });

  // Local state for Roteiro (evita apagar letras ao digitar rápido - debounce no updateEncontro)
  const [localRoteiro, setLocalRoteiro] = useState('');
  const roteiroDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [roteiroViewMode, setRoteiroViewMode] = useState<'view' | 'edit'>('view');

  const activeEncontros = encontros.filter(e => e.turma_id === selectedTurma);
  const activeCatequizandos = catequizandos.filter(c => c.turma_id === selectedTurma);
  const currentEncontroDetails = activeEncontros.find(e => e.id === selectedEncontro);
  const activeTurmaName = visibleTurmas.find(t => t.id === selectedTurma)?.etapa_nome || 'Turma';
  const activeTurmaObj = visibleTurmas.find(t => t.id === selectedTurma);

  // Sincroniza localRoteiro ao trocar de encontro; cancela debounce pendente
  useEffect(() => {
    if (roteiroDebounceRef.current) {
      clearTimeout(roteiroDebounceRef.current);
      roteiroDebounceRef.current = null;
    }
    setLocalRoteiro(currentEncontroDetails?.observacoes || '');
    setRoteiroViewMode('view');
  }, [selectedEncontro, currentEncontroDetails?.id]);

  useEffect(() => {
    return () => {
      if (roteiroDebounceRef.current) clearTimeout(roteiroDebounceRef.current);
    };
  }, []);

  const saveRoteiro = useCallback((valor: string) => {
    if (!currentEncontroDetails) return;
    updateEncontro({ ...currentEncontroDetails, observacoes: valor });
  }, [currentEncontroDetails, updateEncontro]);

  const handleRoteiroChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setLocalRoteiro(v);
    if (roteiroDebounceRef.current) clearTimeout(roteiroDebounceRef.current);
    const encontroId = currentEncontroDetails?.id;
    roteiroDebounceRef.current = setTimeout(() => {
      if (encontroId && selectedEncontro === encontroId) {
        saveRoteiro(v);
      }
    }, 400);
  };

  const handleRoteiroBlur = () => {
    if (roteiroDebounceRef.current) {
      clearTimeout(roteiroDebounceRef.current);
      roteiroDebounceRef.current = null;
    }
    saveRoteiro(localRoteiro);
  };


  const formatDateDisplay = (dateString: string) => {
      if (!dateString) return '';
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
  };

  const togglePresenca = (catequizandoId: string) => {
    if (!selectedEncontro) return;

    const existingRecord = presencas.find(p => p.encontro_id === selectedEncontro && p.catequizando_id === catequizandoId);

    if (existingRecord) {
        const currentStatus = existingRecord.status;
        const newStatus = currentStatus === 'P' ? 'F' : 'P';
        updatePresenca({ ...existingRecord, status: newStatus });
    } else {
        updatePresenca({ 
            id: Date.now().toString(), 
            encontro_id: selectedEncontro, 
            catequizando_id: catequizandoId, 
            status: 'P' 
        });
    }
  };

  const getStatus = (catequizandoId: string) => {
    if (!selectedEncontro) return null;
    const record = presencas.find(p => p.encontro_id === selectedEncontro && p.catequizando_id === catequizandoId);
    return record ? record.status : null;
  };

  const handleConsultAi = async () => {
    if (!newEncontro.data) return;
    setIsLoadingAi(true);
    setAiSuggestion(null);
    setCustomPrompt(''); 
    
    // Call the service which now uses the correct model 'gemini-3-flash-preview'
    const suggestion = await getLiturgicalSuggestions(newEncontro.data, activeTurmaName);
    
    if (suggestion) {
        setAiSuggestion(suggestion);
    }
    setIsLoadingAi(false);
  };

  const handleApplySuggestion = () => {
      if (!aiSuggestion) return;
      
      let mapColor = LiturgicalColor.GREEN;
      const sColor = aiSuggestion.cor.toLowerCase();
      if (sColor.includes('roxo') || sColor.includes('lilás')) mapColor = LiturgicalColor.PURPLE;
      else if (sColor.includes('vermelho')) mapColor = LiturgicalColor.RED;
      else if (sColor.includes('branco') || sColor.includes('dourado') || sColor.includes('amarelo')) mapColor = LiturgicalColor.WHITE;

      setNewEncontro(prev => ({
          ...prev,
          tema: aiSuggestion.tema_sugerido,
          cor_liturgica: mapColor,
          observacoes: `Santo do Dia: ${aiSuggestion.santo}\n\nLeituras: ${aiSuggestion.leituras}\n\nDinâmica: ${aiSuggestion.ideia_dinamica}\n\n---\n\n${prev.observacoes}`
      }));
  };

  const handleGenerateScript = async () => {
      if (!newEncontro.data) return;
      setIsGeneratingScript(true);
      
      const script = await generateMeetingScript(
          newEncontro.data, 
          activeTurmaName, 
          aiSuggestion, 
          customPrompt
      );

      setNewEncontro(prev => ({
          ...prev,
          tema: prev.tema || aiSuggestion?.tema_sugerido || "Encontro Catequético",
          observacoes: script
      }));

      setIsGeneratingScript(false);
  };

  const handleSaveEncontro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurma) return;

    addEncontro({
      turma_id: selectedTurma,
      data: newEncontro.data,
      tema: newEncontro.tema,
      cor_liturgica: newEncontro.cor_liturgica,
      observacoes: newEncontro.observacoes,
      concluido: false
    });

    setIsModalOpen(false);
    setNewEncontro({ data: '', tema: '', cor_liturgica: LiturgicalColor.GREEN, observacoes: '' });
    setAiSuggestion(null);
    setCustomPrompt('');
  };

  if (visibleTurmas.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar size={40} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-600">
            {isCoordenador ? `Nenhum ${labels.turma} cadastrado` : `Você não está vinculado a nenhum ${labels.turma.toLowerCase()}`}
          </h3>
          <p className="text-sm mt-2 text-gray-400 max-w-md mx-auto">
            {isCoordenador
              ? `Crie um ${labels.turma.toLowerCase()} na seção "Estrutura" para começar a agendar ${labels.encontros.toLowerCase()}.`
              : `Peça ao coordenador para vincular você a um ${labels.turma.toLowerCase()}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="mr-2 text-church-600"/>
            {labels.encontros} & Frequência
        </h2>
        <div className="relative">
            <select 
            value={selectedTurma}
            onChange={(e) => {
                setSelectedTurma(e.target.value);
                setSelectedEncontro(null);
                setIsChamadaMode(false);
            }}
            className="appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-church-500 focus:border-church-500 block w-64 p-2.5 pr-8 font-medium"
            >
            {visibleTurmas.map(turma => (
                <option key={turma.id} value={turma.id}>{turma.etapa_nome} - {turma.dia_encontro}</option>
            ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Meetings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Agenda</h3>
            <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">{activeEncontros.length} encontros</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto p-4 space-y-4">
            {activeEncontros.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((encontro, idx) => (
              <div key={encontro.id} className="relative pl-8 pb-4 last:pb-0">
                {/* Timeline Line */}
                {idx !== activeEncontros.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-100"></div>
                )}
                {/* Timeline Dot */}
                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${
                  encontro.concluido ? 'bg-emerald-500' : 'bg-church-500'
                }`}></div>
                
                <button
                  onClick={() => {
                      setSelectedEncontro(encontro.id);
                      setIsChamadaMode(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group relative border
                      ${selectedEncontro === encontro.id ? 'bg-church-50 border-church-100 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                      <div>
                          <div className="flex items-center space-x-2 mb-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDateDisplay(encontro.data)}</span>
                              {encontro.concluido && <CheckCircle size={10} className="text-emerald-500" />}
                          </div>
                          <p className={`font-bold text-sm ${selectedEncontro === encontro.id ? 'text-church-900' : 'text-gray-700'}`}>{encontro.tema}</p>
                      </div>
                      <ChevronRight size={14} className={`text-gray-300 transition-transform ${selectedEncontro === encontro.id ? 'text-church-500 translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </div>
                </button>
              </div>
            ))}
            
            <div className="pt-2">
                <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 rounded-2xl text-xs font-bold text-church-600 bg-church-50 hover:bg-church-100 border border-church-100 border-dashed transition-all flex items-center justify-center group"
                >
                <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform"/> Agendar Novo {labels.encontro}
                </button>
            </div>
          </div>
        </div>

        {/* Details / Attendance Area */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEncontro && currentEncontroDetails ? (
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${isChamadaMode ? 'ring-2 ring-church-500 shadow-xl' : ''}`}>
               {/* HEADER DO ENCONTRO */}
               <div className={`p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isChamadaMode ? 'bg-church-50' : 'bg-white'}`}>
                  <div className="flex-1 w-full">
                    <div className="animate-fade-in space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <select 
                                value={currentEncontroDetails.cor_liturgica}
                                onChange={(e) => updateEncontro({...currentEncontroDetails, cor_liturgica: e.target.value as LiturgicalColor})}
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border-none cursor-pointer outline-none focus:ring-2 focus:ring-church-500 ${
                                    currentEncontroDetails.cor_liturgica.includes('Verde') ? 'bg-green-100 text-green-700' :
                                    currentEncontroDetails.cor_liturgica.includes('Roxo') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {Object.values(LiturgicalColor).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {currentEncontroDetails.concluido && (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center">
                                    REALIZADO
                                </span>
                            )}
                        </div>
                        <input 
                            type="text"
                            value={currentEncontroDetails.tema}
                            onChange={(e) => updateEncontro({...currentEncontroDetails, tema: e.target.value})}
                            className="text-2xl font-bold text-gray-900 leading-tight bg-transparent border-b border-transparent hover:border-gray-200 focus:border-church-500 outline-none w-full transition-colors"
                            placeholder="Tema do Encontro"
                        />
                        <div className="flex items-center mt-2">
                            <Clock size={16} className="mr-1.5 text-gray-400"/> 
                            <input 
                                type="date"
                                value={currentEncontroDetails.data}
                                onChange={(e) => updateEncontro({...currentEncontroDetails, data: e.target.value})}
                                className="text-sm text-gray-500 font-medium bg-transparent border-b border-transparent hover:border-gray-200 focus:border-church-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 shrink-0">
                     {!isChamadaMode ? (
                        <>
                            <button 
                                onClick={() => setIsChamadaMode(true)}
                                className="px-5 py-2 text-sm bg-church-600 text-white rounded-xl hover:bg-church-700 flex items-center font-bold shadow-lg shadow-church-200 transition-transform active:scale-95"
                            >
                                <Users size={16} className="mr-2"/> Fazer Chamada
                            </button>
                        </>
                     ) : (
                        <>
                            <button 
                                onClick={() => setIsChamadaMode(false)}
                                className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center font-bold shadow-lg shadow-emerald-200 transition-transform active:scale-95"
                            >
                                <Check size={16} className="mr-2"/> Concluir Chamada
                            </button>
                        </>
                     )}
                  </div>
               </div>
               
               <div className="p-6 bg-white min-h-[300px]">
                 {isChamadaMode ? (
                     // ROLL CALL MODE INTERFACE
                     <div className="space-y-6 animate-fade-in">
                         <div className="bg-amber-50 p-4 rounded-xl flex items-start text-sm text-amber-900 border border-amber-100">
                            <AlertCircle size={18} className="mt-0.5 mr-3 shrink-0 text-amber-600"/>
                            <p>Modo de Chamada Ativo. Toque nos cartões para alternar a presença.</p>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {activeCatequizandos.map(aluno => {
                                 const status = getStatus(aluno.id);
                                 const isPresent = status === 'P';
                                 const isAbsent = status === 'F';
                                 
                                 return (
                                     <button 
                                        key={aluno.id}
                                        onClick={() => togglePresenca(aluno.id)}
                                        className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-200 group
                                            ${isPresent ? 'border-emerald-400 bg-emerald-50' : ''}
                                            ${isAbsent ? 'border-red-200 bg-red-50' : ''}
                                            ${!status ? 'border-gray-100 bg-white hover:border-gray-300' : ''}
                                        `}
                                     >
                                         <div className="flex items-center">
                                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mr-4 transition-colors shadow-sm
                                                 ${isPresent ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'}
                                             `}>
                                                 {aluno.nome_completo.charAt(0)}
                                             </div>
                                             <div className="text-left">
                                                 <p className={`font-bold text-base ${isPresent ? 'text-emerald-900' : 'text-gray-900'}`}>{aluno.nome_completo}</p>
                                                 <p className="text-xs font-medium opacity-60 uppercase tracking-wide mt-1">{isPresent ? 'Presente' : isAbsent ? 'Ausente' : 'Não Marcado'}</p>
                                             </div>
                                         </div>
                                         <div className="transform transition-transform group-active:scale-90">
                                             {isPresent ? <CheckCircle className="text-emerald-500" size={28} fill="currentColor" stroke="white" /> : 
                                              isAbsent ? <X className="text-red-400" size={24} /> :
                                              <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>}
                                         </div>
                                     </button>
                                 )
                             })}
                         </div>
                     </div>
                 ) : (
                     // VIEW MODE & OBSERVATIONS
                     <div className="space-y-8 animate-fade-in">
                        {/* Attendance Summary */}
                        <div>
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resumo da Frequência</h4>
                             {activeCatequizandos.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {activeCatequizandos.map(aluno => {
                                        const status = getStatus(aluno.id);
                                        return (
                                            <div key={aluno.id} className={`text-xs font-medium px-3 py-1.5 rounded-full border flex items-center transition-colors
                                                ${status === 'P' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : ''}
                                                ${status === 'F' ? 'bg-red-50 border-red-100 text-red-700' : ''}
                                                ${!status ? 'bg-gray-50 border-gray-100 text-gray-400' : ''}
                                            `}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${status === 'P' ? 'bg-emerald-500' : status === 'F' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                                {aluno.nome_completo.split(' ')[0]}
                                            </div>
                                        )
                                    })}
                                </div>
                             ) : <p className="text-sm text-gray-400 italic">Nenhum {labels.participante.toLowerCase()} cadastrado neste {labels.turma.toLowerCase()}.</p>}
                        </div>

                        {/* Roteiro Pastoral */}
                        <div className="bg-white rounded-2xl border border-gray-100">
                             <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Roteiro Pastoral</h4>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setRoteiroViewMode('view')}
                                    className={`p-2 rounded-lg transition-colors ${roteiroViewMode === 'view' ? 'bg-church-100 text-church-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                                    title="Visualizar"
                                  >
                                    <Eye size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRoteiroViewMode('edit')}
                                    className={`p-2 rounded-lg transition-colors ${roteiroViewMode === 'edit' ? 'bg-church-100 text-church-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                                    title="Editar"
                                  >
                                    <Pencil size={18} />
                                  </button>
                                </div>
                             </div>
                             <div className="p-5 min-h-[200px]">
                               {roteiroViewMode === 'view' ? (
                                 <div className="bg-amber-50/30 rounded-xl p-6 border border-amber-100/50">
                                   <RoteiroViewer content={localRoteiro} onEmptyEdit={() => setRoteiroViewMode('edit')} />
                                 </div>
                               ) : (
                                 <textarea 
                                   className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-church-500 outline-none min-h-[200px] bg-gray-50 focus:bg-white transition-colors leading-relaxed font-serif"
                                   value={localRoteiro}
                                   onChange={handleRoteiroChange}
                                   onBlur={handleRoteiroBlur}
                                   placeholder="Descreva o roteiro do encontro: 1. Acolhida, 2. Leituras, 3. Dinâmicas..."
                                 />
                               )}
                             </div>
                        </div>
                    </div>
                 )}
               </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <Calendar size={40} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-600">Nenhum {labels.encontro} Selecionado</h3>
              <p className="text-sm mt-2 max-w-xs text-center">Selecione um {labels.encontro.toLowerCase()} na lista ao lado ou agende um novo momento.</p>
            </div>
          )}

          {/* Liturgical Calendar Widget */}
          {!isChamadaMode && (
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-8 text-white shadow-xl shadow-emerald-200 relative overflow-hidden mt-6 group cursor-pointer hover:scale-[1.01] transition-transform">
                <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-3">
                    <Sparkles size={16} className="text-emerald-300" />
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Dica Pastoral</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Planejamento Litúrgico</h3>
                <p className="text-emerald-50 text-sm max-w-lg leading-relaxed opacity-90">
                    Ao criar novos {labels.encontros.toLowerCase()}, use nossa <strong>IA Pastoral</strong> para alinhar automaticamente o tema com o Santo do Dia e as leituras da Igreja.
                </p>
                </div>
                <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 text-white/5 w-64 h-64 -mr-10 group-hover:scale-110 transition-transform duration-700" />
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Encontro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
             <div className="bg-church-600 p-5 flex justify-between items-center text-white shrink-0">
                <h3 className="font-bold text-lg">Novo {labels.encontro}</h3>
                <button onClick={() => { setIsModalOpen(false); setAiSuggestion(null); setCustomPrompt(''); }} className="hover:bg-white/20 rounded-full p-1"><X size={20} /></button>
             </div>
             
             <form onSubmit={handleSaveEncontro} className="p-6 space-y-6 overflow-y-auto">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data do {labels.encontro}</label>
                   <div className="flex gap-3">
                       <input 
                          type="date" 
                          required
                          value={newEncontro.data}
                          onChange={e => setNewEncontro({...newEncontro, data: e.target.value})}
                          className="flex-1 border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all"
                       />
                       <button
                          type="button"
                          onClick={handleConsultAi}
                          disabled={!newEncontro.data || isLoadingAi}
                          className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center disabled:opacity-50 border border-indigo-100"
                       >
                           {isLoadingAi ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="mr-2"/>}
                           Consultar Liturgia
                       </button>
                   </div>
                </div>

                {/* AI Suggestion Card - Rich Design */}
                {aiSuggestion && (
                    <div className="relative overflow-hidden rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
                        {/* Liturgical Header */}
                        <div className={`p-4 text-white flex justify-between items-start
                            ${aiSuggestion.cor.toLowerCase().includes('vermelho') ? 'bg-gradient-to-r from-red-600 to-red-500' :
                              aiSuggestion.cor.toLowerCase().includes('roxo') ? 'bg-gradient-to-r from-purple-600 to-purple-500' :
                              aiSuggestion.cor.toLowerCase().includes('branco') ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950' :
                              'bg-gradient-to-r from-emerald-600 to-emerald-500'
                            }`}
                        >
                            <div>
                                <div className="flex items-center space-x-1 opacity-90 text-xs font-bold uppercase tracking-widest mb-1">
                                    <BookOpen size={12} />
                                    <span>Santo do Dia / Liturgia</span>
                                </div>
                                <h4 className="font-bold text-xl leading-tight">{aiSuggestion.santo}</h4>
                                <p className="text-sm opacity-90 mt-1 italic leading-snug max-w-sm">"{aiSuggestion.vida_breve}"</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 flex flex-col items-center min-w-[60px]">
                                <span className="text-[10px] uppercase font-bold">Cor</span>
                                <div className={`w-4 h-4 rounded-full mt-1 border-2 border-white/50
                                    ${aiSuggestion.cor.toLowerCase().includes('vermelho') ? 'bg-red-600' :
                                      aiSuggestion.cor.toLowerCase().includes('roxo') ? 'bg-purple-600' :
                                      aiSuggestion.cor.toLowerCase().includes('branco') ? 'bg-white' :
                                      'bg-emerald-600'
                                    }`}></div>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="bg-white p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase flex items-center mb-2">
                                        <Book size={12} className="mr-1"/> Leituras
                                    </h5>
                                    <p className="text-sm font-medium text-gray-800">{aiSuggestion.leituras}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase flex items-center mb-2">
                                        <Feather size={12} className="mr-1"/> Tema Sugerido
                                    </h5>
                                    <p className="text-sm font-medium text-gray-800">{aiSuggestion.tema_sugerido}</p>
                                </div>
                            </div>

                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <h5 className="text-xs font-bold text-emerald-700 uppercase flex items-center mb-2">
                                    <Sparkles size={12} className="mr-1"/> Ideia de Dinâmica
                                </h5>
                                <p className="text-sm font-medium text-emerald-900">{aiSuggestion.ideia_dinamica}</p>
                            </div>

                            <button
                                type="button"
                                onClick={handleApplySuggestion}
                                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white hover:bg-indigo-700 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 transform active:scale-95"
                            >
                                <CheckCircle size={18} />
                                <span>Aplicar Sugestão ao Formulário</span>
                            </button>

                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <label className="block text-xs font-bold text-indigo-800 mb-2 uppercase tracking-widest">
                                    Contexto Específico (Opcional)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        placeholder="Ex: Focar na obediência, incluir dinâmica de grupo..."
                                        className="flex-1 text-sm border border-indigo-100 bg-indigo-50/30 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleGenerateScript}
                                        disabled={isGeneratingScript}
                                        className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center disabled:opacity-50"
                                        title="Gerar Roteiro Completo"
                                    >
                                        {isGeneratingScript ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                                        <span className="ml-2 text-xs font-bold">Gerar Roteiro</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tema</label>
                   <input 
                      type="text" 
                      required
                      value={newEncontro.tema}
                      onChange={e => setNewEncontro({...newEncontro, tema: e.target.value})}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all"
                      placeholder="Ex: Iniciação à Vida Cristã"
                   />
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cor Litúrgica</label>
                   <select 
                      value={newEncontro.cor_liturgica}
                      onChange={e => setNewEncontro({...newEncontro, cor_liturgica: e.target.value as LiturgicalColor})}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all"
                   >
                      {Object.values(LiturgicalColor).map(cor => (
                         <option key={cor} value={cor}>{cor}</option>
                      ))}
                   </select>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Roteiro Pastoral</label>
                   <textarea 
                      value={newEncontro.observacoes}
                      onChange={e => setNewEncontro({...newEncontro, observacoes: e.target.value})}
                      placeholder="Descreva o roteiro do encontro: 1. Acolhida, 2. Leituras, 3. Dinâmicas..."
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all min-h-[120px] resize-y"
                   />
                   <p className="text-xs text-gray-400 mt-1">Opcional. Você também pode preencher depois ou usar a IA para gerar.</p>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-church-600 text-white py-3.5 rounded-xl font-bold hover:bg-church-700 transition-all shadow-lg shadow-church-200 transform active:scale-95 mt-4"
                >
                   Confirmar Agendamento
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingManager;