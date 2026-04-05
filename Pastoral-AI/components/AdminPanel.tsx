import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Mail, Lock, User, Church, MapPin, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { PastoralType } from '../types';
import { PASTORAL_CONFIGS } from '../constants';
import type { PastoralConfig } from '../types';

interface Paroquia {
  id: string;
  nome: string;
  endereco?: string;
  telefone?: string;
}

interface Comunidade {
  id: string;
  paroquia_id: string;
  nome: string;
  padroeiro?: string;
}

const SEGMENTOS: { type: PastoralType; config: PastoralConfig }[] = [
  { type: PastoralType.CATEQUESE, config: PASTORAL_CONFIGS[PastoralType.CATEQUESE] },
  { type: PastoralType.PASTORAL_CRISTA, config: PASTORAL_CONFIGS[PastoralType.PASTORAL_CRISTA] },
];

const AdminPanel: React.FC = () => {
  const { getSessionToken } = useAuth();
  const hasSupabase = isSupabaseConfigured();

  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    nome: '',
    paroquiaId: '',
    comunidadeId: '',
    pastoralType: PastoralType.CATEQUESE,
  });

  const [novaParoquia, setNovaParoquia] = useState({ nome: '', endereco: '', telefone: '' });
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', paroquiaId: '', padroeiro: '' });
  const [criandoParoquia, setCriandoParoquia] = useState(false);
  const [criandoComunidade, setCriandoComunidade] = useState(false);

  const loadData = async () => {
    if (!supabase) return;
    const [pRes, cRes] = await Promise.all([
      supabase.from('paroquias').select('id, nome, endereco, telefone').order('nome'),
      supabase.from('comunidades').select('id, paroquia_id, nome, padroeiro').order('nome'),
    ]);
    setParoquias(pRes.data || []);
    setComunidades(cRes.data || []);
  };

  useEffect(() => {
    if (!hasSupabase || !supabase) { setLoading(false); return; }
    loadData().finally(() => setLoading(false));
  }, [hasSupabase]);

  const comunidadesDaParoquia = form.paroquiaId
    ? comunidades.filter(c => c.paroquia_id === form.paroquiaId)
    : [];

  const handleCriarParoquia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaParoquia.nome.trim()) return;
    setError('');
    setSuccess('');
    setCriandoParoquia(true);
    try {
      if (!supabase) { setError('Supabase não configurado.'); setCriandoParoquia(false); return; }
      const { data, error } = await supabase
        .from('paroquias')
        .insert({ nome: novaParoquia.nome.trim(), endereco: novaParoquia.endereco || null, telefone: novaParoquia.telefone || null })
        .select('id, nome')
        .single();
      if (error) {
        setError(error.message || 'Erro ao criar paróquia.');
        setCriandoParoquia(false);
        return;
      }
      setSuccess('Paróquia criada com sucesso.');
      setNovaParoquia({ nome: '', endereco: '', telefone: '' });
      await loadData();
    } catch (err: any) { setError(err.message || 'Erro.'); }
    setCriandoParoquia(false);
  };

  const handleCriarComunidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaComunidade.nome.trim() || !novaComunidade.paroquiaId) {
      setError('Preencha o nome e selecione a paróquia.');
      return;
    }
    setError('');
    setSuccess('');
    setCriandoComunidade(true);
    try {
      if (!supabase) { setError('Supabase não configurado.'); setCriandoComunidade(false); return; }
      const { data, error } = await supabase
        .from('comunidades')
        .insert({ nome: novaComunidade.nome.trim(), paroquia_id: novaComunidade.paroquiaId, padroeiro: novaComunidade.padroeiro || null })
        .select('id, nome, paroquia_id')
        .single();
      if (error) {
        setError(error.message || 'Erro ao criar comunidade.');
        setCriandoComunidade(false);
        return;
      }
      setSuccess('Comunidade criada com sucesso.');
      setNovaComunidade({ nome: '', paroquiaId: '', padroeiro: '' });
      await loadData();
    } catch (err: any) { setError(err.message || 'Erro.'); }
    setCriandoComunidade(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.email || !form.password || !form.nome || !form.paroquiaId || !form.comunidadeId) {
      setError('Preencha todos os campos.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getSessionToken();
      console.log('AdminPanel: Token obtido:', !!token);
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setSubmitting(false);
        return;
      }
      const res = await fetch('/api/admin/create-coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nome: form.nome,
          paroquiaId: form.paroquiaId,
          comunidadeId: form.comunidadeId,
          pastoralType: form.pastoralType,
        }),
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        console.error('AdminPanel: Erro ao parsear resposta:', e);
      }
      
      console.log('AdminPanel: Resposta da API:', { status: res.status, data });
      
      if (!res.ok) {
        // Mostrar erro mas NÃO fazer logout - apenas exibir a mensagem
        const errorMsg = data.error || `Erro ${res.status} ao criar coordenador.`;
        if (data.debug) {
          console.error('AdminPanel: Debug info:', data.debug);
        }
        setError(errorMsg);
        setSubmitting(false);
        return;
      }
      setSuccess('Coordenador criado com sucesso. Ele pode acessar o sistema com o e-mail e senha definidos.');
      setForm({ ...form, email: '', password: '', nome: '', paroquiaId: '', comunidadeId: '' });
    } catch (err: any) {
      console.error('AdminPanel: Erro na requisição:', err);
      setError(err.message || 'Erro ao criar coordenador.');
    }
    setSubmitting(false);
  };

  const handleParoquiaChange = (paroquiaId: string) => {
    setForm(prev => ({ ...prev, paroquiaId, comunidadeId: '' }));
  };

  if (!hasSupabase) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-amber-50 border border-amber-200 rounded-2xl">
        <p className="text-amber-800 font-medium">Supabase não configurado. O painel admin requer banco de dados.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900">
          <Shield size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Painel Admin</h2>
          <p className="text-gray-500 text-sm">Crie paróquias, comunidades e coordenadores por segmento.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm flex items-start gap-2">
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Criar Paróquia */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50 p-4 border-b border-blue-100">
          <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <Church size={20} /> Nova Paróquia
          </h3>
          <p className="text-sm text-blue-900/80 mt-1">Cadastre uma nova paróquia antes de criar comunidades.</p>
        </div>
        <form onSubmit={handleCriarParoquia} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Paróquia</label>
            <input
              type="text"
              required
              value={novaParoquia.nome}
              onChange={e => setNovaParoquia(p => ({ ...p, nome: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Paróquia São Francisco"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={novaParoquia.endereco}
                onChange={e => setNovaParoquia(p => ({ ...p, endereco: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={novaParoquia.telefone}
                onChange={e => setNovaParoquia(p => ({ ...p, telefone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Opcional"
              />
            </div>
          </div>
          <button type="submit" disabled={criandoParoquia || loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
            {criandoParoquia ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Criar Paróquia
          </button>
        </form>
      </div>

      {/* Criar Comunidade */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-emerald-50 p-4 border-b border-emerald-100">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2">
            <MapPin size={20} /> Nova Comunidade
          </h3>
          <p className="text-sm text-emerald-900/80 mt-1">Cadastre comunidades vinculadas a uma paróquia.</p>
        </div>
        <form onSubmit={handleCriarComunidade} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Paróquia</label>
            <select
              required
              value={novaComunidade.paroquiaId}
              onChange={e => setNovaComunidade(p => ({ ...p, paroquiaId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="">Selecione a paróquia</option>
              {paroquias.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Comunidade</label>
            <input
              type="text"
              required
              value={novaComunidade.nome}
              onChange={e => setNovaComunidade(p => ({ ...p, nome: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Ex: Matriz São Francisco"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Padroeiro</label>
            <input
              type="text"
              value={novaComunidade.padroeiro}
              onChange={e => setNovaComunidade(p => ({ ...p, padroeiro: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Opcional"
            />
          </div>
          <button type="submit" disabled={criandoComunidade || loading || !novaComunidade.paroquiaId} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50">
            {criandoComunidade ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Criar Comunidade
          </button>
        </form>
      </div>

      {/* Novo Coordenador */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-amber-50 p-4 border-b border-amber-100">
          <h3 className="font-bold text-amber-900 flex items-center gap-2">
            <UserPlus size={20} /> Novo Coordenador
          </h3>
          <p className="text-sm text-amber-900/80 mt-1">
            Paróquia e comunidade são obrigatórios. Sem eles, o coordenador não poderá acessar o sistema.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-800 mb-3">Paróquia e Comunidade (obrigatórios)</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Paróquia</label>
                <div className="relative">
                  <Church className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    required
                    value={form.paroquiaId}
                    onChange={e => handleParoquiaChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white"
                  >
                    <option value="">Selecione a paróquia</option>
                    {paroquias.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Comunidade</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    required
                    value={form.comunidadeId}
                    onChange={e => setForm({ ...form, comunidadeId: e.target.value })}
                    disabled={!form.paroquiaId}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white disabled:bg-gray-50"
                  >
                    <option value="">Selecione a comunidade</option>
                    {comunidadesDaParoquia.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Segmento / Pastoral</label>
            <p className="text-xs text-gray-500 mb-2">Selecione a pastoral do coordenador.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEGMENTOS.map(({ type, config }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, pastoralType: type }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    form.pastoralType === type
                      ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-lg">{type === PastoralType.CATEQUESE ? '📖' : '⛪'}</span>
                  <p className="font-bold text-xs mt-1">{config.labels.pastoralNome}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Ex: Maria da Silva"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="coordenador@paroquia.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading || !form.paroquiaId || !form.comunidadeId}
            className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
            Criar Coordenador de {PASTORAL_CONFIGS[form.pastoralType].labels.pastoralNome}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
