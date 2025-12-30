import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSubscriptionPlans, getClientSubscription, subscribeToPlan, cancelClientSubscription } from '../../services/mockData';
import { SubscriptionPlan, ClientSubscription as ClientSubscriptionType } from '../../types';
import { Check, Crown, CreditCard, Calendar, AlertCircle, X, ShieldCheck } from 'lucide-react';

export const ClientSubscription: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<ClientSubscriptionType | null>(null);
  
  // Modal for confirmation
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [allPlans, sub] = await Promise.all([
      getSubscriptionPlans(),
      getClientSubscription(user.id)
    ]);
    // Filter only active plans for display
    setPlans(allPlans.filter(p => p.active));
    setCurrentSub(sub);
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!user || !selectedPlan) return;
    
    // Simulate API call
    setLoading(true);
    await subscribeToPlan(user.id, selectedPlan);
    
    // Refresh data
    await loadData();
    setSelectedPlan(null);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!user || !currentSub) return;
    
    if (window.confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá os benefícios ao fim do ciclo atual.')) {
        setLoading(true);
        await cancelClientSubscription(user.id);
        await loadData();
        setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando informações de assinatura...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Minha Assinatura</h1>
        <p className="text-slate-500 text-sm">Gerencie seu plano e aproveite benefícios exclusivos.</p>
      </div>

      {currentSub ? (
        // --- ACTIVE SUBSCRIPTION VIEW ---
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
           <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white relative overflow-hidden">
               <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                   <Crown size={200} />
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                   <div>
                       <div className="flex items-center gap-2 mb-2 opacity-90 text-sm font-medium uppercase tracking-wide">
                           <ShieldCheck size={16} /> Assinatura Ativa
                       </div>
                       <h2 className="text-3xl font-bold mb-1">{currentSub.planName}</h2>
                       <p className="opacity-80">Renova em {new Date(currentSub.nextBillingDate).toLocaleDateString('pt-BR')}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-sm opacity-80 mb-1">Valor Mensal</p>
                       <p className="text-4xl font-bold">R$ {currentSub.price.toFixed(2)}</p>
                   </div>
               </div>
           </div>

           <div className="p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                       <h3 className="font-bold text-slate-800 mb-4">Detalhes do Plano</h3>
                       <div className="space-y-3">
                           <div className="flex items-center gap-3 text-slate-600">
                               <Calendar size={18} className="text-indigo-500" />
                               <span>Membro desde {new Date(currentSub.startDate).toLocaleDateString('pt-BR')}</span>
                           </div>
                           <div className="flex items-center gap-3 text-slate-600">
                               <CreditCard size={18} className="text-indigo-500" />
                               <span>Cobrança automática no cartão final 4242</span>
                           </div>
                       </div>
                   </div>

                   <div className="flex flex-col items-start md:items-end justify-center">
                        <button 
                            onClick={handleCancel}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancelar Assinatura
                        </button>
                        <p className="text-xs text-slate-400 mt-2 max-w-xs text-right">
                            Ao cancelar, você continuará com acesso até o final do período de cobrança atual.
                        </p>
                   </div>
               </div>
           </div>
        </div>
      ) : (
        // --- NO SUBSCRIPTION (PLAN SELECTION) VIEW ---
        <div className="animate-fade-in">
           <div className="text-center mb-12 max-w-2xl mx-auto">
               <h2 className="text-3xl font-bold text-slate-900 mb-4">Escolha o plano ideal para você</h2>
               <p className="text-slate-500">
                   Desbloqueie descontos exclusivos, agendamento prioritário e cortes ilimitados com nossos planos de fidelidade.
               </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {plans.map(plan => (
                   <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col relative overflow-hidden group">
                       <div className="p-8 flex-1">
                           <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                           <p className="text-slate-500 text-sm mb-6">{plan.description}</p>
                           
                           <div className="flex items-baseline gap-1 mb-8">
                               <span className="text-4xl font-bold text-slate-900">R$ {plan.price.toFixed(2)}</span>
                               <span className="text-slate-400">/mês</span>
                           </div>

                           <ul className="space-y-4 mb-8">
                               {plan.features.map((feature, idx) => (
                                   <li key={idx} className="flex items-start gap-3 text-slate-700">
                                       <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                           <Check size={12} strokeWidth={3} />
                                       </div>
                                       <span className="text-sm">{feature}</span>
                                   </li>
                               ))}
                           </ul>
                       </div>
                       
                       <div className="p-6 bg-gray-50 border-t border-gray-100">
                           <button 
                               onClick={() => setSelectedPlan(plan)}
                               className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200"
                           >
                               Assinar Agora
                           </button>
                       </div>
                   </div>
               ))}
           </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
             <button 
                onClick={() => setSelectedPlan(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
             >
                 <X size={20} />
             </button>

             <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CreditCard size={32} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900">Confirmar Assinatura</h2>
                 <p className="text-slate-500 mt-2">Você está prestes a assinar o plano <strong className="text-slate-800">{selectedPlan.name}</strong>.</p>
             </div>

             <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm border border-gray-100">
                 <div className="flex justify-between mb-2">
                     <span className="text-slate-500">Plano</span>
                     <span className="font-bold text-slate-800">{selectedPlan.name}</span>
                 </div>
                 <div className="flex justify-between mb-2">
                     <span className="text-slate-500">Ciclo</span>
                     <span className="font-bold text-slate-800">Mensal</span>
                 </div>
                 <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                     <span className="font-bold text-slate-800">Total</span>
                     <span className="font-bold text-indigo-600 text-lg">R$ {selectedPlan.price.toFixed(2)}</span>
                 </div>
             </div>
             
             <div className="flex items-start gap-2 mb-6 text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
                 <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                 <p>Esta é uma simulação. Nenhum valor será cobrado do seu cartão real neste ambiente de demonstração.</p>
             </div>

             <button 
                onClick={handleSubscribe}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
             >
                 {loading ? 'Processando...' : 'Confirmar e Assinar'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};