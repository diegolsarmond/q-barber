
import React, { useEffect, useState } from 'react';
import { getClients, saveUser, deleteUser, getAppointments, getProfessionals, saveRestriction, getRestrictions, deleteRestriction } from '../../services/mockData';
import { User, Appointment, UserRole, Professional, ClientRestriction } from '../../types';
import { Search, Edit2, Trash2, X, History, Mail, Calendar, CheckCircle, Clock, Plus, Phone, MapPin, Gift, User as UserIcon, TrendingUp, DollarSign, ShieldAlert, Lock, Briefcase } from 'lucide-react';

export const ManageClients: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit/Create Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<User> | null>(null);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = useState<{client: User, appointments: Appointment[], stats: {totalSpent: number, count: number}} | null>(null);

  // Restriction Modal State
  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [restrictions, setRestrictions] = useState<ClientRestriction[]>([]);
  const [restrictionForm, setRestrictionForm] = useState({
      clientId: '',
      type: 'BLOCK_PROFESSIONAL' as 'BLOCK_PROFESSIONAL' | 'BLOCK_ALL',
      professionalId: '',
      reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsData, appointmentsData, profsData, restrData] = await Promise.all([
        getClients(),
        getAppointments(),
        getProfessionals(),
        getRestrictions()
      ]);
      setClients(clientsData);
      setAppointments(appointmentsData);
      setProfessionals(profsData);
      setRestrictions(restrData);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get client stats
  const getClientStats = (clientId: string) => {
    const clientAppts = appointments.filter(a => a.clientId === clientId && (a.status === 'COMPLETED' || a.status === 'CONFIRMED'));
    
    // Sort desc for last visit
    const sorted = [...clientAppts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastVisit = sorted.length > 0 ? sorted[0].date : null;
    const totalSpent = clientAppts.reduce((sum, a) => sum + a.price, 0);

    return {
        count: clientAppts.length,
        lastVisit,
        totalSpent
    };
  };

  // Phone Mask Helper
  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    if (phoneNumberLength <= 2) return `+${phoneNumber}`;
    if (phoneNumberLength <= 4) return `+${phoneNumber.slice(0, 2)} (${phoneNumber.slice(2, 4)}`;
    if (phoneNumberLength <= 9) return `+${phoneNumber.slice(0, 2)} (${phoneNumber.slice(2, 4)}) ${phoneNumber.slice(4)}`;
    return `+${phoneNumber.slice(0, 2)} (${phoneNumber.slice(2, 4)}) ${phoneNumber.slice(4, 9)}-${phoneNumber.slice(9, 14)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingClient) return;
    const formatted = formatPhone(e.target.value);
    setEditingClient({ ...editingClient, phone: formatted });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este cliente? O acesso do usuário será revogado.')) {
      await deleteUser(id);
      loadData();
    }
  };

  const handleCreate = () => {
    setEditingClient({
      name: '',
      email: '',
      role: UserRole.CLIENT,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      phone: '+55 ',
      address: '',
      birthDate: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = (client: User) => {
    setEditingClient({ ...client });
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient && editingClient.name && editingClient.email) {
      const userToSave = { ...editingClient, role: UserRole.CLIENT } as User;
      await saveUser(userToSave);
      setIsEditModalOpen(false);
      loadData();
    }
  };

  const handleViewHistory = async (client: User) => {
    // Fetch fresh appointments ensures latest data in modal
    const freshAppointments = await getAppointments();
    const clientAppts = freshAppointments
      .filter(a => a.clientId === client.id)
      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
    
    const completed = clientAppts.filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED');
    const stats = {
        totalSpent: completed.reduce((sum, a) => sum + a.price, 0),
        count: completed.length
    };

    setSelectedClientHistory({ client, appointments: clientAppts, stats });
    setIsHistoryModalOpen(true);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { 
      'CONFIRMED': 'bg-green-100 text-green-700 border border-green-200', 
      'PENDING': 'bg-yellow-100 text-yellow-700 border border-yellow-200', 
      'CANCELLED': 'bg-red-100 text-red-700 border border-red-200', 
      'COMPLETED': 'bg-blue-100 text-blue-700 border border-blue-200',
      'BLOCKED': 'bg-gray-100 text-gray-500 border border-gray-200'
    };
    
    const icons: Record<string, React.ReactNode> = {
        'CONFIRMED': <CheckCircle size={10} />,
        'PENDING': <Clock size={10} />,
        'CANCELLED': <X size={10} />,
        'COMPLETED': <CheckCircle size={10} />,
        'BLOCKED': <X size={10} />
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
            {icons[status]}
            {status}
        </span>
    );
  };

  // --- Restriction Logic ---
  
  const handleSaveRestriction = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!restrictionForm.clientId) return;
      if(restrictionForm.type === 'BLOCK_PROFESSIONAL' && !restrictionForm.professionalId) {
          alert('Selecione um profissional para bloquear.');
          return;
      }

      await saveRestriction({
          id: '',
          clientId: restrictionForm.clientId,
          type: restrictionForm.type,
          professionalId: restrictionForm.professionalId || undefined,
          reason: restrictionForm.reason,
          createdAt: new Date().toISOString()
      });

      // Clear form
      setRestrictionForm({ clientId: '', type: 'BLOCK_PROFESSIONAL', professionalId: '', reason: '' });
      loadData();
  };

  const handleDeleteRestriction = async (id: string) => {
      if(window.confirm("Remover este bloqueio?")) {
          await deleteRestriction(id);
          loadData();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciamento de Clientes</h1>
          <p className="text-slate-500 text-sm">Visualize o histórico, edite dados e acompanhe a fidelidade.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setIsRestrictionModalOpen(true)}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-red-200 text-sm"
            >
              <ShieldAlert size={18} /> Restrições
            </button>
            <button 
              onClick={handleCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95 text-sm"
            >
              <Plus size={18} /> Novo Cliente
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 transition-shadow focus-within:shadow-md">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome, e-mail ou telefone..." 
          className="flex-1 outline-none text-slate-700 placeholder-slate-400 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Responsive View: Cards on Mobile */}
          <div className="block lg:hidden space-y-4">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-slate-400">Nenhum cliente encontrado.</p>
              </div>
            ) : (
              filteredClients.map(client => {
                const stats = getClientStats(client.id);
                return (
                <div key={client.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={client.avatarUrl || 'https://via.placeholder.com/64'} className="w-14 h-14 rounded-full object-cover border border-gray-100" alt={client.name} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate">{client.name}</h3>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p className="flex items-center gap-1.5"><Mail size={12} className="shrink-0" /> {client.email}</p>
                        {client.phone && <p className="flex items-center gap-1.5"><Phone size={12} className="shrink-0" /> {client.phone}</p>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex gap-2 text-xs">
                     <div className="flex-1 bg-slate-50 rounded-lg p-2 flex flex-col items-center border border-slate-100">
                        <span className="text-slate-400 uppercase text-[10px] font-bold">Visitas</span>
                        <span className="font-bold text-slate-800">{stats.count}</span>
                     </div>
                     <div className="flex-1 bg-slate-50 rounded-lg p-2 flex flex-col items-center border border-slate-100">
                        <span className="text-slate-400 uppercase text-[10px] font-bold">Última</span>
                        <span className="font-bold text-slate-800">
                            {stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '-'}
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
                    <button onClick={() => handleViewHistory(client)} className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><History size={14}/> Histórico</button>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(client)} className="flex-1 flex items-center justify-center p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(client.id)} className="flex-1 flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>

          {/* Table for Desktop */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-bold">Cliente</th>
                  <th className="p-4 font-bold">Contato</th>
                  <th className="p-4 font-bold">Localização</th>
                  <th className="p-4 font-bold text-center">Frequência</th>
                  <th className="p-4 font-bold text-center">Última Visita</th>
                  <th className="p-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 italic">Nenhum cliente encontrado com os critérios de busca.</td>
                  </tr>
                ) : (
                  filteredClients.map(client => {
                    const stats = getClientStats(client.id);
                    return (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={client.avatarUrl || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:border-indigo-200 transition-colors" />
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{client.name}</p>
                            {client.birthDate && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <Gift size={10} />
                                <span>{new Date(client.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                              <Phone size={14} className="text-slate-400 shrink-0" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">
                        {client.address ? (
                          <div className="flex items-center gap-2 text-xs truncate max-w-[150px]" title={client.address}>
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            {client.address}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">Não informado</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                            <TrendingUp size={12} /> {stats.count}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-600 text-xs">
                        {stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString('pt-BR') : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button 
                            onClick={() => handleViewHistory(client)} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Ver Histórico"
                          >
                            <History size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(client)} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Editar Dados"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remover Cliente"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit/Create Modal */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                <p className="text-xs text-slate-500">Preencha as informações cadastrais abaixo.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required 
                      type="text" 
                      value={editingClient.name} 
                      onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" 
                      placeholder="Nome do cliente"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required 
                      type="email" 
                      value={editingClient.email} 
                      onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" 
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={editingClient.phone || ''} 
                      onChange={handlePhoneChange} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow font-mono" 
                      placeholder="+55 (11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Data de Nascimento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      value={editingClient.birthDate || ''} 
                      onChange={e => setEditingClient({ ...editingClient, birthDate: e.target.value })} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" 
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Endereço</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={editingClient.address || ''} 
                      onChange={e => setEditingClient({ ...editingClient, address: e.target.value })} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" 
                      placeholder="Rua, Número, Bairro, Cidade..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTRICTION MODAL */}
      {isRestrictionModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                      <div>
                          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                              <ShieldAlert size={24} className="text-red-500" /> Restrições de Clientes
                          </h2>
                          <p className="text-sm text-slate-500">Bloqueie agendamentos para clientes específicos.</p>
                      </div>
                      <button onClick={() => setIsRestrictionModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-gray-50 rounded-full"><X size={24}/></button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                      {/* Left: Create Form */}
                      <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-gray-100 flex flex-col gap-4 overflow-y-auto">
                          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Nova Restrição</h3>
                          
                          <form onSubmit={handleSaveRestriction} className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
                                  <select 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    value={restrictionForm.clientId}
                                    onChange={e => setRestrictionForm({...restrictionForm, clientId: e.target.value})}
                                  >
                                      <option value="">Selecione...</option>
                                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                                  <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    value={restrictionForm.type}
                                    onChange={e => setRestrictionForm({...restrictionForm, type: e.target.value as any})}
                                  >
                                      <option value="BLOCK_PROFESSIONAL">Bloquear Profissional Específico</option>
                                      {/* Future: <option value="BLOCK_ALL">Bloquear Todos (Lista Negra)</option> */}
                                  </select>
                              </div>

                              {restrictionForm.type === 'BLOCK_PROFESSIONAL' && (
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Profissional</label>
                                      <select 
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                        value={restrictionForm.professionalId}
                                        onChange={e => setRestrictionForm({...restrictionForm, professionalId: e.target.value})}
                                      >
                                          <option value="">Selecione...</option>
                                          {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                  </div>
                              )}

                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Observação</label>
                                  <textarea 
                                    required
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                    placeholder="Motivo do bloqueio..."
                                    value={restrictionForm.reason}
                                    onChange={e => setRestrictionForm({...restrictionForm, reason: e.target.value})}
                                  />
                              </div>

                              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors text-sm shadow-sm">
                                  Criar Bloqueio
                              </button>
                          </form>
                      </div>

                      {/* Right: List */}
                      <div className="flex-1 p-6 overflow-y-auto bg-white">
                          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-4">Bloqueios Ativos</h3>
                          
                          {restrictions.length === 0 ? (
                              <div className="text-center py-10 text-slate-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                  <Lock size={32} className="mx-auto mb-2 opacity-20" />
                                  <p className="text-sm">Nenhuma restrição cadastrada.</p>
                              </div>
                          ) : (
                              <div className="space-y-3">
                                  {restrictions.map(res => {
                                      const client = clients.find(c => c.id === res.clientId);
                                      const prof = professionals.find(p => p.id === res.professionalId);
                                      
                                      return (
                                          <div key={res.id} className="border border-red-100 bg-red-50/50 rounded-xl p-4 flex justify-between items-start">
                                              <div>
                                                  <div className="flex items-center gap-2 mb-1">
                                                      <span className="font-bold text-slate-800">{client?.name || 'Cliente Desconhecido'}</span>
                                                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">Bloqueado</span>
                                                  </div>
                                                  <div className="text-sm text-slate-600 mb-2">
                                                      {res.type === 'BLOCK_PROFESSIONAL' ? (
                                                          <span className="flex items-center gap-1"><Briefcase size={12}/> Não pode agendar com: <strong>{prof?.name}</strong></span>
                                                      ) : (
                                                          <span>Bloqueado em toda a rede</span>
                                                      )}
                                                  </div>
                                                  <p className="text-xs text-slate-500 italic bg-white/50 p-2 rounded border border-red-100 max-w-md">"{res.reason}"</p>
                                                  <p className="text-[10px] text-slate-400 mt-2">Criado em: {new Date(res.createdAt).toLocaleDateString()}</p>
                                              </div>
                                              <button onClick={() => handleDeleteRestriction(res.id)} className="text-red-400 hover:text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Remover Bloqueio">
                                                  <Trash2 size={18} />
                                              </button>
                                          </div>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedClientHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                 <img src={selectedClientHistory.client.avatarUrl || 'https://via.placeholder.com/64'} className="w-16 h-16 rounded-full border-2 border-indigo-50 shadow-sm" alt="" />
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedClientHistory.client.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail size={12}/> {selectedClientHistory.client.email}</p>
                 </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            {/* Summary Stats Header in Modal */}
            <div className="bg-slate-50 p-4 border-b border-slate-100 grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={18}/></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Investido</p>
                        <p className="text-lg font-bold text-slate-800">R$ {selectedClientHistory.stats.totalSpent.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CheckCircle size={18}/></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Serviço Concluídos</p>
                        <p className="text-lg font-bold text-slate-800">{selectedClientHistory.stats.count}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Histórico de Atendimentos</h3>
              {selectedClientHistory.appointments.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                    <Calendar className="mx-auto mb-3 opacity-20" size={48} />
                    <p className="font-medium">Nenhum histórico encontrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedClientHistory.appointments.map(appt => (
                    <div key={appt.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                      <div className="flex gap-4 items-center">
                        <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${appt.status === 'CONFIRMED' || appt.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' : 'bg-red-50 text-red-500 group-hover:bg-red-100'}`}>
                          {appt.status === 'CONFIRMED' || appt.status === 'COMPLETED' ? <CheckCircle size={22} /> : <X size={22} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {appt.time}</p>
                          <div className="flex items-center gap-2 mt-1">
                             {getStatusBadge(appt.status)}
                             <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                                ID: {appt.id.slice(-5)}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-gray-50 flex sm:flex-col justify-between items-center sm:items-end">
                        <span className="text-xs text-slate-400 sm:hidden">Valor:</span>
                        <span className="font-bold text-slate-900 text-base">R$ {appt.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg"
                >
                    Fechar Histórico
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
