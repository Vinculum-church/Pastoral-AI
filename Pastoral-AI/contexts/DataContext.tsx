import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Catequizando,
  Catequista,
  Familia,
  Encontro,
  Presenca,
  Turma,
  Paroquia,
  MaterialApoio,
  Aviso,
  Solicitacao,
  UserRole,
} from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { usePastoral } from './PastoralContext';
import {
  MOCK_CATEQUIZANDOS,
  MOCK_CATEQUISTAS,
  MOCK_FAMILIAS,
  MOCK_ENCONTROS,
  MOCK_PRESENCAS,
  MOCK_TURMAS,
  MOCK_PAROQUIA,
  MOCK_MATERIAIS,
  MOCK_AVISOS
} from '../constants';

interface DataContextType {
  paroquia: Paroquia;
  turmas: Turma[];
  catequizandos: Catequizando[];
  familias: Familia[];
  catequistas: Catequista[];
  encontros: Encontro[];
  presencas: Presenca[];
  materiais: MaterialApoio[];
  avisos: Aviso[];
  solicitacoes: Solicitacao[];
  loading: boolean;

  addCatequizando: (data: Omit<Catequizando, 'id'>) => Promise<void>;
  updateCatequizando: (catequizando: Catequizando) => Promise<void>;
  addFamilia: (data: Omit<Familia, 'id'>) => void;
  addCatequista: (data: Omit<Catequista, 'id'>) => Promise<void>;
  addEncontro: (data: Omit<Encontro, 'id'>) => Promise<void>;
  updateEncontro: (encontro: Encontro) => Promise<void>;
  updatePresenca: (presenca: Presenca) => Promise<void>;
  addMaterial: (data: Omit<MaterialApoio, 'id' | 'data_adicao'>) => Promise<void>;
  addAviso: (data: Omit<Aviso, 'id' | 'data_publicacao'>) => Promise<void>;
  removeAviso: (id: string) => Promise<void>;
  addTurma: (data: Omit<Turma, 'id'>) => Promise<void>;
  removeTurma: (id: string) => Promise<void>;
  aprovarSolicitacao: (solicitacao: Solicitacao, turmaId: string) => Promise<void>;
  rejeitarSolicitacao: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Mappers: Supabase row ↔ Frontend type ────────────────────────────────────

function rowToParticipante(row: any): Catequizando {
  const responsaveis = row.responsaveis || [];
  const primary = responsaveis[0] || {};
  return {
    id: row.id,
    turma_id: row.turma_id || '',
    nome_completo: row.nome_completo,
    data_nascimento: row.data_nascimento || '',
    telefone: row.telefone || '',
    nome_responsavel: primary.nome || '',
    telefone_responsavel: primary.telefone || '',
    responsaveis: responsaveis,
    sacramentos: row.sacramentos || { batismo: false, eucaristia: false, crisma: false },
    observacoes_pastorais: row.observacoes || '',
    familia_id: '',
  };
}

function participanteToRow(data: Omit<Catequizando, 'id'>, paroquiaId: string, pastoralType: string) {
  return {
    turma_id: data.turma_id || null,
    paroquia_id: paroquiaId,
    pastoral_type: pastoralType,
    nome_completo: data.nome_completo,
    data_nascimento: data.data_nascimento || null,
    telefone: data.telefone || null,
    sacramentos: data.sacramentos,
    observacoes: data.observacoes_pastorais || '',
    responsaveis: data.responsaveis || [],
  };
}

function rowToLider(row: any): Catequista {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email || '',
    telefone: row.telefone || '',
    data_nascimento: row.data_nascimento || '',
    comunidade_id: row.comunidade_id || '',
    turma_id: row.turma_id || '',
    tempo_servico_anos: row.tempo_servico_anos || 0,
    experiencia_anterior: row.experiencia || '',
    observacoes: row.observacoes || '',
  };
}

function liderToRow(data: Omit<Catequista, 'id'>, paroquiaId: string, comunidadeId: string, pastoralType: string) {
  return {
    paroquia_id: paroquiaId,
    comunidade_id: comunidadeId || null,
    pastoral_type: pastoralType,
    turma_id: data.turma_id || null,
    nome: data.nome,
    email: data.email || null,
    telefone: data.telefone || null,
    data_nascimento: data.data_nascimento || null,
    tempo_servico_anos: data.tempo_servico_anos || 0,
    experiencia: data.experiencia_anterior || '',
    observacoes: data.observacoes || '',
  };
}

function rowToEncontro(row: any): Encontro {
  return {
    id: row.id,
    turma_id: row.turma_id,
    data: row.data,
    tema: row.tema,
    cor_liturgica: row.cor_liturgica || 'Tempo Comum',
    observacoes: row.observacoes || '',
    concluido: row.concluido || false,
  };
}

function rowToPresenca(row: any): Presenca {
  return {
    id: row.id,
    encontro_id: row.encontro_id,
    catequizando_id: row.participante_id,
    status: row.status,
  };
}

function rowToMaterial(row: any): MaterialApoio {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao || '',
    tipo: row.tipo || 'PDF',
    categoria: row.categoria || 'Formação',
    url: row.url || '',
    data_adicao: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  };
}

function rowToAviso(row: any): Aviso {
  return {
    id: row.id,
    titulo: row.titulo,
    conteudo: row.conteudo,
    data_publicacao: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    prioridade: row.prioridade || 'Normal',
  };
}

function rowToTurma(row: any): Turma {
  return {
    id: row.id,
    comunidade_id: row.comunidade_id || '',
    etapa_id: '',
    etapa_nome: row.etapa_nome || '',
    ano: row.ano || new Date().getFullYear(),
    faixa_etaria: row.faixa_etaria || '',
    dia_encontro: row.dia_encontro || '',
    horario: row.horario || '',
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { pastoralType: activePastoralType } = usePastoral();
  const useDb = isSupabaseConfigured();

  const [loading, setLoading] = useState(false);
  const [catequizandos, setCatequizandos] = useState<Catequizando[]>(useDb ? [] : MOCK_CATEQUIZANDOS);
  const [familias, setFamilias] = useState<Familia[]>(useDb ? [] : MOCK_FAMILIAS);
  const [catequistas, setCatequistas] = useState<Catequista[]>(useDb ? [] : MOCK_CATEQUISTAS);
  const [encontros, setEncontros] = useState<Encontro[]>(useDb ? [] : MOCK_ENCONTROS);
  const [presencas, setPresencas] = useState<Presenca[]>(useDb ? [] : MOCK_PRESENCAS);
  const [materiais, setMateriais] = useState<MaterialApoio[]>(useDb ? [] : MOCK_MATERIAIS);
  const [avisos, setAvisos] = useState<Aviso[]>(useDb ? [] : MOCK_AVISOS);
  const [turmas, setTurmas] = useState<Turma[]>(useDb ? [] : MOCK_TURMAS);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [paroquia, setParoquia] = useState<Paroquia>(MOCK_PAROQUIA);

  const paroquiaId = user?.parish_id || '';
  const comunidadeId = user?.comunidade_id || '';
  const pastoralType = activePastoralType || user?.pastoral_type || 'catequese';

  /** Admin não carrega dados pastorais. Coordenador usa comunidade_id. */
  const getEffectiveParoquiaId = useCallback(async (): Promise<string | null> => {
    if (paroquiaId) return paroquiaId;
    if (!supabase) return null;
    const { data } = await supabase.from('paroquias').select('id').limit(1).maybeSingle();
    return data?.id || null;
  }, [paroquiaId, supabase]);

  // ─── Fetch all data (isolado por comunidade) ───────────────────────────────

  const refreshData = useCallback(async () => {
    if (!useDb || !supabase) return;
    setLoading(true);

    const isAdmin = user?.role === 'Administrador Paroquial' || user?.role === UserRole.ADMIN;
    if (isAdmin) {
      setTurmas([]);
      setCatequizandos([]);
      setCatequistas([]);
      setEncontros([]);
      setPresencas([]);
      setMateriais([]);
      setAvisos([]);
      setLoading(false);
      return;
    }

    const effectiveComunidadeId = comunidadeId;
    if (!effectiveComunidadeId) {
      setTurmas([]);
      setCatequizandos([]);
      setCatequistas([]);
      setEncontros([]);
      setPresencas([]);
      setMateriais([]);
      setAvisos([]);
      setLoading(false);
      return;
    }

    try {
      const turmaTypes = pastoralType === 'catequese' ? ['catequese', 'perseveranca'] : [pastoralType];
      const [turmasRes, comunidadesRes] = await Promise.all([
        supabase.from('turmas').select('*').eq('comunidade_id', effectiveComunidadeId).in('pastoral_type', turmaTypes),
        supabase.from('comunidades').select('*, paroquias(*)').eq('id', effectiveComunidadeId).single(),
      ]);

      const turmasData = (turmasRes.data || []).map(rowToTurma);
      const turmaIds = turmasData.map(t => t.id);

      const comunidadeData = comunidadesRes.data;
      const paroquiaData = comunidadeData?.paroquias;
      if (paroquiaData) {
        setParoquia({
          id: paroquiaData.id,
          diocese_id: paroquiaData.diocese_id || '',
          nome: paroquiaData.nome,
          endereco: paroquiaData.endereco || '',
          telefone: paroquiaData.telefone || '',
        });
      }

      setTurmas(turmasData);

      let participantesData: any[] = [];
      let lideresData: any[] = [];
      if (turmaIds.length > 0) {
        const [participantesRes, lideresRes] = await Promise.all([
          supabase.from('participantes').select('*').in('turma_id', turmaIds).in('pastoral_type', turmaTypes).order('nome_completo'),
          effectiveComunidadeId
            ? supabase.from('lideres').select('*').or(`turma_id.in.(${turmaIds.join(',')}),comunidade_id.eq.${effectiveComunidadeId}`).in('pastoral_type', turmaTypes).order('nome')
            : supabase.from('lideres').select('*').in('turma_id', turmaIds).in('pastoral_type', turmaTypes).order('nome'),
        ]);
        participantesData = participantesRes.data || [];
        lideresData = lideresRes.data || [];
      } else if (effectiveComunidadeId) {
        const lideresRes = await supabase.from('lideres').select('*').eq('comunidade_id', effectiveComunidadeId).in('pastoral_type', turmaTypes).order('nome');
        lideresData = lideresRes.data || [];
      }

      const [materiaisRes, avisosRes, solicitacoesRes] = await Promise.all([
        supabase.from('materiais').select('*').eq('comunidade_id', effectiveComunidadeId).order('created_at', { ascending: false }),
        supabase.from('avisos').select('*').eq('comunidade_id', effectiveComunidadeId).order('created_at', { ascending: false }),
        supabase.from('solicitacoes').select('*').eq('comunidade_id', effectiveComunidadeId).eq('status', 'pendente').order('created_at', { ascending: false }),
      ]);

      setCatequizandos(participantesData.map(rowToParticipante));
      setCatequistas(lideresData.map(rowToLider));
      setMateriais((materiaisRes.data || []).map(rowToMaterial));
      setAvisos((avisosRes.data || []).map(rowToAviso));
      setSolicitacoes((solicitacoesRes.data || []).map((r: any) => ({
        id: r.id,
        paroquia_id: r.paroquia_id,
        comunidade_id: r.comunidade_id,
        email_fiel: r.email_fiel || '',
        nome_completo: r.nome_completo,
        data_nascimento: r.data_nascimento || '',
        telefone: r.telefone || '',
        responsaveis: r.responsaveis || [],
        sacramentos: r.sacramentos || { batismo: false, eucaristia: false, crisma: false },
        observacoes: r.observacoes || '',
        status: r.status || 'pendente',
        created_at: r.created_at || '',
      })));

      if (turmaIds.length > 0) {
        const encontrosRes = await supabase
          .from('encontros')
          .select('*')
          .in('turma_id', turmaIds)
          .order('data', { ascending: false });
        setEncontros((encontrosRes.data || []).map(rowToEncontro));

        const encontroIds = (encontrosRes.data || []).map((e: any) => e.id);
        if (encontroIds.length > 0) {
          const presencasRes = await supabase
            .from('presencas')
            .select('*')
            .in('encontro_id', encontroIds);
          setPresencas((presencasRes.data || []).map(rowToPresenca));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [useDb, comunidadeId, pastoralType, user?.role]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData, pastoralType]);

  useEffect(() => {
    if (!user) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshData();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [user, refreshData]);

  // ─── CRUD: Participantes ──────────────────────────────────────────────────

  const addCatequizando = async (data: Omit<Catequizando, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setCatequizandos(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const effectiveParoquiaId = paroquia.id || paroquiaId || (await getEffectiveParoquiaId());
    if (!effectiveParoquiaId) {
      const newId = Date.now().toString();
      setCatequizandos(prev => [...prev, { ...data, id: newId }]);
      return;
    }

    const row = participanteToRow(data, effectiveParoquiaId, pastoralType);
    const { data: inserted, error } = await supabase.from('participantes').insert(row).select().single();
    if (error) {
      console.error('Erro ao salvar participante:', error);
      const newId = Date.now().toString();
      setCatequizandos(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    setCatequizandos(prev => [...prev, rowToParticipante(inserted)]);
  };

  // ─── Update Participante ─────────────────────────────────────────────────

  const updateCatequizando = async (catequizando: Catequizando) => {
    if (!useDb) {
      setCatequizandos(prev => prev.map(c => c.id === catequizando.id ? catequizando : c));
      return;
    }
    if (!supabase) return;

    const { error } = await supabase.from('participantes').update({
      turma_id: catequizando.turma_id || null,
      nome_completo: catequizando.nome_completo,
      data_nascimento: catequizando.data_nascimento || null,
      telefone: catequizando.telefone || null,
      sacramentos: catequizando.sacramentos,
      observacoes: catequizando.observacoes_pastorais || '',
      responsaveis: catequizando.responsaveis || [],
    }).eq('id', catequizando.id);

    if (error) { console.error('Erro ao atualizar participante:', error); return; }
    setCatequizandos(prev => prev.map(c => c.id === catequizando.id ? catequizando : c));
  };

  // ─── CRUD: Famílias (local only por enquanto) ─────────────────────────────

  const addFamilia = (data: Omit<Familia, 'id'>) => {
    const newId = Date.now().toString();
    setFamilias(prev => [...prev, { ...data, id: newId }]);
  };

  // ─── CRUD: Líderes ────────────────────────────────────────────────────────

  const addCatequista = async (data: Omit<Catequista, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setCatequistas(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const effectiveParoquiaId = paroquiaId || paroquia.id || (await getEffectiveParoquiaId());
    const effectiveComunidadeId = comunidadeId;
    if (!effectiveParoquiaId) {
      const newId = Date.now().toString();
      setCatequistas(prev => [...prev, { ...data, id: newId }]);
      return;
    }

    const row = liderToRow(data, effectiveParoquiaId, effectiveComunidadeId, pastoralType);
    const { data: inserted, error } = await supabase.from('lideres').insert(row).select().single();
    if (error) {
      console.error('Erro ao salvar líder:', error);
      const newId = Date.now().toString();
      setCatequistas(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    setCatequistas(prev => [...prev, rowToLider(inserted)]);
  };

  // ─── CRUD: Encontros ──────────────────────────────────────────────────────

  const addEncontro = async (data: Omit<Encontro, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setEncontros(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const { data: inserted, error } = await supabase.from('encontros').insert({
      turma_id: data.turma_id,
      data: data.data,
      tema: data.tema,
      cor_liturgica: data.cor_liturgica || 'Tempo Comum',
      observacoes: data.observacoes || '',
      concluido: false,
    }).select().single();

    if (error) { console.error(error); return; }
    setEncontros(prev => [...prev, rowToEncontro(inserted)]);
  };

  const updateEncontro = async (encontro: Encontro) => {
    if (!useDb) {
      setEncontros(prev => prev.map(e => e.id === encontro.id ? encontro : e));
      return;
    }
    if (!supabase) return;

    const { error } = await supabase.from('encontros').update({
      tema: encontro.tema,
      data: encontro.data,
      cor_liturgica: encontro.cor_liturgica,
      observacoes: encontro.observacoes,
      concluido: encontro.concluido,
    }).eq('id', encontro.id);

    if (error) { console.error(error); return; }
    setEncontros(prev => prev.map(e => e.id === encontro.id ? encontro : e));
  };

  // ─── CRUD: Presenças ──────────────────────────────────────────────────────

  const updatePresenca = async (presenca: Presenca) => {
    if (!useDb) {
      setPresencas(prev => {
        const idx = prev.findIndex(p => p.id === presenca.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = presenca; return n; }
        return [...prev, presenca];
      });
      return;
    }
    if (!supabase) return;

    // Upsert: check if exists
    const { data: existing } = await supabase
      .from('presencas')
      .select('id')
      .eq('encontro_id', presenca.encontro_id)
      .eq('participante_id', presenca.catequizando_id)
      .maybeSingle();

    if (existing) {
      await supabase.from('presencas').update({ status: presenca.status }).eq('id', existing.id);
      setPresencas(prev => prev.map(p =>
        (p.encontro_id === presenca.encontro_id && p.catequizando_id === presenca.catequizando_id)
          ? { ...p, status: presenca.status }
          : p
      ));
    } else {
      const { data: inserted, error } = await supabase.from('presencas').insert({
        encontro_id: presenca.encontro_id,
        participante_id: presenca.catequizando_id,
        status: presenca.status,
      }).select().single();

      if (error) { console.error(error); return; }
      setPresencas(prev => [...prev, rowToPresenca(inserted)]);
    }
  };

  // ─── CRUD: Materiais ──────────────────────────────────────────────────────

  const addMaterial = async (data: Omit<MaterialApoio, 'id' | 'data_adicao'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setMateriais(prev => [...prev, { ...data, id: newId, data_adicao: new Date().toISOString().split('T')[0] }]);
      return;
    }
    if (!supabase) return;

    const { data: inserted, error } = await supabase.from('materiais').insert({
      paroquia_id: paroquia.id || paroquiaId || null,
      comunidade_id: comunidadeId || null,
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      categoria: data.categoria,
      url: data.url,
    }).select().single();

    if (error) { console.error(error); return; }
    setMateriais(prev => [rowToMaterial(inserted), ...prev]);
  };

  // ─── CRUD: Avisos ─────────────────────────────────────────────────────────

  const addAviso = async (data: Omit<Aviso, 'id' | 'data_publicacao'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setAvisos(prev => [{ ...data, id: newId, data_publicacao: new Date().toISOString().split('T')[0] }, ...prev]);
      return;
    }
    if (!supabase) return;

    const { data: inserted, error } = await supabase.from('avisos').insert({
      paroquia_id: paroquia.id || paroquiaId,
      comunidade_id: comunidadeId || null,
      titulo: data.titulo,
      conteudo: data.conteudo,
      prioridade: data.prioridade || 'Normal',
    }).select().single();

    if (error) { console.error(error); return; }
    setAvisos(prev => [rowToAviso(inserted), ...prev]);
  };

  const removeAviso = async (id: string) => {
    if (!useDb) {
      setAvisos(prev => prev.filter(a => a.id !== id));
      return;
    }
    if (!supabase) return;

    const { error } = await supabase.from('avisos').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setAvisos(prev => prev.filter(a => a.id !== id));
  };

  // ─── CRUD: Solicitações ──────────────────────────────────────────────────

  const aprovarSolicitacao = async (solicitacao: Solicitacao, turmaId: string) => {
    await addCatequizando({
      turma_id: turmaId,
      nome_completo: solicitacao.nome_completo,
      data_nascimento: solicitacao.data_nascimento,
      telefone: solicitacao.telefone,
      nome_responsavel: solicitacao.responsaveis[0]?.nome || '',
      telefone_responsavel: solicitacao.responsaveis[0]?.telefone || '',
      responsaveis: solicitacao.responsaveis,
      sacramentos: solicitacao.sacramentos,
      observacoes_pastorais: solicitacao.observacoes,
    });

    if (useDb && supabase) {
      await supabase.from('solicitacoes').update({ status: 'aprovada' }).eq('id', solicitacao.id);
    }
    setSolicitacoes(prev => prev.filter(s => s.id !== solicitacao.id));
  };

  const rejeitarSolicitacao = async (id: string) => {
    if (useDb && supabase) {
      await supabase.from('solicitacoes').update({ status: 'rejeitada' }).eq('id', id);
    }
    setSolicitacoes(prev => prev.filter(s => s.id !== id));
  };

  // ─── CRUD: Turmas ─────────────────────────────────────────────────────────

  const addTurma = async (data: Omit<Turma, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setTurmas(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const effectiveComunidadeId = data.comunidade_id || comunidadeId;
    const effectiveParoquiaId = paroquia.id || paroquiaId || (await getEffectiveParoquiaId());

    const { data: inserted, error } = await supabase.from('turmas').insert({
      comunidade_id: effectiveComunidadeId || null,
      paroquia_id: effectiveParoquiaId || null,
      pastoral_type: pastoralType,
      etapa_nome: data.etapa_nome || '',
      ano: data.ano,
      faixa_etaria: data.faixa_etaria || '',
      dia_encontro: data.dia_encontro,
      horario: data.horario,
    }).select().single();

    if (error) {
      console.error('Erro ao salvar turma:', error);
      const newId = Date.now().toString();
      setTurmas(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    setTurmas(prev => [...prev, rowToTurma(inserted)]);
  };

  const removeTurma = async (id: string) => {
    if (!useDb) {
      setTurmas(prev => prev.filter(t => t.id !== id));
      return;
    }
    if (!supabase) return;

    const { error } = await supabase.from('turmas').delete().eq('id', id);
    if (error) {
      console.error('Erro ao remover turma:', error);
      throw new Error(error.message);
    }
    setTurmas(prev => prev.filter(t => t.id !== id));
    setCatequizandos(prev => prev.filter(c => c.turma_id !== id));
    setEncontros(prev => prev.filter(e => e.turma_id !== id));
    setCatequistas(prev => prev.map(c => c.turma_id === id ? { ...c, turma_id: undefined } : c));
  };

  return (
    <DataContext.Provider value={{
      paroquia,
      turmas,
      catequizandos,
      familias,
      catequistas,
      encontros,
      presencas,
      materiais,
      avisos,
      solicitacoes,
      loading,
      addCatequizando,
      updateCatequizando,
      addFamilia,
      addCatequista,
      addEncontro,
      updateEncontro,
      updatePresenca,
      addMaterial,
      addAviso,
      removeAviso,
      addTurma,
      removeTurma,
      aprovarSolicitacao,
      rejeitarSolicitacao,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
