
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { getAppointments, getClients, getProducts } from '../../services/mockData';
import { Appointment, User, Product } from '../../types';
import { Download, Filter, Calendar, Users, DollarSign, Package, X } from 'lucide-react';

export const Reports: React.FC = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'geral';

    // Data State
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Filter State
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [appts, users, prods] = await Promise.all([
            getAppointments(),
            getClients(),
            getProducts()
        ]);
        setAppointments(appts);
        setClients(users);
        setProducts(prods);
    };

    // Filter appointments based on date range
    const getFilteredAppointments = () => {
        if (!filterStartDate && !filterEndDate) return appointments;
        return appointments.filter(appt => {
            if (filterStartDate && appt.date < filterStartDate) return false;
            if (filterEndDate && appt.date > filterEndDate) return false;
            return true;
        });
    };

    // Export to CSV
    const handleExport = () => {
        let csvContent = '';
        let filename = '';

        switch (currentTab) {
            case 'geral':
                csvContent = 'Data,Cliente,Serviço,Status,Valor\n' +
                    getFilteredAppointments().map(a =>
                        `${a.date},${a.clientName},${a.serviceId},${a.status},${a.price.toFixed(2)}`
                    ).join('\n');
                filename = 'relatorio_geral.csv';
                break;
            case 'financeiro':
                csvContent = 'Data,Cliente,Valor,Status\n' +
                    getFilteredAppointments().filter(a => a.status !== 'CANCELLED').map(a =>
                        `${a.date},${a.clientName},${a.price.toFixed(2)},${a.status}`
                    ).join('\n');
                filename = 'relatorio_financeiro.csv';
                break;
            case 'estoque':
                csvContent = 'Produto,Marca,Categoria,Quantidade,Estoque Mínimo,Preço\n' +
                    products.map(p =>
                        `${p.name},${p.brand},${p.category},${p.quantity},${p.minStock},${p.price.toFixed(2)}`
                    ).join('\n');
                filename = 'relatorio_estoque.csv';
                break;
            case 'aniversariantes':
                const currentMonth = new Date().getMonth();
                const birthdays = clients.filter(c => {
                    if (!c.birthDate) return false;
                    const month = parseInt(c.birthDate.split('-')[1]) - 1;
                    return month === currentMonth;
                });
                csvContent = 'Nome,Email,Telefone,Data Nascimento\n' +
                    birthdays.map(c =>
                        `${c.name},${c.email},${c.phone || ''},${c.birthDate || ''}`
                    ).join('\n');
                filename = 'aniversariantes.csv';
                break;
            default:
                csvContent = 'Nenhum dado para exportar';
                filename = 'relatorio.csv';
        }

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Clear filters
    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setShowFilterModal(false);
    };

    // --- Render Functions for Tabs ---

    const renderGeral = () => {
        // Group appointments by date
        const data = appointments.reduce((acc, appt) => {
            const date = new Date(appt.date).toLocaleDateString('pt-BR', { weekday: 'short' });
            if (!acc[date]) acc[date] = { name: date, total: 0, confirmed: 0, cancelled: 0 };
            acc[date].total += 1;
            if (appt.status === 'CONFIRMED' || appt.status === 'COMPLETED') acc[date].confirmed += 1;
            if (appt.status === 'CANCELLED') acc[date].cancelled += 1;
            return acc;
        }, {} as any);

        const chartData = Object.values(data).slice(0, 7); // Last 7 days mock

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium">Total de Agendamentos</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{appointments.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium">Taxa de Conclusão</p>
                        <h3 className="text-3xl font-bold text-green-600 mt-2">
                            {((appointments.filter(a => a.status === 'COMPLETED').length / appointments.length) * 100).toFixed(0)}%
                        </h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-slate-500 text-sm font-medium">Cancelamentos</p>
                        <h3 className="text-3xl font-bold text-red-500 mt-2">
                            {appointments.filter(a => a.status === 'CANCELLED').length}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-900 mb-6">Volume de Agendamentos (Últimos Dias)</h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="confirmed" name="Confirmados" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cancelled" name="Cancelados" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderFinanceiro = () => {
        // Mock Financial Data
        const revenueData = [
            { name: 'Seg', income: 1500 },
            { name: 'Ter', income: 2300 },
            { name: 'Qua', income: 1800 },
            { name: 'Qui', income: 2900 },
            { name: 'Sex', income: 3500 },
            { name: 'Sáb', income: 4200 },
        ];

        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <DollarSign className="text-green-600" /> Receita da Semana
                    </h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderEstoque = () => {
        const lowStock = products.filter(p => p.quantity <= p.minStock);
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Package className="text-orange-500" /> Alerta de Estoque Baixo
                        </h4>
                        {lowStock.length === 0 ? (
                            <p className="text-slate-500 text-sm">Estoque saudável.</p>
                        ) : (
                            <div className="space-y-3">
                                {lowStock.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                                            <p className="text-xs text-red-600">Restam: {p.quantity}</p>
                                        </div>
                                        <button
                                            onClick={() => window.location.hash = '#/admin/products'}
                                            className="text-xs font-bold text-red-700 bg-white border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                        >
                                            Repor
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-900 mb-4">Valor em Estoque</h4>
                        <p className="text-4xl font-bold text-slate-800">
                            R$ {products.reduce((acc, p) => acc + (p.costPrice * p.quantity), 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500 mt-2">Baseado no preço de custo</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderAniversariantes = () => {
        const currentMonth = new Date().getMonth();
        const birthdays = clients.filter(c => {
            if (!c.birthDate) return false;
            const month = parseInt(c.birthDate.split('-')[1]) - 1;
            return month === currentMonth;
        });

        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Calendar className="text-pink-500" /> Aniversariantes do Mês
                </h4>

                {birthdays.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Nenhum aniversariante neste mês.</p>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Data</th>
                                <th className="p-4">Contato</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {birthdays.map(client => (
                                <tr key={client.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-900">{client.name}</td>
                                    <td className="p-4 text-pink-600 font-bold">
                                        {new Date(client.birthDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                    </td>
                                    <td className="p-4 text-slate-500">{client.phone || client.email}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => {
                                                const phone = client.phone?.replace(/\D/g, '') || '';
                                                const message = encodeURIComponent(`Olá ${client.name.split(' ')[0]}! 🎂 Feliz Aniversário! Desejamos muita saúde, paz e realizações. Um abraço da equipe!`);
                                                if (phone) {
                                                    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                                                } else {
                                                    alert(`Parabéns enviado para ${client.name}! (Email: ${client.email})`);
                                                }
                                            }}
                                            className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold hover:bg-green-100 transition-colors"
                                        >
                                            Enviar Parabéns
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    const getTitle = () => {
        switch (currentTab) {
            case 'geral': return 'Relatório Geral';
            case 'financeiro': return 'Relatório Financeiro';
            case 'estoque': return 'Relatório de Estoque';
            case 'aniversariantes': return 'Aniversariantes';
            default: return 'Relatórios';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 capitalize">{getTitle()}</h1>
                    <p className="text-slate-500 text-sm">Análise detalhada e dados estratégicos.</p>
                </div>
                <div className="flex gap-2">
                    {(filterStartDate || filterEndDate) && (
                        <span className="flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                            Filtro ativo
                            <button onClick={clearFilters} className="ml-1 hover:text-indigo-900">
                                <X size={14} />
                            </button>
                        </span>
                    )}
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm"
                    >
                        <Filter size={16} /> Filtrar
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm"
                    >
                        <Download size={16} /> Exportar
                    </button>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Filtrar Relatório</h3>
                            <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Data Inicial</label>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Data Final</label>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={clearFilters}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                Limpar
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                            >
                                Aplicar Filtro
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Render */}
            <div className="min-h-[400px]">
                {currentTab === 'geral' && renderGeral()}
                {currentTab === 'financeiro' && renderFinanceiro()}
                {currentTab === 'estoque' && renderEstoque()}
                {currentTab === 'aniversariantes' && renderAniversariantes()}

                {!['geral', 'financeiro', 'estoque', 'aniversariantes'].includes(currentTab) && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-slate-400">Selecione um relatório no menu lateral para visualizar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
