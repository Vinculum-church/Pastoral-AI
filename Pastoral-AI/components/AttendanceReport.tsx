import React, { useState } from 'react';
import { Calendar, Printer, Download, Filter, Check, X, Minus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usePastoral } from '../contexts/PastoralContext';
import { Encontro, Presenca } from '../types';

const AttendanceReport: React.FC = () => {
  const { turmas, encontros, catequizandos, presencas, paroquia } = useData();
  const { labels } = usePastoral();
  const [selectedTurma, setSelectedTurma] = useState(turmas[0]?.id || '');

  // 1. Filtrar Encontros da Turma e Ordenar por Data
  const filteredEncontros = encontros
    .filter(e => e.turma_id === selectedTurma)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  // 2. Filtrar Catequizandos da Turma e Ordenar por Nome
  const filteredCatequizandos = catequizandos
    .filter(c => c.turma_id === selectedTurma)
    .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

  const activeTurmaName = turmas.find(t => t.id === selectedTurma)?.etapa_nome || 'Turma';

  // Helper para pegar status de um aluno em um encontro
  const getPresencaStatus = (alunoId: string, encontroId: string) => {
    const record = presencas.find(p => p.encontro_id === encontroId && p.catequizando_id === alunoId);
    return record ? record.status : null; // null = não registrado
  };

  // Calcular estatísticas individuais
  const calculateStats = (alunoId: string) => {
    let totalP = 0;
    let totalF = 0;
    let totalEncontrosRealizados = 0;

    filteredEncontros.forEach(enc => {
        if (enc.concluido) {
            totalEncontrosRealizados++;
            const status = getPresencaStatus(alunoId, enc.id);
            if (status === 'P') totalP++;
            else if (status === 'F') totalF++;
            // Justificado conta como ausência no cálculo de % ou ignora? 
            // Pastoralmente, justificado não penaliza, mas aqui vamos contar presença real.
            // Para simplicidade: % = Presenças / Encontros Concluídos
        }
    });

    const percent = totalEncontrosRealizados > 0 
        ? Math.round((totalP / totalEncontrosRealizados) * 100) 
        : 100;

    return { totalP, totalF, percent };
  };

  const handlePrint = () => {
    const win = window.open('', '', 'width=1000,height=600');
    if (!win) return;

    const printStyles = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1a1a1a; font-size: 11px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        h1 { font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; color: #1e3a8a; }
        h2 { font-size: 14px; margin: 5px 0; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ccc; padding: 6px 4px; text-align: center; }
        th { background-color: #f3f4f6; font-weight: bold; font-size: 10px; }
        th.name-col { text-align: left; width: 250px; padding-left: 8px; }
        td.name-col { text-align: left; padding-left: 8px; font-weight: 500; }
        .status-p { color: green; font-weight: bold; }
        .status-f { color: red; font-weight: bold; background-color: #fef2f2; }
        .status-j { color: orange; font-weight: bold; }
        .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); height: 80px; white-space: nowrap; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; }
        @media print { 
            button { display: none; } 
            body { padding: 0; }
            th { background-color: #eee !important; -webkit-print-color-adjust: exact; }
            .status-f { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; }
        }
      </style>
    `;

    // Gerar colunas de datas
    const dateHeaders = filteredEncontros.map(e => {
        const dateObj = new Date(e.data);
        const formattedDate = `${dateObj.getDate().toString().padStart(2,'0')}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}`;
        return `<th><div class="vertical-text">${formattedDate}</div></th>`;
    }).join('');

    // Gerar linhas de alunos
    const rows = filteredCatequizandos.map((aluno, idx) => {
        const stats = calculateStats(aluno.id);
        const cells = filteredEncontros.map(e => {
            const status = getPresencaStatus(aluno.id, e.id);
            let symbol = '-';
            let className = '';
            if (status === 'P') { symbol = '•'; className = 'status-p'; }
            if (status === 'F') { symbol = 'F'; className = 'status-f'; }
            if (status === 'J') { symbol = 'J'; className = 'status-j'; }
            return `<td class="${className}">${symbol}</td>`;
        }).join('');

        return `
            <tr>
                <td>${idx + 1}</td>
                <td class="name-col">${aluno.nome_completo}</td>
                ${cells}
                <td>${stats.totalP}</td>
                <td>${stats.totalF}</td>
                <td><strong>${stats.percent}%</strong></td>
            </tr>
        `;
    }).join('');

    const html = `
      <html>
        <head><title>Relatório de Frequência - ${activeTurmaName}</title>${printStyles}</head>
        <body>
          <div class="header">
            <h1>${paroquia.nome}</h1>
            <h2>Relatório de Frequência - ${activeTurmaName}</h2>
            <p>Ano: ${new Date().getFullYear()}</p>
          </div>
          
          <table>
            <thead>
                <tr>
                    <th style="width: 30px">#</th>
                    <th class="name-col">${labels.participante}</th>
                    ${dateHeaders}
                    <th style="width: 40px">Pres.</th>
                    <th style="width: 40px">Faltas</th>
                    <th style="width: 50px">%</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
          </table>
          
          <div class="footer">Gerado em ${new Date().toLocaleDateString()} - Sistema Vinculum</div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Frequência</h2>
          <p className="text-gray-500 text-sm">Visão geral de presença por {labels.turma.toLowerCase()} e por {labels.encontro.toLowerCase()}.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex items-center shadow-sm w-full md:w-auto">
                <Filter size={16} className="text-gray-400 mr-2" />
                <select 
                    value={selectedTurma}
                    onChange={(e) => setSelectedTurma(e.target.value)}
                    className="bg-transparent outline-none text-sm text-gray-700 w-full"
                >
                    {turmas.map(t => (
                        <option key={t.id} value={t.id}>{t.etapa_nome} - {t.dia_encontro}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={handlePrint}
                className="bg-church-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center hover:bg-church-700 transition-colors shadow-sm whitespace-nowrap"
            >
                <Printer size={18} className="mr-2" />
                Imprimir Relatório
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         {/* Tabela com Scroll Horizontal para muitos encontros */}
         <div className="overflow-x-auto pb-4">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-gray-700 w-10">#</th>
                        <th className="px-6 py-4 font-semibold text-gray-700 min-w-[250px] sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            {labels.participante}
                        </th>
                        {filteredEncontros.map(enc => (
                            <th key={enc.id} className="px-2 py-4 font-semibold text-gray-500 text-center min-w-[60px]">
                                <div className="flex flex-col items-center group relative cursor-help">
                                    <span className="text-xs font-bold text-church-600">
                                        {new Date(enc.data).getDate().toString().padStart(2, '0')}/{(new Date(enc.data).getMonth()+1).toString().padStart(2, '0')}
                                    </span>
                                    {/* Tooltip do tema */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded w-40 z-20 text-center shadow-lg">
                                        {enc.tema}
                                    </div>
                                    {enc.concluido && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1"></div>}
                                </div>
                            </th>
                        ))}
                        <th className="px-4 py-4 font-semibold text-gray-700 text-center border-l border-gray-100 bg-gray-50">Freq.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredCatequizandos.map((aluno, index) => {
                        const stats = calculateStats(aluno.id);
                        const isLowAttendance = stats.percent < 75; // Alerta se frequência < 75%

                        return (
                            <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-gray-500">{index + 1}</td>
                                <td className="px-6 py-3 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {aluno.nome_completo}
                                    {isLowAttendance && (
                                        <span className="block text-[10px] text-red-500 font-normal mt-0.5">Atenção pastoral necessária</span>
                                    )}
                                </td>
                                {filteredEncontros.map(enc => {
                                    const status = getPresencaStatus(aluno.id, enc.id);
                                    let content = <span className="text-gray-200 text-xs">-</span>;
                                    
                                    if (status === 'P') {
                                        content = <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto"><Check size={14} strokeWidth={3} /></div>;
                                    } else if (status === 'F') {
                                        content = <div className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto"><X size={14} strokeWidth={3} /></div>;
                                    } else if (status === 'J') {
                                        content = <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto font-bold text-xs">J</div>;
                                    }

                                    return (
                                        <td key={enc.id} className="px-2 py-3 text-center border-l border-transparent hover:border-gray-100">
                                            {content}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 text-center border-l border-gray-100 bg-gray-50/50">
                                    <div className={`text-sm font-bold ${isLowAttendance ? 'text-red-600' : 'text-green-700'}`}>
                                        {stats.percent}%
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        {stats.totalP} P / {stats.totalF} F
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredCatequizandos.length === 0 && (
                        <tr>
                            <td colSpan={filteredEncontros.length + 3} className="px-6 py-8 text-center text-gray-400">
                                Nenhum {labels.participante.toLowerCase()} encontrado neste {labels.turma.toLowerCase()}.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
         
         <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-500">
             <div className="flex items-center"><div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-2"><Check size={10} /></div> Presença</div>
             <div className="flex items-center"><div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-red-500 mr-2"><X size={10} /></div> Falta</div>
             <div className="flex items-center"><div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold mr-2">J</div> Justificativa</div>
             <div className="flex items-center ml-auto">Frequência mínima ideal: 75%</div>
         </div>
      </div>
    </div>
  );
};

export default AttendanceReport;