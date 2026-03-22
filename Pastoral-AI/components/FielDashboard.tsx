import React, { useState } from 'react';
import {
  Church,
  Heart,
  LogOut,
  BookOpen,
  Bell,
  Megaphone,
  DollarSign,
  Calendar,
  Cross,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useFiel } from '../contexts/FielContext';
import FielRevista from './fiel/FielRevista';
import FielAvisos from './fiel/FielAvisos';
import FielCampanhas from './fiel/FielCampanhas';
import FielDizimo from './fiel/FielDizimo';
import FielLiturgia from './fiel/FielLiturgia';
import FielTerços from './fiel/FielTerços';

type FielSection = 'home' | 'revista' | 'avisos' | 'campanhas' | 'dizimo' | 'liturgia' | 'tercos';

const FielCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-purple-50 transition-colors">
          <Icon size={24} className="text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

const FielDashboard: React.FC = () => {
  const { session, setSession } = useFiel();
  const [section, setSection] = useState<FielSection>('home');

  if (!session) return null;

  const handleSair = () => {
    setSession(null);
    window.location.href = '/fiel';
  };

  const renderContent = () => {
    switch (section) {
      case 'revista':
        return <FielRevista />;
      case 'avisos':
        return <FielAvisos />;
      case 'campanhas':
        return <FielCampanhas />;
      case 'dizimo':
        return <FielDizimo />;
      case 'liturgia':
        return <FielLiturgia />;
      case 'tercos':
        return <FielTerços />;
      default:
        return (
          <>
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Heart size={20} />
                <span className="text-sm font-medium text-purple-100">Bem-vindo(a)</span>
              </div>
              <h2 className="text-xl font-bold">
                Conteúdos pastorais da {session.comunidadeNome}
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Acesse revistas, avisos, campanhas e muito mais.
              </p>
            </div>

            <div className="grid gap-4">
              <FielCard
                icon={BookOpen}
                title="Revista da Comunidade"
                description="Publicações e conteúdos da sua comunidade"
                onClick={() => setSection('revista')}
              />
              <FielCard
                icon={Bell}
                title="Avisos"
                description="Comunicados e novidades da paróquia"
                onClick={() => setSection('avisos')}
              />
              <FielCard
                icon={Megaphone}
                title="Campanhas"
                description="Ações pastorais e campanhas em andamento"
                onClick={() => setSection('campanhas')}
              />
              <FielCard
                icon={DollarSign}
                title="Dízimo"
                description="Informações sobre contribuição e dízimo"
                onClick={() => setSection('dizimo')}
              />
              <FielCard
                icon={Calendar}
                title="Liturgia"
                description="Leituras, santos do dia e calendário litúrgico"
                onClick={() => setSection('liturgia')}
              />
              <FielCard
                icon={Cross}
                title="Terços e Orações"
                description="Orações, terços e devoções"
                onClick={() => setSection('tercos')}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {section !== 'home' && (
              <button
                onClick={() => setSection('home')}
                className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-2 rounded-xl text-white">
                <Church size={24} />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Portal do Fiel</h1>
                <p className="text-xs text-gray-500">
                  {session.paroquiaNome} • {session.comunidadeNome}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSair}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium p-2 rounded-lg hover:bg-gray-50"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default FielDashboard;
