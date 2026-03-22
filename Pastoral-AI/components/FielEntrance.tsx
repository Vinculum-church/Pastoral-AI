import React, { useState, useEffect } from 'react';
import { Church, Mail, MapPin, Loader2, ChevronRight, Heart } from 'lucide-react';
import { useFiel } from '../contexts/FielContext';
import { MOCK_PAROQUIAS, MOCK_COMUNIDADES } from '../constants';
import { Paroquia, Comunidade } from '../types';

const FielEntrance: React.FC = () => {
  const { setSession } = useFiel();
  const [email, setEmail] = useState('');
  const [paroquiaId, setParoquiaId] = useState('');
  const [comunidadeId, setComunidadeId] = useState('');
  const [paroquias, setParoquias] = useState<Paroquia[]>(MOCK_PAROQUIAS);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setParoquias(MOCK_PAROQUIAS);
    if (!paroquiaId && MOCK_PAROQUIAS.length > 0) {
      setParoquiaId(MOCK_PAROQUIAS[0].id);
    }
  }, []);

  useEffect(() => {
    const filtered = MOCK_COMUNIDADES.filter(c => c.paroquia_id === paroquiaId);
    setComunidades(filtered);
    setComunidadeId(filtered.length > 0 ? filtered[0].id : '');
  }, [paroquiaId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !paroquiaId || !comunidadeId) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return;
    }

    setLoading(true);
    const paroquia = paroquias.find(p => p.id === paroquiaId);
    const comunidade = comunidades.find(c => c.id === comunidadeId);
    if (paroquia && comunidade) {
      setSession({
        email: email.trim(),
        paroquiaId,
        paroquiaNome: paroquia.nome,
        comunidadeId,
        comunidadeNome: comunidade.nome,
      });
    }
    setLoading(false);
  };

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-purple-200">
            <Heart size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Portal do Fiel</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Acesso sem cadastro</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <p className="text-sm text-gray-500 mb-6">
              Informe seu e-mail e selecione sua paróquia e comunidade para acessar o conteúdo pastoral.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="seu.email@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paróquia</label>
                <div className="relative">
                  <Church className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={paroquiaId}
                    onChange={(e) => setParoquiaId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                  >
                    {paroquias.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comunidade</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={comunidadeId}
                    onChange={(e) => setComunidadeId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                  >
                    {comunidades.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={18} />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isValidEmail || !paroquiaId || !comunidadeId || loading}
                className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-6">
              <a href="/" className="text-purple-600 hover:underline">Voltar ao login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FielEntrance;
