import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MeetingManager from './components/MeetingManager';
import PeopleManager from './components/PeopleManager';
import AiPlanner from './components/AiPlanner';
import ResourceLibrary from './components/ResourceLibrary';
import AttendanceReport from './components/AttendanceReport';
import EstruturaView from './components/EstruturaView';
import EscolaFormacaoView from './components/EscolaFormacaoView';
import SolicitacoesView from './components/SolicitacoesView';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import Login from './components/Login';
import FielPage from './components/FielPage';
import { ViewState, UserRole } from './types';
import { Loader2, LogOut, Church } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { PastoralProvider, usePastoral } from './contexts/PastoralContext';
import { FielProvider } from './contexts/FielContext';

const AdminDashboard: React.FC = () => (
  <div className="min-h-screen bg-[#F3F4F6]">
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <span className="font-bold text-gray-900">Vinculum • Painel Admin</span>
      <AdminLogoutButton />
    </div>
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
      <AdminPanel />
    </div>
  </div>
);

const AdminLogoutButton: React.FC = () => {
  const { logout } = useAuth();
  return (
    <button
      onClick={() => logout()}
      className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
    >
      <LogOut size={18} /> Sair
    </button>
  );
};

/** Verifica se o usuário é admin */
function checkIsAdmin(user: any): boolean {
  if (!user) return false;
  const roleStr = String(user.role || '').toLowerCase();
  return user.role === UserRole.ADMIN || roleStr === 'admin' || roleStr.includes('admin');
}

/** Rota /admin: exige credenciais. Se não logado como admin, mostra formulário de login. */
const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const isAdmin = checkIsAdmin(user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <Loader2 size={40} className="animate-spin text-amber-600" />
      </div>
    );
  }
  if (isAdmin) return <AdminDashboard />;
  return <AdminLogin />;
};

/** Coordenador sem paróquia/comunidade não pode usar o sistema. */
const CoordenadorSemVinculo: React.FC<{ logout: () => void }> = ({ logout }) => (
  <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
    <div className="max-w-md bg-white rounded-2xl shadow-lg border border-amber-200 p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
        <Church size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Cadastro incompleto</h2>
      <p className="text-gray-600 text-sm mb-6">
        Todo coordenador deve ter paróquia e comunidade vinculados. Entre em contato com o administrador para completar seu cadastro.
      </p>
      <button onClick={logout} className="text-amber-600 hover:text-amber-700 font-medium text-sm">
        Sair
      </button>
    </div>
  </div>
);

const AuthenticatedApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const { user, logout } = useAuth();
  const { setPastoralType } = usePastoral();
  const isCoordenador = user?.role === UserRole.COORDENADOR;

  // Coordenador e líder: fixar pastoral ao segmento atribuído no cadastro
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN && user.pastoral_type) {
      setPastoralType(user.pastoral_type);
    }
  }, [user?.id, user?.role, user?.pastoral_type, setPastoralType]);

  // Catequista não vê Turmas nem Líderes - redirecionar se estiver nessa tela
  useEffect(() => {
    if (!isCoordenador && (currentView === ViewState.ESTRUTURA || currentView === ViewState.LIDERES)) {
      setCurrentView(ViewState.DASHBOARD);
    }
  }, [isCoordenador, currentView]);

  const isCoordenadorSemVinculo = user?.role === UserRole.COORDENADOR && (!user?.parish_id || !user?.comunidade_id);
  if (isCoordenadorSemVinculo) return <CoordenadorSemVinculo logout={logout} />;

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard setView={setCurrentView} />;
      case ViewState.ENCONTROS:
        return <MeetingManager />;
      case ViewState.RELATORIOS:
        return <AttendanceReport />;
      case ViewState.PARTICIPANTES:
        return <PeopleManager initialTab="participantes" />;
      case ViewState.MARKETING:
        return <PeopleManager initialTab="marketing" />;
      case ViewState.LIDERES:
        return <PeopleManager initialTab="lideres" />;
      case ViewState.IA_ASSISTANT:
        return <AiPlanner />;
      case ViewState.MATERIAIS:
        return <ResourceLibrary />;
      case ViewState.ESCOLA_FORMACAO:
        return <EscolaFormacaoView />;
      case ViewState.ESTRUTURA:
        return <EstruturaView />;
      case ViewState.SOLICITACOES:
        return <SolicitacoesView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

const Root: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const isAdmin = checkIsAdmin(user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-church-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Admin deve acessar via /admin
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return isAuthenticated ? <AuthenticatedApp /> : <Login />;
};

const App: React.FC = () => {
  return (
    <PastoralProvider>
      <AuthProvider>
        <FielProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/admin" element={<AdminRoute />} />
                <Route path="/fiel" element={<FielPage />} />
                <Route path="/" element={<Root />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </FielProvider>
      </AuthProvider>
    </PastoralProvider>
  );
};

export default App;
