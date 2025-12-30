
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Appointment, Professional, User, Service, Branch } from '../../types';
import { getAppointments, getProfessionals, updateAppointmentStatus, getClients, getServices, getBranches, createAppointment } from '../../services/mockData';
import { Search, Filter, Calendar, User as UserIcon, Clock, CheckCircle, XCircle, SearchIcon, MoreHorizontal, ChevronDown, Check, X, Lock, AlertCircle, Plus, Zap, Building2 } from 'lucide-react';

export const ProfessionalAppointments: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  
  // Data for Squeeze In Modal
  const [clients, setClients] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Squeeze In Modal State
  const [isSqueezeModalOpen, setIsSqueezeModalOpen] = useState(false);
  const [squeezeData, setSqueezeData] = useState({
      clientId: '',
      serviceId: '',
      date: '',
      time: '',
      branchId: ''
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  // Determine branch automatically for squeeze-in
  useEffect(() => {
    if (professional && squeezeData.date) {
        const dateObj = new Date(squeezeData.date + 'T12:00:00');
        const dayOfWeek = dateObj.getDay();
        const schedule = professional.schedule.find(s => s.dayOfWeek === dayOfWeek);
        
        if (schedule && schedule.isActive && schedule.branchId) {
            setSqueezeData(prev => ({ ...prev, branchId: schedule.branchId || '' }));
        } else {
            // Fallback to first branch if not working or explicit
            setSqueezeData(prev => ({ ...prev, branchId: branches[0]?.id || '' }));
        }
    }
  }, [squeezeData.date, professional, branches]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    const [allProfs, allAppts, allClients, allServices, allBranches] = await Promise.all([
      getProfessionals(),
      getAppointments(),
      getClients(),
      getServices(),
      getBranches()
    ]);
    
    setClients(allClients);
    setServices(allServices);
    setBranches(allBranches);

    const myProf = allProfs.find(p => p.userId === user.id);
    if (myProf) {
      setProfessional(myProf);
      const filtered = allAppts.filter(a => a.professionalId === myProf.id);
      setAppointments(filtered.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()));
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    const action = newStatus === 'COMPLETED' ? 'concluir' : 'cancelar';
    if (window.confirm(`Deseja realmente ${action} este atendimento?`)) {
      await updateAppointmentStatus(id, newStatus);
      loadData();
    }
  };

  const handleCreateSqueezeIn = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!professional || !squeezeData.clientId || !squeezeData.serviceId || !squeezeData.date || !squeezeData.time) return;

      const client = clients.find(c => c.id === squeezeData.clientId);
      const service = services.find(s => s.id === squeezeData.serviceId);

      if (client && service) {
          await createAppointment({
              clientId: client.id,
              clientName: client.name,
              professionalId: professional.id,
              serviceId: service.id,
              date: squeezeData.date,
              time: squeezeData.time,
              branchId: squeezeData.branchId,
              price: service.price,
              isSqueezeIn: true // Important
          });
          
          setIsSqueezeModalOpen(false);
          setSqueezeData({ clientId: '', serviceId: '', date: '', time: '', branchId: '' });
          loadData();
      }
  };

  const filtered = appointments.filter(a => {
    const matchesSearch = a.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesDate = !dateFilter || a.date === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { style: string, label: string, icon: React.ReactNode }> = {
      'CONFIRMED': { style: 'bg-green-100 text-green-700 border border-green-200', label: 'Confirmado', icon: <CheckCircle size={12} /> },
      'PENDING': { style: 'bg-yellow-100 text-yellow-700 border border-yellow-200', label: 'Pendente', icon: <Clock size={12} /> },
      'CANCELLED': { style: 'bg-red-100 text-red-700 border border-red-200', label: 'Cancelado', icon: <XCircle size={12} /> },
      'COMPLETED': { style: 'bg-blue-100 text-blue-700 border border-blue-200', label: 'Concluído', icon: <CheckCircle size={12} /> },
      'BLOCKED': { style: 'bg-gray-100 text-gray-500 border border-gray-200', label: 'Bloqueado', icon: <Lock size={12} /> }
    };
    
    const conf = config[status] || { style: 'bg-gray-100 text-gray-700 border border-gray-200', label: status, icon: <AlertCircle size={12} /> };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${conf.style}`}>
        {conf.icon}
        {conf.label}
      </span>
    );
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando seus atendimentos...</div>;
  if (!professional) return <div className="p-8 text-center text-slate-500">Perfil profissional não encontrado.</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = filtered.filter(a => a.date === todayStr);
  const todayRevenue = todayAppts.filter(a => a.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meus Atendimentos</h1>
          <p className="text-slate-500 text-sm">Gerencie o status e visualize seu histórico de serviços.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto items-center">
             <button 
                onClick={() => setIsSqueezeModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 text-sm"
             >
                <Zap size={16} className="fill-white" /> Inserir Encaixe
             </button>
             <div className="flex-1 md:flex-none px-4 py-2 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-green-400 uppercase">Receita Hoje</span>
                <span className="text-sm font-bold text-green-700">R$ {todayRevenue.toFixed(2)}</span>
             </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <SearchIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <select 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os Status</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="COMPLETED">Concluídos</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
          <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={18} />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="date" 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile View */}
        <div className="block lg:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">Nenhum atendimento encontrado com os filtros atuais.</div>
          ) : (
            filtered.map(appt => (
              <div key={appt.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {appt.clientName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-1">
                            {appt.clientName}
                            {appt.isSqueezeIn && <Zap size={12} className="text-amber-500 fill-amber-500" />}
                        </h4>
                        <p className="text-xs text-slate-500">{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {appt.time}</p>
                      </div>
                   </div>
                   {getStatusBadge(appt.status)}
                </div>
                <div className="flex justify-between items-center pt-2">
                   <span className="font-bold text-slate-700">R$ {appt.price.toFixed(2)}</span>
                   <div className="flex gap-2">
                      {appt.status === 'CONFIRMED' && (
                        <>
                          <button onClick={() => handleStatusChange(appt.id, 'COMPLETED')} className="p-2 bg-green-50 text-green-600 rounded-lg" title="Concluir"><Check size={18}/></button>
                          <button onClick={() => handleStatusChange(appt.id, 'CANCELLED')} className="p-2 bg-red-50 text-red-600 rounded-lg" title="Cancelar"><X size={18}/></button>
                        </>
                      )}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <table className="hidden lg:table w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-4">Cliente</th>
              <th className="p-4">Data & Hora</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4">Preço</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 italic">Nenhum atendimento encontrado.</td>
              </tr>
            ) : (
              filtered.map(appt => (
                <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {appt.clientName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                          {appt.clientName}
                          {appt.isSqueezeIn && <span title="Encaixe"><Zap size={14} className="text-amber-500 fill-amber-500" /></span>}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      <Clock size={14} className="ml-2 text-slate-400" />
                      <span className="font-mono">{appt.time}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {getStatusBadge(appt.status)}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    R$ {appt.price.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    {appt.status === 'CONFIRMED' ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                        >
                          <Check size={14} /> Concluir
                        </button>
                        <button 
                          onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          <X size={14} /> Cancelar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Finalizado</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Squeeze In Modal */}
      {isSqueezeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Inserir Encaixe</h2>
                <p className="text-xs text-slate-500">Agendamento sem verificação de choque de horário.</p>
              </div>
              <button onClick={() => setIsSqueezeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={24}/></button>
            </div>

            <form onSubmit={handleCreateSqueezeIn} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Cliente*</label>
                <div className="flex gap-2">
                    <select required value={squeezeData.clientId} onChange={e => setSqueezeData({ ...squeezeData, clientId: e.target.value })} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm">
                        <option value="">Selecione Cliente</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" className="bg-green-500 hover:bg-green-600 text-white px-3 rounded-xl font-bold text-xs flex items-center transition-colors">+ Novo</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Serviço*</label>
                <select required value={squeezeData.serviceId} onChange={e => setSqueezeData({ ...squeezeData, serviceId: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm">
                    <option value="">Selecione um Serviço</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Profissional*</label>
                <input 
                    type="text" 
                    value={professional.name} 
                    disabled 
                    className="w-full px-4 py-2.5 border border-gray-100 bg-gray-50 text-slate-500 rounded-xl outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Data Início*</label>
                    <input required type="date" min={new Date().toISOString().split('T')[0]} value={squeezeData.date} onChange={e => setSqueezeData({ ...squeezeData, date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"/>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Hora*</label>
                    <input required type="time" value={squeezeData.time} onChange={e => setSqueezeData({ ...squeezeData, time: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"/>
                  </div>
              </div>

              {squeezeData.branchId && (
                  <div className="px-4 py-2 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                      <Building2 size={12} />
                      <span className="font-bold">Filial detectada: </span>
                      {branches.find(b => b.id === squeezeData.branchId)?.name || 'N/A'}
                  </div>
              )}

              <p className="text-xs text-red-500 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                  * Este serviço será adicionado como Encaixe. Nos encaixes, não são verificados choques de horário.
              </p>

              <div className="flex gap-2 mt-4">
                  <button type="submit" disabled={!squeezeData.time || !squeezeData.clientId} className="flex-1 text-white py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg transition-all active:scale-[0.98] bg-green-500 hover:bg-green-600 shadow-green-200">Salvar</button>
                  <button type="button" onClick={() => setIsSqueezeModalOpen(false)} className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-gray-50">Fechar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
