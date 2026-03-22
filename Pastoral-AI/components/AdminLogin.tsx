import React, { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, Info, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

/** Tela de login exclusiva para administradores - acessada em /admin */
const AdminLogin: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Se logou mas não é admin, mostrar erro e deslogar
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN && (user as { role?: string }).role !== 'admin') {
      setError('Apenas administradores podem acessar esta área. Faça login com uma conta de administrador.');
      logout();
    }
  }, [user, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password, 'admin');
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-amber-200">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel Admin</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Vinculum • Acesso restrito</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-amber-50 p-4 border-b border-amber-100">
            <p className="text-sm text-amber-900 font-medium">
              Digite suas credenciais de administrador para acessar o painel.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="admin@paroquia.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start">
                <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 flex items-center justify-center disabled:opacity-70 transform active:scale-[0.98] cursor-pointer"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Acessar Painel Admin'}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-center text-sm text-gray-500 hover:text-church-600 transition-colors"
        >
          ← Voltar ao sistema
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
