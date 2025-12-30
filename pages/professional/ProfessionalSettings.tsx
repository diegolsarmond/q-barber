import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProfessionals, saveProfessional, getServices, getBranches } from '../../services/mockData';
import { Professional, Service, Branch, WorkScheduleItem } from '../../types';
import { Save, User, Calendar, Clock, Briefcase, MapPin, Phone, Mail, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const ProfessionalSettings: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [professional, setProfessional] = useState<Professional | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'services'>('profile');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        const [profs, servs, branchs] = await Promise.all([
            getProfessionals(),
            getServices(),
            getBranches()
        ]);

        // Find professional linked to current user
        const myProf = profs.find(p => p.userId === user?.id);
        if (myProf) {
            setProfessional(myProf);
        }
        setServices(servs);
        setBranches(branchs);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!professional) return;

        setSaving(true);
        try {
            await saveProfessional(professional);
            addNotification({
                title: 'Configurações Salvas',
                message: 'Suas configurações foram atualizadas com sucesso!',
                type: 'success'
            });
        } catch (error) {
            addNotification({
                title: 'Erro',
                message: 'Não foi possível salvar as configurações.',
                type: 'error'
            });
        }
        setSaving(false);
    };

    const updateField = (field: keyof Professional, value: any) => {
        if (!professional) return;
        setProfessional({ ...professional, [field]: value });
    };

    const toggleSpecialty = (serviceId: string) => {
        if (!professional) return;
        const current = professional.specialties || [];
        if (current.includes(serviceId)) {
            updateField('specialties', current.filter(s => s !== serviceId));
        } else {
            updateField('specialties', [...current, serviceId]);
        }
    };

    const updateScheduleDay = (dayIndex: number, field: keyof WorkScheduleItem, value: any) => {
        if (!professional) return;
        const newSchedule = [...professional.schedule];
        const daySchedule = newSchedule.find(s => s.dayOfWeek === dayIndex);
        if (daySchedule) {
            (daySchedule as any)[field] = value;
            updateField('schedule', newSchedule);
        }
    };

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!professional) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <AlertCircle size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Perfil não encontrado</h2>
                <p className="text-slate-500 mt-2">Seu usuário não está vinculado a um profissional.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Minhas Configurações</h1>
                    <p className="text-slate-500 text-sm">Gerencie seu perfil, agenda e serviços.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100 bg-slate-50">
                    <TabButton
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                        icon={<User size={16} />}
                        label="Perfil"
                    />
                    <TabButton
                        active={activeTab === 'schedule'}
                        onClick={() => setActiveTab('schedule')}
                        icon={<Calendar size={16} />}
                        label="Agenda"
                    />
                    <TabButton
                        active={activeTab === 'services'}
                        onClick={() => setActiveTab('services')}
                        icon={<Briefcase size={16} />}
                        label="Serviços"
                    />
                </div>

                <div className="p-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 mb-8">
                                <img
                                    src={professional.avatarUrl}
                                    alt={professional.name}
                                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                                />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{professional.name}</h2>
                                    <p className="text-slate-500">{professional.nickname || 'Sem apelido'}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={`text-lg ${i < professional.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                                        ))}
                                        <span className="text-sm text-slate-500 ml-1">({professional.rating})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={professional.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Apelido</label>
                                    <input
                                        type="text"
                                        value={professional.nickname || ''}
                                        onChange={(e) => updateField('nickname', e.target.value)}
                                        placeholder="Como você gostaria de ser chamado"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        <Mail size={14} className="inline mr-1" /> E-mail
                                    </label>
                                    <input
                                        type="email"
                                        value={professional.email || ''}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        <Phone size={14} className="inline mr-1" /> Celular
                                    </label>
                                    <input
                                        type="text"
                                        value={professional.mobilePhone || ''}
                                        onChange={(e) => updateField('mobilePhone', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Biografia</label>
                                    <textarea
                                        value={professional.bio}
                                        onChange={(e) => updateField('bio', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Fale um pouco sobre você e sua experiência..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-6 pt-4 border-t border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={professional.availableInApp !== false}
                                        onChange={(e) => updateField('availableInApp', e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">Disponível para agendamento online</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={professional.availableInPresentation !== false}
                                        onChange={(e) => updateField('availableInPresentation', e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">Exibir no site</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 mb-6">Configure seus horários de trabalho para cada dia da semana.</p>

                            {dayNames.map((dayName, index) => {
                                const daySchedule = professional.schedule.find(s => s.dayOfWeek === index);
                                if (!daySchedule) return null;

                                const branch = branches.find(b => b.id === daySchedule.branchId);

                                return (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl border transition-all ${daySchedule.isActive
                                                ? 'bg-white border-gray-200'
                                                : 'bg-slate-50 border-slate-100 opacity-60'
                                            }`}
                                    >
                                        <div className="flex flex-wrap items-center gap-4">
                                            <button
                                                onClick={() => updateScheduleDay(index, 'isActive', !daySchedule.isActive)}
                                                className="flex items-center gap-2 min-w-[120px]"
                                            >
                                                {daySchedule.isActive
                                                    ? <CheckSquare size={20} className="text-indigo-600" />
                                                    : <Square size={20} className="text-slate-400" />
                                                }
                                                <span className={`font-bold ${daySchedule.isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                                    {dayName}
                                                </span>
                                            </button>

                                            {daySchedule.isActive && (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-slate-400" />
                                                        <input
                                                            type="time"
                                                            value={daySchedule.startTime}
                                                            onChange={(e) => updateScheduleDay(index, 'startTime', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        />
                                                        <span className="text-slate-400">às</span>
                                                        <input
                                                            type="time"
                                                            value={daySchedule.endTime}
                                                            onChange={(e) => updateScheduleDay(index, 'endTime', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <MapPin size={14} className="text-slate-400" />
                                                        <select
                                                            value={daySchedule.branchId || ''}
                                                            onChange={(e) => updateScheduleDay(index, 'branchId', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                                                        >
                                                            {branches.map(b => (
                                                                <option key={b.id} value={b.id}>{b.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 mb-6">Selecione os serviços que você oferece.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {services.map(service => {
                                    const isSelected = professional.specialties.includes(service.id);

                                    return (
                                        <button
                                            key={service.id}
                                            onClick={() => toggleSpecialty(service.id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${isSelected
                                                    ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500'
                                                    : 'bg-white border-gray-200 hover:border-indigo-200'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                                                    {service.name}
                                                </span>
                                                {isSelected
                                                    ? <CheckSquare size={20} className="text-indigo-600 shrink-0" />
                                                    : <Square size={20} className="text-slate-300 shrink-0" />
                                                }
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">{service.description}</p>
                                            <div className="flex items-center gap-3 mt-3 text-xs">
                                                <span className="text-slate-400">{service.durationMinutes}min</span>
                                                <span className="font-bold text-emerald-600">R$ {service.price.toFixed(2)}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${active
                ? 'text-indigo-600 border-indigo-600 bg-white'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/50'
            }`}
    >
        {icon}
        {label}
    </button>
);
