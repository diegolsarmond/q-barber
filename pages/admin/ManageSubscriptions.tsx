
import React, { useEffect, useState } from 'react';
import { getSubscriptionPlans, saveSubscriptionPlan, deleteSubscriptionPlan, syncWithAsaas } from '../../services/mockData';
import { SubscriptionPlan } from '../../types';
import { Plus, Edit2, Trash2, X, Crown, Check, AlertCircle, Settings, Link as LinkIcon, RefreshCcw, CreditCard, ShieldCheck } from 'lucide-react';

export const ManageSubscriptions: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  
  // Asaas Config State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [asaasApiKey, setAsaasApiKey] = useState('');
  const [isAsaasConfigured, setIsAsaasConfigured] = useState(false);
  
  // Sync Logic in Modal
  const [shouldSyncAsaas, setShouldSyncAsaas] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auxiliary state for feature editing (textarea string)
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    loadPlans();
    // Simulate checking if API key exists in local storage/backend
    const hasKey = localStorage.getItem('asaas_api_key');
    if (hasKey) {
        setAsaasApiKey(hasKey);
        setIsAsaasConfigured(true);
    }
  }, []);

  const loadPlans = async () => {
    const data = await getSubscriptionPlans();
    setPlans(data);
  };

  const handleCreate = () => {
    setEditingPlan({
      name: '',
      description: '',
      price: 0,
      active: true,
      billingCycle: 'MONTHLY',
      features: []
    });
    setFeaturesText('');
    setShouldSyncAsaas(isAsaasConfigured); // Default to sync if configured
    setIsModalOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setFeaturesText(plan.features.join('\n'));
    setShouldSyncAsaas(!!plan.externalId); // Only toggle on if already synced
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano?')) {
      await deleteSubscriptionPlan(id);
      loadPlans();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan && editingPlan.name) {
      setIsSyncing(true);
      
      // Convert features text area to array
      const featuresArray = featuresText.split('\n').filter(line => line.trim() !== '');
      
      let planToSave = { 
          ...editingPlan, 
          features: featuresArray 
      } as SubscriptionPlan;

      // Handle Asaas Sync Simulation
      if (shouldSyncAsaas && !planToSave.externalId) {
          try {
              const externalId = await syncWithAsaas(planToSave);
              planToSave.externalId = externalId;
          } catch (error) {
              console.error("Falha ao sincronizar com Asaas");
              alert("Erro ao sincronizar com Asaas. O plano será salvo localmente.");
          }
      } else if (!shouldSyncAsaas) {
          // If uncheck, theoretically we might want to decouple, but for now let's just keep ID or clear it?
          // Usually you don't 'unsync' easily, but let's assume we keep the link if it exists unless explicitly cleared in a real backend.
          // For this mock, if user unchecks, we don't clear the ID to avoid breaking existing subs, just stop future sync logic.
      }

      await saveSubscriptionPlan(planToSave);
      setIsSyncing(false);
      setIsModalOpen(false);
      loadPlans();
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('asaas_api_key', asaasApiKey);
      setIsAsaasConfigured(!!asaasApiKey);
      setIsConfigModalOpen(false);
      alert("Configurações do Asaas salvas com sucesso!");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planos de Assinatura</h1>
          <p className="text-slate-500 text-sm">Crie planos recorrentes para fidelizar seus clientes.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsConfigModalOpen(true)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all border ${isAsaasConfigured ? 'bg-white text-slate-600 border-gray-200 hover:border-blue-300 hover:text-blue-600' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
            >
                <Settings size={18} /> 
                {isAsaasConfigured ? 'Configurar Integração' : 'Conectar Asaas'}
            </button>
            <button 
                onClick={handleCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
            >
                <Plus size={18} /> Novo Plano
            </button>
        </div>
      </div>

      {/* Asaas Banner if not configured */}
      {!isAsaasConfigured && plans.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-blue-500 mt-0.5" size={20} />
              <div>
                  <h4 className="font-bold text-blue-800 text-sm">Integração de Pagamentos Pendente</h4>
                  <p className="text-xs text-blue-600 mt-1">Para cobrar seus clientes automaticamente, configure sua chave de API do Asaas clicando no botão "Conectar Asaas".</p>
              </div>
          </div>
      )}

      {plans.length === 0 ? (
         <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Crown size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Nenhum plano de assinatura criado.</p>
            <p className="text-sm text-slate-400">Clique em "Novo Plano" para começar.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
                <div key={plan.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${plan.active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                            <div className="flex gap-1">
                                {plan.externalId && (
                                    <span title="Sincronizado com Asaas" className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full border border-blue-100 flex items-center gap-1">
                                        <LinkIcon size={10} /> Asaas
                                    </span>
                                )}
                                {plan.active ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">Ativo</span>
                                ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded-full">Inativo</span>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{plan.description}</p>
                        
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-3xl font-bold text-slate-900">R$ {plan.price.toFixed(2)}</span>
                            <span className="text-sm text-slate-500">/mês</span>
                        </div>

                        <div className="space-y-2 mb-6">
                            {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                    <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                            {plan.features.length === 0 && <span className="text-xs text-slate-400 italic">Sem benefícios listados.</span>}
                        </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                         <span className="text-[10px] text-slate-400 font-mono">
                             {plan.externalId ? `ID: ${plan.externalId}` : 'Local Apenas'}
                         </span>
                         <div className="flex gap-2">
                            <button 
                                onClick={() => handleEdit(plan)}
                                className="text-slate-500 hover:text-indigo-600 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                title="Editar"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(plan.id)}
                                className="text-slate-500 hover:text-red-600 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                title="Excluir"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Plan Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPlan.id ? 'Editar Plano' : 'Novo Plano'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Plano</label>
                <input
                  required
                  type="text"
                  value={editingPlan.name}
                  onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Clube VIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Curta</label>
                <input
                  type="text"
                  value={editingPlan.description}
                  onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Para clientes exigentes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço Mensal (R$)</label>
                    <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPlan.price}
                        onChange={e => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                        value={editingPlan.active ? 'true' : 'false'}
                        onChange={e => setEditingPlan({ ...editingPlan, active: e.target.value === 'true' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                  </div>
              </div>

              {/* Asaas Integration Toggle */}
              {isAsaasConfigured && (
                  <div className={`p-4 rounded-xl border transition-colors ${shouldSyncAsaas ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <label className="flex items-start gap-3 cursor-pointer">
                          <div className="relative flex items-center">
                              <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={shouldSyncAsaas}
                                  onChange={(e) => setShouldSyncAsaas(e.target.checked)}
                                  disabled={!!editingPlan.externalId} // Cannot un-sync easily once created
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </div>
                          <div className="flex-1">
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-800">Sincronizar com Asaas</span>
                                  {editingPlan.externalId && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">JÁ SINCRONIZADO</span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                  {editingPlan.externalId 
                                    ? `ID Externo: ${editingPlan.externalId}` 
                                    : "Criar este plano automaticamente no painel do Asaas para cobrança recorrente."}
                              </p>
                          </div>
                      </label>
                  </div>
              )}

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Benefícios / Recursos</label>
                 <textarea
                    rows={5}
                    value={featuresText}
                    onChange={e => setFeaturesText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Digite um benefício por linha.&#10;Ex:&#10;Cortes ilimitados&#10;Bebida grátis"
                 />
                 <p className="text-xs text-slate-500 mt-1">Separe cada benefício pulando uma linha.</p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start text-xs text-yellow-800 border border-yellow-100">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>Alterações no preço não afetam assinaturas já ativas, apenas novas adesões.</p>
              </div>

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-100 mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSyncing ? (
                    <>
                        <RefreshCcw size={18} className="animate-spin" /> Sincronizando...
                    </>
                ) : (
                    "Salvar Plano"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Asaas Config Modal */}
      {isConfigModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CreditCard size={24} /> Integração Asaas
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">Configure sua chave de API para automatizar cobranças.</p>
                    </div>
                    <button onClick={() => setIsConfigModalOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSaveConfig} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Chave de API (API Key)</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={asaasApiKey}
                                onChange={(e) => setAsaasApiKey(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                placeholder="$aact_..."
                            />
                            <div className="absolute left-3 top-3.5 text-slate-400">
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Você pode encontrar sua chave no painel do Asaas em <strong>Configurações de Conta {'>'} Integração</strong>.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
                        <p className="font-bold mb-1">Ambiente</p>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="env" defaultChecked className="text-blue-600" />
                                Produção
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="env" className="text-blue-600" />
                                Sandbox (Teste)
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                    >
                        Salvar Configuração
                    </button>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
