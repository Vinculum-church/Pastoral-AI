import React, { useState } from 'react';
import { Check, CreditCard, QrCode, FileText, Zap, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PLANS = [
  {
    id: 'price_trial',
    name: 'Degustação (Trial)',
    price: 'Grátis',
    period: '/15 dias',
    description: 'Teste todas as funcionalidades sem compromisso.',
    features: ['Acesso total', 'Suporte por e-mail', 'Até 20 participantes'],
    color: 'gray',
  },
  {
    id: 'price_monthly_basic',
    name: 'Plano Básico',
    price: 'R$ 49,90',
    period: '/mês',
    description: 'Ideal para paróquias pequenas.',
    features: ['Até 100 participantes', 'Gestão de grupos', 'Relatórios PDF'],
    color: 'blue',
  },
  {
    id: 'price_annual_pro',
    name: 'Plano Premium',
    price: 'R$ 89,90',
    period: '/mês',
    description: 'Gestão profissional para grandes paróquias.',
    features: ['Participantes ilimitados', 'Assistente IA ilimitado', 'Multi-comunidade', 'Suporte VIP'],
    highlight: true,
    color: 'indigo',
  },
];

const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerEmail: user?.email,
          parishId: user?.parish_id,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao iniciar checkout. Verifique as chaves do Stripe.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro na conexão com o servidor.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Escolha o Plano Ideal para sua Paróquia</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Digitalize sua pastoral hoje mesmo. Aceitamos Cartão de Crédito (recorrente), PIX e Boleto.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {PLANS.map((plan) => (
          <div 
            key={plan.id}
            className={`relative bg-white rounded-3xl p-8 shadow-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
              plan.highlight ? 'border-church-600 ring-4 ring-church-50' : 'border-gray-100'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-church-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                <Star size={14} fill="currentColor" />
                MAIS POPULAR
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm">{plan.description}</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
              <span className="text-gray-500 font-medium">{plan.period}</span>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-600">
                  <div className="mt-1 bg-green-100 p-0.5 rounded-full text-green-600">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                plan.highlight 
                  ? 'bg-church-600 text-white hover:bg-church-700 shadow-lg shadow-church-200' 
                  : 'bg-gray-900 text-white hover:bg-black'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading === plan.id ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={20} />
                  Assinar Agora
                </>
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-gray-400">
              <CreditCard size={18} />
              <QrCode size={18} />
              <FileText size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Cartão • PIX • Boleto</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-church-50 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 border border-church-100">
        <div className="bg-white p-4 rounded-2xl shadow-sm text-church-600">
          <ShieldCheck size={48} />
        </div>
        <div>
          <h4 className="text-xl font-bold text-church-900 mb-2">Pagamento Seguro & Garantido</h4>
          <p className="text-church-700 text-sm leading-relaxed">
            Utilizamos a infraestrutura do Stripe, a mesma de empresas como Amazon e Google. 
            Seus dados estão protegidos e você pode cancelar a qualquer momento sem burocracia.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
