import React from 'react';
import { BookOpen, FileText, ChevronRight } from 'lucide-react';

const MOCK_EDIÇOES = [
  { id: '1', titulo: 'Revista Comunidade - Março 2025', data: '01/03/2025', descricao: 'Edição especial sobre a Quaresma e preparação para a Páscoa.' },
  { id: '2', titulo: 'Revista Comunidade - Fevereiro 2025', data: '01/02/2025', descricao: 'Tema: A Família como Igreja Doméstica.' },
  { id: '3', titulo: 'Revista Comunidade - Janeiro 2025', data: '01/01/2025', descricao: 'Ano Novo: Projetos pastorais para 2025.' },
];

const FielRevista: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-purple-100">
        <BookOpen size={28} className="text-purple-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Revista da Comunidade</h2>
        <p className="text-sm text-gray-500">Publicações e conteúdos da sua comunidade</p>
      </div>
    </div>

    <div className="space-y-4">
      {MOCK_EDIÇOES.map((ed) => (
        <div
          key={ed.id}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-purple-50 transition-colors">
              <FileText size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{ed.titulo}</h3>
              <p className="text-sm text-gray-500 mb-2">{ed.descricao}</p>
              <span className="text-xs text-gray-400">{ed.data}</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-500" />
        </div>
      ))}
    </div>

    <p className="text-center text-xs text-gray-400 py-4">Conteúdo fictício para demonstração</p>
  </div>
);

export default FielRevista;
