
import React, { useEffect, useState } from 'react';
import { getQueue, getClients, getServices, getProfessionals, saveQueueEntry, deleteQueueEntry, updateQueueStatus, clearDailyQueue } from '../../services/mockData';
import { QueueEntry, User, Service, Professional, QueueStatus } from '../../types';
import { Plus, Trash2, X, Check, Play, Square, RotateCw, List, Clock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const WalkInQueue: React.FC = () => {
  const { user } = useAuth();
  
  // Data State
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  
  // Queue for TODAY
  const today = new Date().toISOString().split('T')[0];
  const [filteredEntries, setFilteredEntries] = useState<QueueEntry[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
      clientId: string;
      serviceId: string;
      professionalId: string;
  }>({
      clientId: '',
      serviceId: '',
      professionalId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter for TODAY automatically for "Queue" behavior
    const filtered = entries
        .filter(entry => entry.date === today)
        .sort((a, b) => a.queueNumber - b.queueNumber);
    setFilteredEntries(filtered);
  }, [entries]);

  const loadData = async () => {
    const [list, cls, servs, profs] = await Promise.all([
      getQueue(),
      getClients(),
      getServices(),
      getProfessionals()
    ]);
    setEntries(list);
    setClients(cls);
    setServices(servs);
    setProfessionals(profs);
  };

  const handleStatusChange = async (id: string, newStatus: QueueStatus) => {
      await updateQueueStatus(id, newStatus);
      loadData();
  };

  const handleDelete = async (id: string) => {
      if (window.confirm('Remover da fila?')) {
          await deleteQueueEntry(id);
          loadData();
      }
  };

  const handleFinishQueue = async () => {
      if(window.confirm('Deseja limpar os atendimentos concluídos e cancelados de hoje?')) {
          await clearDailyQueue(today);
          loadData();
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.clientId) return;

      const client = clients.find(c => c.id === formData.clientId);
      if (!client) return;

      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newEntry: QueueEntry = {
          id: '', // Generated in mock
          clientId: formData.clientId,
          clientName: client.name,
          serviceId: formData.serviceId,
          professionalId: formData.professionalId,
          date: today, // Always today for queue
          status: 'AGUARDANDO',
          queueNumber: 0, // Calc in mock
          arrivalTime: timeString
      };

      await saveQueueEntry(newEntry);
      setIsModalOpen(false);
      
      // Reset form
      setFormData({
          clientId: '',
          serviceId: '',
          professionalId: ''
      });
      
      loadData();
  };

  // Helper to resolve names
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Sem Serviço';
  const getProfName = (id?: string) => professionals.find(p => p.id === id)?.name || 'Qualquer um';

  const getStatusBadge = (status: QueueStatus) => {
      switch(status) {
          case 'AGUARDANDO': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">Aguardando</span>;
          case 'EM_ATENDIMENTO': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold animate-pulse">Em Atendimento</span>;
          case 'CONCLUIDO': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Concluído</span>;
          case 'CANCELADO': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Cancelado</span>;
          default: return null;
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Header/Actions Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Left Action */}
            <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <List size={24} className="text-indigo-600"/>
                    Ordem de Chegada
                </h1>
                <p className="text-xs text-slate-500">Gerenciamento de fila para atendimento imediato.</p>
            </div>

            {/* Right Actions */}
            <div className="flex gap-2">
                <button 
                    onClick={handleFinishQueue}
                    className="bg-sky-50 text-sky-600 hover:bg-sky-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors border border-sky-100"
                >
                    <Check size={16} /> Limpar Finalizados
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-md shadow-indigo-100"
                >
                    <Plus size={16} /> Novo Cliente na Fila
                </button>
                <button 
                    onClick={loadData}
                    className="bg-gray-100 hover:bg-gray-200 text-slate-600 px-3 py-2 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"
                >
                    <RotateCw size={16} />
                </button>
            </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-indigo-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-indigo-50 border-b border-indigo-100 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                            <th className="py-4 px-4 w-16 text-center">Senha</th>
                            <th className="py-4 px-4">Chegada</th>
                            <th className="py-4 px-4">Cliente</th>
                            <th className="py-4 px-4">Profissional</th>
                            <th className="py-4 px-4 text-center">Status</th>
                            <th className="py-4 px-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-600 divide-y divide-gray-100">
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400 bg-white">
                                    A fila está vazia para hoje.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((entry, index) => (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 text-center">
                                        <span className="font-black text-xl text-slate-800 bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full mx-auto">
                                            {entry.queueNumber}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} /> {entry.arrivalTime}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold">
                                                <UserIcon size={14} />
                                            </div>
                                            <div>
                                                <p>{entry.clientName}</p>
                                                <p className="text-xs text-slate-400 font-normal">{getServiceName(entry.serviceId)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-500">
                                        {getProfName(entry.professionalId)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {getStatusBadge(entry.status)}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            {entry.status === 'AGUARDANDO' && (
                                                <button 
                                                    onClick={() => handleStatusChange(entry.id, 'EM_ATENDIMENTO')}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                    title="Chamar / Iniciar"
                                                >
                                                    <Play size={18} fill="currentColor" />
                                                </button>
                                            )}
                                            {entry.status === 'EM_ATENDIMENTO' && (
                                                <button 
                                                    onClick={() => handleStatusChange(entry.id, 'CONCLUIDO')}
                                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                    title="Concluir Atendimento"
                                                >
                                                    <Square size={18} fill="currentColor" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(entry.id)} 
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remover da Fila"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Add Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900">Adicionar na Fila</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente*</label>
                            <div className="flex gap-2">
                                <select 
                                    required 
                                    className="flex-1 border border-gray-300 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.clientId}
                                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serviço*</label>
                            <select 
                                required
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                                value={formData.serviceId}
                                onChange={e => setFormData({...formData, serviceId: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Profissional Preferencial</label>
                            <select 
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                                value={formData.professionalId}
                                onChange={e => setFormData({...formData, professionalId: e.target.value})}
                            >
                                <option value="">Sem preferência (Qualquer um)</option>
                                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-colors">
                                Entrar na Fila
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        )}

    </div>
  );
};
