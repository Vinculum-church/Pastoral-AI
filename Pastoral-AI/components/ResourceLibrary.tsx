import React, { useState } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  Video, 
  File, 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  Plus,
  X 
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { MaterialApoio } from '../types';

const ResourceLibrary: React.FC = () => {
  const { materiais, addMaterial } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterCategory, setFilterCategory] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Material Form State
  const [newMaterial, setNewMaterial] = useState<Omit<MaterialApoio, 'id' | 'data_adicao'>>({
      titulo: '',
      descricao: '',
      tipo: 'PDF',
      categoria: 'Formação',
      url: ''
  });

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'PDF': return <FileText size={24} className="text-red-500" />;
      case 'LINK': return <LinkIcon size={24} className="text-blue-500" />;
      case 'VIDEO': return <Video size={24} className="text-purple-500" />;
      default: return <File size={24} className="text-gray-500" />;
    }
  };

  const filteredMaterials = materiais.filter(m => {
    const matchesSearch = m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'TODOS' || m.tipo === filterType;
    const matchesCategory = filterCategory === 'TODOS' || m.categoria === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      addMaterial(newMaterial);
      setIsModalOpen(false);
      setNewMaterial({ titulo: '', descricao: '', tipo: 'PDF', categoria: 'Formação', url: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Materiais de Apoio</h2>
           <p className="text-gray-500 text-sm">Biblioteca de formação, liturgia e dinâmicas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-church-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center hover:bg-church-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Adicionar Recurso
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Buscar material..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-500 outline-none text-sm"
               />
            </div>
            <div className="flex gap-2">
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-church-500 bg-white"
                >
                    <option value="TODOS">Todos os Tipos</option>
                    <option value="PDF">PDFs</option>
                    <option value="LINK">Links</option>
                    <option value="VIDEO">Vídeos</option>
                    <option value="DOC">Documentos</option>
                </select>
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-church-500 bg-white"
                >
                    <option value="TODOS">Todas Categorias</option>
                    <option value="Formação">Formação</option>
                    <option value="Liturgia">Liturgia</option>
                    <option value="Dinâmicas">Dinâmicas</option>
                    <option value="Administrativo">Administrativo</option>
                </select>
            </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(material => (
              <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                          {getIcon(material.tipo)}
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {material.categoria}
                      </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{material.titulo}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">{material.descricao}</p>
                  
                  <div className="pt-4 border-t border-gray-100 mt-auto flex justify-between items-center">
                      <span className="text-xs text-gray-400">Adicionado em: {new Date(material.data_adicao).toLocaleDateString()}</span>
                      <a 
                        href={material.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`flex items-center space-x-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors
                            ${material.tipo === 'LINK' ? 'text-blue-600 hover:bg-blue-50' : 'text-church-600 hover:bg-church-50'}
                        `}
                      >
                          {material.tipo === 'LINK' ? (
                              <><span>Acessar</span><ExternalLink size={16} /></>
                          ) : (
                              <><span>Baixar</span><Download size={16} /></>
                          )}
                      </a>
                  </div>
              </div>
          ))}
          
          {filteredMaterials.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                  <Filter size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhum material encontrado com os filtros atuais.</p>
              </div>
          )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
             <div className="bg-church-600 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold">Adicionar Material</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
             </div>
             <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                   <input 
                      type="text" 
                      required
                      value={newMaterial.titulo}
                      onChange={e => setNewMaterial({...newMaterial, titulo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-church-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                   <textarea 
                      required
                      value={newMaterial.descricao}
                      onChange={e => setNewMaterial({...newMaterial, descricao: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-church-500 outline-none h-24 resize-none"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            value={newMaterial.tipo}
                            onChange={e => setNewMaterial({...newMaterial, tipo: e.target.value as any})}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-church-500 outline-none"
                        >
                            <option value="PDF">PDF</option>
                            <option value="LINK">Link Web</option>
                            <option value="VIDEO">Vídeo</option>
                            <option value="DOC">Documento</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select
                            value={newMaterial.categoria}
                            onChange={e => setNewMaterial({...newMaterial, categoria: e.target.value as any})}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-church-500 outline-none"
                        >
                            <option value="Formação">Formação</option>
                            <option value="Liturgia">Liturgia</option>
                            <option value="Dinâmicas">Dinâmicas</option>
                            <option value="Administrativo">Administrativo</option>
                        </select>
                    </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                   <input 
                      type="text" 
                      required
                      value={newMaterial.url}
                      onChange={e => setNewMaterial({...newMaterial, url: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-church-500 outline-none"
                      placeholder="https://..."
                   />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-church-600 text-white py-2 rounded-lg font-semibold hover:bg-church-700 transition-colors mt-2"
                >
                   Salvar Arquivo
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceLibrary;