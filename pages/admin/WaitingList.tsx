
import React, { useEffect, useState } from 'react';
import { getWaitingList, getClients, getServices, deleteWaitingListEntry, getProfessionals, saveWaitingListEntry } from '../../services/mockData';
import { WaitingListEntry, User, Service, Professional } from '../../types';
import { Trash2, Plus, Bell, Calendar, User as UserIcon, AlertCircle, X, Search, Briefcase } from 'lucide-react';

export const WaitingList: React.FC = () => {
  // Data State
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      clientId: '',
      serviceId: '',
      professionalId: '',
      date: '',
      notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [list, cls, servs, profs] = await Promise.all([
      getWaitingList(),
      getClients(),
      getServices(),
      getProfessionals()
    ]);
    setEntries(list);
    setClients(cls);
    setServices(servs);
    setProfessionals(profs);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm('Remover da lista de espera?')) {
          await deleteWaitingListEntry(id);
          loadData();
      }
  };

  const handleNotify = (entry: WaitingListEntry) => {
      alert(`Simulação: Notificação enviada para ${getClientName(entry.clientId)} via WhatsApp/Email.`);
      // In a real app, this would update entry.notified to true via API
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.clientId || !formData.date) return;

      const newEntry: WaitingListEntry = {
          id: '', 
          clientId: formData.clientId,
          serviceId: formData.serviceId,
          professionalId: formData.professionalId || undefined, // Send undefined if empty string
          date: formData.date,
          notes: formData.notes,
          createdAt: new Date().toISOString(),
          notified: false,
          status: 'AGUARDANDO'
      };

      await saveWaitingListEntry(newEntry);
      setIsModalOpen(false);
      setFormData({ clientId: '', serviceId: '', professionalId: '', date: '', notes: '' });
      loadData();
  };

  // Helper to resolve names
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente Removido';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Qualquer Serviço';
  const getProfName = (id?: string) => professionals.find(p => p.id === id)?.name || 'Qualquer Profissional';

  // Group by Date
  const groupedEntries = entries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
  }, {} as Record<string, WaitingListEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort();

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <AlertCircle size={24} className="text-orange-500"/>
                    Lista de Espera (Vagas)
                </h1>
                <p className="text-slate-500 text-sm">Clientes aguardando desistências em dias cheios.</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-orange-100"
            >
                <Plus size={18} /> Adicionar Interesse
            </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
            {sortedDates.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-slate-400 font-medium">Ninguém aguardando vagas no momento.</p>
                </div>
            ) : (
                sortedDates.map(date => (
                    <div key={date} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-500" />
                            <h3 className="font-bold text-slate-700">
                                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {groupedEntries[date].map(entry => (
                                <div key={entry.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shrink-0">
                                            <UserIcon size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{getClientName(entry.clientId)}</h4>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                    {getServiceName(entry.serviceId)}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded border ${entry.professionalId ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                    {entry.professionalId ? `Pref: ${getProfName(entry.professionalId)}` : 'Qualquer Profissional'}
                                                </span>
                                            </div>
                                            {entry.notes && <p className="text-xs text-slate-400 italic mt-1">Obs: {entry.notes}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <button 
                                            onClick={() => handleNotify(entry)}
                                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-green-100 transition-colors"
                                        >
                                            <Bell size={14} /> Notificar Vaga
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(entry.id)} 
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900">Novo Interesse (Lista de Espera)</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente*</label>
                            <select 
                                required 
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500"
                                value={formData.clientId}
                                onChange={e => setFormData({...formData, clientId: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Interesse*</label>
                            <input 
                                required
                                type="date" 
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serviço Desejado (Opcional)</label>
                            <select 
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500"
                                value={formData.serviceId}
                                onChange={e => setFormData({...formData, serviceId: e.target.value})}
                            >
                                <option value="">Qualquer Serviço</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Profissional Preferencial</label>
                            <div className="relative">
                                <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <select 
                                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500"
                                    value={formData.professionalId}
                                    onChange={e => setFormData({...formData, professionalId: e.target.value})}
                                >
                                    <option value="">Qualquer Profissional (Mais rápido)</option>
                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                            <textarea 
                                rows={2}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Ex: Prefere parte da manhã..."
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-100 transition-colors">
                                Salvar na Lista
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
