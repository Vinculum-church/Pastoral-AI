import React, { useState, useEffect } from 'react';
import { Church, Plus, X, Users, Calendar, Clock, Trash2, Pencil, Printer } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { usePastoral } from '../contexts/PastoralContext';
import { UserRole } from '../types';

const EstruturaView: React.FC = () => {
  const { turmas, catequizandos, catequistas, encontros, paroquia, addTurma, updateTurma, removeTurma } = useData();
  const { user } = useAuth();
  const { labels, config } = usePastoral();
  const isCoordenador = user?.role === UserRole.COORDENADOR || user?.role === UserRole.ADMIN;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomEtapa, setIsCustomEtapa] = useState(false);
  const CUSTOM_OPTION = 'Outro (personalizado)';
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    comunidade_id: user?.comunidade_id || '',
    etapa_id: '',
    etapa_nome: config.etapasDisponiveis[0] || '',
    ano: currentYear,
    faixa_etaria: '',
    dia_encontro: '',
    horario: '',
  });

  useEffect(() => {
    if (user?.comunidade_id) {
      setForm(prev => ({ ...prev, comunidade_id: user.comunidade_id! }));
    }
  }, [user?.comunidade_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.etapa_nome || !form.dia_encontro || !form.horario) return;
    if (editingId) {
      const existing = turmas.find(t => t.id === editingId);
      if (existing) {
        updateTurma({ ...existing, etapa_nome: form.etapa_nome, ano: form.ano, faixa_etaria: form.faixa_etaria, dia_encontro: form.dia_encontro, horario: form.horario });
      }
    } else {
      addTurma({
        comunidade_id: form.comunidade_id || user?.comunidade_id || '',
        etapa_id: form.etapa_id || '',
        etapa_nome: form.etapa_nome,
        ano: form.ano,
        faixa_etaria: form.faixa_etaria,
        dia_encontro: form.dia_encontro,
        horario: form.horario,
      });
    }
    setIsModalOpen(false);
    setEditingId(null);
    setIsCustomEtapa(false);
    setForm({ ...form, etapa_nome: config.etapasDisponiveis[0] || '', faixa_etaria: '', dia_encontro: '', horario: '' });
  };

  const startEdit = (t: typeof turmas[0]) => {
    setEditingId(t.id);
    const isPredefined = config.etapasDisponiveis.filter(e => e !== CUSTOM_OPTION).includes(t.etapa_nome);
    setIsCustomEtapa(!isPredefined);
    setForm({ ...form, etapa_nome: t.etapa_nome, ano: t.ano, faixa_etaria: t.faixa_etaria || '', dia_encontro: t.dia_encontro, horario: t.horario });
    setIsModalOpen(true);
  };

  const handlePrintTurmas = () => {
    const win = window.open('', '', 'width=900,height=700');
    if (!win) return;
    const turmasHtml = turmas.map(t => {
      const participantes = catequizandos.filter(c => c.turma_id === t.id);
      const lideres = catequistas.filter(c => c.turma_id === t.id);
      const totalEncontros = encontros.filter(e => e.turma_id === t.id).length;
      return `
        <div class="turma">
          <h2>${t.etapa_nome || labels.turma}</h2>
          <div class="info-row"><strong>Dia:</strong> ${t.dia_encontro} &nbsp;|&nbsp; <strong>Horário:</strong> ${t.horario} &nbsp;|&nbsp; <strong>Ano:</strong> ${t.ano}${t.faixa_etaria ? ` &nbsp;|&nbsp; <strong>Faixa etária:</strong> ${t.faixa_etaria}` : ''}</div>
          <div class="info-row"><strong>${labels.encontros}:</strong> ${totalEncontros} &nbsp;|&nbsp; <strong>${labels.participantes}:</strong> ${participantes.length}</div>
          <h3>${labels.lideres} (${lideres.length})</h3>
          ${lideres.length > 0 ? `<table><thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th></tr></thead><tbody>${lideres.map(l => `<tr><td>${l.nome}</td><td>${l.telefone || '-'}</td><td>${l.email || '-'}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Nenhum ${labels.lider.toLowerCase()} atribuído.</p>'}
          <h3>${labels.participantes} (${participantes.length})</h3>
          ${participantes.length > 0 ? `<table><thead><tr><th>Nome</th><th>Idade</th><th>Telefone</th><th>Responsável</th></tr></thead><tbody>${participantes.map(p => {
            const age = p.data_nascimento ? Math.floor((Date.now() - new Date(p.data_nascimento).getTime()) / 31557600000) : '-';
            const resp = (p.responsaveis && p.responsaveis.length > 0) ? p.responsaveis.map(r => `${r.nome} (${r.telefone})`).join(', ') : p.nome_responsavel ? `${p.nome_responsavel} (${p.telefone_responsavel})` : '-';
            return `<tr><td>${p.nome_completo}</td><td>${age}</td><td>${p.telefone || '-'}</td><td>${resp}</td></tr>`;
          }).join('')}</tbody></table>` : '<p class="empty">Nenhum ${labels.participante.toLowerCase()} cadastrado.</p>'}
        </div>`;
    }).join('');

    win.document.write(`<html><head><title>Relatório de ${labels.turmas}</title>
      <style>
        body{font-family:Inter,sans-serif;padding:25px;color:#1a1a1a;font-size:12px}
        .header{text-align:center;margin-bottom:20px;border-bottom:2px solid #e5e7eb;padding-bottom:12px}
        .header h1{font-size:16px;font-weight:bold;margin:0;text-transform:uppercase}
        .header p{font-size:11px;color:#666;margin:4px 0 0}
        .turma{margin-bottom:28px;page-break-inside:avoid}
        .turma h2{font-size:14px;background:#f0f4ff;padding:8px 12px;border-radius:6px;margin:0 0 8px;border-left:4px solid #4f46e5}
        .turma h3{font-size:11px;text-transform:uppercase;color:#6b7280;margin:12px 0 6px;letter-spacing:0.5px}
        .info-row{font-size:11px;color:#555;margin-bottom:4px}
        table{width:100%;border-collapse:collapse;margin-top:4px}
        th,td{border:1px solid #e5e7eb;padding:5px 8px;text-align:left;font-size:11px}
        th{background:#f9fafb;font-weight:600;text-transform:uppercase;font-size:10px}
        .empty{color:#9ca3af;font-style:italic;font-size:11px}
        .footer{margin-top:30px;text-align:center;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}
        @media print{button{display:none}body{padding:0}}
      </style></head><body>
      <div class="header"><h1>${paroquia.nome}</h1><p>Relatório de ${labels.turmas} — ${user?.comunidade || ''}</p></div>
      ${turmasHtml}
      <div class="footer">Gerado pelo sistema PastoriAI — ${new Date().toLocaleDateString()}</div>
      <script>window.print();</script></body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-900 flex items-center">
            <Church className="mr-2 text-church-600" size={28} />
            Estrutura Paroquial
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie as {labels.turmas.toLowerCase()} da {labels.pastoralNome.toLowerCase()}. Crie {labels.turmas.toLowerCase()} para organizar {labels.participantes.toLowerCase()} e {labels.encontros.toLowerCase()}.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handlePrintTurmas}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-2.5 rounded-xl font-semibold flex items-center hover:bg-gray-50 transition-colors">
            <Printer size={18} className="mr-1.5" /> <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button type="button"
            onClick={() => { setEditingId(null); setIsCustomEtapa(false); setForm({ ...form, etapa_nome: config.etapasDisponiveis[0] || '', faixa_etaria: '', dia_encontro: '', horario: '' }); setIsModalOpen(true); }}
            className="bg-church-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center hover:bg-church-700 transition-colors shadow-lg shadow-church-200">
            <Plus size={20} className="mr-2" />
            Nova {labels.turma}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
            {labels.turmas} cadastradas ({turmas.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {turmas.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Church size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">Nenhuma {labels.turma.toLowerCase()} ainda.</p>
              <p className="text-sm mt-1">Clique em &quot;Nova {labels.turma}&quot; para criar a primeira.</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-6 bg-church-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-church-700 transition-colors"
              >
                <Plus size={18} className="inline mr-2" />
                Nova {labels.turma}
              </button>
            </div>
          ) : (
            turmas.map((t) => {
              const turmaParticipantes = catequizandos.filter(c => c.turma_id === t.id).length;
              const turmaEncontros = encontros.filter(e => e.turma_id === t.id).length;
              return (
              <div
                key={t.id}
                className="p-5 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-church-50 text-church-600 flex items-center justify-center shrink-0">
                    <Users size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.etapa_nome || labels.turma}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-0.5">
                      <span className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {t.dia_encontro}
                      </span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {t.horario}
                      </span>
                      {t.ano && <span>Ano {t.ano}</span>}
                      {t.faixa_etaria && <span>{t.faixa_etaria}</span>}
                      <span className="text-xs text-gray-400">
                        {turmaParticipantes} {turmaParticipantes === 1 ? labels.participante : labels.participantes} · {turmaEncontros} {turmaEncontros === 1 ? labels.encontro : labels.encontros}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => startEdit(t)}
                    className="p-2 rounded-xl text-gray-400 hover:text-church-600 hover:bg-church-50 transition-colors cursor-pointer" title="Editar">
                    <Pencil size={18} />
                  </button>
                  {isCoordenador && (
                    <button type="button" onClick={() => { setDeletingId(t.id); setDeleteError(''); }}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Excluir">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Confirmar Exclusão */}
      {deletingId && (() => {
        const turmaToDelete = turmas.find(t => t.id === deletingId);
        const participantCount = catequizandos.filter(c => c.turma_id === deletingId).length;
        const encontroCount = encontros.filter(e => e.turma_id === deletingId).length;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="bg-red-600 p-5 flex justify-between items-center text-white">
                <h3 className="font-bold text-lg">Excluir {labels.turma}</h3>
                <button type="button" onClick={() => setDeletingId(null)} className="hover:bg-white/20 rounded-full p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700">
                  Tem certeza que deseja excluir <strong>{turmaToDelete?.etapa_nome}</strong>?
                </p>
                {(participantCount > 0 || encontroCount > 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                    Esta {labels.turma.toLowerCase()} possui <strong>{participantCount}</strong> {participantCount === 1 ? labels.participante.toLowerCase() : labels.participantes.toLowerCase()} e <strong>{encontroCount}</strong> {encontroCount === 1 ? labels.encontro.toLowerCase() : labels.encontros.toLowerCase()}. Todos serão removidos.
                  </div>
                )}
                {deleteError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{deleteError}</div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await removeTurma(deletingId);
                        setDeletingId(null);
                      } catch (err: any) {
                        setDeleteError(err.message || 'Erro ao excluir.');
                      }
                    }}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Nova Turma */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-church-600 p-5 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">{editingId ? `Editar ${labels.turma}` : `Nova ${labels.turma}`}</h3>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="hover:bg-white/20 rounded-full p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.etapa}</label>
                <select
                  value={isCustomEtapa ? CUSTOM_OPTION : form.etapa_nome}
                  onChange={(e) => {
                    if (e.target.value === CUSTOM_OPTION) {
                      setIsCustomEtapa(true);
                      setForm({ ...form, etapa_nome: '' });
                    } else {
                      setIsCustomEtapa(false);
                      setForm({ ...form, etapa_nome: e.target.value });
                    }
                  }}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                >
                  {config.etapasDisponiveis.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
                {isCustomEtapa && (
                  <input
                    type="text"
                    required
                    value={form.etapa_nome}
                    onChange={(e) => setForm({ ...form, etapa_nome: e.target.value })}
                    placeholder="Digite o nome da turma"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none mt-2"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                  <input
                    type="number"
                    required
                    min={currentYear - 2}
                    max={currentYear + 1}
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: parseInt(e.target.value, 10) || currentYear })}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faixa etária (opcional)</label>
                  <input
                    type="text"
                    value={form.faixa_etaria}
                    onChange={(e) => setForm({ ...form, faixa_etaria: e.target.value })}
                    placeholder="Ex: 7-10 anos"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia do {labels.encontro}</label>
                <input
                  type="text"
                  required
                  value={form.dia_encontro}
                  onChange={(e) => setForm({ ...form, dia_encontro: e.target.value })}
                  placeholder="Ex: Sábado, Terça-feira"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <input
                  type="text"
                  required
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                  placeholder="Ex: 09:00 - 10:30"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                  className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-church-600 text-white py-3 rounded-xl font-semibold hover:bg-church-700 transition-colors"
                >
                  {editingId ? 'Salvar' : `Criar ${labels.turma}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstruturaView;
