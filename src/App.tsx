import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  Lock, 
  Layout, 
  Shield, 
  Zap, 
  ChevronRight, 
  Menu, 
  X,
  CreditCard,
  Building2,
  Key,
  Search,
  Loader2,
  MapPin,
  Navigation,
  LogOut,
  Info,
  XCircle,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchByCEP, searchByAddress, type Address } from './services/cepService';

// Types
type Plan = 'monthly' | 'quarterly' | 'yearly';
type SearchMode = 'cep' | 'address';
type View = 'landing' | 'checkout' | 'login' | 'system' | 'payment-success' | 'payment-failure' | 'payment-pending';

interface PricingPlan {
  id: Plan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 99',
    period: '/mês',
    description: 'Ideal para pequenas empresas começando agora.',
    features: ['Acesso total ao sistema', 'Suporte via email', '1 Chave de acesso', 'Relatórios básicos']
  },
  {
    id: 'quarterly',
    name: 'Trimestral',
    price: 'R$ 249',
    period: '/trimestre',
    description: 'O melhor equilíbrio para empresas em crescimento.',
    features: ['Acesso total ao sistema', 'Suporte prioritário', '3 Chaves de acesso', 'Relatórios avançados', 'Economia de 15%'],
    highlight: true
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 'R$ 799',
    period: '/ano',
    description: 'Máximo valor para grandes operações.',
    features: ['Acesso total ao sistema', 'Suporte 24/7', '10 Chaves de acesso', 'Relatórios personalizados', 'Economia de 33%', 'Treinamento exclusivo']
  }
];

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Payer State
  const [payer, setPayer] = useState({ name: '', surname: '', email: '' });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Auth State
  const [accessKey, setAccessKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // System State
  const [searchMode, setSearchMode] = useState<SearchMode>('cep');
  const [cepInput, setCepInput] = useState('');
  const [addressInput, setAddressInput] = useState({ uf: '', city: '', street: '' });
  const [results, setResults] = useState<Address[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Path detection for payment returns
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/payment/success') || path.includes('/payment/sucess')) {
      setView('payment-success');
    } else if (path.includes('/payment/failure')) {
      setView('payment-failure');
    } else if (path.includes('/payment/pending')) {
      setView('payment-pending');
    }
  }, []);

  const handleBuy = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setPaymentError('');
    setView('checkout');
  };

  const handleContinuePurchase = async () => {
    if (!selectedPlan) return;
    if (!payer.name || !payer.surname || !payer.email) {
      setPaymentError('Por favor, preencha todos os campos do pagador.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      // Parse price R$ 99 -> 99
      const priceValue = parseInt(selectedPlan.price.replace(/[^\d]/g, ''));

      const response = await fetch('https://payment.escaliagora.com.br/api/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item: {
            id: `${selectedPlan.id}-001`,
            title: `Plano ${selectedPlan.name}`,
            quantity: 1,
            unit_price: priceValue,
            currency_id: 'BRL'
          },
          payer: {
            name: payer.name,
            surname: payer.surname,
            email: payer.email
          },
          back_url: `${window.location.origin}/payment`
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar preferência de pagamento.');
      }

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de pagamento não encontrada no retorno.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!accessKey.trim()) {
      setAuthError('Por favor, insira a chave de acesso.');
      return;
    }

    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const masterCode = import.meta.env.VITE_ACCESS_CODE;
    const accessKeysRaw = import.meta.env.VITE_ACCESS_KEYS;
    
    let isValid = false;
    const trimmedKey = accessKey.trim();

    // Check master code
    if (masterCode && trimmedKey === masterCode) {
      isValid = true;
    } 
    // Check individual keys with expiration
    else if (accessKeysRaw) {
      try {
        const keys = JSON.parse(accessKeysRaw);
        if (keys[trimmedKey]) {
          const expirationDate = new Date(keys[trimmedKey]);
          const today = new Date();
          
          // Reset hours to compare only dates
          today.setHours(0, 0, 0, 0);
          expirationDate.setHours(23, 59, 59, 999);

          if (expirationDate >= today) {
            isValid = true;
          } else {
            setAuthError('Esta chave de acesso expirou.');
            setIsLoadingAuth(false);
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing VITE_ACCESS_KEYS', e);
      }
    }

    if (isValid) {
      setView('system');
      setAccessKey('');
    } else {
      setAuthError('Chave de acesso inválida.');
    }
    setIsLoadingAuth(false);
  };

  const handleCEPSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (cepInput.length < 8) return;

    setIsLoadingSearch(true);
    try {
      const data = await searchByCEP(cepInput);
      setResults([data]);
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao buscar CEP');
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const { uf, city, street } = addressInput;
    if (!uf || !city || street.length < 3) return;

    setIsLoadingSearch(true);
    try {
      const data = await searchByAddress(uf, city, street);
      setResults(data);
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao buscar endereço');
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const logout = () => {
    setView('landing');
    setResults([]);
    setSearchError('');
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-black selection:text-white">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
              <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <MapPin className="text-white w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">BuscaCep Pro</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                  <a href="#features" className="text-sm font-medium text-zinc-500 hover:text-black transition-colors">Recursos</a>
                  <a href="#pricing" className="text-sm font-medium text-zinc-500 hover:text-black transition-colors">Planos</a>
                  <button 
                    onClick={() => setView('login')}
                    className="text-sm font-medium text-zinc-500 hover:text-black transition-colors flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Login
                  </button>
                  <button 
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-zinc-800 transition-all"
                  >
                    Começar Agora
                  </button>
                </div>

                <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  {isMenuOpen ? <X /> : <Menu />}
                </button>
              </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6">
              <div className="max-w-7xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-zinc-100 rounded-full text-zinc-500">
                    Soluções para Empresas Modernas
                  </span>
                  <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                    IMPULSIONE SUA <br />
                    <span className="text-zinc-400 italic">PRODUTIVIDADE.</span>
                  </h1>
                  <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-12">
                    A plataforma definitiva para gerenciar suas operações corporativas com segurança, 
                    velocidade e inteligência de dados.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full sm:w-auto bg-black text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                      Ver Planos <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="w-full sm:w-auto bg-white border border-zinc-200 px-10 py-4 rounded-full text-lg font-bold hover:bg-zinc-50 transition-all">
                      Falar com Consultor
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-zinc-50 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-12">
                  {[
                    { icon: <Layout className="w-8 h-8" />, title: "Interface Intuitiva", desc: "Design focado na experiência do usuário para máxima eficiência." },
                    { icon: <Shield className="w-8 h-8" />, title: "Segurança Total", desc: "Criptografia de ponta a ponta e chaves de acesso exclusivas." },
                    { icon: <Building2 className="w-8 h-8" />, title: "Escalabilidade", desc: "Pronto para crescer junto com a sua empresa, sem limites." }
                  ].map((f, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 }}
                      className="p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm"
                    >
                      <div className="mb-6 text-black">{f.icon}</div>
                      <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                      <p className="text-zinc-500 leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Planos Flexíveis</h2>
                  <p className="text-zinc-500">Escolha a opção que melhor se adapta ao seu negócio.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {PRICING_PLANS.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`relative p-10 rounded-[2.5rem] border ${plan.highlight ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white'} transition-all hover:scale-[1.02]`}
                    >
                      {plan.highlight && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                          Mais Popular
                        </span>
                      )}
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className={`text-sm ${plan.highlight ? 'text-zinc-400' : 'text-zinc-500'}`}>{plan.period}</span>
                      </div>
                      <p className={`text-sm mb-8 ${plan.highlight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {plan.description}
                      </p>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm">
                            <Check className={`w-4 h-4 ${plan.highlight ? 'text-white' : 'text-black'}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => handleBuy(plan)}
                        className={`w-full py-4 rounded-2xl font-bold transition-all ${
                          plan.highlight 
                            ? 'bg-white text-black hover:bg-zinc-100' 
                            : 'bg-black text-white hover:bg-zinc-800'
                        }`}
                      >
                        Assinar Agora
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-zinc-100 px-6 mt-auto">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  <span className="font-bold">BuscaCep Pro</span>
                </div>
                <p className="text-zinc-400 text-sm">© 2026 BuscaCep Pro. Todos os direitos reservados.</p>
                <div className="flex gap-8">
                  <a href="#" className="text-sm text-zinc-400 hover:text-black">Termos</a>
                  <a href="#" className="text-sm text-zinc-400 hover:text-black">Privacidade</a>
                </div>
              </div>
            </footer>
          </motion.div>
        )}

        {view === 'checkout' && (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen bg-zinc-50 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-xl bg-white p-12 rounded-[3rem] border border-zinc-200 shadow-2xl text-center">
              <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <CreditCard className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Confirmar Assinatura</h2>
              <p className="text-zinc-500 mb-8">
                Você selecionou o plano <span className="font-bold text-black">{selectedPlan?.name}</span>. 
                Preencha seus dados para prosseguir para o pagamento seguro.
              </p>

              <div className="space-y-4 mb-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Nome</label>
                    <input 
                      type="text" 
                      value={payer.name}
                      onChange={(e) => setPayer({...payer, name: e.target.value})}
                      placeholder="Ex: Eduardo"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black transition-all outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Sobrenome</label>
                    <input 
                      type="text" 
                      value={payer.surname}
                      onChange={(e) => setPayer({...payer, surname: e.target.value})}
                      placeholder="Ex: Judici"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black transition-all outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">Email</label>
                  <input 
                    type="email" 
                    value={payer.email}
                    onChange={(e) => setPayer({...payer, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-black transition-all outline-none text-sm"
                  />
                </div>
              </div>
              
              <div className="bg-zinc-50 p-6 rounded-2xl mb-10 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-500">Plano</span>
                  <span className="font-bold">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total</span>
                  <span className="font-bold text-xl">{selectedPlan?.price}</span>
                </div>
              </div>

              {paymentError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {paymentError}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleContinuePurchase}
                  disabled={isProcessingPayment}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar Compra'}
                </button>
                <button 
                  onClick={() => setView('landing')}
                  className="w-full bg-white text-zinc-500 py-4 rounded-2xl font-bold hover:text-black transition-all"
                >
                  Cancelar e Voltar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view.startsWith('payment-') && (
          <motion.div 
            key="payment-status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="min-h-screen bg-zinc-50 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-xl bg-white p-12 rounded-[3rem] border border-zinc-200 shadow-2xl text-center">
              {view === 'payment-success' && (
                <>
                  <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-green-100">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Pagamento Confirmado!</h2>
                  <p className="text-zinc-500 mb-8 leading-relaxed">
                    Sua compra foi realizada com sucesso. <br />
                    Em breve você receberá um e-mail com todas <br />
                    as <span className="font-bold text-black">informações de acesso</span> ao sistema.
                  </p>
                </>
              )}

              {view === 'payment-pending' && (
                <>
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-100">
                    <Clock className="w-10 h-10 text-amber-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Pagamento em Processamento</h2>
                  <p className="text-zinc-500 mb-8 leading-relaxed">
                    O seu pagamento está sendo processado. <br />
                    Assim que for confirmado, você receberá <br />
                    as instruções de acesso por e-mail.
                  </p>
                </>
              )}

              {view === 'payment-failure' && (
                <>
                  <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-100">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Ops! Algo deu errado</h2>
                  <p className="text-zinc-500 mb-8 leading-relaxed">
                    Não conseguimos processar o seu pagamento. <br />
                    Por favor, verifique seus dados ou tente <br />
                    novamente utilizando outro método.
                  </p>
                </>
              )}

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    window.history.pushState({}, '', '/');
                    setView('landing');
                  }}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  {view === 'payment-failure' ? 'Tentar Novamente' : 'Voltar para Início'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="min-h-screen bg-black flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
                  <Key className="text-black w-8 h-8" />
                </div>
                <h2 className="text-white text-3xl font-bold tracking-tight">Acesso ao Sistema</h2>
                <p className="text-zinc-500 mt-2">Insira sua chave corporativa para entrar.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Chave de Acesso</label>
                  <input
                    type="password"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-14 px-6 bg-zinc-800 border border-zinc-700 rounded-2xl text-white text-lg focus:border-white focus:ring-0 transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoadingAuth}
                  className="w-full h-14 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoadingAuth ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ChevronRight className="w-5 h-5" /></>}
                </button>

                {authError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
                    <Info className="w-4 h-4" />
                    {authError}
                  </div>
                )}
              </form>

              <button 
                onClick={() => setView('landing')}
                className="mt-8 w-full text-zinc-500 text-sm font-medium hover:text-white transition-colors"
              >
                Voltar para a Home
              </button>
            </div>
          </motion.div>
        )}

        {view === 'system' && (
          <motion.div 
            key="system"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-zinc-50 flex flex-col"
          >
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <MapPin className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">BuscaCep Pro</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Autenticado</span>
                <button 
                  onClick={logout}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-black"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </header>

            <main className="flex-1 pt-32 pb-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Search */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="space-y-8">
                  <div>
                    <h1 className="text-5xl font-bold leading-[0.9] tracking-tighter mb-4">
                      BUSCA DE <br />
                      <span className="text-zinc-400">ENDEREÇOS.</span>
                    </h1>
                    <p className="text-zinc-500 text-lg max-w-md">
                      Localize qualquer endereço no Brasil com rapidez e precisão.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Mode Switcher */}
                    <div className="flex p-1 bg-zinc-200/50 rounded-2xl w-fit">
                      <button
                        onClick={() => setSearchMode('cep')}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                          searchMode === 'cep' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        Por CEP
                      </button>
                      <button
                        onClick={() => setSearchMode('address')}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                          searchMode === 'address' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        Por Nome
                      </button>
                    </div>

                    {/* Search Form */}
                    <div className="relative">
                      {searchMode === 'cep' ? (
                        <form onSubmit={handleCEPSearch} className="space-y-4">
                          <div className="relative group">
                            <input
                              value={cepInput}
                              onChange={(e) => setCepInput(e.target.value)}
                              placeholder="00000-000"
                              className="w-full h-16 px-6 bg-white border-2 border-zinc-200 rounded-2xl text-xl font-bold focus:border-black focus:ring-0 transition-all outline-none"
                            />
                            <button
                              type="submit"
                              disabled={isLoadingSearch}
                              className="absolute right-3 top-3 bottom-3 px-6 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                            >
                              {isLoadingSearch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                              <span className="font-medium">Buscar</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleAddressSearch} className="space-y-4">
                          <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                              <input
                                value={addressInput.uf}
                                onChange={(e) => setAddressInput({ ...addressInput, uf: e.target.value.toUpperCase() })}
                                placeholder="UF"
                                maxLength={2}
                                className="w-full h-14 px-4 bg-white border-2 border-zinc-200 rounded-xl text-lg font-bold focus:border-black focus:ring-0 transition-all outline-none uppercase"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                value={addressInput.city}
                                onChange={(e) => setAddressInput({ ...addressInput, city: e.target.value })}
                                placeholder="Cidade"
                                className="w-full h-14 px-4 bg-white border-2 border-zinc-200 rounded-xl text-lg font-bold focus:border-black focus:ring-0 transition-all outline-none"
                              />
                            </div>
                            <div className="col-span-4 relative">
                              <input
                                value={addressInput.street}
                                onChange={(e) => setAddressInput({ ...addressInput, street: e.target.value })}
                                placeholder="Nome da Rua / Logradouro"
                                className="w-full h-14 px-4 bg-white border-2 border-zinc-200 rounded-xl text-lg font-bold focus:border-black focus:ring-0 transition-all outline-none"
                              />
                              <button
                                type="submit"
                                disabled={isLoadingSearch}
                                className="absolute right-2 top-2 bottom-2 px-4 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                              >
                                {isLoadingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>

                    {searchError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
                        <Info className="w-4 h-4" />
                        {searchError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                <div className="h-full min-h-[500px] bg-white rounded-[2.5rem] p-8 border border-zinc-200 relative overflow-hidden shadow-sm">
                  <AnimatePresence mode="wait">
                    {results.length > 0 ? (
                      <motion.div 
                        key="results"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative z-10 space-y-6"
                      >
                        <div className="flex justify-between items-end">
                          <div>
                            <h3 className="text-2xl font-bold">Resultados</h3>
                            <p className="text-zinc-500 text-sm">{results.length} endereço(s) encontrado(s)</p>
                          </div>
                          <button
                            onClick={() => setResults([])}
                            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                          {results.map((addr, idx) => (
                            <div
                              key={idx}
                              className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 hover:border-black transition-all group"
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">CEP</span>
                                    <span className="font-bold text-xl">{addr.cep}</span>
                                  </div>
                                  <h4 className="text-lg font-semibold text-zinc-800">{addr.logradouro || 'Sem logradouro'}</h4>
                                  <p className="text-zinc-500">
                                    {addr.bairro ? addr.bairro + ', ' : ''}{addr.localidade} - {addr.uf}
                                  </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                                  <ArrowRight className="w-5 h-5" />
                                </div>
                              </div>

                              <div className="mt-6 pt-6 border-t border-zinc-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Estado</span>
                                  <span className="text-sm font-medium">{addr.uf}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">DDD</span>
                                  <span className="text-sm font-medium">{addr.ddd}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">IBGE</span>
                                  <span className="text-sm font-medium">{addr.ibge}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Região</span>
                                  <span className="text-sm font-medium">{addr.regiao || '-'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-6"
                      >
                        <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center border border-zinc-100">
                          <Navigation className="w-10 h-10 text-zinc-300" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Nenhum endereço selecionado</h3>
                          <p className="text-zinc-500 text-sm max-w-[240px] mx-auto">
                            Utilize o formulário ao lado para buscar informações detalhadas de qualquer lugar do Brasil.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
