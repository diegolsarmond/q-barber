
import React, { useEffect, useState } from 'react';
import { Appointment, Professional, User, Service, ClientSubscription, Branch } from '../../types';
import { getAppointments, getProfessionals, cancelAppointment, getClients, getServices, getAvailableSlots, createAppointment, SUBSCRIPTION_PLANS, getBranches } from '../../services/mockData';
import { Search, Filter, Calendar as CalendarIcon, User as UserIcon, Briefcase, XCircle, CheckCircle, Clock, LayoutGrid, List, ChevronLeft, ChevronRight, MoreHorizontal, Plus, X, Scissors, Sun, Sunset, Moon, FilterX, Crown, ShieldCheck, Tag, Building2, Lock, AlertTriangle, Zap, CalendarX } from 'lucide-react';

export const AppointmentsList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [vipClientIds, setVipClientIds] = useState<Set<string>>(new Set(['u4']));

  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper data and functions for calendar navigation
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Filter States
  const [filterDate, setFilterDate] = useState('');
  const [filterProfId, setFilterProfId] = useState('');
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterClientName, setFilterClientName] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // New Appointment/Block Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'APPOINTMENT' | 'BLOCK' | 'SQUEEZE_IN' | 'DAY_CLOSE'>('APPOINTMENT'); 
  const [newApptData, setNewApptData] = useState({
    clientId: '',
    professionalId: '',
    serviceId: '',
    branchId: '',
    date: '',
    time: '',
    endTime: '', // For blocks
    reason: ''   // For blocks
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, filterDate, filterProfId, filterClientName, filterStatus, filterBranchId]);

  useEffect(() => {
    if (filterDate && viewMode === 'calendar') {
      const selectedDate = new Date(filterDate + 'T12:00:00');
      if (selectedDate.getMonth() !== currentMonth.getMonth() || selectedDate.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      }
    }
  }, [filterDate, viewMode]);

  useEffect(() => {
    const { professionalId, serviceId, date } = newApptData;
    // Only fetch slots for regular appointments, not for squeeze-ins or blocks
    if (modalType === 'APPOINTMENT' && professionalId && serviceId && date) {
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [newApptData.professionalId, newApptData.serviceId, newApptData.date, modalType]);

  // Effect to set branch automatically based on professional's schedule for the selected date
  useEffect(() => {
    if (newApptData.professionalId && newApptData.date) {
        const prof = professionals.find(p => p.id === newApptData.professionalId);
        if (prof) {
            const dateObj = new Date(newApptData.date + 'T12:00:00');
            const dayOfWeek = dateObj.getDay();
            const schedule = prof.schedule.find(s => s.dayOfWeek === dayOfWeek);
            
            if (schedule && schedule.isActive && schedule.branchId) {
                setNewApptData(prev => ({ ...prev, branchId: schedule.branchId || '' }));
            } else {
                setNewApptData(prev => ({ ...prev, branchId: '' })); // Not working that day or no branch
            }
        }
    }
  }, [newApptData.professionalId, newApptData.date, professionals]);

  const loadData = async () => {
    setLoading(true);
    const [allAppts, allProfs, allClients, allServices, allBranches] = await Promise.all([
      getAppointments(),
      getProfessionals(),
      getClients(),
      getServices(),
      getBranches()
    ]);
    
    const sorted = allAppts.sort((a, b) => {
      return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
    });
    
    setAppointments(sorted);
    setProfessionals(allProfs);
    setClients(allClients);
    setServices(allServices);
    setBranches(allBranches);
    setLoading(false);
  };

  const fetchSlots = async () => {
    const { professionalId, serviceId, date } = newApptData;
    const service = services.find(s => s.id === serviceId);
    
    const prof = professionals.find(p => p.id === professionalId);
    let branchId = '';
    if (prof) {
        const d = new Date(date + 'T12:00:00');
        const daySchedule = prof.schedule.find(s => s.dayOfWeek === d.getDay());
        if (daySchedule && daySchedule.isActive && daySchedule.branchId) {
            branchId = daySchedule.branchId;
        }
    }

    if (!service || !branchId) {
        setAvailableSlots([]);
        return;
    }

    setIsSlotsLoading(true);
    const slots = await getAvailableSlots(professionalId, date, service.durationMinutes, branchId);
    setAvailableSlots(slots);
    setIsSlotsLoading(false);
  };

  const applyFilters = () => {
    let result = appointments;
    
    if (filterDate) {
      result = result.filter(a => a.date === filterDate);
    }
    
    if (filterProfId) {
      result = result.filter(a => a.professionalId === filterProfId);
    }

    if (filterBranchId) {
        result = result.filter(a => a.branchId === filterBranchId);
    }
    
    if (filterClientName) {
      const search = filterClientName.toLowerCase();
      result = result.filter(a => a.clientName.toLowerCase().includes(search));
    }
    
    if (filterStatus !== 'ALL') {
      result = result.filter(a => a.status === filterStatus);
    }
    
    setFilteredAppointments(result);
  };

  const handleCancel = async (id: string, isBlock: boolean = false) => {
    const msg = isBlock ? 'Deseja desbloquear este horário?' : 'Tem certeza que deseja cancelar este agendamento?';
    if (window.confirm(msg)) {
      await cancelAppointment(id);
      loadData();
    }
  };

  // Helper functions for time calculation (needed for blocking)
  function parseTime(t: string): number {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function formatTime(m: number): string {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalType === 'DAY_CLOSE') {
        const { date, reason } = newApptData;
        if (!date) return;

        if (window.confirm(`Confirma o fechamento da agenda para o dia ${new Date(date + 'T12:00:00').toLocaleDateString()}? Isso bloqueará todos os profissionais.`)) {
            setLoading(true);
            for (const prof of professionals) {
                 await createAppointment({
                    clientId: 'SYSTEM_BLOCK',
                    clientName: 'Fechamento de Agenda',
                    professionalId: prof.id,
                    serviceId: 'BLOCK',
                    branchId: branches[0]?.id || 'b1',
                    date: date,
                    time: '00:00', // Marker for full day block
                    price: 0,
                    notes: reason || 'Fechamento'
                });
                
                // Hack to force status to BLOCKED since mock createAppointment defaults to CONFIRMED
                const updatedAppts = await getAppointments();
                const lastAppt = updatedAppts[updatedAppts.length - 1];
                if (lastAppt.clientName === 'Fechamento de Agenda') {
                    lastAppt.status = 'BLOCKED';
                }
            }
            setLoading(false);
        }

    } else if (modalType === 'BLOCK') {
        // Handle Block Logic
        const { professionalId, date, time, endTime, branchId, reason } = newApptData;
        if (!professionalId || !date || !time || !endTime) return;

        const startMinutes = parseTime(time);
        const endMinutes = parseTime(endTime);

        if (endMinutes <= startMinutes) {
            alert('O horário de fim deve ser posterior ao horário de início.');
            return;
        }

        // Create multiple slots to fill the block
        let current = startMinutes;
        while (current < endMinutes) {
            const timeStr = formatTime(current);
            await createAppointment({
                clientId: 'SYSTEM_BLOCK', // Special ID
                clientName: 'Bloqueio Administrativo',
                professionalId,
                serviceId: 'BLOCK',
                branchId: branchId || (professionals.find(p => p.id === professionalId)?.schedule.find(s => s.branchId)?.branchId || ''),
                date,
                time: timeStr,
                price: 0,
                notes: reason || `Bloqueado (${time} - ${endTime})`
            });
            
            // Hack to force status to BLOCKED since mock createAppointment defaults to CONFIRMED
            const updatedAppts = await getAppointments();
            const lastAppt = updatedAppts[updatedAppts.length - 1];
            if (lastAppt.clientName === 'Bloqueio Administrativo') {
                lastAppt.status = 'BLOCKED';
            }
            
            current += 30; // 30 min slots
        }

    } else {
        // Handle Regular Appointment Logic OR Squeeze In
        const { clientId, professionalId, serviceId, date, time, branchId } = newApptData;
        if (!clientId || !professionalId || !serviceId || !date || !time) return;

        const client = clients.find(c => c.id === clientId);
        const service = services.find(s => s.id === serviceId);

        // For regular appointment, branch is mandatory. For squeeze in, we can try to infer or fallback.
        if (!branchId && modalType === 'APPOINTMENT') {
            alert("O profissional não possui agenda configurada ou filial definida para esta data.");
            return;
        }

        // Use selected branch or first available for squeeze in fallback
        const finalBranchId = branchId || branches[0]?.id;

        if (client && service) {
            await createAppointment({
                clientId,
                clientName: client.name,
                professionalId,
                serviceId,
                date,
                time,
                branchId: finalBranchId,
                price: service.price,
                isSqueezeIn: modalType === 'SQUEEZE_IN'
            });
        }
    }

    setIsModalOpen(false);
    setNewApptData({ clientId: '', professionalId: '', serviceId: '', branchId: '', date: '', time: '', endTime: '', reason: '' });
    loadData();
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterProfId('');
    setFilterBranchId('');
    setFilterClientName('');
    setFilterStatus('ALL');
  };

  const setFilterToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilterDate(today);
  };

  const groupSlots = (slots: string[]) => {
    const morning = slots.filter(t => parseInt(t.split(':')[0]) < 12);
    const afternoon = slots.filter(t => {
      const h = parseInt(t.split(':')[0]);
      return h >= 12 && h < 18;
    });
    const evening = slots.filter(t => parseInt(t.split(':')[0]) >= 18);
    return { morning, afternoon, evening };
  };

  const renderSlotGroup = (title: string, icon: React.ReactNode, slots: string[]) => {
    if (slots.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">{icon} {title}</div>
        <div className="grid grid-cols-4 gap-2">
          {slots.map(time => (
            <button key={time} type="button" onClick={() => setNewApptData({ ...newApptData, time })} className={`py-1.5 text-xs font-medium rounded border transition-all ${newApptData.time === time ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 hover:border-indigo-400 bg-white'}`}>{time}</button>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] md:min-h-[120px] bg-gray-50/30 border-b border-r border-gray-100"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayAppts = filteredAppointments.filter(a => a.date === fullDate);
      const isToday = new Date().toISOString().split('T')[0] === fullDate;
      const isSelected = filterDate === fullDate;

      days.push(
        <div key={i} className={`min-h-[100px] md:min-h-[120px] p-1 md:p-2 border-b border-r border-gray-100 relative transition-all hover:bg-gray-50 ${isToday ? 'bg-indigo-50/20' : isSelected ? 'bg-amber-50/40' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : isSelected ? 'bg-amber-500 text-white' : 'text-slate-700'}`}>{i}</span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[70px] md:max-h-[85px] custom-scrollbar">
            {dayAppts.map(appt => {
                const isBlock = appt.status === 'BLOCKED';
                return (
                    <div 
                        key={appt.id} 
                        className={`text-[8px] md:text-[10px] p-1 rounded border-l-2 truncate cursor-pointer 
                        ${isBlock 
                            ? 'bg-gray-100 border-gray-400 text-gray-500 font-medium' 
                            : appt.status === 'CONFIRMED' 
                                ? 'bg-green-50 border-green-500 text-green-800' 
                                : appt.status === 'CANCELLED' 
                                    ? 'bg-red-50 border-red-400 text-red-800 opacity-60' 
                                    : 'bg-blue-50 border-blue-500 text-blue-800'
                        }`} 
                        onClick={() => appt.status !== 'CANCELLED' && handleCancel(appt.id, isBlock)}
                        style={isBlock ? {backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)'} : {}}
                        title={isBlock ? appt.notes : `${appt.clientName} - ${appt.time}`}
                    >
                        {appt.isSqueezeIn && <Zap size={8} className="inline mr-0.5 text-amber-500 fill-amber-500" />}
                        <span className="font-bold">{appt.time}</span> {isBlock ? <Lock size={8} className="inline ml-1"/> : appt.clientName.split(' ')[0]}
                    </div>
                );
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, {style: string, icon: React.ReactNode, label: string}> = { 
        'CONFIRMED': {style: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={10} />, label: 'Confirmado'}, 
        'PENDING': {style: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={10} />, label: 'Pendente'}, 
        'CANCELLED': {style: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={10} />, label: 'Cancelado'}, 
        'COMPLETED': {style: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle size={10} />, label: 'Concluído'},
        'BLOCKED': {style: 'bg-gray-100 text-gray-500 border-gray-300', icon: <Lock size={10} />, label: 'Bloqueado'}
    };
    
    const config = styles[status] || styles['PENDING'];

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border flex items-center gap-1 w-fit ${config.style}`}>
            {config.icon} {config.label}
        </span>
    );
  };

  const { morning, afternoon, evening } = groupSlots(availableSlots);

  const getModalTitle = () => {
      switch(modalType) {
          case 'APPOINTMENT': return 'Novo Agendamento';
          case 'BLOCK': return 'Bloquear Agenda';
          case 'SQUEEZE_IN': return 'Inserir Encaixe';
          case 'DAY_CLOSE': return 'Fechamento de Agenda';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Agenda Geral</h1><p className="text-slate-500 text-sm">Visualize e gerencie todos os horários da equipe.</p></div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button onClick={() => { setIsModalOpen(true); setModalType('DAY_CLOSE'); }} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-transform active:scale-95 text-sm"><CalendarX size={16}/> Fechar Dia</button>
          <button onClick={() => { setIsModalOpen(true); setModalType('SQUEEZE_IN'); }} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-200 transition-transform active:scale-95 text-sm"><Zap size={16}/> Encaixe</button>
          <button onClick={() => { setIsModalOpen(true); setModalType('APPOINTMENT'); }} className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-transform active:scale-95 text-sm"><Plus size={18}/> Novo</button>
          <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-gray-50'}`}><LayoutGrid size={18}/></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-gray-50'}`}><List size={18}/></button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Filter size={14} /> Filtros de Visualização
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Filter */}
          <div className="relative group">
            <CalendarIcon className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Branch Filter */}
          <div className="relative group">
            <Building2 className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <select 
                value={filterBranchId} 
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white"
            >
                <option value="">Todas Filiais</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Professional Filter */}
          <div className="relative group">
            <Briefcase className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <select 
                value={filterProfId} 
                onChange={(e) => setFilterProfId(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white"
            >
                <option value="">Todos Profissionais</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <CheckCircle className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white"
            >
                <option value="ALL">Todos os Status</option>
                <option value="CONFIRMED">Confirmados</option>
                <option value="COMPLETED">Concluídos</option>
                <option value="PENDING">Pendentes</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="BLOCKED">Bloqueios</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button 
                onClick={setFilterToday} 
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors uppercase tracking-wider"
            >
                Hoje
            </button>
            <button 
                onClick={clearFilters} 
                className="p-2.5 border border-gray-200 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                title="Limpar Filtros"
            >
                <FilterX size={20} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          {/* List for Mobile */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredAppointments.length === 0 ? <div className="p-12 text-center text-slate-400 italic">Nenhum agendamento encontrado com os filtros atuais.</div> : filteredAppointments.map(appt => {
              const isVIP = vipClientIds.has(appt.clientId);
              const serviceObj = services.find(s => s.id === appt.serviceId);
              const isBlock = appt.status === 'BLOCKED';
              
              return (
              <div key={appt.id} className={`p-4 space-y-3 ${isBlock ? 'bg-gray-50' : ''}`}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${isBlock ? 'bg-gray-200 text-gray-500' : isVIP ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'} rounded-lg flex items-center justify-center font-bold text-xs`}>
                          {isBlock ? <Lock size={14} /> : isVIP ? <Crown size={14} /> : <UserIcon size={14} />}
                        </div>
                        <div className="font-extrabold text-slate-900">{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {appt.time}</div>
                    </div>
                    {getStatusBadge(appt.status)}
                </div>
                <div className="text-sm text-slate-600 flex flex-col pl-10 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-base ${isBlock ? 'text-gray-500' : 'text-slate-900'}`}>{appt.clientName}</span>
                      {isVIP && !isBlock && <span title="Assinante VIP"><Crown size={14} className="text-amber-500 fill-amber-500" /></span>}
                      {appt.isSqueezeIn && <span className="text-[10px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-100 flex items-center gap-0.5"><Zap size={10} className="fill-amber-500"/> Encaixe</span>}
                    </div>
                    {!isBlock && (
                        <div className="flex items-center gap-2 font-bold text-indigo-600">
                        <Scissors size={14} />
                        <span>{serviceObj?.name || 'Serviço'}</span>
                        </div>
                    )}
                    {isBlock && <p className="text-xs text-gray-500 italic">{appt.notes}</p>}
                    {!isBlock && <span className="text-xs text-slate-400">Preço: R$ {appt.price.toFixed(2)}</span>}
                </div>
                {appt.status !== 'CANCELLED' && (
                    <div className="flex gap-2 pl-10">
                         <button onClick={() => handleCancel(appt.id, isBlock)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${isBlock ? 'text-slate-600 bg-slate-200 hover:bg-slate-300' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}>
                             {isBlock ? 'Desbloquear' : 'Cancelar'}
                         </button>
                    </div>
                )}
              </div>
            )})}
          </div>
          {/* Table for Desktop */}
          <table className="hidden md:table w-full text-left">
            <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <th className="p-4">Data/Hora</th>
                    <th className="p-4">Cliente/Motivo</th>
                    <th className="p-4">Unidade</th>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {filteredAppointments.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 italic">Sem resultados para os filtros aplicados.</td>
                    </tr>
                ) : (
                    filteredAppointments.map(appt => {
                        const isVIP = vipClientIds.has(appt.clientId);
                        const serviceObj = services.find(s => s.id === appt.serviceId);
                        const branchObj = branches.find(b => b.id === appt.branchId);
                        const isBlock = appt.status === 'BLOCKED';

                        return (
                        <tr key={appt.id} className={`hover:bg-slate-50/50 transition-colors group ${isBlock ? 'bg-gray-50/50' : ''}`}>
                            <td className="p-4">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <CalendarIcon size={14} className="text-slate-400" />
                                    <span className="font-medium">{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                    <span className="text-slate-300 mx-1">|</span>
                                    <span className="font-bold text-indigo-600">{appt.time}</span>
                                    {appt.isSqueezeIn && <span title="Encaixe" className="ml-1"><Zap size={14} className="text-amber-500 fill-amber-500"/></span>}
                                </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${isBlock ? 'bg-gray-200 text-gray-500' : isVIP ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {isBlock ? <Lock size={14} /> : isVIP ? <Crown size={14} className="fill-amber-500" /> : <UserIcon size={14} />}
                                </div>
                                <div>
                                    <span className={`font-black text-base ${isBlock ? 'text-gray-600' : 'text-slate-900'}`}>{appt.clientName}</span>
                                    {isBlock && <p className="text-[10px] text-gray-400 italic leading-none mt-0.5">{appt.notes}</p>}
                                </div>
                                {isVIP && !isBlock && <span title="Assinante VIP"><Crown size={14} className="text-amber-500 fill-amber-500" /></span>}
                              </div>
                            </td>
                            <td className="p-4 text-xs text-slate-500">
                                {branchObj?.name || 'N/A'}
                            </td>
                            <td className="p-4">
                              {isBlock ? (
                                  <span className="text-xs text-gray-400 italic">N/A</span>
                              ) : (
                                <div className="flex items-center gap-2 font-bold text-indigo-700">
                                    <Tag size={14} className="text-indigo-400" />
                                    <span>{serviceObj?.name || 'Serviço'}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4">{getStatusBadge(appt.status)}</td>
                            <td className="p-4 font-bold text-slate-600">{isBlock ? '-' : `R$ ${appt.price.toFixed(2)}`}</td>
                            <td className="p-4 text-right">
                                {appt.status !== 'CANCELLED' && (
                                    <button 
                                        onClick={() => handleCancel(appt.id, isBlock)} 
                                        className={`${isBlock ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-red-400 hover:text-red-600 hover:bg-red-50'} p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100`}
                                        title={isBlock ? "Desbloquear Horário" : "Cancelar Agendamento"}
                                    >
                                        <XCircle size={18}/>
                                    </button>
                                )}
                            </td>
                        </tr>
                    )})
                )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-xl font-extrabold text-slate-900">{monthNames[currentMonth.getMonth()]} <span className="text-slate-400 font-normal">{currentMonth.getFullYear()}</span></h2>
            <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl text-slate-500 transition-colors"><ChevronLeft size={20}/></button>
                <button onClick={() => { setCurrentMonth(new Date()); setFilterDate(''); }} className="px-4 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors uppercase tracking-wider">Mês Atual</button>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl text-slate-500 transition-colors"><ChevronRight size={20}/></button>
            </div>
          </div>
          <div className="grid grid-cols-7 bg-slate-50/80 border-b border-gray-100 text-[10px] md:text-xs font-bold text-slate-400 uppercase text-center py-3 tracking-widest">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 border-l border-gray-100 bg-gray-200 gap-px">{renderCalendar()}</div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                    {getModalTitle()}
                </h2>
                <p className="text-xs text-slate-500">
                    {modalType === 'APPOINTMENT' ? 'Manual (via Administração)' : modalType === 'BLOCK' ? 'Indisponibilidade do Profissional' : modalType === 'DAY_CLOSE' ? 'Bloquear dia para toda a equipe' : 'Agendamento sem verificação de choque'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={24}/></button>
            </div>

            {/* Toggle Type - Only show if NOT DAY_CLOSE to avoid clutter */}
            {modalType !== 'DAY_CLOSE' && (
                <div className="px-6 pt-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setModalType('APPOINTMENT')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modalType === 'APPOINTMENT' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Normal
                        </button>
                        <button 
                            onClick={() => setModalType('SQUEEZE_IN')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modalType === 'SQUEEZE_IN' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Encaixe
                        </button>
                        <button 
                            onClick={() => setModalType('BLOCK')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modalType === 'BLOCK' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Bloqueio
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleCreateAction} className="p-6 space-y-5">
              
              {/* --- DAY CLOSE FORM --- */}
              {modalType === 'DAY_CLOSE' && (
                  <>
                    {/* Red Side Label Simulation */}
                    <div className="absolute top-20 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-4 rounded-l-lg shadow-md writing-vertical-lr flex items-center justify-center gap-1">
                        <span>Caixa !</span>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1.5">Descrição</label>
                        <input 
                            type="text" 
                            placeholder="Descricao" 
                            value={newApptData.reason} 
                            onChange={e => setNewApptData({ ...newApptData, reason: e.target.value })} 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-red-500 text-slate-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1.5">Data</label>
                        <div className="relative">
                            <input 
                                required
                                type="date" 
                                value={newApptData.date} 
                                onChange={e => setNewApptData({ ...newApptData, date: e.target.value })} 
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-red-500 text-slate-600"
                            />
                            {/* Calendar Icon overlay to match screenshot style if needed, but native date picker usually suffices */}
                            <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center border-l border-gray-300 pointer-events-none text-slate-500">
                                <CalendarIcon size={18} />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg shadow-md transition-colors mt-2"
                    >
                        Salvar
                    </button>
                  </>
              )}

              {/* --- REGULAR FORMS --- */}
              {modalType !== 'DAY_CLOSE' && (
                  <>
                    {modalType !== 'BLOCK' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Cliente*</label>
                            <div className="flex gap-2">
                                <select required value={newApptData.clientId} onChange={e => setNewApptData({ ...newApptData, clientId: e.target.value })} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                                    <option value="">Selecione Cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button type="button" className="bg-green-500 hover:bg-green-600 text-white px-3 rounded-xl font-bold text-xs flex items-center transition-colors">+ Novo</button>
                            </div>
                        </div>
                    )}

                    {modalType !== 'BLOCK' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Serviço*</label>
                            <select required value={newApptData.serviceId} onChange={e => setNewApptData({ ...newApptData, serviceId: e.target.value, time: '' })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                                <option value="">Selecione um Serviço</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Profissional*</label>
                        <select required value={newApptData.professionalId} onChange={e => setNewApptData({ ...newApptData, professionalId: e.target.value, time: '' })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                            <option value="">Selecione Profissional</option>
                            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Data Início*</label>
                            <input required type="date" min={new Date().toISOString().split('T')[0]} value={newApptData.date} onChange={e => setNewApptData({ ...newApptData, date: e.target.value, time: '' })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"/>
                        </div>
                        
                        {(modalType === 'SQUEEZE_IN' || modalType === 'BLOCK') && (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Hora*</label>
                                <input required type="time" value={newApptData.time} onChange={e => setNewApptData({ ...newApptData, time: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"/>
                            </div>
                        )}
                    </div>

                    {newApptData.professionalId && newApptData.date && (
                        <div className="px-4 py-2 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                            <Building2 size={12} />
                            <span className="font-bold">Filial detectada: </span>
                            {newApptData.branchId ? (
                                branches.find(b => b.id === newApptData.branchId)?.name
                            ) : (
                                <span className="text-red-500">Nenhuma (Profissional não atende nesta data)</span>
                            )}
                        </div>
                    )}

                    {modalType === 'SQUEEZE_IN' && (
                        <p className="text-xs text-red-500 font-medium">
                            * Este serviço será adicionado como Encaixe. Nos encaixes, não são verificados choques de horário.
                        </p>
                    )}

                    {modalType === 'BLOCK' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-start-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Fim</label>
                                    <input required type="time" value={newApptData.endTime} onChange={e => setNewApptData({ ...newApptData, endTime: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Motivo</label>
                                <input type="text" placeholder="Ex: Almoço, Médico, Folga" value={newApptData.reason} onChange={e => setNewApptData({ ...newApptData, reason: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"/>
                            </div>
                        </>
                    )}

                    {modalType === 'APPOINTMENT' && (
                        <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Horários Disponíveis</label>
                            {isSlotsLoading ? (
                                <div className="text-center py-4 text-indigo-500 animate-pulse text-xs">Verificando agenda...</div>
                            ) : (
                                <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {renderSlotGroup('Manhã', <Sun size={12} className="text-amber-500" />, morning)}
                                    {renderSlotGroup('Tarde', <Sunset size={12} className="text-orange-500" />, afternoon)}
                                    {renderSlotGroup('Noite', <Moon size={12} className="text-indigo-400" />, evening)}
                                    {!newApptData.date && <div className="text-center py-4 text-slate-300 text-xs italic">Selecione uma data para ver horários.</div>}
                                    {newApptData.date && availableSlots.length === 0 && !isSlotsLoading && <div className="text-center py-4 text-red-400 text-xs italic">Nenhum horário disponível para esta seleção.</div>}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button type="submit" disabled={!newApptData.time || (modalType === 'BLOCK' && !newApptData.endTime)} className={`flex-1 text-white py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg transition-all active:scale-[0.98] ${modalType === 'BLOCK' ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-200' : modalType === 'SQUEEZE_IN' ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-green-500 hover:bg-green-600 shadow-green-200'}`}>Salvar</button>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-gray-50">Fechar</button>
                    </div>
                  </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
