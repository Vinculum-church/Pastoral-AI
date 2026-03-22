import React from 'react';
import { Calendar, BookOpen, Sun } from 'lucide-react';

const MOCK_LITURGIA = {
  data: '13/03/2025',
  diaSemana: 'Quinta-feira',
  tempoLiturgico: 'Quaresma',
  cor: 'Roxo',
  santo: 'Santo do dia: São Leandro de Sevilha',
  leituras: {
    primeira: 'Êxodo 32,7-14',
    salmo: 'Sl 105(106)',
    evangelho: 'Jo 5,31-47',
  },
};

const FielLiturgia: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-purple-100">
        <Calendar size={28} className="text-purple-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Liturgia</h2>
        <p className="text-sm text-gray-500">Leituras e santos do dia</p>
      </div>
    </div>

    <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
      <div className="flex items-center gap-2 mb-4">
        <Sun size={20} className="text-purple-600" />
        <span className="font-bold text-purple-900">{MOCK_LITURGIA.data}</span>
        <span className="text-purple-600">•</span>
        <span className="text-purple-700">{MOCK_LITURGIA.diaSemana}</span>
      </div>
      <p className="text-sm text-purple-800 mb-2 uppercase font-medium">{MOCK_LITURGIA.tempoLiturgico}</p>
      <p className="text-sm text-purple-700 mb-4">{MOCK_LITURGIA.santo}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-purple-600" />
          <span className="text-sm"><strong>1ª Leitura:</strong> {MOCK_LITURGIA.leituras.primeira}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-purple-600" />
          <span className="text-sm"><strong>Salmo:</strong> {MOCK_LITURGIA.leituras.salmo}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-purple-600" />
          <span className="text-sm"><strong>Evangelho:</strong> {MOCK_LITURGIA.leituras.evangelho}</span>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-2">Calendário Litúrgico</h3>
      <p className="text-sm text-gray-600">Acesse o calendário completo em liturgiadiaria.cnbb.org.br</p>
    </div>

    <p className="text-center text-xs text-gray-400 py-4">Conteúdo fictício para demonstração</p>
  </div>
);

export default FielLiturgia;
