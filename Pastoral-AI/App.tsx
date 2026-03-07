import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MeetingManager from './components/MeetingManager';
import PeopleManager from './components/PeopleManager';
import AiPlanner from './components/AiPlanner';
import ResourceLibrary from './components/ResourceLibrary';
import AttendanceReport from './components/AttendanceReport';
import SubscriptionManager from './components/SubscriptionManager';
import EstruturaView from './components/EstruturaView';
import Login from './components/Login';
import { ViewState } from './types';
import { Church, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { PastoralProvider } from './contexts/PastoralContext';

const AuthenticatedApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const { user } = useAuth();

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard setView={setCurrentView} />;
      case ViewState.ENCONTROS:
        return <MeetingManager />;
      case ViewState.RELATORIOS:
        return <AttendanceReport />;
      case ViewState.SUBSCRIPTION:
        return <SubscriptionManager />;
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
      case ViewState.ESTRUTURA:
        return <EstruturaView />;
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
  const { isAuthenticated, loading } = useAuth();

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

  return isAuthenticated ? <AuthenticatedApp /> : <Login />;
};

const App: React.FC = () => {
  return (
    <PastoralProvider>
      <AuthProvider>
        <DataProvider>
          <Root />
        </DataProvider>
      </AuthProvider>
    </PastoralProvider>
  );
};

export default App;
