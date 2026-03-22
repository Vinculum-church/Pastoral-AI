import React from 'react';
import { Bell, AlertCircle, Info } from 'lucide-react';

const MOCK_AVISOS = [
  { id: '1', titulo: 'Missa de Páscoa', conteudo: 'Celebração especial no domingo às 10h. Traga sua família!', data: '12/03/2025', prioridade: 'alta' },
  { id: '2', titulo: 'Retiro de Cura e Libertação', conteudo: 'Inscrições abertas para o retiro de 28 a 30 de março.', data: '10/03/2025', prioridade: 'normal' },
  { id: '3', titulo: 'Horário de Confissões', conteudo: 'Todas as quartas-feiras: 19h às 20h30.', data: '05/03/2025', prioridade: 'normal' },
];

const FielAvisos: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-purple-100">
        <Bell size={28} className="text-purple-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Avisos</h2>
        <p className="text-sm text-gray-500">Comunicados e novidades da paróquia</p>
      </div>
    </div>

    <div className="space-y-4">
      {MOCK_AVISOS.map((av) => (
        <div
          key={av.id}
          className={`rounded-2xl p-5 border border-gray-100 shadow-sm ${
            av.prioridade === 'alta' ? 'bg-amber-50 border-amber-100' : 'bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${av.prioridade === 'alta' ? 'bg-amber-100' : 'bg-gray-50'}`}>
              {av.prioridade === 'alta' ? (
                <AlertCircle size={24} className="text-amber-600" />
              ) : (
                <Info size={24} className="text-purple-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{av.titulo}</h3>
              <p className="text-sm text-gray-600 mb-2">{av.conteudo}</p>
              <span className="text-xs text-gray-400">{av.data}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    <p className="text-center text-xs text-gray-400 py-4">Conteúdo fictício para demonstração</p>
  </div>
);

export default FielAvisos;
