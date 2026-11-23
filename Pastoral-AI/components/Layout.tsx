import React from 'react';
import { Church, LayoutDashboard, Users, Calendar, Sparkles, BookOpen, Menu, X, LogOut, MessageCircle, FolderOpen, BarChart3, ChevronRight, GraduationCap, Inbox, Home, ClipboardCheck } from 'lucide-react';
import { ViewState, UserRole } from '../types';
import LogoMark from './LogoMark';
import { useAuth } from '../contexts/AuthContext';
import { usePastoral } from '../contexts/PastoralContext';
import { useData } from '../contexts/DataContext';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  // Cada tela abre do topo (a rolagem fica no <main>, não na janela).
  const mainRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 }); // no celular quem rola é a página
  }, [currentView]);
  const { user, logout } = useAuth();
  const { labels } = usePastoral();
  const { solicitacoes } = useData();

  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewState; icon: any; label: string; badge?: number }) => {
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
        <div className="flex items-center space-x-2">
          {badge && badge > 0 ? (
            <span className={`min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 ${
              isActive ? 'bg-white text-church-700' : 'bg-red-500 text-white'
            }`}>{badge}</span>
          ) : null}
          {isActive && <ChevronRight size={16} className="text-white/80" />}
        </div>
      </button>
    );
  };

  const isCoordenador = user?.role === UserRole.COORDENADOR;

  return (
    <div className="min-h-screen bg-marfim font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-200 p-4 flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center space-x-2 text-church-900">
          <div className="bg-church-800 p-1.5 rounded-lg text-gold-200">
            <LogoMark size={20} />
          </div>
          <span className="font-serif font-semibold text-xl tracking-tight">PastoriAI</span>
        </div>
        {/* No celular o menu completo abre pelo "Mais" da barra inferior; aqui só o botão de fechar */}
        {isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu"
            className="p-2 active:bg-gray-100 rounded-full text-gray-600 transition-colors hover:bg-gray-50"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-marfim-claro border-r border-gray-200/60 
        transform transition-transform duration-300 ease-in-out z-30 overflow-hidden flex flex-col shadow-xl md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center space-x-3 text-church-900 mb-8">
            <div className="bg-gradient-to-br from-church-700 to-church-900 p-2.5 rounded-xl text-gold-200 shadow-lg shadow-church-200">
              <LogoMark size={28} />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-2xl leading-none tracking-tight text-gray-900">PastoriAI</h1>
              <p className="text-[11px] text-gold-700 font-semibold uppercase tracking-wider mt-1.5">{labels.pastoralDescricao}</p>
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
            <NavItem view={ViewState.DASHBOARD} icon={Home} label="Início" />
            {isCoordenador && <NavItem view={ViewState.VISAO_GERAL} icon={LayoutDashboard} label="Visão geral" />}
            <NavItem view={ViewState.ENCONTROS} icon={Calendar} label={`${labels.encontros} & Frequência`} />
            <NavItem view={ViewState.RELATORIOS} icon={BarChart3} label="Histórico & Relatórios" />
            <NavItem view={ViewState.IA_ASSISTANT} icon={Sparkles} label="Assistente Pastoral IA" />
            <NavItem view={ViewState.ESCOLA_FORMACAO} icon={GraduationCap} label="Escola Pastoral de Formação" />
            <NavItem view={ViewState.MATERIAIS} icon={FolderOpen} label="Materiais de Apoio" />
          </div>

          <div>
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Secretaria</p>
            <NavItem view={ViewState.PARTICIPANTES} icon={Users} label={labels.participantes} />
            <NavItem view={ViewState.MARKETING} icon={MessageCircle} label="Marketing" />
            {isCoordenador && (
              <>
                <NavItem view={ViewState.SOLICITACOES} icon={Inbox} label="Solicitações" badge={solicitacoes.length} />
                <NavItem view={ViewState.ESTRUTURA} icon={Church} label={`${labels.turmas} / Estrutura`} />
                <NavItem view={ViewState.LIDERES} icon={BookOpen} label={labels.equipe} />
              </>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 bg-gradient-to-t from-marfim-claro to-transparent space-y-2">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 text-sm font-medium text-gray-500 hover:text-church-600 hover:bg-church-50 p-3 rounded-xl transition-all duration-200 group border border-gray-200 hover:border-church-200"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao login</span>
          </button>
          <p className="text-center text-[10px] text-gray-300">Versão 3.0 • PastoriAI</p>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-28 md:pb-24">
          {children}
        </div>
      </main>

      {/* Barra inferior (celular): as tarefas do dia a dia a um toque */}
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5">
          {[
            { view: ViewState.DASHBOARD, icon: Home, label: 'Início' },
            { view: ViewState.ENCONTROS, icon: ClipboardCheck, label: 'Chamada' },
            { view: ViewState.PARTICIPANTES, icon: Users, label: labels.turma },
            { view: ViewState.MATERIAIS, icon: FolderOpen, label: 'Material' },
          ].map(({ view, icon: Icon, label }) => {
            const active = currentView === view;
            return (
              <button
                key={view}
                onClick={() => { setView(view); setIsMobileMenuOpen(false); }}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${active ? 'text-church-600' : 'text-gray-500'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className="truncate max-w-full px-1">{label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium text-gray-500 relative"
          >
            <Menu size={22} />
            <span>Mais</span>
            {isCoordenador && solicitacoes.length > 0 && <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
