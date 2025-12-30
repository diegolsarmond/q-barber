
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAppointments, getClients, getServices } from '../../services/mockData';
import { Appointment, User, Service } from '../../types';
import { DollarSign, Users, Calendar as CalendarIcon, TrendingUp, ChevronLeft, ChevronRight, Clock, MessageCircle, Cake, UserPlus, ZapOff, ArrowRight, Crown, Scissors, Star, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Mock VIP logic for the dashboard
  const [vipClientIds] = useState<Set<string>>(new Set(['u4']));

  useEffect(() => {
    Promise.all([getAppointments(), getClients(), getServices()]).then(([appts, cls, servs]) => {
      setAppointments(appts);
      setClients(cls);
      setServices(servs);
    });
  }, []);

  // --- Logic Calculation ---

  const totalRevenue = appointments
    .filter(a => a.status !== 'CANCELLED')
    .reduce((sum, a) => sum + a.price, 0);
  
  const totalBookings = appointments.length;
  const activeBookings = appointments.filter(a => a.status === 'CONFIRMED').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const monthDayToday = todayStr.substring(5); // MM-DD

  // Upcoming Appointments
  const upcomingAppointments = appointments
    .filter(a => a.date >= todayStr && a.status === 'CONFIRMED')
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 6);

  // Insights Logic
  const birthdayItems = clients
    .filter(c => c.birthDate?.includes(monthDayToday))
    .map(user => ({ user, label: 'Hoje!' }));

  const newClientsItems = clients.map(c => {
    const userAppts = appointments.filter(a => a.clientId === c.id);
    if (userAppts.length === 1) {
      const appt = userAppts[0];
      const [y, m, d] = appt.date.split('-');
      return { user: c, label: `${d}/${m}` };
    }
    return null;
  }).filter((item): item is { user: User; label: string } => item !== null);

  const inactiveClientsItems = clients.map(c => {
    const userAppts = appointments.filter(a => a.clientId === c.id && a.status === 'COMPLETED');
    if (userAppts.length === 0) return null;

    const lastAppt = userAppts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const diffTime = Math.abs(new Date().getTime() - new Date(lastAppt.date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const [y, m, d] = lastAppt.date.split('-');
      return { user: c, label: `${diffDays}d off` };
    }
    return null;
  }).filter((item): item is { user: User; label: string } => item !== null);

  // Mock Data for Area Chart
  const chartData = [
    { name: 'Seg', bookings: 4, revenue: 140 },
    { name: 'Ter', bookings: 3, revenue: 105 },
    { name: 'Qua', bookings: 2, revenue: 70 },
    { name: 'Qui', bookings: 6, revenue: 210 },
    { name: 'Sex', bookings: 8, revenue: 350 },
    { name: 'Sáb', bookings: 9, revenue: 420 },
    { name: 'Dom', bookings: 5, revenue: 180 },
  ];

  // Calendar Logic
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getAppointmentsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${month}-${dayStr}`;
    return appointments.filter(a => a.date === fullDate && a.status !== 'CANCELLED');
  };

  const renderCalendarDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24 bg-gray-50/30"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayAppts = getAppointmentsForDay(i);
      const isToday = 
        new Date().getDate() === i && 
        new Date().getMonth() === currentDate.getMonth() && 
        new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div key={i} className={`h-20 sm:h-24 p-2 transition-all hover:bg-gray-50 group border-t border-r border-gray-100/50 ${isToday ? 'bg-white shadow-inner' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 group-hover:text-slate-600'}`}>
              {i}
            </span>
            {dayAppts.length > 0 && (
              <div className="flex gap-0.5">
                 {dayAppts.slice(0, 3).map((_, idx) => (
                     <div key={idx} className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                 ))}
                 {dayAppts.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1 mt-1">
            {dayAppts.slice(0, 2).map(appt => (
              <div key={appt.id} className="text-[9px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded truncate border border-slate-100">
                {appt.time} {appt.clientName.split(' ')[0]}
              </div>
            ))}
            {dayAppts.length > 2 && (
                <div className="text-[9px] text-indigo-500 font-bold pl-1">+ {dayAppts.length - 2}</div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const getGreeting = () => {
      const h = new Date().getHours();
      if (h < 12) return 'Bom dia';
      if (h < 18) return 'Boa tarde';
      return 'Boa noite';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider mb-1">
                <Activity size={16} /> Visão Geral
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getGreeting()}, Admin.</h1>
            <p className="text-slate-500">Aqui está o resumo da performance da sua barbearia/clínica hoje.</p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 text-sm font-bold text-slate-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard 
            title="Receita Total" 
            value={`R$ ${totalRevenue.toFixed(0)}`} 
            trend="+12%" 
            trendUp={true}
            icon={<DollarSign size={24} className="text-emerald-600" />} 
            color="emerald" 
        />
        <KpiCard 
            title="Agendamentos" 
            value={totalBookings.toString()} 
            trend="+5%" 
            trendUp={true}
            icon={<CalendarIcon size={24} className="text-indigo-600" />} 
            color="indigo" 
        />
        <KpiCard 
            title="Clientes Ativos" 
            value={activeBookings.toString()} 
            trend="-2%" 
            trendUp={false}
            icon={<Users size={24} className="text-purple-600" />} 
            color="purple" 
        />
        <KpiCard 
            title="Base Total" 
            value={clients.length.toString()} 
            trend="+8%" 
            trendUp={true}
            icon={<Star size={24} className="text-amber-500" />} 
            color="amber" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Charts & Upcoming (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Revenue Chart */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Fluxo de Receita</h2>
                        <p className="text-sm text-slate-400">Desempenho dos últimos 7 dias</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                        <span className="text-xs font-bold text-slate-500">Esta semana</span>
                    </div>
                </div>
                
                <div className="h-[280px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                                dy={10}
                            />
                            <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'}}
                                cursor={{stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5'}}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#6366f1" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                {/* Decorative background blob */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            </div>

            {/* Calendar Section */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="text-indigo-500" size={20}/> Calendário
                    </h2>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                        <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><ChevronLeft size={18} /></button>
                        <span className="font-bold text-slate-700 text-sm px-2 w-24 text-center">
                            {monthNames[currentDate.getMonth()].substring(0,3)} {currentDate.getFullYear()}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"><ChevronRight size={18} /></button>
                    </div>
                </div>
                <div className="border border-gray-100 rounded-2xl overflow-hidden bg-slate-50">
                    <div className="grid grid-cols-7 bg-white border-b border-gray-100">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 bg-slate-50 gap-px">
                        {renderCalendarDays()}
                    </div>
                </div>
            </div>

        </div>

        {/* Right Column: Upcoming & Insights (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Upcoming Appointments Card */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-[500px] relative overflow-hidden">
                <div className="p-6 pb-4 border-b border-gray-50 bg-white sticky top-0 z-10">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-lg font-bold text-slate-900">Agenda Hoje</h2>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            {upcomingAppointments.length}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">Próximos clientes confirmados.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
                    {upcomingAppointments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-50">
                            <Clock size={40} className="text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-500">Agenda livre por enquanto.</p>
                        </div>
                    ) : (
                        upcomingAppointments.map((appt, i) => {
                            const isVIP = vipClientIds.has(appt.clientId);
                            const service = services.find(s => s.id === appt.serviceId);
                            
                            return (
                                <div key={appt.id} className="relative pl-4 group">
                                    {/* Timeline Line */}
                                    {i !== upcomingAppointments.length - 1 && (
                                        <div className="absolute left-[7px] top-8 bottom-[-16px] w-[2px] bg-indigo-100 group-hover:bg-indigo-200 transition-colors"></div>
                                    )}
                                    <div className="absolute left-0 top-3 w-4 h-4 rounded-full border-2 border-white bg-indigo-500 shadow-md ring-2 ring-indigo-50"></div>
                                    
                                    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                {appt.time}
                                            </span>
                                            {isVIP && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                                                {appt.clientName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate leading-tight">{appt.clientName}</p>
                                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                    <Scissors size={10} /> {service?.name || 'Serviço'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <button className="p-4 text-xs font-bold text-center text-indigo-600 bg-white border-t border-gray-50 hover:bg-indigo-50 transition-colors uppercase tracking-widest">
                    Ver Todos
                </button>
            </div>

            {/* Insights Stack */}
            <div className="space-y-4">
                <InsightWidget 
                    title="Aniversariantes" 
                    icon={<Cake size={18} className="text-pink-500"/>} 
                    count={birthdayItems.length}
                    items={birthdayItems}
                    color="pink"
                />
                <InsightWidget 
                    title="Novos Clientes" 
                    icon={<UserPlus size={18} className="text-emerald-500"/>} 
                    count={newClientsItems.length}
                    items={newClientsItems}
                    color="emerald"
                />
                <InsightWidget 
                    title="Inativos > 30d" 
                    icon={<ZapOff size={18} className="text-amber-500"/>} 
                    count={inactiveClientsItems.length}
                    items={inactiveClientsItems}
                    color="amber"
                />
            </div>

        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const KpiCard = ({ title, value, trend, trendUp, icon, color }: any) => {
    const colorClasses: any = {
        emerald: 'bg-emerald-50 text-emerald-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3.5 rounded-2xl ${colorClasses[color]} transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trendUp ? <TrendingUp size={12}/> : <TrendingUp size={12} className="rotate-180"/>}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            </div>
            {/* Decorative bg circle */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${colorClasses[color].split(' ')[0]}`}></div>
        </div>
    );
};

const InsightWidget = ({ title, icon, count, items, color }: any) => {
    const bgColors: any = {
        pink: 'bg-pink-50 border-pink-100 hover:border-pink-200',
        emerald: 'bg-emerald-50 border-emerald-100 hover:border-emerald-200',
        amber: 'bg-amber-50 border-amber-100 hover:border-amber-200',
    };

    return (
        <div className={`p-4 rounded-3xl border transition-all cursor-pointer group ${bgColors[color]} relative`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                        {icon}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{title}</span>
                </div>
                <span className="bg-white px-2.5 py-1 rounded-lg text-xs font-black shadow-sm text-slate-700">
                    {count}
                </span>
            </div>
            {items.length > 0 ? (
                <div className="flex -space-x-2 mt-2 px-1">
                    {items.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="relative group/avatar">
                            <img 
                                src={item.user.avatarUrl} 
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                                alt={item.user.name} 
                            />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                {item.user.name} • {item.label}
                            </div>
                        </div>
                    ))}
                    {items.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                            +{items.length - 4}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-[10px] text-slate-400 font-medium pl-1 mt-1">Sem novidades hoje.</p>
            )}
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={16} className="text-slate-400" />
            </div>
        </div>
    );
};
