import React, { useState, useRef } from 'react';
import { Search, Plus, User, Droplets, MessageCircle, HeartHandshake, MapPin, X, Trash2, Smartphone, Printer, Calendar, Mail, BookOpen, Church, ChevronDown, Send, UserPlus, Info, Eye, Home, Camera } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { usePastoral } from '../contexts/PastoralContext';
import { Responsavel, Catequista, Catequizando, Familia, ResponsavelSimples } from '../types';
import { UserRole } from '../types';
import { MOCK_COMUNIDADES } from '../constants';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface PeopleManagerProps {
  initialTab?: 'participantes' | 'marketing' | 'lideres';
}

const PeopleManager: React.FC<PeopleManagerProps> = ({ initialTab = 'participantes' }) => {
  const { catequizandos, familias, catequistas, turmas, addCatequizando, updateCatequizando, removeCatequizando, addFamilia, addCatequista, updateCatequista, paroquia } = useData();
  const { user, getSessionToken } = useAuth();
  const { labels, pastoralType } = usePastoral();
  const hasSupabase = isSupabaseConfigured();
  const isCoordenador = user?.role === UserRole.COORDENADOR;

  const safeInitialTab = !isCoordenador && initialTab === 'lideres' ? 'participantes' : initialTab;
  const [activeTab, setActiveTab] = useState<'participantes' | 'marketing' | 'lideres'>(safeInitialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterEtapa, setFilterEtapa] = useState('');
  const [filterAno, setFilterAno] = useState('');

  const [viewingStudent, setViewingStudent] = useState<Catequizando | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [studentForm, setStudentForm] = useState({
     nome_completo: '',
     data_nascimento: '',
     telefone: '',
     endereco: '',
     turma_id: '',
     batismo: false,
     eucaristia: false,
     crisma: false,
     observacoes_pastorais: '',
     familia_id: '',
     foto_url: '',
  });

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setStudentForm(prev => ({ ...prev, foto_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [responsaveisList, setResponsaveisList] = useState<ResponsavelSimples[]>([]);
  const [tempResponsavel, setTempResponsavel] = useState<ResponsavelSimples>({
      nome: '',
      parentesco: 'Mãe',
      telefone: ''
  });

  const [marketingMessage, setMarketingMessage] = useState('');

  const [newCatequista, setNewCatequista] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    data_nascimento: '',
    tempo_servico_anos: 0,
    comunidade_id: '',
    turma_id: '',
    experiencia_anterior: '',
    observacoes: ''
  });
  const [liderError, setLiderError] = useState('');
  const [editingLiderId, setEditingLiderId] = useState<string | null>(null);

  const uniqueEtapas = Array.from(new Set(turmas.map(t => t.etapa_nome).filter(Boolean))) as string[];
  const uniqueAnos = Array.from(new Set(turmas.map(t => t.ano))).sort((a: number, b: number) => b - a);

  const filteredParticipantes = catequizandos.filter(c => {
    const matchesSearch = c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase());
    const turma = turmas.find(t => t.id === c.turma_id);
    const matchesEtapa = filterEtapa ? turma?.etapa_nome === filterEtapa : true;
    const matchesAno = filterAno ? turma?.ano.toString() === filterAno : true;
    return matchesSearch && matchesEtapa && matchesAno;
  });

  const filteredLideres = catequistas.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openWhatsApp = (phone: string, message?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    let url = `https://wa.me/55${cleanPhone}`;
    if (message) {
        url += `?text=${encodeURIComponent(message)}`;
    }
    window.open(url, '_blank');
  };

  const calculateAge = (dateString: string) => {
    if (!dateString) return '-';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const handlePrintList = () => {
    const win = window.open('', '', 'width=800,height=600');
    if (!win) return;

    const printStyles = `
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; color: #1a1a1a; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; }
        .header h1 { font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; }
        .header h2 { font-size: 12px; font-weight: normal; margin: 5px 0 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background-color: #f9fafb; font-weight: 600; text-transform: uppercase; font-size: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        @media print { button { display: none; } body { padding: 0; } }
      </style>
    `;

    let tableContent = '';
    const title = activeTab === 'participantes' 
        ? `Relatório Geral de ${labels.participantes}` 
        : activeTab === 'lideres' 
            ? `Ficha da ${labels.equipe}` 
            : 'Lista de Contatos (Marketing)';

    if (activeTab === 'participantes') {
        tableContent = `
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>Idade</th>
              <th>${labels.turma}</th>
              <th>Sacramentos Recebidos</th>
              <th>Responsáveis</th>
            </tr>
          </thead>
          <tbody>
            ${filteredParticipantes.map(student => {
               const turma = turmas.find(t => t.id === student.turma_id);
               const age = calculateAge(student.data_nascimento);
               const sacraments = [];
               if (student.sacramentos.batismo) sacraments.push('Batismo');
               if (student.sacramentos.eucaristia) sacraments.push('Eucaristia');
               if (student.sacramentos.crisma) sacraments.push('Crisma');

               const respNames = (student.responsaveis && student.responsaveis.length > 0)
                 ? student.responsaveis.map(r => `${r.nome} (${r.parentesco}) - ${r.telefone}`).join('<br>')
                 : `${student.nome_responsavel} (${student.telefone_responsavel})`;

               return `
                 <tr>
                   <td>${student.nome_completo}</td>
                   <td>${age} anos</td>
                   <td>${turma?.etapa_nome || '-'}</td>
                   <td>${sacraments.join(', ') || 'Nenhum'}</td>
                   <td>${respNames}</td>
                 </tr>
               `;
            }).join('')}
          </tbody>
        `;
    } else if (activeTab === 'lideres') {
        tableContent = `
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone / E-mail</th>
              <th>${labels.turma} Atual</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLideres.map(cat => {
                const turma = turmas.find(t => t.id === cat.turma_id);
                return `
                 <tr>
                   <td>${cat.nome}</td>
                   <td>${cat.telefone}<br>${cat.email}</td>
                   <td>${turma?.etapa_nome || `Sem ${labels.turma.toLowerCase()}`}</td>
                 </tr>
               `;
            }).join('')}
          </tbody>
        `;
    } else {
        tableContent = `<tbody><tr><td>Lista de contatos para uso interno. Utilize a interface digital para envio.</td></tr></tbody>`;
    }

    const html = `
      <html>
        <head><title>${title}</title>${printStyles}</head>
        <body>
          <div class="header">
            <h1>${paroquia.nome}</h1>
            <h2>${title}</h2>
          </div>
          <table>${tableContent}</table>
          <div class="footer">Gerado pelo sistema Pastoral AI - ${new Date().toLocaleDateString()}</div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const handleAddResponsavel = () => {
      if (tempResponsavel.nome && tempResponsavel.telefone) {
          setResponsaveisList([...responsaveisList, tempResponsavel]);
          setTempResponsavel({ nome: '', parentesco: 'Mãe', telefone: '' });
      }
  };

  const handleRemoveResponsavel = (index: number) => {
      setResponsaveisList(responsaveisList.filter((_, i) => i !== index));
  };

  const handleEditParticipante = (student: Catequizando) => {
    setEditingId(student.id);
    setStudentForm({
      nome_completo: student.nome_completo,
      data_nascimento: student.data_nascimento,
      telefone: student.telefone || '',
      endereco: student.endereco || '',
      turma_id: student.turma_id,
      batismo: student.sacramentos.batismo,
      eucaristia: student.sacramentos.eucaristia,
      crisma: student.sacramentos.crisma,
      observacoes_pastorais: student.observacoes_pastorais,
      familia_id: student.familia_id || '',
      foto_url: student.foto_url || '',
    });
    setResponsaveisList(student.responsaveis || []);
    setTempResponsavel({ nome: '', parentesco: 'Mãe', telefone: '' });
    setIsModalOpen(true);
  };

  const resetParticipanteForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setStudentForm({
        nome_completo: '',
        data_nascimento: '',
        telefone: '',
        endereco: '',
        turma_id: '',
        batismo: false,
        eucaristia: false,
        crisma: false,
        observacoes_pastorais: '',
        familia_id: '',
        foto_url: '',
    });
    setResponsaveisList([]);
    setTempResponsavel({ nome: '', parentesco: 'Mãe', telefone: '' });
  };

  const handleSaveParticipante = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalResponsaveis = [...responsaveisList];
    if (finalResponsaveis.length === 0 && tempResponsavel.nome && tempResponsavel.telefone) {
        finalResponsaveis.push(tempResponsavel);
    }

    const primaryResp = finalResponsaveis[0] || { nome: '', telefone: '', parentesco: '' };

    const payload = {
        nome_completo: studentForm.nome_completo,
        data_nascimento: studentForm.data_nascimento,
        telefone: studentForm.telefone,
        endereco: studentForm.endereco,
        turma_id: studentForm.turma_id,
        foto_url: studentForm.foto_url,
        sacramentos: {
            batismo: studentForm.batismo,
            eucaristia: studentForm.eucaristia,
            crisma: studentForm.crisma
        },
        observacoes_pastorais: studentForm.observacoes_pastorais,
        familia_id: '',
        nome_responsavel: primaryResp.nome,
        telefone_responsavel: primaryResp.telefone,
        responsaveis: finalResponsaveis
    };

    if (editingId) {
        updateCatequizando({ ...payload, id: editingId });
    } else {
        addCatequizando(payload);
    }
    
    resetParticipanteForm();
  };

  const handleSaveLider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiderError('');
    if (!newCatequista.turma_id) {
      setLiderError(`Selecione a ${labels.turma.toLowerCase()} em que o ${labels.lider.toLowerCase()} atuará.`);
      return;
    }
    if (newCatequista.senha.length < 6) {
      setLiderError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!hasSupabase || !isCoordenador) {
      setLiderError('Apenas coordenadores podem cadastrar catequistas com acesso ao sistema.');
      return;
    }

    try {
        const token = await getSessionToken();
        if (!token) {
          setLiderError('Sessão expirada. Faça login novamente.');
          return;
        }
        const res = await fetch('/api/create-lider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email: newCatequista.email,
            nome: newCatequista.nome,
            password: newCatequista.senha,
            turmaId: newCatequista.turma_id,
            pastoralType: pastoralType || 'catequese',
            paroquiaId: user?.parish_id || paroquia.id,
            comunidadeId: user?.comunidade_id || '',
          }),
        });
        const text = await res.text();
        const data = (() => { try { return JSON.parse(text); } catch { return {}; } })();
        if (!res.ok) {
          const msg = data?.error || (res.status === 401 ? 'Sessão expirada. Faça login novamente.' : res.status === 503 ? 'Servidor não configurado. Verifique o Supabase.' : `Erro ${res.status}: ${text?.slice(0, 100) || 'Erro ao criar acesso.'}`);
          setLiderError(msg);
          return;
        }
    } catch (err: any) {
      setLiderError(err.message || 'Erro ao criar acesso.');
      return;
    }

    const { senha, ...dataForLider } = newCatequista;
    await addCatequista(dataForLider);

    setIsModalOpen(false);
    setEditingLiderId(null);
    setNewCatequista({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        data_nascimento: '',
        tempo_servico_anos: 0,
        comunidade_id: '',
        turma_id: '',
        experiencia_anterior: '',
        observacoes: ''
    });
  };

  const handleEditLider = (cat: Catequista) => {
    setEditingLiderId(cat.id);
    setNewCatequista({
      nome: cat.nome,
      email: cat.email || '',
      senha: '',
      telefone: cat.telefone || '',
      data_nascimento: cat.data_nascimento || '',
      tempo_servico_anos: cat.tempo_servico_anos || 0,
      comunidade_id: cat.comunidade_id || '',
      turma_id: cat.turma_id || '',
      experiencia_anterior: cat.experiencia_anterior || '',
      observacoes: cat.observacoes || '',
    });
    setActiveTab('lideres');
    setIsModalOpen(true);
  };

  const handleUpdateLider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLiderId) return;
    const existing = catequistas.find(c => c.id === editingLiderId);
    if (!existing) return;
    await updateCatequista({
      ...existing,
      nome: newCatequista.nome,
      telefone: newCatequista.telefone,
      data_nascimento: newCatequista.data_nascimento,
      turma_id: newCatequista.turma_id,
      tempo_servico_anos: newCatequista.tempo_servico_anos,
      experiencia_anterior: newCatequista.experiencia_anterior,
      observacoes: newCatequista.observacoes,
    });
    setIsModalOpen(false);
    setEditingLiderId(null);
    setNewCatequista({ nome: '', email: '', senha: '', telefone: '', data_nascimento: '', tempo_servico_anos: 0, comunidade_id: '', turma_id: '', experiencia_anterior: '', observacoes: '' });
  };

  const getAllContacts = () => {
      const contacts: { id: string, nome: string, tipo: string, telefone: string }[] = [];
      
      catequistas.forEach(c => {
          if (c.telefone) contacts.push({ id: `cat-${c.id}`, nome: c.nome, tipo: labels.lider, telefone: c.telefone });
      });

      catequizandos.forEach(c => {
          if (c.telefone) contacts.push({ id: `alu-${c.id}`, nome: c.nome_completo, tipo: labels.participante, telefone: c.telefone });
          
          if (c.responsaveis && c.responsaveis.length > 0) {
              c.responsaveis.forEach((r, idx) => {
                  contacts.push({ id: `resp-${c.id}-${idx}`, nome: `${r.nome} (Resp. ${c.nome_completo.split(' ')[0]})`, tipo: 'Responsável', telefone: r.telefone });
              });
          } else if (c.nome_responsavel && c.telefone_responsavel) {
              contacts.push({ id: `resp-old-${c.id}`, nome: `${c.nome_responsavel} (Resp. ${c.nome_completo.split(' ')[0]})`, tipo: 'Responsável', telefone: c.telefone_responsavel });
          }
      });

      return contacts.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const marketingContacts = getAllContacts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Gestão de Pessoas</h2>
           <p className="text-gray-500 text-sm">{labels.participantes}, {labels.equipe} e Marketing.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handlePrintList} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-semibold flex items-center hover:bg-gray-50 transition-colors text-sm">
                <Printer size={18} className="mr-1.5" /> <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button onClick={() => { resetParticipanteForm(); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-church-600 text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center hover:bg-church-700 transition-colors shadow-sm shadow-church-200 text-sm">
                <Plus size={18} className="mr-1.5" /> Novo Cadastro
            </button>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('participantes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'participantes'
                ? 'border-church-500 text-church-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {labels.participantes}
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'marketing'
                ? 'border-church-500 text-church-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Marketing & Mensagens
          </button>
          {isCoordenador && (
            <button
              onClick={() => setActiveTab('lideres')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'lideres'
                  ? 'border-church-500 text-church-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {labels.lideres}
            </button>
          )}
        </nav>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder={`Buscar em ${activeTab === 'participantes' ? labels.participantes.toLowerCase() : activeTab === 'lideres' ? labels.lideres.toLowerCase() : 'marketing'}...`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-500 outline-none text-sm transition-all"
            />
        </div>
        {activeTab === 'participantes' && (
            <>
                <div className="relative">
                    <select 
                        value={filterEtapa} 
                        onChange={e => setFilterEtapa(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm outline-none focus:border-church-500 bg-white min-w-[150px]"
                    >
                        <option value="">Todas as {labels.etapas}</option>
                        {uniqueEtapas.map(et => <option key={et} value={et}>{et}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={filterAno} 
                        onChange={e => setFilterAno(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm outline-none focus:border-church-500 bg-white min-w-[150px]"
                    >
                        <option value="">Todos os Anos</option>
                        {uniqueAnos.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </>
        )}
      </div>

      {/* CONTENT LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'participantes' && (
          <div className="divide-y divide-gray-100">
            {filteredParticipantes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <User size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum {labels.participante.toLowerCase()} encontrado.</p>
              </div>
            ) : (
              filteredParticipantes.map((student) => {
                const turma = turmas.find(t => t.id === student.turma_id);
                return (
                  <div key={student.id} className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setViewingStudent(student)}>
                    <div className="flex items-center gap-3">
                      {student.foto_url ? (
                        <img src={student.foto_url} alt={student.nome_completo} className="h-10 w-10 rounded-full object-cover border border-church-200 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-church-100 flex items-center justify-center text-church-600 font-bold text-sm border border-church-200 shrink-0">
                          {student.nome_completo.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{student.nome_completo}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setViewingStudent(student); }} className="p-1.5 rounded-lg text-gray-400 hover:text-church-600 hover:bg-church-50 transition-colors" title="Ver detalhes"><Eye size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleEditParticipante(student); }} className="text-church-600 hover:text-church-900 text-xs font-semibold px-2 py-1">Editar</button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="text-xs text-gray-500">{calculateAge(student.data_nascimento)} anos</span>
                          {turma && <span className="text-xs text-church-600 font-medium bg-church-50 px-2 py-0.5 rounded-full">{turma.etapa_nome}</span>}
                          <div className="flex gap-1">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${student.sacramentos.batismo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Bat</span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${student.sacramentos.eucaristia ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Euc</span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${student.sacramentos.crisma ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Cri</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'lideres' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                 {filteredLideres.map(cat => {
                     const turma = turmas.find(t => t.id === cat.turma_id);
                     return (
                         <div key={cat.id} className="border border-gray-200 rounded-lg p-4 flex items-start space-x-4 hover:shadow-md transition-shadow bg-white">
                             <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg border border-purple-200">
                                 {cat.nome.charAt(0)}
                             </div>
                             <div className="flex-1">
                                 <div className="flex items-center justify-between">
                                   <h3 className="font-bold text-gray-900">{cat.nome}</h3>
                                   <button onClick={() => handleEditLider(cat)} className="text-church-600 hover:text-church-900 text-xs font-semibold cursor-pointer">Editar</button>
                                 </div>
                                 <p className="text-sm text-gray-500 mb-2">{turma ? `${labels.lider} de ${turma.etapa_nome}` : `Sem ${labels.turma.toLowerCase()} atribuída`}</p>
                                 <div className="text-xs text-gray-500 space-y-1">
                                     <div 
                                         onClick={() => openWhatsApp(cat.telefone)}
                                         className="flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors"
                                         title="Clique para abrir WhatsApp"
                                     >
                                         <MessageCircle size={12} className="mr-1 text-emerald-500 fill-emerald-500/10"/> {cat.telefone}
                                     </div>
                                     {cat.email && <div className="flex items-center"><Mail size={12} className="mr-1"/> {cat.email}</div>}
                                 </div>
                             </div>
                         </div>
                     )
                 })}
             </div>
        )}

        {activeTab === 'marketing' && (
            <div className="flex flex-col h-full">
                <div className="bg-green-50 p-6 border-b border-green-100">
                    <h3 className="text-lg font-bold text-green-900 flex items-center mb-3">
                        <MessageCircle className="mr-2" /> Disparo de Mensagens
                    </h3>
                    <div className="flex gap-4">
                        <textarea
                            value={marketingMessage}
                            onChange={(e) => setMarketingMessage(e.target.value)}
                            placeholder="Digite a mensagem padrão aqui..."
                            className="flex-1 p-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-20 resize-none text-sm"
                        />
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                        * Clique no botão "Enviar" ao lado de cada contato para abrir o WhatsApp com esta mensagem.
                    </p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                                <th className="px-6 py-3 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {marketingContacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm font-bold text-gray-900">{contact.nome}</td>
                                    <td className="px-6 py-3 text-xs">
                                        <span className={`px-2 py-1 rounded-full font-bold
                                            ${contact.tipo === labels.lider ? 'bg-purple-100 text-purple-700' : 
                                              contact.tipo === 'Responsável' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {contact.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{contact.telefone}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button 
                                            onClick={() => openWhatsApp(contact.telefone, marketingMessage)}
                                            className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center ml-auto"
                                        >
                                            <Send size={12} className="mr-1" /> Enviar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* Modal - Visualizar Catequizando */}
      {viewingStudent && (() => {
        const student = viewingStudent;
        const turma = turmas.find(t => t.id === student.turma_id);
        const displayResp = (student.responsaveis && student.responsaveis.length > 0)
          ? student.responsaveis
          : student.nome_responsavel ? [{ nome: student.nome_responsavel, telefone: student.telefone_responsavel, parentesco: '' }] : [];

        const handlePrintStudent = () => {
          const win = window.open('', '', 'width=800,height=600');
          if (!win) return;
          const sacramentos = [];
          if (student.sacramentos.batismo) sacramentos.push('Batismo');
          if (student.sacramentos.eucaristia) sacramentos.push('1ª Eucaristia');
          if (student.sacramentos.crisma) sacramentos.push('Crisma');
          const respHtml = displayResp.map(r => `<p><strong>${r.nome}</strong>${r.parentesco ? ` (${r.parentesco})` : ''} — ${r.telefone}</p>`).join('');
          win.document.write(`<html><head><title>Ficha - ${student.nome_completo}</title>
            <style>body{font-family:Inter,sans-serif;padding:30px;color:#1a1a1a;max-width:600px;margin:0 auto}
            h1{font-size:18px;border-bottom:2px solid #e5e7eb;padding-bottom:8px}
            .section{margin-top:16px} .section h2{font-size:13px;text-transform:uppercase;color:#6b7280;margin-bottom:6px}
            .field{margin-bottom:6px;font-size:13px} .field strong{display:inline-block;width:140px;color:#374151}
            .footer{margin-top:30px;text-align:center;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}
            @media print{button{display:none}}</style></head><body>
            <h1>${student.nome_completo}</h1>
            <div class="section"><h2>Dados Pessoais</h2>
              <div class="field"><strong>Data de Nasc.:</strong> ${student.data_nascimento ? new Date(student.data_nascimento + 'T12:00').toLocaleDateString('pt-BR') : '-'} (${calculateAge(student.data_nascimento)} anos)</div>
              <div class="field"><strong>Telefone:</strong> ${student.telefone || '-'}</div>
              <div class="field"><strong>Endereço:</strong> ${student.endereco || '-'}</div>
              <div class="field"><strong>${labels.turma}:</strong> ${turma?.etapa_nome || '-'} ${turma ? `(${turma.dia_encontro} - ${turma.horario})` : ''}</div>
            </div>
            <div class="section"><h2>Sacramentos Recebidos</h2>
              <div class="field">${sacramentos.length > 0 ? sacramentos.join(', ') : 'Nenhum registrado'}</div>
            </div>
            <div class="section"><h2>Responsáveis</h2>${respHtml || '<p>Nenhum cadastrado</p>'}</div>
            ${student.observacoes_pastorais ? `<div class="section"><h2>Observações</h2><p style="font-size:13px">${student.observacoes_pastorais}</p></div>` : ''}
            <div class="footer">Gerado pelo sistema Pastoral AI — ${new Date().toLocaleDateString()}</div>
            <script>window.print();</script></body></html>`);
          win.document.close();
        };

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingStudent(null)}>
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="bg-church-600 p-5 flex justify-between items-center text-white sticky top-0 z-10">
                <h3 className="font-bold text-lg truncate mr-2">{student.nome_completo}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handlePrintStudent} className="hover:bg-white/20 rounded-full p-1.5 transition-colors" title="Imprimir ficha"><Printer size={18} /></button>
                  <button onClick={() => setViewingStudent(null)} className="hover:bg-white/20 rounded-full p-1.5 transition-colors"><X size={20} /></button>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  {student.foto_url ? (
                    <img src={student.foto_url} alt={student.nome_completo} className="h-16 w-16 rounded-full object-cover border-2 border-church-200 shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-church-100 flex items-center justify-center text-church-600 font-bold text-2xl border-2 border-church-200 shrink-0">
                      {student.nome_completo.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{student.nome_completo}</h4>
                    <p className="text-sm text-gray-500">{calculateAge(student.data_nascimento)} anos {turma ? `· ${turma.etapa_nome}` : ''}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Data de Nascimento</p>
                    <p className="text-sm font-medium text-gray-800">{student.data_nascimento ? new Date(student.data_nascimento + 'T12:00').toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Telefone</p>
                    {student.telefone ? (
                      <p className="text-sm font-medium text-emerald-600 cursor-pointer hover:underline flex items-center" onClick={() => openWhatsApp(student.telefone!)}>
                        <MessageCircle size={14} className="mr-1" />{student.telefone}
                      </p>
                    ) : <p className="text-sm text-gray-400">-</p>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Endereço</p>
                    <p className="text-sm font-medium text-gray-800">{student.endereco || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{labels.turma}</p>
                    <p className="text-sm font-medium text-gray-800">{turma ? `${turma.etapa_nome} — ${turma.dia_encontro}, ${turma.horario}` : '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sacramentos</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${student.sacramentos.batismo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>Batismo</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${student.sacramentos.eucaristia ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>1a Eucaristia</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${student.sacramentos.crisma ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>Crisma</span>
                  </div>
                </div>

                {displayResp.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Responsáveis</p>
                    <div className="space-y-2">
                      {displayResp.map((r, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{r.nome} {r.parentesco && <span className="text-gray-400 font-normal">({r.parentesco})</span>}</p>
                            <p className="text-xs text-gray-500">{r.telefone}</p>
                          </div>
                          {r.telefone && (
                            <button onClick={() => openWhatsApp(r.telefone)} className="p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0">
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {student.observacoes_pastorais && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Observações Pastorais</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{student.observacoes_pastorais}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => { setViewingStudent(null); handleEditParticipante(student); }}
                    className="flex-1 bg-church-600 text-white py-3 rounded-xl font-semibold hover:bg-church-700 transition-colors text-sm min-w-[120px]">
                    Editar Cadastro
                  </button>
                  <button onClick={handlePrintStudent}
                    className="px-4 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                    <Printer size={16} /> Imprimir
                  </button>
                  {isCoordenador && (
                    <button onClick={() => { setViewingStudent(null); setDeletingStudentId(student.id); setDeleteError(''); }}
                      className="px-4 py-3 rounded-xl font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors text-sm flex items-center gap-2">
                      <Trash2 size={16} /> Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Confirmar Exclusão */}
      {deletingStudentId && (() => {
        const studentToDelete = catequizandos.find(c => c.id === deletingStudentId);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="bg-red-600 p-5 flex justify-between items-center text-white">
                <h3 className="font-bold text-lg">Excluir {labels.participante}</h3>
                <button type="button" onClick={() => setDeletingStudentId(null)} className="hover:bg-white/20 rounded-full p-1"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-700">
                  Tem certeza que deseja excluir <strong>{studentToDelete?.nome_completo}</strong>?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  Todas as presenças registradas para este {labels.participante.toLowerCase()} também serão removidas.
                </div>
                {deleteError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{deleteError}</div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setDeletingStudentId(null)}
                    className="flex-1 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
                    Cancelar
                  </button>
                  <button type="button" onClick={async () => {
                    try {
                      await removeCatequizando(deletingStudentId);
                      setDeletingStudentId(null);
                    } catch (err: any) {
                      setDeleteError(err.message || 'Erro ao excluir.');
                    }
                  }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors cursor-pointer">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal - Novo Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl">
             <div className="bg-church-600 p-5 flex justify-between items-center text-white sticky top-0 z-10">
                <div className="flex items-center space-x-2">
                    <User size={20} />
                    <h3 className="font-bold text-lg">
                      {editingId ? 'Editar' : 'Novo'} Cadastro ({activeTab === 'participantes' ? labels.participante : activeTab === 'lideres' ? labels.lider : 'Contato'})
                    </h3>
                </div>
                <button onClick={resetParticipanteForm} className="hover:bg-white/20 rounded-full p-1 transition-colors"><X size={20} /></button>
             </div>
             
             <div className="p-6 md:p-8">
                {activeTab === 'participantes' && (
                    <form onSubmit={handleSaveParticipante} className="space-y-8">

                        <div>
                            <h4 className="text-xs font-bold text-church-600 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Dados do {labels.participante}</h4>
                            <div className="space-y-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                      className="relative w-20 h-20 rounded-full cursor-pointer group"
                                      onClick={() => fotoInputRef.current?.click()}
                                      title="Clique para adicionar foto"
                                    >
                                      {studentForm.foto_url ? (
                                        <img src={studentForm.foto_url} alt="Foto" className="w-20 h-20 rounded-full object-cover border-2 border-church-200" />
                                      ) : (
                                        <div className="w-20 h-20 rounded-full bg-church-50 border-2 border-dashed border-church-300 flex flex-col items-center justify-center text-church-400">
                                          <Camera size={20} />
                                          <span className="text-[10px] font-bold mt-1">Foto</span>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={16} className="text-white" />
                                      </div>
                                    </div>
                                    {studentForm.foto_url && (
                                      <button type="button" onClick={() => setStudentForm(prev => ({ ...prev, foto_url: '' }))} className="text-xs text-red-500 hover:text-red-700">
                                        Remover foto
                                      </button>
                                    )}
                                    <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-1.5">Nome Completo</label>
                                    <input type="text" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-all" 
                                        placeholder={`Nome do ${labels.participante.toLowerCase()}`}
                                        value={studentForm.nome_completo} onChange={e => setStudentForm({...studentForm, nome_completo: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-1.5">Data de Nascimento</label>
                                        <input type="date" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-all" 
                                            value={studentForm.data_nascimento} onChange={e => setStudentForm({...studentForm, data_nascimento: e.target.value})} />
                                     </div>
                                     <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-1.5">{labels.turma} / {labels.etapa}</label>
                                        <div className="relative">
                                            <select className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-all appearance-none"
                                                value={studentForm.turma_id} onChange={e => setStudentForm({...studentForm, turma_id: e.target.value})}>
                                                <option value="">Selecione...</option>
                                                {turmas.map(t => <option key={t.id} value={t.id}>{t.etapa_nome} ({t.dia_encontro})</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                     </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-1.5">Telefone (opcional)</label>
                                    <input type="text" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-all"
                                        placeholder="(00) 00000-0000"
                                        value={studentForm.telefone} onChange={e => setStudentForm({...studentForm, telefone: e.target.value})} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-1.5">Endereço (opcional)</label>
                                    <input type="text" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-gray-50 focus:bg-white transition-all"
                                        placeholder="Rua, número, bairro, cidade"
                                        value={studentForm.endereco} onChange={e => setStudentForm({...studentForm, endereco: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-church-600 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center">
                                <Droplets size={14} className="mr-2"/> Vida Cristã (Sacramentos Já Recebidos)
                            </h4>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs text-gray-500 mb-3 font-medium">Marque os sacramentos que o {labels.participante.toLowerCase()} JÁ recebeu:</p>
                                <div className="flex flex-wrap gap-4 md:gap-8">
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-church-600 checked:border-church-600 transition-all" 
                                                checked={studentForm.batismo} onChange={e => setStudentForm({...studentForm, batismo: e.target.checked})} />
                                            <CheckIcon size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-church-700">Batismo</span>
                                    </label>
                                    
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-church-600 checked:border-church-600 transition-all" 
                                                checked={studentForm.eucaristia} onChange={e => setStudentForm({...studentForm, eucaristia: e.target.checked})} />
                                            <CheckIcon size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-church-700">1a Eucaristia</span>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-church-600 checked:border-church-600 transition-all" 
                                                checked={studentForm.crisma} onChange={e => setStudentForm({...studentForm, crisma: e.target.checked})} />
                                            <CheckIcon size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-church-700">Crisma</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-church-600 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex items-center">
                                <HeartHandshake size={14} className="mr-2"/> Dados dos Responsáveis
                            </h4>
                            
                            {responsaveisList.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {responsaveisList.map((resp, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{resp.nome} <span className="text-gray-500 font-normal">({resp.parentesco})</span></p>
                                                <p className="text-xs text-gray-500">{resp.telefone}</p>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveResponsavel(index)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-1.5">Nome do Responsável</label>
                                        <input type="text" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-white"
                                        placeholder="Ex: Maria da Silva"
                                        value={tempResponsavel.nome} onChange={e => setTempResponsavel({...tempResponsavel, nome: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-1.5">Parentesco</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-white appearance-none"
                                                    value={tempResponsavel.parentesco} 
                                                    onChange={e => setTempResponsavel({...tempResponsavel, parentesco: e.target.value})}
                                                >
                                                    <option value="Mãe">Mãe</option>
                                                    <option value="Pai">Pai</option>
                                                    <option value="Avó">Avó</option>
                                                    <option value="Avô">Avô</option>
                                                    <option value="Tio(a)">Tio(a)</option>
                                                    <option value="Padrinho/Madrinha">Padrinho/Madrinha</option>
                                                    <option value="Outro">Outro</option>
                                                </select>
                                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-1.5">Celular / WhatsApp</label>
                                            <input type="text" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-gray-900 bg-white"
                                            placeholder="(00) 00000-0000"
                                            value={tempResponsavel.telefone} onChange={e => setTempResponsavel({...tempResponsavel, telefone: e.target.value})} />
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleAddResponsavel}
                                        className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold text-sm transition-colors mt-2"
                                    >
                                        + Adicionar Este Responsável à Lista
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-church-600 text-white py-4 rounded-xl font-bold hover:bg-church-700 transition-all shadow-lg shadow-church-200 text-lg flex justify-center items-center transform active:scale-[0.99]">
                           <Plus size={20} className="mr-2" /> {editingId ? 'Salvar Alterações' : 'Salvar Cadastro'}
                        </button>
                    </form>
                )}
                
                {activeTab === 'lideres' && (
                    <form onSubmit={editingLiderId ? handleUpdateLider : handleSaveLider} className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center text-sm uppercase tracking-wide">
                                <User size={16} className="mr-2 text-church-600" />
                                Informações Pessoais
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-gray-900" 
                                        value={newCatequista.nome} 
                                        onChange={e => setNewCatequista({...newCatequista, nome: e.target.value})} 
                                        placeholder="Ex: Maria da Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento</label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-gray-900" 
                                        value={newCatequista.data_nascimento} 
                                        onChange={e => setNewCatequista({...newCatequista, data_nascimento: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center text-sm uppercase tracking-wide">
                                <BookOpen size={16} className="mr-2 text-church-600" />
                                {labels.turma}
                            </h4>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{labels.turma} em que será {labels.lider.toLowerCase()} *</label>
                                <select
                                    required
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-gray-900"
                                    value={newCatequista.turma_id}
                                    onChange={e => setNewCatequista({...newCatequista, turma_id: e.target.value})}
                                    disabled={turmas.length === 0}
                                >
                                    <option value="">
                                        {turmas.length === 0 ? `Crie uma ${labels.turma.toLowerCase()} antes` : `Selecione a ${labels.turma.toLowerCase()}`}
                                    </option>
                                    {turmas.map(t => (
                                        <option key={t.id} value={t.id}>{t.etapa_nome} ({t.dia_encontro})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center text-sm uppercase tracking-wide">
                                <Mail size={16} className="mr-2 text-church-600" />
                                Contato e Acesso
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">E-mail {editingLiderId ? '' : '*'}</label>
                                    <input 
                                        type="email" 
                                        required={!editingLiderId}
                                        disabled={!!editingLiderId}
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-gray-900 disabled:bg-gray-100 disabled:text-gray-500" 
                                        value={newCatequista.email} 
                                        onChange={e => setNewCatequista({...newCatequista, email: e.target.value})} 
                                        placeholder="exemplo@email.com"
                                    />
                                </div>
                                {!editingLiderId && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Senha *</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-gray-900" 
                                        value={newCatequista.senha} 
                                        onChange={e => setNewCatequista({...newCatequista, senha: e.target.value})} 
                                        placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                    />
                                </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-gray-900" 
                                        value={newCatequista.telefone} 
                                        onChange={e => setNewCatequista({...newCatequista, telefone: e.target.value})} 
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                        </div>

                        {liderError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start">
                                <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                {liderError}
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100">
                            <button type="submit" className="w-full bg-church-600 text-white py-3 rounded-xl font-bold hover:bg-church-700 transition-all shadow-sm">
                                {editingLiderId ? 'Salvar Alterações' : `Salvar Cadastro do ${labels.lider}`}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'marketing' && (
                    <div className="text-center text-gray-500 py-8">
                        Use a tabela principal para gerenciar e enviar mensagens.
                    </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckIcon = ({ className, size }: { className?: string, size: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default PeopleManager;
