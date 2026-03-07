import React, { useState } from 'react';
import { Church, Plus, X, Users, Calendar, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usePastoral } from '../contexts/PastoralContext';

const EstruturaView: React.FC = () => {
  const { turmas, addTurma } = useData();
  const { labels, config } = usePastoral();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    comunidade_id: '',
    etapa_id: '',
    etapa_nome: config.etapasDisponiveis[0] || '',
    ano: currentYear,
    faixa_etaria: '',
    dia_encontro: '',
    horario: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.etapa_nome || !form.dia_encontro || !form.horario) return;
    addTurma({
      comunidade_id: form.comunidade_id || '',
      etapa_id: form.etapa_id || '',
      etapa_nome: form.etapa_nome,
      ano: form.ano,
      faixa_etaria: form.faixa_etaria,
      dia_encontro: form.dia_encontro,
      horario: form.horario,
    });
    setIsModalOpen(false);
    setForm({
      ...form,
      etapa_nome: config.etapasDisponiveis[0] || '',
      faixa_etaria: '',
      dia_encontro: '',
      horario: '',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Church className="mr-2 text-church-600" size={28} />
            Estrutura Paroquial
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie as {labels.turmas.toLowerCase()} da {labels.pastoralNome.toLowerCase()}. Crie {labels.turmas.toLowerCase()} para organizar {labels.participantes.toLowerCase()} e {labels.encontros.toLowerCase()}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-church-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center hover:bg-church-700 transition-colors shadow-lg shadow-church-200"
        >
          <Plus size={20} className="mr-2" />
          Nova {labels.turma}
        </button>
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
            turmas.map((t) => (
              <div
                key={t.id}
                className="p-5 hover:bg-gray-50/50 transition-colors flex flex-wrap items-center gap-4"
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
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Nova Turma */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-church-600 p-5 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Nova {labels.turma}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 rounded-full p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.etapa}</label>
                <select
                  required
                  value={form.etapa_nome}
                  onChange={(e) => setForm({ ...form, etapa_nome: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                >
                  {config.etapasDisponiveis.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
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
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-church-600 text-white py-3 rounded-xl font-semibold hover:bg-church-700 transition-colors"
                >
                  Criar {labels.turma}
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
