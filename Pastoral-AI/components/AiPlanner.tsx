import React, { useState } from 'react';
import { Sparkles, Send, Loader2, BookOpen, Info, Printer, Save, Calendar, X } from 'lucide-react';
import { generateCatecheticalPlan } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import { usePastoral } from '../contexts/PastoralContext';
import { LiturgicalColor } from '../types';

const AiPlanner: React.FC = () => {
  const { addEncontro, turmas, paroquia } = useData();
  const { labels, config } = usePastoral();

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(config.etapasDisponiveis[0] || '');
  const [tempo, setTempo] = useState('Advento');

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveData, setSaveData] = useState({
    turmaId: turmas[0]?.id || '',
    data: '',
    tema: ''
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResult(null);

    const plan = await generateCatecheticalPlan(etapa, tempo, prompt);
    
    setResult(plan);
    setIsLoading(false);
    // Auto-fill theme suggestion based on prompt
    setSaveData(prev => ({ ...prev, tema: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt }));
  };

  const handlePrint = () => {
    if (!result) return;

    const win = window.open('', '', 'width=800,height=600');
    if (!win) return;

    const printStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Roboto:wght@300;400;500&display=swap');
        body { font-family: 'Roboto', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase; color: #1e3a8a; }
        .header h2 { font-size: 14px; font-weight: normal; margin: 5px 0 0; color: #666; letter-spacing: 1px; }
        .meta { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 30px; font-size: 13px; display: flex; gap: 20px; border: 1px solid #e5e7eb; }
        .content { font-family: 'Merriweather', serif; font-size: 14px; white-space: pre-wrap; text-align: justify; color: #374151; }
        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        @media print { button { display: none; } body { padding: 0; margin: 2cm; } }
      </style>
    `;

    const html = `
      <html>
        <head><title>Sugestão Pastoral - IA</title>${printStyles}</head>
        <body>
          <div class="header">
            <h1>${paroquia.nome}</h1>
            <h2>Sugestão de Encontro Catequético</h2>
          </div>
          
          <div class="meta">
             <div><strong>Etapa:</strong> ${etapa}</div>
             <div><strong>Tempo Litúrgico:</strong> ${tempo}</div>
             <div><strong>Intenção:</strong> ${prompt}</div>
          </div>

          <div class="content">
            ${result}
          </div>

          <div class="footer">Gerado pela Inteligência Artificial Pastoral - Vinculum</div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const handleSaveToSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !saveData.turmaId || !saveData.data || !saveData.tema) return;

    addEncontro({
      turma_id: saveData.turmaId,
      data: saveData.data,
      tema: saveData.tema,
      cor_liturgica: LiturgicalColor.GREEN, // Default, can be edited later
      observacoes: result,
      concluido: false
    });

    setIsSaveModalOpen(false);
    setSaveData({ ...saveData, data: '', tema: '' });
    alert('Encontro salvo com sucesso no cronograma!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full text-indigo-600 mb-4">
          <Sparkles size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Assistente Pastoral IA</h2>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">
          Utilize inteligência artificial para planejar {labels.encontros.toLowerCase()} inspiradores, fiéis ao magistério e adequados ao tempo litúrgico.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{labels.etapa}</label>
              <select 
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {config.etapasDisponiveis.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tempo Litúrgico</label>
              <select 
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="w-full border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Tempo Comum">Tempo Comum</option>
                <option value="Advento">Advento</option>
                <option value="Natal">Natal</option>
                <option value="Quaresma">Quaresma</option>
                <option value="Páscoa">Páscoa</option>
                <option value="Pentecostes">Pentecostes</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Sugira um encontro sobre os Dons do Espírito Santo com uma dinâmica para jovens agitados..."
              className="w-full p-4 pr-12 h-32 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none shadow-sm"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              title="Gerar Sugestão"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <div className="mt-2 flex items-center text-xs text-indigo-600">
            <Info size={12} className="mr-1" />
            <span>A IA sugere temas baseados na Doutrina Católica. Revise sempre antes de aplicar.</span>
          </div>
        </div>

        {result && (
          <div className="p-8 bg-white animate-fade-in relative">
            <div className="prose prose-indigo max-w-none">
              <div className="flex items-center space-x-2 text-indigo-800 mb-6 pb-4 border-b border-indigo-100">
                <BookOpen size={24} />
                <h3 className="text-xl font-bold m-0">Sugestão de {labels.encontro}</h3>
              </div>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
                {result}
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={handlePrint}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center font-semibold"
              >
                <Printer size={16} className="mr-2"/> Imprimir
              </button>
              <button 
                onClick={() => setIsSaveModalOpen(true)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center font-semibold"
              >
                <Save size={16} className="mr-2"/> Salvar no Cronograma
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Salvar Encontro */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden animate-fade-in">
             <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center"><Calendar size={18} className="mr-2"/> Salvar {labels.encontro}</h3>
                <button onClick={() => setIsSaveModalOpen(false)}><X size={20} /></button>
             </div>
             <form onSubmit={handleSaveToSchedule} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o {labels.turma}</label>
                   <select 
                      required
                      value={saveData.turmaId}
                      onChange={e => setSaveData({...saveData, turmaId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                   >
                      {turmas.map(t => (
                        <option key={t.id} value={t.id}>{t.etapa_nome} - {t.dia_encontro}</option>
                      ))}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Data do {labels.encontro}</label>
                   <input 
                      type="date" 
                      required
                      value={saveData.data}
                      onChange={e => setSaveData({...saveData, data: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Título / Tema</label>
                   <input 
                      type="text" 
                      required
                      value={saveData.tema}
                      onChange={e => setSaveData({...saveData, tema: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Tema do Encontro"
                   />
                </div>
                <div className="pt-2">
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                       Confirmar e Salvar
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPlanner;