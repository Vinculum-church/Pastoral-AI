import React from 'react';
import { Church, LayoutDashboard, Users, Calendar, Sparkles, BookOpen, Menu, X, LogOut, MessageCircle, FolderOpen, BarChart3, ChevronRight, CreditCard, GraduationCap } from 'lucide-react';
import { ViewState, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePastoral } from '../contexts/PastoralContext';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { labels } = usePastoral();

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          setView(view);
          setIsMobileMenuOpen(false);
        }}
        className={`group w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 mb-1.5 ${
          isActive 
            ? 'bg-church-600 text-white shadow-lg shadow-church-200 translate-x-1' 
            : 'text-gray-600 hover:bg-white hover:text-church-700 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-church-600 transition-colors'}`} />
          <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>{label}</span>
        </div>
        {isActive && <ChevronRight size={16} className="text-white/80" />}
      </button>
    );
  };

  const isCoordenador = user?.role === UserRole.COORDENADOR;

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-200 p-4 flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center space-x-2 text-church-900">
          <div className="bg-church-600 p-1.5 rounded-lg text-white">
            <Church size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">Vinculum</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 active:bg-gray-100 rounded-full text-gray-600 transition-colors hover:bg-gray-50"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-[#F9FAFB] border-r border-gray-200/60 
        transform transition-transform duration-300 ease-in-out z-30 overflow-hidden flex flex-col shadow-xl md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center space-x-3 text-church-900 mb-8">
            <div className="bg-gradient-to-br from-church-600 to-church-800 p-2.5 rounded-xl text-white shadow-lg shadow-church-200">
              <Church size={28} />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight text-gray-900">Vinculum</h1>
              <p className="text-[11px] text-church-600 font-semibold uppercase tracking-wider mt-1.5">{labels.pastoralDescricao}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-church-50 border border-church-100 flex items-center justify-center text-church-700 font-bold text-sm shrink-0">
                {user?.avatar || user?.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name.split('/')[0]}</p>
                <p className="text-[10px] text-gray-500 font-medium truncate">{user?.paroquia}</p>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 flex-1 overflow-y-auto no-scrollbar space-y-8">
          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Menu Principal</p>
            <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label={isCoordenador ? "Visão Geral" : `Meu ${labels.turma}`} />
            <NavItem view={ViewState.ENCONTROS} icon={Calendar} label={`${labels.encontros} & Frequência`} />
            <NavItem view={ViewState.RELATORIOS} icon={BarChart3} label="Histórico & Relatórios" />
            <NavItem view={ViewState.IA_ASSISTANT} icon={Sparkles} label="Assistente Pastoral IA" />
            <NavItem view={ViewState.ESCOLA_FORMACAO} icon={GraduationCap} label="Escola Pastoral de Formação" />
            <NavItem view={ViewState.MATERIAIS} icon={FolderOpen} label="Materiais de Apoio" />
            <NavItem view={ViewState.SUBSCRIPTION} icon={CreditCard} label="Assinatura & Planos" />
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Secretaria</p>
            <NavItem view={ViewState.PARTICIPANTES} icon={Users} label={labels.participantes} />
            <NavItem view={ViewState.MARKETING} icon={MessageCircle} label="Marketing" />
            {isCoordenador && (
              <>
                <NavItem view={ViewState.ESTRUTURA} icon={Church} label={`${labels.turmas} / Estrutura`} />
                <NavItem view={ViewState.LIDERES} icon={BookOpen} label={labels.equipe} />
              </>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 bg-gradient-to-t from-[#F9FAFB] to-transparent space-y-2">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 text-sm font-medium text-gray-500 hover:text-church-600 hover:bg-church-50 p-3 rounded-xl transition-all duration-200 group border border-gray-200 hover:border-church-200"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao login</span>
          </button>
          <p className="text-center text-[10px] text-gray-300">Versão 3.0 • Vinculum</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
