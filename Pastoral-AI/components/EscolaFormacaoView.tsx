import React, { useState } from 'react';
import { GraduationCap, BookOpen, Video, FileText, ChevronRight, Clock, CheckCircle } from 'lucide-react';

interface Modulo {
  id: string;
  titulo: string;
  descricao: string;
  duracao: string;
  tipo: 'video' | 'leitura' | 'atividade';
  concluido?: boolean;
}

const MOCK_MODULOS: Modulo[] = [
  { id: '1', titulo: 'Introdução à Catequese', descricao: 'Fundamentos da catequese e o papel do catequista.', duracao: '~45 min', tipo: 'video' },
  { id: '2', titulo: 'Metodologia do Encontro', descricao: 'Como estruturar e conduzir um encontro catequético.', duracao: '~1h', tipo: 'video' },
  { id: '3', titulo: 'Psicologia da Idade', descricao: 'Desenvolvimento infantil e adolescente na perspectiva da fé.', duracao: '~30 min', tipo: 'leitura' },
  { id: '4', titulo: 'Liturgia e Catequese', descricao: 'A conexão entre a liturgia e a formação catequética.', duracao: '~40 min', tipo: 'video' },
  { id: '5', titulo: 'Dinâmicas e Recursos', descricao: 'Técnicas práticas para engajar os catequizandos.', duracao: '~35 min', tipo: 'atividade' },
];

const EscolaFormacaoView: React.FC = () => {
  const [modulos] = useState<Modulo[]>(MOCK_MODULOS);

  const getIcon = (tipo: Modulo['tipo']) => {
    switch (tipo) {
      case 'video': return <Video size={22} className="text-purple-500" />;
      case 'leitura': return <BookOpen size={22} className="text-blue-500" />;
      default: return <FileText size={22} className="text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap size={28} className="text-church-600" />
            Escola Pastoral de Formação
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Cursos e módulos para aprofundar sua formação como catequista.
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-church-600 to-church-700 rounded-2xl p-6 text-white shadow-lg shadow-church-200">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/20">
            <GraduationCap size={32} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Formação contínua</h3>
            <p className="text-church-100 text-sm">
              Acesse os módulos abaixo para fortalecer sua prática catequética e aprofundar conhecimentos teológicos e pastorais.
            </p>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Módulos disponíveis</h3>
        <div className="space-y-3">
          {modulos.map((mod) => (
            <div
              key={mod.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-gray-50 group-hover:bg-church-50 transition-colors">
                  {getIcon(mod.tipo)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{mod.titulo}</h4>
                  <p className="text-sm text-gray-500 mb-2">{mod.descricao}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {mod.duracao}
                    </span>
                    {mod.concluido && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle size={14} />
                        Concluído
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-church-500 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 py-4">
        Em breve: conteúdo completo e acompanhamento de progresso.
      </p>
    </div>
  );
};

export default EscolaFormacaoView;
