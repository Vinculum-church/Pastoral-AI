import React from 'react';
import { DollarSign, CreditCard, QrCode } from 'lucide-react';

const FielDizimo: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-purple-100">
        <DollarSign size={28} className="text-purple-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dízimo</h2>
        <p className="text-sm text-gray-500">Contribua com a comunidade</p>
      </div>
    </div>

    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
      <p className="text-purple-100 text-sm mb-4">
        O dízimo é um gesto de gratidão e partilha. Sua contribuição sustenta as obras pastorais e sociais da comunidade.
      </p>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-3">
          <CreditCard size={20} />
          <span className="text-sm font-medium">PIX: 123.456.789-00</span>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-3">
          <QrCode size={20} />
          <span className="text-sm font-medium">QR Code disponível na secretaria</span>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-3">Horário</h3>
      <p className="text-sm text-gray-600">Secretaria paroquial: Segunda a Sexta, 8h às 17h</p>
      <p className="text-sm text-gray-600 mt-1">Domingo: após as missas</p>
    </div>

    <p className="text-center text-xs text-gray-400 py-4">Conteúdo fictício para demonstração</p>
  </div>
);

export default FielDizimo;
