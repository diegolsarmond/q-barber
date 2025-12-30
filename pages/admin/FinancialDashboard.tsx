
import React, { useEffect, useState } from 'react';
import { getAppointments, getExpenses, getProfessionals, getCashRegisters, openRegister, getVouchers, saveVoucher } from '../../services/mockData';
import { Appointment, Expense, Professional, CashRegisterSession, Voucher } from '../../types';
import { DollarSign, TrendingUp, TrendingDown, Plus, Calendar, FileText, Search, CreditCard, User, Wallet, Lock, Unlock, BarChart3, Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

type FinancialTab = 'REGISTER' | 'TRANSACTIONS' | 'VOUCHERS' | 'COMMISSIONS' | 'CASHFLOW';

export const FinancialDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinancialTab>('REGISTER');
  
  // Stores
  const [registers, setRegisters] = useState<CashRegisterSession[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Derived State for Current Register
  const todayStr = new Date().toISOString().split('T')[0];
  const currentRegister = registers.find(r => r.date === todayStr && r.status === 'OPEN');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [regs, appts, exps, profs, vouchs] = await Promise.all([
      getCashRegisters(),
      getAppointments(),
      getExpenses(),
      getProfessionals(),
      getVouchers()
    ]);
    setRegisters(regs);
    setAppointments(appts);
    setExpenses(exps);
    setProfessionals(profs);
    setVouchers(vouchs);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão Financeira</h1>
          <p className="text-slate-500 text-sm">Controle de caixa, movimentações e pagamentos.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <TabButton active={activeTab === 'REGISTER'} onClick={() => setActiveTab('REGISTER')} icon={<Wallet size={18} />} label="Frente de Caixa" />
          <TabButton active={activeTab === 'TRANSACTIONS'} onClick={() => setActiveTab('TRANSACTIONS')} icon={<ArrowUpRight size={18} />} label="Entrada / Saída" />
          <TabButton active={activeTab === 'VOUCHERS'} onClick={() => setActiveTab('VOUCHERS')} icon={<Receipt size={18} />} label="Vales" />
          <TabButton active={activeTab === 'COMMISSIONS'} onClick={() => setActiveTab('COMMISSIONS')} icon={<User size={18} />} label="Comissões" />
          <TabButton active={activeTab === 'CASHFLOW'} onClick={() => setActiveTab('CASHFLOW')} icon={<BarChart3 size={18} />} label="Fluxo de Caixa" />
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
          {activeTab === 'REGISTER' && <RegisterTab registers={registers} currentRegister={currentRegister} loadData={loadData} />}
          {activeTab === 'TRANSACTIONS' && <TransactionsTab appointments={appointments} expenses={expenses} />}
          {activeTab === 'VOUCHERS' && <VouchersTab vouchers={vouchers} professionals={professionals} loadData={loadData} />}
          {activeTab === 'COMMISSIONS' && <CommissionsTab appointments={appointments} professionals={professionals} />}
          {activeTab === 'CASHFLOW' && <CashFlowTab appointments={appointments} expenses={expenses} />}
      </div>
    </div>
  );
};

// --- Sub-Components for Tabs ---

const RegisterTab = ({ registers, currentRegister, loadData }: { registers: CashRegisterSession[], currentRegister?: CashRegisterSession, loadData: () => void }) => {
    const [initialValue, setInitialValue] = useState(0);
    const [notes, setNotes] = useState('');

    const handleOpen = async (e: React.FormEvent) => {
        e.preventDefault();
        await openRegister({
            openedAt: new Date().toISOString(),
            initialValue,
            status: 'OPEN',
            openedBy: 'Admin', // In real app, use auth context
            date: new Date().toISOString().split('T')[0],
            notes
        });
        loadData();
    };

    return (
        <div className="p-6">
            {!currentRegister ? (
                <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Unlock size={20} className="text-green-600"/> Abertura de Caixa
                    </h3>
                    <form onSubmit={handleOpen} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                            <input type="date" disabled value={new Date().toISOString().split('T')[0]} className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-100 text-slate-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Inicial*</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                                <input 
                                    type="number" 
                                    required 
                                    min="0" 
                                    step="0.01" 
                                    value={initialValue}
                                    onChange={e => setInitialValue(parseFloat(e.target.value))}
                                    className="w-full pl-10 pr-4 p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" 
                                />
                            </div>
                        </div>
                        <button type="submit" className="bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                            Abrir Caixa
                        </button>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observação</label>
                            <input 
                                type="text" 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" 
                                placeholder="Ex: Fundo de troco"
                            />
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                            <Unlock size={20}/> Caixa Aberto
                        </h3>
                        <p className="text-green-600 text-sm mt-1">Iniciado com <strong>R$ {currentRegister.initialValue.toFixed(2)}</strong> às {new Date(currentRegister.openedAt).toLocaleTimeString()}</p>
                    </div>
                    <button className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm shadow-sm flex items-center gap-2">
                        <Lock size={16} /> Fechar Caixa
                    </button>
                </div>
            )}

            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-slate-400"/> Histórico de Caixas
            </h3>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="p-3 border-b">Data</th>
                            <th className="p-3 border-b">Responsável</th>
                            <th className="p-3 border-b">Status</th>
                            <th className="p-3 border-b text-right">Inicial</th>
                            <th className="p-3 border-b text-right">Final</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-600">
                        {registers.map(reg => (
                            <tr key={reg.id} className="border-b hover:bg-slate-50">
                                <td className="p-3">{new Date(reg.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="p-3">{reg.openedBy}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${reg.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {reg.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                                    </span>
                                </td>
                                <td className="p-3 text-right">R$ {reg.initialValue.toFixed(2)}</td>
                                <td className="p-3 text-right">{reg.finalValue ? `R$ ${reg.finalValue.toFixed(2)}` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TransactionsTab = ({ appointments, expenses }: { appointments: Appointment[], expenses: Expense[] }) => {
    // Merge Data
    const transactions = [
        ...appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED').map(a => ({
            id: a.id,
            date: a.date,
            description: `Serviço: ${a.clientName}`,
            amount: a.price,
            type: 'INCOME',
            category: 'Vendas'
        })),
        ...expenses.map(e => ({
            id: e.id,
            date: e.date,
            description: e.description,
            amount: e.amount,
            type: 'EXPENSE',
            category: e.category
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-bold text-green-600 uppercase">Receitas</p>
                    <p className="text-2xl font-bold text-green-700">R$ {totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase">Despesas</p>
                    <p className="text-2xl font-bold text-red-700">R$ {totalExpense.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Saldo</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>R$ {balance.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-slate-500 uppercase font-bold">
                        <tr>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Descrição</th>
                            <th className="p-4">Categoria</th>
                            <th className="p-4">Data</th>
                            <th className="p-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    {t.type === 'INCOME' ? 
                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">RECEITA</span> : 
                                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-[10px] font-bold">DESPESA</span>
                                    }
                                </td>
                                <td className="p-4 font-medium text-slate-700">{t.description}</td>
                                <td className="p-4 text-slate-500 text-xs uppercase">{t.category}</td>
                                <td className="p-4 text-slate-500">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className={`p-4 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const VouchersTab = ({ vouchers, professionals, loadData }: { vouchers: Voucher[], professionals: Professional[], loadData: () => void }) => {
    const [formData, setFormData] = useState({
        professionalId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        type: 'VALE',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const prof = professionals.find(p => p.id === formData.professionalId);
        if (!prof) return;

        await saveVoucher({
            id: '',
            professionalId: formData.professionalId,
            professionalName: prof.name,
            amount: formData.amount,
            date: formData.date,
            type: formData.type as any,
            description: formData.description
        });
        loadData();
        setFormData(prev => ({ ...prev, amount: 0, description: '' }));
    };

    return (
        <div className="p-6">
            <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4">Novo Vale / Adiantamento</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Profissional*</label>
                        <select required value={formData.professionalId} onChange={e => setFormData({...formData, professionalId: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm">
                            <option value="">Selecione...</option>
                            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor*</label>
                        <input required type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data*</label>
                        <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm">
                            <option value="VALE">Vale (Descontar)</option>
                            <option value="ADIANTAMENTO">Adiantamento</option>
                        </select>
                    </div>
                    <div className="lg:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observação</label>
                        <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm" />
                    </div>
                    <div className="lg:col-span-1">
                        <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-lg hover:bg-slate-900">Salvar</button>
                    </div>
                </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="p-3">Data</th>
                            <th className="p-3">Profissional</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Obs</th>
                            <th className="p-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-600 divide-y divide-gray-100">
                        {vouchers.map(v => (
                            <tr key={v.id}>
                                <td className="p-3">{new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="p-3 font-bold text-slate-800">{v.professionalName}</td>
                                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">{v.type}</span></td>
                                <td className="p-3 text-xs">{v.description}</td>
                                <td className="p-3 text-right font-bold text-red-600">R$ {v.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CommissionsTab = ({ appointments, professionals }: { appointments: Appointment[], professionals: Professional[] }) => {
    // Simple mock calculation: 50% commission for everyone or use data from service if available
    // For demo, we just sum up appointments by professional
    const stats = professionals.map(prof => {
        const profAppts = appointments.filter(a => a.professionalId === prof.id && (a.status === 'COMPLETED' || a.status === 'CONFIRMED'));
        const totalGross = profAppts.reduce((sum, a) => sum + a.price, 0);
        const commissionRate = 0.5; // Mock 50%
        const commissionVal = totalGross * commissionRate;
        
        return {
            id: prof.id,
            name: prof.name,
            count: profAppts.length,
            gross: totalGross,
            commission: commissionVal
        };
    });

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats.map(stat => (
                    <div key={stat.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                {stat.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{stat.name}</h3>
                                <p className="text-xs text-slate-500">{stat.count} serviços realizados</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center py-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Bruto</p>
                                <p className="font-bold text-slate-700">R$ {stat.gross.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Taxas (Est.)</p>
                                <p className="font-bold text-red-400">- R$ 0,00</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">A Pagar</p>
                                <p className="font-bold text-green-600">R$ {stat.commission.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-6 text-xs text-slate-400 bg-gray-50 p-3 rounded-lg">
                <p><strong>Legenda:</strong> Bruto (Valor total dos serviços) | Líquido (A receber após taxas de cartão) | A Pagar (Valor final da comissão).</p>
            </div>
        </div>
    );
};

const CashFlowTab = ({ appointments, expenses }: { appointments: Appointment[], expenses: Expense[] }) => {
    // Generate daily data for chart
    const getData = () => {
        const data: Record<string, any> = {};
        // Mocking last 7 days
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('pt-BR', {weekday: 'short'});
            data[dateStr] = { name: dayLabel, income: 0, expense: 0 };
        }

        appointments.forEach(a => {
            if(data[a.date]) data[a.date].income += a.price;
        });
        expenses.forEach(e => {
            if(data[e.date]) data[e.date].expense += e.amount;
        });

        return Object.values(data);
    };

    const chartData = getData();

    return (
        <div className="p-6">
            <h3 className="font-bold text-slate-800 mb-6">Fluxo Geral (Últimos 7 dias)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="income" name="Entrada" stroke="#22c55e" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                        <Area type="monotone" dataKey="expense" name="Saída" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Helper for Tabs
const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
            active 
            ? 'bg-slate-900 text-white shadow-md' 
            : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
    >
        {icon} {label}
    </button>
);
