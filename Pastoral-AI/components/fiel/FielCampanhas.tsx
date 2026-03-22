import React from 'react';
import { Megaphone, TrendingUp } from 'lucide-react';

const MOCK_CAMPANHAS = [
  { id: '1', titulo: 'Campanha da Fraternidade 2025', descricao: 'Biomas brasileiros e defesa da vida. Participe das ações em sua comunidade.', dataInicio: '26/02/2025', ativa: true },
  { id: '2', titulo: 'Páscoa Solidária', descricao: 'Doação de cestas básicas para famílias carentes. Entrega até 28/03.', dataInicio: '01/03/2025', ativa: true },
  { id: '3', titulo: 'Reforma da Capela', descricao: 'Contribua para a reforma do espaço de oração da comunidade.', dataInicio: '15/01/2025', ativa: false },
];

const FielCampanhas: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-purple-100">
        <Megaphone size={28} className="text-purple-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campanhas</h2>
        <p className="text-sm text-gray-500">Ações pastorais em andamento</p>
      </div>
    </div>

    <div className="space-y-4">
      {MOCK_CAMPANHAS.map((c) => (
        <div
          key={c.id}
          className={`rounded-2xl p-5 border shadow-sm ${
            c.ativa ? 'bg-white border-purple-100' : 'bg-gray-50 border-gray-100 opacity-75'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${c.ativa ? 'bg-purple-100' : 'bg-gray-200'}`}>
              <TrendingUp size={24} className={c.ativa ? 'text-purple-600' : 'text-gray-500'} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">{c.titulo}</h3>
                {c.ativa && (
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    Ativa
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{c.descricao}</p>
              <span className="text-xs text-gray-400">Desde {c.dataInicio}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    <p className="text-center text-xs text-gray-400 py-4">Conteúdo fictício para demonstração</p>
  </div>
);

export default FielCampanhas;
