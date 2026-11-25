import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, UserPlus, Mail, Lock, User, Church, MapPin, Loader2, CheckCircle, AlertCircle,
  Plus, Trash2, Pencil, X, LayoutDashboard, Users, ChevronDown, ChevronRight, Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { PastoralType } from '../types';
import { PASTORAL_CONFIGS } from '../constants';
import type { PastoralConfig } from '../types';

interface Paroquia { id: string; nome: string; endereco?: string; telefone?: string; }
interface Comunidade { id: string; paroquia_id: string; nome: string; padroeiro?: string; }
interface Coordenador {
  id: string; nome: string; email: string; role: string;
  paroquia_id: string; comunidade_id: string; pastoral_type: string;
  paroquia_nome?: string; comunidade_nome?: string;
}

type AdminTab = 'dashboard' | 'paroquias' | 'comunidades' | 'coordenadores';

const SEGMENTOS: { type: PastoralType; config: PastoralConfig }[] = [
  { type: PastoralType.CATEQUESE, config: PASTORAL_CONFIGS[PastoralType.CATEQUESE] },
  { type: PastoralType.PASTORAL_CRISTA, config: PASTORAL_CONFIGS[PastoralType.PASTORAL_CRISTA] },
];

const AdminPanel: React.FC = () => {
  const { getSessionToken } = useAuth();
  const hasSupabase = isSupabaseConfigured();

  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const adminMutation = async (table: string, action: string, data?: any, id?: string) => {
    const token = await getSessionToken();
    if (!token) throw new Error('Sessão expirada.');
    const res = await fetch('/api/admin/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ table, action, data, id }),
    });
    const result = await res.json();
    if (!res.ok || result.error) throw new Error(result.error || `Erro ${res.status}`);
    return result;
  };

  // ─── Load data via server endpoint (bypasses RLS) ──────────────────────────
  const loadData = async () => {
    try {
      const token = await getSessionToken();
      if (!token) { setError('Sessão expirada.'); return; }

      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Erro ${res.status} ao carregar dados.`);
        return;
      }

      const data = await res.json();
      const pList: Paroquia[] = data.paroquias || [];
      const cList: Comunidade[] = data.comunidades || [];
      const profiles: any[] = data.profiles || [];

      setParoquias(pList);
      setComunidades(cList);

      const coords = profiles
        .filter((p: any) => String(p.role || '').toLowerCase().includes('coord'))
        .map((p: any) => ({
          ...p,
          paroquia_nome: pList.find(par => par.id === p.paroquia_id)?.nome || '',
          comunidade_nome: cList.find(cm => cm.id === p.comunidade_id)?.nome || '',
        }));
      setCoordenadores(coords);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados.');
    }
  };

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }
    loadData().finally(() => setLoading(false));
  }, [hasSupabase]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const comunidadesPorParoquia = useMemo(() => {
    const map: Record<string, Comunidade[]> = {};
    comunidades.forEach(c => {
      if (!map[c.paroquia_id]) map[c.paroquia_id] = [];
      map[c.paroquia_id].push(c);
    });
    return map;
  }, [comunidades]);

  const coordenadoresPorComunidade = useMemo(() => {
    const map: Record<string, Coordenador[]> = {};
    coordenadores.forEach(c => {
      const key = c.comunidade_id || 'sem';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [coordenadores]);

  if (!hasSupabase) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-amber-50 border border-amber-200 rounded-2xl">
        <p className="text-amber-800 font-medium">Supabase não configurado. O painel admin requer banco de dados.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-amber-600" />
      </div>
    );
  }

  const TABS: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { key: 'paroquias', label: 'Paróquias', icon: Church },
    { key: 'comunidades', label: 'Comunidades', icon: MapPin },
    { key: 'coordenadores', label: 'Coordenadores', icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900">
          <Shield size={28} />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-semibold text-gray-900">Painel Administrativo</h2>
          <p className="text-gray-500 text-sm">Gerencie paróquias, comunidades e coordenadores.</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm flex items-start gap-2">
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); clearMessages(); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tab === t.key ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'dashboard' && (
        <DashboardTab paroquias={paroquias} comunidades={comunidades} coordenadores={coordenadores}
          comunidadesPorParoquia={comunidadesPorParoquia} coordenadoresPorComunidade={coordenadoresPorComunidade} setTab={setTab} />
      )}
      {tab === 'paroquias' && (
        <ParoquiasTab paroquias={paroquias} comunidadesPorParoquia={comunidadesPorParoquia} search={search} setSearch={setSearch}
          onReload={loadData} setError={setError} setSuccess={setSuccess} clearMessages={clearMessages} adminMutation={adminMutation} />
      )}
      {tab === 'comunidades' && (
        <ComunidadesTab comunidades={comunidades} paroquias={paroquias} search={search} setSearch={setSearch}
          onReload={loadData} setError={setError} setSuccess={setSuccess} clearMessages={clearMessages} adminMutation={adminMutation} />
      )}
      {tab === 'coordenadores' && (
        <CoordenadoresTab coordenadores={coordenadores} paroquias={paroquias} comunidades={comunidades}
          search={search} setSearch={setSearch} onReload={loadData} setError={setError} setSuccess={setSuccess}
          clearMessages={clearMessages} getSessionToken={getSessionToken} adminMutation={adminMutation} />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard Tab
// ═══════════════════════════════════════════════════════════════════════════════
const DashboardTab: React.FC<{
  paroquias: Paroquia[]; comunidades: Comunidade[]; coordenadores: Coordenador[];
  comunidadesPorParoquia: Record<string, Comunidade[]>; coordenadoresPorComunidade: Record<string, Coordenador[]>;
  setTab: (t: AdminTab) => void;
}> = ({ paroquias, comunidades, coordenadores, comunidadesPorParoquia, setTab }) => {
  const [expandedParoquia, setExpandedParoquia] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button onClick={() => setTab('paroquias')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-church-50 text-church-600 group-hover:scale-110 transition-transform"><Church size={22} /></div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-church-500 transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{paroquias.length}</h3>
          <p className="text-sm font-medium text-gray-500 mt-1">Paróquias</p>
        </button>
        <button onClick={() => setTab('comunidades')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform"><MapPin size={22} /></div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{comunidades.length}</h3>
          <p className="text-sm font-medium text-gray-500 mt-1">Comunidades</p>
        </button>
        <button onClick={() => setTab('coordenadores')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform"><Users size={22} /></div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{coordenadores.length}</h3>
          <p className="text-sm font-medium text-gray-500 mt-1">Coordenadores</p>
        </button>
      </div>

      {/* Hierarchical Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Estrutura Hierárquica</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {paroquias.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Church size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma paróquia cadastrada.</p>
              <p className="text-sm mt-1">Comece criando uma paróquia na aba correspondente.</p>
            </div>
          ) : paroquias.map(p => {
            const coms = comunidadesPorParoquia[p.id] || [];
            const isExpanded = expandedParoquia === p.id;
            return (
              <div key={p.id}>
                <button
                  onClick={() => setExpandedParoquia(isExpanded ? null : p.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-church-50 text-church-600 flex items-center justify-center shrink-0">
                    <Church size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{p.nome}</h4>
                    <p className="text-xs text-gray-400">{coms.length} comunidade{coms.length !== 1 ? 's' : ''}</p>
                  </div>
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>
                {isExpanded && coms.length > 0 && (
                  <div className="pl-14 pb-3 space-y-1">
                    {coms.map(c => (
                      <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm">
                        <MapPin size={14} className="text-emerald-500 shrink-0" />
                        <span className="font-medium text-gray-700">{c.nome}</span>
                        {c.padroeiro && <span className="text-gray-400 text-xs">— {c.padroeiro}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded && coms.length === 0 && (
                  <p className="pl-14 pb-3 text-xs text-gray-400 italic">Nenhuma comunidade vinculada.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Paróquias Tab
// ═══════════════════════════════════════════════════════════════════════════════
const ParoquiasTab: React.FC<{
  paroquias: Paroquia[]; comunidadesPorParoquia: Record<string, Comunidade[]>;
  search: string; setSearch: (s: string) => void;
  onReload: () => Promise<void>; setError: (s: string) => void; setSuccess: (s: string) => void; clearMessages: () => void;
  adminMutation: (table: string, action: string, data?: any, id?: string) => Promise<any>;
}> = ({ paroquias, comunidadesPorParoquia, search, setSearch, onReload, setError, setSuccess, clearMessages, adminMutation }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nome: '', endereco: '', telefone: '' });

  const filtered = paroquias.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('paroquias', 'insert', { nome: form.nome.trim(), endereco: form.endereco || null, telefone: form.telefone || null });
      setSuccess('Paróquia criada.'); setForm({ nome: '', endereco: '', telefone: '' }); setIsCreating(false); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.nome.trim()) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('paroquias', 'update', { nome: form.nome.trim(), endereco: form.endereco || null, telefone: form.telefone || null }, editingId);
      setSuccess('Paróquia atualizada.'); setEditingId(null); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('paroquias', 'delete', undefined, deletingId);
      setSuccess('Paróquia excluída.'); setDeletingId(null); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const startEdit = (p: Paroquia) => {
    setEditingId(p.id);
    setForm({ nome: p.nome, endereco: p.endereco || '', telefone: p.telefone || '' });
    setIsCreating(false);
    clearMessages();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paróquia..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-church-500 outline-none" />
        </div>
        <button onClick={() => { setIsCreating(true); setEditingId(null); setForm({ nome: '', endereco: '', telefone: '' }); clearMessages(); }}
          className="bg-church-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-church-700 transition-colors text-sm cursor-pointer">
          <Plus size={18} /> Nova Paróquia
        </button>
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800">{editingId ? 'Editar Paróquia' : 'Nova Paróquia'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" placeholder="Ex: Paróquia São Francisco" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-church-500 outline-none" placeholder="Opcional" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setIsCreating(false); setEditingId(null); }}
              className="px-4 py-2.5 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm cursor-pointer">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-church-600 text-white rounded-xl font-semibold hover:bg-church-700 disabled:opacity-50 text-sm flex items-center gap-2 cursor-pointer">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Paróquias ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Church size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma paróquia encontrada.</p>
            </div>
          ) : filtered.map(p => {
            const coms = comunidadesPorParoquia[p.id] || [];
            return (
              <div key={p.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-church-50 text-church-600 flex items-center justify-center shrink-0"><Church size={18} /></div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{p.nome}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {p.endereco && <span>{p.endereco}</span>}
                      {p.telefone && <span>· {p.telefone}</span>}
                      <span className="bg-church-50 text-church-600 px-2 py-0.5 rounded-full font-medium">{coms.length} comunidade{coms.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-gray-400 hover:text-church-600 hover:bg-church-50 transition-colors cursor-pointer" title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => { setDeletingId(p.id); clearMessages(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirm */}
      {deletingId && <DeleteModal
        title="Excluir Paróquia"
        message={`Tem certeza que deseja excluir "${paroquias.find(p => p.id === deletingId)?.nome}"? Todas as comunidades e coordenadores vinculados podem ser afetados.`}
        submitting={submitting} onCancel={() => setDeletingId(null)} onConfirm={handleDelete}
      />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Comunidades Tab
// ═══════════════════════════════════════════════════════════════════════════════
const ComunidadesTab: React.FC<{
  comunidades: Comunidade[]; paroquias: Paroquia[];
  search: string; setSearch: (s: string) => void;
  onReload: () => Promise<void>; setError: (s: string) => void; setSuccess: (s: string) => void; clearMessages: () => void;
  adminMutation: (table: string, action: string, data?: any, id?: string) => Promise<any>;
}> = ({ comunidades, paroquias, search, setSearch, onReload, setError, setSuccess, clearMessages, adminMutation }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nome: '', paroquiaId: '', padroeiro: '' });

  const filtered = comunidades.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (paroquias.find(p => p.id === c.paroquia_id)?.nome || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.paroquiaId) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('comunidades', 'insert', { nome: form.nome.trim(), paroquia_id: form.paroquiaId, padroeiro: form.padroeiro || null });
      setSuccess('Comunidade criada.'); setForm({ nome: '', paroquiaId: '', padroeiro: '' }); setIsCreating(false); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.nome.trim() || !form.paroquiaId) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('comunidades', 'update', { nome: form.nome.trim(), paroquia_id: form.paroquiaId, padroeiro: form.padroeiro || null }, editingId);
      setSuccess('Comunidade atualizada.'); setEditingId(null); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('comunidades', 'delete', undefined, deletingId);
      setSuccess('Comunidade excluída.'); setDeletingId(null); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const startEdit = (c: Comunidade) => {
    setEditingId(c.id);
    setForm({ nome: c.nome, paroquiaId: c.paroquia_id, padroeiro: c.padroeiro || '' });
    setIsCreating(false);
    clearMessages();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar comunidade ou paróquia..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <button onClick={() => { setIsCreating(true); setEditingId(null); setForm({ nome: '', paroquiaId: '', padroeiro: '' }); clearMessages(); }}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors text-sm cursor-pointer">
          <Plus size={18} /> Nova Comunidade
        </button>
      </div>

      {(isCreating || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800">{editingId ? 'Editar Comunidade' : 'Nova Comunidade'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paróquia *</label>
            <select required value={form.paroquiaId} onChange={e => setForm(f => ({ ...f, paroquiaId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
              <option value="">Selecione a paróquia</option>
              {paroquias.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Comunidade Santa Clara" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Padroeiro</label>
            <input value={form.padroeiro} onChange={e => setForm(f => ({ ...f, padroeiro: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Opcional" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setIsCreating(false); setEditingId(null); }}
              className="px-4 py-2.5 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm cursor-pointer">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center gap-2 cursor-pointer">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Comunidades ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <MapPin size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma comunidade encontrada.</p>
            </div>
          ) : filtered.map(c => {
            const par = paroquias.find(p => p.id === c.paroquia_id);
            return (
              <div key={c.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><MapPin size={18} /></div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{c.nome}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {par && <span className="bg-church-50 text-church-600 px-2 py-0.5 rounded-full font-medium">{par.nome}</span>}
                      {c.padroeiro && <span>Padroeiro: {c.padroeiro}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(c)} className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer" title="Editar"><Pencil size={16} /></button>
                  <button onClick={() => { setDeletingId(c.id); clearMessages(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Excluir"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {deletingId && <DeleteModal
        title="Excluir Comunidade"
        message={`Tem certeza que deseja excluir "${comunidades.find(c => c.id === deletingId)?.nome}"? Coordenadores e turmas vinculados podem ser afetados.`}
        submitting={submitting} onCancel={() => setDeletingId(null)} onConfirm={handleDelete}
      />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Coordenadores Tab
// ═══════════════════════════════════════════════════════════════════════════════
const CoordenadoresTab: React.FC<{
  coordenadores: Coordenador[]; paroquias: Paroquia[]; comunidades: Comunidade[];
  search: string; setSearch: (s: string) => void;
  onReload: () => Promise<void>; setError: (s: string) => void; setSuccess: (s: string) => void;
  clearMessages: () => void; getSessionToken: () => Promise<string | null>;
  adminMutation: (table: string, action: string, data?: any, id?: string) => Promise<any>;
}> = ({ coordenadores, paroquias, comunidades, search, setSearch, onReload, setError, setSuccess, clearMessages, getSessionToken, adminMutation }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nome: '', paroquiaId: '', comunidadeId: '', pastoralType: PastoralType.CATEQUESE });

  const comunidadesDaParoquia = form.paroquiaId ? comunidades.filter(c => c.paroquia_id === form.paroquiaId) : [];

  const filtered = coordenadores.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.paroquia_nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.comunidade_nome || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.nome || !form.paroquiaId || !form.comunidadeId) { setError('Preencha todos os campos.'); return; }
    if (form.password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    clearMessages(); setSubmitting(true);
    try {
      const token = await getSessionToken();
      if (!token) { setError('Sessão expirada.'); setSubmitting(false); return; }
      const res = await fetch('/api/admin/create-coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: form.email, password: form.password, nome: form.nome, paroquiaId: form.paroquiaId, comunidadeId: form.comunidadeId, pastoralType: form.pastoralType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || `Erro ${res.status}`); }
      else { setSuccess('Coordenador criado.'); setForm({ email: '', password: '', nome: '', paroquiaId: '', comunidadeId: '', pastoralType: PastoralType.CATEQUESE }); setIsCreating(false); await onReload(); }
    } catch (err: any) { setError(err.message || 'Erro.'); }
    setSubmitting(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !form.nome.trim() || !form.paroquiaId || !form.comunidadeId) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('profiles', 'update', {
        nome: form.nome.trim(), paroquia_id: form.paroquiaId, comunidade_id: form.comunidadeId, pastoral_type: form.pastoralType,
      }, editingId);
      setSuccess('Coordenador atualizado.'); setEditingId(null); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    clearMessages(); setSubmitting(true);
    try {
      await adminMutation('profiles', 'delete', undefined, deletingId);
      setSuccess('Coordenador removido.'); setDeletingId(null); await onReload();
    } catch (err: any) { setError(err.message); }
    setSubmitting(false);
  };

  const startEdit = (c: Coordenador) => {
    setEditingId(c.id);
    setForm({ email: c.email, password: '', nome: c.nome, paroquiaId: c.paroquia_id, comunidadeId: c.comunidade_id, pastoralType: (c.pastoral_type || PastoralType.CATEQUESE) as PastoralType });
    setIsCreating(false);
    clearMessages();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar coordenador..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <button onClick={() => { setIsCreating(true); setEditingId(null); setForm({ email: '', password: '', nome: '', paroquiaId: '', comunidadeId: '', pastoralType: PastoralType.CATEQUESE }); clearMessages(); }}
          className="bg-amber-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-amber-700 transition-colors text-sm cursor-pointer">
          <UserPlus size={18} /> Novo Coordenador
        </button>
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-bold text-gray-800">{editingId ? 'Editar Coordenador' : 'Novo Coordenador'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paróquia *</label>
              <select required value={form.paroquiaId} onChange={e => setForm(f => ({ ...f, paroquiaId: e.target.value, comunidadeId: '' }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                <option value="">Selecione</option>
                {paroquias.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comunidade *</label>
              <select required value={form.comunidadeId} onChange={e => setForm(f => ({ ...f, comunidadeId: e.target.value }))} disabled={!form.paroquiaId}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white disabled:bg-gray-50">
                <option value="">Selecione</option>
                {comunidadesDaParoquia.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segmento / Pastoral</label>
            <div className="flex gap-2 flex-wrap">
              {SEGMENTOS.map(({ type, config }) => (
                <button key={type} type="button" onClick={() => setForm(f => ({ ...f, pastoralType: type }))}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                    form.pastoralType === type ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {type === PastoralType.CATEQUESE ? '📖' : '⛪'} {config.labels.pastoralNome}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
            <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Ex: Maria da Silva" />
          </div>

          {isCreating && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="coordenador@paroquia.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Mínimo 6 caracteres" />
              </div>
            </>
          )}

          {editingId && (
            <p className="text-xs text-gray-400 italic">E-mail e senha não podem ser alterados por aqui. Para redefinir a senha, use o Supabase.</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => { setIsCreating(false); setEditingId(null); }}
              className="px-4 py-2.5 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm cursor-pointer">Cancelar</button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 text-sm flex items-center gap-2 cursor-pointer">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Salvar' : 'Criar Coordenador'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Coordenadores ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum coordenador encontrado.</p>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{c.nome}</h4>
                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {c.paroquia_nome && <span className="text-[10px] bg-church-50 text-church-600 px-2 py-0.5 rounded-full font-medium">{c.paroquia_nome}</span>}
                    {c.comunidade_nome && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">{c.comunidade_nome}</span>}
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium capitalize">{c.pastoral_type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(c)} className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer" title="Editar"><Pencil size={16} /></button>
                <button onClick={() => { setDeletingId(c.id); clearMessages(); }} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Excluir"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deletingId && <DeleteModal
        title="Excluir Coordenador"
        message={`Tem certeza que deseja remover "${coordenadores.find(c => c.id === deletingId)?.nome}" do sistema? O perfil será excluído (a conta de autenticação permanecerá no Supabase Auth).`}
        submitting={submitting} onCancel={() => setDeletingId(null)} onConfirm={handleDelete}
      />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Reusable Delete Modal
// ═══════════════════════════════════════════════════════════════════════════════
const DeleteModal: React.FC<{
  title: string; message: string; submitting: boolean; onCancel: () => void; onConfirm: () => void;
}> = ({ title, message, submitting, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
      <div className="bg-red-600 p-5 flex justify-between items-center text-white">
        <h3 className="font-bold text-lg">{title}</h3>
        <button type="button" onClick={onCancel} className="hover:bg-white/20 rounded-full p-1 cursor-pointer"><X size={20} /></button>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-gray-700 text-sm">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={submitting}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default AdminPanel;
