import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, getProfessionals, cancelAppointment, createAppointment } from '../../services/mockData';
import { Appointment, Professional } from '../../types';
import { Calendar, Clock, DollarSign, User, CheckCircle, XCircle, Briefcase, LayoutGrid, List, ChevronLeft, ChevronRight, Lock, Plus, X, Sun, Sunset, Moon, AlertCircle } from 'lucide-react';

export const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [professionalData, setProfessionalData] = useState<Professional | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [todayStats, setTodayStats] = useState({ count: 0, revenue: 0 });

  // View Controls
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Block Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockData, setBlockData] = useState({ date: '', startTime: '', endTime: '', reason: '' });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    const allProfs = await getProfessionals();
    const currentProf = allProfs.find(p => p.userId === user.id);
    
    setProfessionalData(currentProf || null);

    if (currentProf) {
        const allAppts = await getAppointments();
        const filtered = allAppts
            .filter(a => a.professionalId === currentProf.id)
            .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        
        setMyAppointments(filtered);

        const today = new Date().toISOString().split('T')[0];
        const todaysAppts = filtered.filter(a => a.date === today && a.status !== 'CANCELLED' && a.status !== 'BLOCKED');
        
        setTodayStats({
            count: todaysAppts.length,
            revenue: todaysAppts.reduce((acc, curr) => acc + curr.price, 0)
        });
    }

    setLoading(false);
  };

  const handleStatusAction = async (id: string, action: 'CANCEL' | 'UNBLOCK') => {
    const confirmMsg = action === 'UNBLOCK' 
      ? 'Deseja desbloquear este horário?' 
      : 'Deseja cancelar este atendimento?';
      
    if (window.confirm(confirmMsg)) {
        await cancelAppointment(id);
        loadDashboardData();
    }
  };

  const handleBlockSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalData || !blockData.date || !blockData.startTime || !blockData.endTime) return;

    const startMinutes = parseTime(blockData.startTime);
    const endMinutes = parseTime(blockData.endTime);

    if (endMinutes <= startMinutes) {
        alert('O horário de fim deve ser posterior ao horário de início.');
        return;
    }

    setLoading(true);

    // Determine branch for the selected date
    const dateObj = new Date(blockData.date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const daySchedule = professionalData.schedule.find(s => s.dayOfWeek === dayOfWeek);
    const branchId = daySchedule?.branchId || professionalData.schedule.find(s => s.branchId)?.branchId || '';

    // Create block entries in 30-minute increments to cover the entire range
    // This ensures existing availability logic detects the entire block as unavailable
    let current = startMinutes;
    while (current < endMinutes) {
        const timeStr = formatTime(current);
        
        await createAppointment({
            clientId: 'SYSTEM_BLOCK',
            clientName: 'Bloqueio de Agenda',
            professionalId: professionalData.id,
            serviceId: 'BLOCK',
            branchId: branchId,
            date: blockData.date,
            time: timeStr,
            price: 0,
            notes: blockData.reason || `Bloqueado (${blockData.startTime} - ${blockData.endTime})`,
        });

        // The mock createAppointment always sets status to CONFIRMED, 
        // so we have to fix it in the mock store (hack for demo purposes)
        const appts = await getAppointments();
        const lastAppt = appts[appts.length - 1];
        if (lastAppt.clientName === 'Bloqueio de Agenda') {
            lastAppt.status = 'BLOCKED';
        }

        current += 30;
    }

    setIsBlockModalOpen(false);
    setBlockData({ date: '', startTime: '', endTime: '', reason: '' });
    await loadDashboardData();
    setLoading(false);
  };

  // Helper: Time to minutes
  function parseTime(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  // Helper: Minutes to HH:mm
  function formatTime(m: number): string {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  // --- Calendar Logic ---
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];

    // Empty slots
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/30 border-b border-r border-gray-100"></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayString = String(i).padStart(2, '0');
      const monthString = String(month + 1).padStart(2, '0');
      const fullDate = `${year}-${monthString}-${dayString}`;
      
      const dayAppts = myAppointments.filter(a => a.date === fullDate && a.status !== 'CANCELLED');
      const isToday = new Date().toISOString().split('T')[0] === fullDate;

      days.push(
        <div key={i} className={`min-h-[100px] p-2 border-b border-r border-gray-100 relative group hover:bg-gray-50 transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
              {i}
            </span>
            {dayAppts.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded-full font-bold">{dayAppts.length}</span>}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayAppts.map(appt => {
               const isBlock = appt.status === 'BLOCKED';
               return (
               <div 
                key={appt.id} 
                className={`text-[9px] p-1 rounded border truncate cursor-pointer ${
                    isBlock 
                    ? 'bg-gray-100 border-gray-300 text-gray-500 font-medium' 
                    : 'bg-blue-50 text-blue-700 border-blue-100'
                }`} 
                style={isBlock ? {backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)'} : {}}
                title={isBlock ? appt.notes : `${appt.time} - ${appt.clientName}`}
                onClick={() => isBlock && handleStatusAction(appt.id, 'UNBLOCK')}
               >
                 <span className="font-bold">{appt.time}</span> {isBlock ? <span className="flex items-center gap-1 inline"><Lock size={8} className="inline"/> Bloqueado</span> : appt.clientName.split(' ')[0]}
               </div>
            )})}
          </div>
        </div>
      );
    }
    return days;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { style: string, label: string, icon: React.ReactNode }> = {
      'CONFIRMED': { style: 'bg-green-100 text-green-700 border border-green-200', label: 'Confirmado', icon: <CheckCircle size={10} /> },
      'PENDING': { style: 'bg-yellow-100 text-yellow-700 border border-yellow-200', label: 'Pendente', icon: <Clock size={10} /> },
      'CANCELLED': { style: 'bg-red-100 text-red-700 border border-red-200', label: 'Cancelado', icon: <XCircle size={10} /> },
      'COMPLETED': { style: 'bg-blue-100 text-blue-700 border border-blue-200', label: 'Concluído', icon: <CheckCircle size={10} /> },
      'BLOCKED': { style: 'bg-gray-100 text-gray-500 border border-gray-200', label: 'Bloqueado', icon: <Lock size={10} /> }
    };
    
    const conf = config[status] || { style: 'bg-gray-100 text-gray-700', label: status, icon: <AlertCircle size={10} /> };

    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${conf.style}`}>
        {conf.icon}
        {conf.label}
      </span>
    );
  };

  if (loading && !professionalData) return <div className="p-8 text-center text-slate-500">Carregando sua agenda...</div>;

  if (!professionalData) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
            <Briefcase size={48} className="text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Perfil Profissional Não Encontrado</h2>
            <p className="text-slate-500 max-w-md mt-2">
                Seu usuário tem permissão de acesso, mas não está vinculado a um perfil de Profissional no sistema.
            </p>
        </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAppts = myAppointments.filter(a => a.date >= todayStr && a.status !== 'CANCELLED' && a.status !== 'COMPLETED');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Minha Agenda</h1>
           <p className="text-slate-500 text-sm">Bem-vindo, {professionalData.name}. Gerencie seus atendimentos.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
             {/* Stats Mini Cards */}
            <div className="hidden md:flex gap-4 mr-4">
                <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase font-bold">Hoje</p>
                    <p className="text-lg font-bold text-slate-800">{todayStats.count} <span className="text-xs font-normal">agend.</span></p>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase font-bold">Faturamento</p>
                    <p className="text-lg font-bold text-green-600">R$ {todayStats.revenue.toFixed(0)}</p>
                </div>
            </div>

            {/* Block Button */}
            <button 
                onClick={() => setIsBlockModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md"
            >
                <Lock size={16} /> <span className="hidden sm:inline">Bloquear Horário</span>
            </button>

            {/* View Toggle */}
            <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-gray-50'}`}
                >
                    <LayoutGrid size={18} /> <span className="hidden sm:inline">Calendário</span>
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-gray-50'}`}
                >
                    <List size={18} /> <span className="hidden sm:inline">Lista</span>
                </button>
            </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
           {/* Calendar Controls */}
           <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} />
                {monthNames[currentMonth.getMonth()]} <span className="text-slate-400 font-normal">{currentMonth.getFullYear()}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-slate-600"><ChevronLeft size={20} /></button>
                    <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md">Hoje</button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-slate-600"><ChevronRight size={20} /></button>
                </div>
           </div>
           
           <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 border-l border-gray-100 bg-gray-200 gap-px">
                {renderCalendar()}
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2 space-y-4">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Clock size={20} className="text-indigo-600" />
                    Próximos Atendimentos
                </h2>
                {upcomingAppts.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-slate-400">
                        Nenhum agendamento futuro encontrado.
                    </div>
                ) : (
                    upcomingAppts.map(appt => {
                         const isToday = appt.date === todayStr;
                         const isBlocked = appt.status === 'BLOCKED';
                         
                         return (
                            <div key={appt.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${isBlocked ? 'bg-gray-50 border-gray-200 border-l-4 border-l-gray-400' : isToday ? 'bg-white border-indigo-200 shadow-md border-l-4 border-l-indigo-500' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className={`p-3 rounded-lg text-center min-w-[60px] ${isBlocked ? 'bg-gray-200 text-gray-500' : isToday ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-slate-600'}`}>
                                        {isBlocked ? <Lock size={20} className="mx-auto" /> : <span className="block text-xl font-bold">{appt.time}</span>}
                                        {!isToday && !isBlocked && <span className="text-[10px] uppercase">{new Date(appt.date).toLocaleDateString('pt-BR', {weekday: 'short'})}</span>}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${isBlocked ? 'text-gray-600' : 'text-slate-900'}`}>{appt.clientName}</h3>
                                        <div className="flex items-center gap-2 mt-1 mb-1">
                                            {getStatusBadge(appt.status)}
                                        </div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar size={12}/> {new Date(appt.date).toLocaleDateString('pt-BR')} 
                                            {isBlocked && ` às ${appt.time}`}
                                        </p>
                                        {!isBlocked && <p className="text-xs text-slate-400">Serviço: {appt.serviceId}</p>}
                                        {isBlocked && <p className="text-xs text-slate-400 italic">{appt.notes}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                     {!isBlocked && <span className="font-bold text-slate-700">R$ {appt.price.toFixed(2)}</span>}
                                     <button 
                                        onClick={() => handleStatusAction(appt.id, isBlocked ? 'UNBLOCK' : 'CANCEL')} 
                                        className={`${isBlocked ? 'text-slate-500 hover:bg-slate-100' : 'text-red-500 hover:bg-red-50'} p-2 rounded-lg text-xs font-bold transition-colors`}
                                     >
                                        {isBlocked ? 'Desbloquear' : 'Cancelar'}
                                     </button>
                                </div>
                            </div>
                         );
                    })
                )}
            </div>
            
            {/* History Column */}
             <div>
                <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-slate-400" />
                    Histórico
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-0">
                        {myAppointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.date < todayStr).slice(0, 10).map(appt => (
                             <div key={appt.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-600">{new Date(appt.date).toLocaleDateString('pt-BR')}</span>
                                    {getStatusBadge(appt.status)}
                                </div>
                                <p className="text-sm font-medium text-slate-900">{appt.clientName}</p>
                             </div>
                        ))}
                         {myAppointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.date < todayStr).length === 0 && (
                             <div className="p-6 text-center text-xs text-slate-400">Sem histórico.</div>
                         )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Block Schedule Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lock size={18} className="text-slate-700" />
                Bloquear Agenda
              </h2>
              <button onClick={() => setIsBlockModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleBlockSchedule} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input 
                    required
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={blockData.date}
                    onChange={(e) => setBlockData({ ...blockData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
                    <input 
                        required
                        type="time"
                        value={blockData.startTime}
                        onChange={(e) => setBlockData({ ...blockData, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
                    <input 
                        required
                        type="time"
                        value={blockData.endTime}
                        onChange={(e) => setBlockData({ ...blockData, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (Opcional)</label>
                  <input 
                    type="text"
                    value={blockData.reason}
                    onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
                    placeholder="Ex: Almoço, Médico..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                  />
               </div>

               <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold mt-2 shadow-lg disabled:opacity-50"
               >
                 {loading ? 'Processando...' : 'Confirmar Bloqueio'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};