import React, { useState } from 'react';
import { UserPlus, Plus, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useFiel } from '../../contexts/FielContext';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { ResponsavelSimples } from '../../types';

const EMPTY_RESPONSAVEL: ResponsavelSimples = { nome: '', parentesco: '', telefone: '' };

const FielMatricula: React.FC = () => {
  const { session } = useFiel();
  const hasDb = isSupabaseConfigured();

  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsaveis, setResponsaveis] = useState<ResponsavelSimples[]>([{ ...EMPTY_RESPONSAVEL }]);
  const [sacramentos, setSacramentos] = useState({ batismo: false, eucaristia: false, crisma: false });
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const addResponsavel = () => setResponsaveis(prev => [...prev, { ...EMPTY_RESPONSAVEL }]);

  const removeResponsavel = (idx: number) => {
    if (responsaveis.length <= 1) return;
    setResponsaveis(prev => prev.filter((_, i) => i !== idx));
  };

  const updateResponsavel = (idx: number, field: keyof ResponsavelSimples, value: string) => {
    setResponsaveis(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setError('');
    setSubmitting(true);

    const validResponsaveis = responsaveis.filter(r => r.nome.trim());
    if (validResponsaveis.length === 0) {
      setError('Informe pelo menos um responsável.');
      setSubmitting(false);
      return;
    }

    const payload = {
      paroquia_id: session.paroquiaId,
      comunidade_id: session.comunidadeId,
      email_fiel: session.email,
      nome_completo: nome.trim(),
      data_nascimento: dataNascimento,
      telefone: telefone.trim(),
      responsaveis: validResponsaveis,
      sacramentos,
      observacoes: observacoes.trim(),
      status: 'pendente',
    };

    if (hasDb && supabase) {
      const { error: dbError } = await supabase.from('solicitacoes').insert(payload);
      if (dbError) {
        setError(dbError.message || 'Erro ao enviar solicitação.');
        setSubmitting(false);
        return;
      }
    }

    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Solicitação Enviada!</h2>
        <p className="text-gray-500">
          O coordenador da <strong>{session?.comunidadeNome}</strong> receberá sua solicitação de matrícula
          e entrará em contato pelo e-mail <strong>{session?.email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
          <UserPlus size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Matricular Catequizando</h2>
          <p className="text-sm text-gray-500">Preencha os dados. O coordenador analisará a solicitação.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-start mb-4">
          <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white transition-all"
              placeholder="Nome completo do catequizando"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento *</label>
              <input
                type="date"
                required
                value={dataNascimento}
                onChange={e => setDataNascimento(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Sacramentos Recebidos</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {(['batismo', 'eucaristia', 'crisma'] as const).map(sac => (
                <label key={sac} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sacramentos[sac]}
                    onChange={() => setSacramentos(prev => ({ ...prev, [sac]: !prev[sac] }))}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{sac}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-700">Responsáveis *</label>
              <button
                type="button"
                onClick={addResponsavel}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            <div className="space-y-4">
              {responsaveis.map((resp, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                  {responsaveis.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResponsavel(idx)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={resp.nome}
                      onChange={e => updateResponsavel(idx, 'nome', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      placeholder="Nome"
                    />
                    <input
                      type="text"
                      value={resp.parentesco}
                      onChange={e => updateResponsavel(idx, 'parentesco', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      placeholder="Parentesco (Pai, Mãe...)"
                    />
                    <input
                      type="tel"
                      value={resp.telefone}
                      onChange={e => updateResponsavel(idx, 'telefone', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      placeholder="Telefone"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Observações</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white transition-all min-h-[80px] resize-y text-sm"
              placeholder="Informações adicionais, necessidades especiais, etc."
            />
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center disabled:opacity-50 transform active:scale-[0.98]"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Enviar Solicitação de Matrícula'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FielMatricula;
