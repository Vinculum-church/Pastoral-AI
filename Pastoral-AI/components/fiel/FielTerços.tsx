import React from 'react';
import { Cross, Heart, BookMarked } from 'lucide-react';

const MOCK_ORACOES = [
  { id: '1', titulo: 'Terço da Misericórdia', descricao: 'Oração às 15h, hora da misericórdia.' },
  { id: '2', titulo: 'Terço Mariano', descricao: 'Mistérios gozosos, dolorosos, gloriosos e luminosos.' },
  { id: '3', titulo: 'Oração do Anjo da Guarda', descricao: 'Anjo do Senhor, meu zeloso guardador...' },
  { id: '4', titulo: 'Ave Maria', descricao: 'Ave Maria, cheia de graça...' },
  { id: '5', titulo: 'Pai Nosso', descricao: 'Pai nosso que estais nos céus...' },
];

const FielTerços: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-purple-100">
        <Cross size={28} className="text-purple-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Terços e Orações</h2>
        <p className="text-sm text-gray-500">Orações, terços e devoções</p>
      </div>
    </div>

    <div className="space-y-4">
      {MOCK_ORACOES.map((o) => (
        <div
          key={o.id}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-purple-50 transition-colors">
              <Heart size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{o.titulo}</h3>
              <p className="text-sm text-gray-500">{o.descricao}</p>
            </div>
          </div>
          <BookMarked size={20} className="text-gray-300 group-hover:text-purple-500" />
        </div>
      ))}
    </div>

    <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
      <p className="text-sm text-purple-800">
        <strong>Terço em comunidade:</strong> Todas as quartas-feiras às 19h após a missa.
      </p>
    </div>

    <p className="text-center text-xs text-gray-400 py-4">Conteúdo fictício para demonstração</p>
  </div>
);

export default FielTerços;
