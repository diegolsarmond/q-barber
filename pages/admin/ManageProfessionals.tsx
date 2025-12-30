
import React, { useEffect, useState, useRef } from 'react';
import { getProfessionals, saveProfessional, deleteProfessional, getServices, getUserById, saveUser, uploadImage, addAuditLog, getBranches, getAccessProfiles } from '../../services/mockData';
import { Professional, Service, WorkScheduleItem, UserRole, Branch, AccessProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, X, Check, Briefcase, Clock, Calendar, Search, Upload, User, Save, Star, Building2, MapPin, Mail, Shield, UserPlus } from 'lucide-react';

const DAYS_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Helper to initialize schedule structure
const createEmptySchedule = (defaultBranchId: string): WorkScheduleItem[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    startTime: '09:00',
    endTime: '18:00',
    isActive: i >= 1 && i <= 5, // Default Mon-Fri
    branchId: i >= 1 && i <= 5 ? defaultBranchId : undefined
  }));
};

type ModalTab = 'details' | 'services' | 'schedule' | 'user' | 'address';

export const ManageProfessionals: React.FC = () => {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]); // New access profiles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [editingProf, setEditingProf] = useState<Partial<Professional> | null>(null);
  const [associatedEmail, setAssociatedEmail] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(''); // New Profile Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Cache of user emails for display in list
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profs, servs, brs, accessProfs] = await Promise.all([getProfessionals(), getServices(), getBranches(), getAccessProfiles()]);
    setProfessionals(profs);
    setServices(servs);
    setBranches(brs);
    setProfiles(accessProfs);

    const emails: Record<string, string> = {};
    for (const p of profs) {
      if (p.userId) {
        const u = await getUserById(p.userId);
        if (u) emails[p.id] = u.email;
      }
    }
    setUserEmails(emails);
  };

  const handleEdit = async (prof: Professional) => {
    setEditingProf(JSON.parse(JSON.stringify(prof)));
    setActiveTab('details');
    
    if (prof.userId) {
      const user = await getUserById(prof.userId);
      setAssociatedEmail(user?.email || '');
      setSelectedProfileId(user?.profileId || '');
    } else {
      setAssociatedEmail('');
      setSelectedProfileId('');
    }
    
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    const defaultBranch = branches.length > 0 ? branches[0].id : '';
    setEditingProf({
      name: '',
      bio: '',
      rating: 5.0,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      specialties: [],
      schedule: createEmptySchedule(defaultBranch),
      // New fields init
      isManager: false,
      availableInApp: true,
      availableInPresentation: true,
      address: {
          zipCode: '', street: '', number: '', neighborhood: '', city: '', state: ''
      }
    });
    setAssociatedEmail('');
    setSelectedProfileId(profiles.find(p => p.name.includes('Profissional'))?.id || '');
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const handleDelete = async (prof: Professional) => {
    if (window.confirm('Tem certeza que deseja remover este profissional?')) {
      await deleteProfessional(prof.id);
      if (user) {
        await addAuditLog({
            action: 'DELETE',
            entity: 'PROFESSIONAL',
            performedBy: user.name,
            description: `Profissional removido: ${prof.name}`
        });
      }
      loadData();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProf) {
      try {
        const base64 = await uploadImage(file);
        setEditingProf({ ...editingProf, avatarUrl: base64 });
      } catch (err) {
        console.error("Erro ao carregar imagem", err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProf && editingProf.name) {
      setLoading(true);
      
      let userId = editingProf.userId;
      
      if (associatedEmail) {
        const userPayload = {
          id: userId,
          name: editingProf.name,
          email: associatedEmail,
          role: UserRole.PROFESSIONAL,
          avatarUrl: editingProf.avatarUrl,
          profileId: selectedProfileId || undefined
        };
        const savedUser = await saveUser(userPayload as any);
        userId = savedUser.id;
      }

      const profToSave = { ...editingProf, userId: userId } as Professional;
      await saveProfessional(profToSave);
      
      if (user) {
        const action = editingProf.id ? 'UPDATE' : 'CREATE';
        await addAuditLog({
            action: action,
            entity: 'PROFESSIONAL',
            performedBy: user.name,
            description: `${action === 'CREATE' ? 'Profissional cadastrado' : 'Profissional atualizado'}: ${editingProf.name}`
        });
      }

      setLoading(false);
      setIsModalOpen(false);
      loadData();
    }
  };

  const toggleSpecialty = (serviceId: string) => {
    if (!editingProf) return;
    const current = editingProf.specialties || [];
    const newSpecialties = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    setEditingProf({ ...editingProf, specialties: newSpecialties });
  };

  const updateScheduleItem = (index: number, field: keyof WorkScheduleItem, value: any) => {
    if (!editingProf || !editingProf.schedule) return;
    const newSchedule = [...editingProf.schedule];
    
    if (field === 'isActive' && value === true && !newSchedule[index].branchId && branches.length > 0) {
        newSchedule[index] = { ...newSchedule[index], branchId: branches[0].id };
    }

    newSchedule[index] = { ...newSchedule[index], [field]: value };
    
    if (field === 'breakStart' && value === '') {
        newSchedule[index].breakEnd = '';
    }

    setEditingProf({ ...editingProf, schedule: newSchedule });
  };

  const filteredProfessionals = professionals.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tab Component
  const TabButton = ({ id, label, icon }: { id: ModalTab, label: string, icon?: React.ReactNode }) => {
      const isActive = activeTab === id;
      // Get number based on id position in enum-like structure
      const tabMap = { 'details': 1, 'services': 2, 'schedule': 3, 'user': 4, 'address': 5 };
      const num = tabMap[id];

      return (
          <button 
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${isActive ? 'border-sky-500 text-sky-600 bg-sky-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {num}
              </span>
              {label}
          </button>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cadastro de Profissionais</h1>
          <p className="text-slate-500 text-sm">Gerencie a equipe, perfis e escalas de trabalho.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-md font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={18} /> Profissional
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar profissional..." 
          className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
          {filteredProfessionals.length === 0 ? (
              <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-md text-gray-500">
                  Nenhum profissional encontrado.
              </div>
          ) : (
              filteredProfessionals.map(prof => (
                  <div key={prof.id} className="bg-white border border-gray-200 rounded-md p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                          <img src={prof.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                          <div>
                              <h3 className="font-bold text-slate-800">{prof.name}</h3>
                              <div className="text-xs text-slate-500 flex gap-2">
                                  {prof.isManager && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Gestor</span>}
                                  <span>{prof.mobilePhone || 'Sem telefone'}</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => handleEdit(prof)} className="p-2 bg-sky-50 text-sky-600 rounded hover:bg-sky-100 transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(prof)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Modal */}
      {isModalOpen && editingProf && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2 text-slate-800">
                    <UserPlus size={20} />
                    <h2 className="text-lg font-bold">Novo Cadastro</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50">
                <TabButton id="details" label="Dados Pessoais" />
                <TabButton id="services" label="Serviços" />
                <TabButton id="schedule" label="Horário de Trabalho" />
                <TabButton id="user" label="Dados Usuário" />
                <TabButton id="address" label="Endereço" />
            </div>

            {/* Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                
                {/* 1. DADOS PESSOAIS */}
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <input 
                                type="checkbox" 
                                id="isManager" 
                                checked={editingProf.isManager} 
                                onChange={e => setEditingProf({...editingProf, isManager: e.target.checked})}
                                className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <label htmlFor="isManager" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                Gestor <span className="text-gray-400 text-xs">(?)</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo*</label>
                                <input required type="text" value={editingProf.name} onChange={e => setEditingProf({...editingProf, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="Nome Completo" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">E-mail*</label>
                                <input type="email" value={editingProf.email || ''} onChange={e => setEditingProf({...editingProf, email: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="E-mail" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Celular*</label>
                                <input required type="text" value={editingProf.mobilePhone || ''} onChange={e => setEditingProf({...editingProf, mobilePhone: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="(00) 00000-0000" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Telefone</label>
                                <input type="text" value={editingProf.phone || ''} onChange={e => setEditingProf({...editingProf, phone: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="Telefone" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">CPF/CNPJ</label>
                                <input type="text" value={editingProf.cpf || ''} onChange={e => setEditingProf({...editingProf, cpf: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="CPF ou CNPJ" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">RG</label>
                                <input type="text" value={editingProf.rg || ''} onChange={e => setEditingProf({...editingProf, rg: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="RG" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Sexo</label>
                                <select value={editingProf.gender || ''} onChange={e => setEditingProf({...editingProf, gender: e.target.value as any})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white">
                                    <option value="">Selecione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Data de Nascimento</label>
                                <input type="date" value={editingProf.birthDate || ''} onChange={e => setEditingProf({...editingProf, birthDate: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Obs</label>
                                <input type="text" value={editingProf.bio || ''} onChange={e => setEditingProf({...editingProf, bio: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="Observações" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Imagem</label>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={editingProf.avatarUrl ? 'Imagem selecionada' : 'Selecionar arquivo ...'} className="flex-1 border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-500" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-sky-600 text-white px-4 rounded text-sm font-medium hover:bg-sky-700">Procurar</button>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                <p className="text-xs text-gray-400 mt-1">Max. 1Mb</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Disponível no Aplicativo?</label>
                                <select value={editingProf.availableInApp ? 'Sim' : 'Não'} onChange={e => setEditingProf({...editingProf, availableInApp: e.target.value === 'Sim'})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white">
                                    <option value="Sim">Sim</option>
                                    <option value="Não">Não</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Disponível na Apresentação</label>
                                <select value={editingProf.availableInPresentation ? 'Sim' : 'Não'} onChange={e => setEditingProf({...editingProf, availableInPresentation: e.target.value === 'Sim'})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none bg-white">
                                    <option value="Sim">Sim</option>
                                    <option value="Não">Não</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-4">(*) Campos Obrigatórios</p>
                    </div>
                )}

                {/* 2. SERVIÇOS */}
                {activeTab === 'services' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map(service => {
                             const isSelected = editingProf.specialties?.includes(service.id);
                             return (
                                <div key={service.id} onClick={() => toggleSpecialty(service.id)} className={`cursor-pointer p-3 rounded border flex items-center justify-between ${isSelected ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <span className="text-sm font-medium">{service.name}</span>
                                    {isSelected && <Check size={16} />}
                                </div>
                            );
                        })}
                        {services.length === 0 && <p className="text-gray-500 text-sm">Nenhum serviço disponível.</p>}
                    </div>
                )}

                {/* 3. HORÁRIO */}
                {activeTab === 'schedule' && (
                    <div className="space-y-3">
                        {editingProf.schedule?.map((daySchedule, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-gray-200 rounded bg-gray-50">
                                <div className="w-32 flex items-center gap-2">
                                    <input type="checkbox" checked={daySchedule.isActive} onChange={(e) => updateScheduleItem(index, 'isActive', e.target.checked)} />
                                    <span className="text-sm font-bold text-gray-700">{DAYS_LABEL[daySchedule.dayOfWeek]}</span>
                                </div>
                                {daySchedule.isActive && (
                                    <div className="flex flex-1 flex-wrap gap-2 items-center">
                                        <input type="time" className="border border-gray-300 rounded px-2 py-1 text-sm" value={daySchedule.startTime} onChange={e => updateScheduleItem(index, 'startTime', e.target.value)} />
                                        <span className="text-gray-400 text-xs">até</span>
                                        <input type="time" className="border border-gray-300 rounded px-2 py-1 text-sm" value={daySchedule.endTime} onChange={e => updateScheduleItem(index, 'endTime', e.target.value)} />
                                        
                                        <div className="mx-2 h-4 w-px bg-gray-300 hidden sm:block"></div>
                                        
                                        <span className="text-xs text-gray-500">Pausa:</span>
                                        <input type="time" className="border border-gray-300 rounded px-2 py-1 text-sm" value={daySchedule.breakStart || ''} onChange={e => updateScheduleItem(index, 'breakStart', e.target.value)} />
                                        <span className="text-gray-400 text-xs">até</span>
                                        <input type="time" className="border border-gray-300 rounded px-2 py-1 text-sm" value={daySchedule.breakEnd || ''} onChange={e => updateScheduleItem(index, 'breakEnd', e.target.value)} />
                                        
                                        <div className="mx-2 h-4 w-px bg-gray-300 hidden sm:block"></div>
                                        
                                        <select className="border border-gray-300 rounded px-2 py-1 text-sm max-w-[120px]" value={daySchedule.branchId || ''} onChange={e => updateScheduleItem(index, 'branchId', e.target.value)}>
                                            <option value="">Filial...</option>
                                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. DADOS USUÁRIO */}
                {activeTab === 'user' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded border border-blue-100">
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1">E-mail de Acesso</label>
                                <input type="email" value={associatedEmail} onChange={e => setAssociatedEmail(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" placeholder="Email para login no sistema" />
                            </div>
                            <p className="text-xs text-blue-600">
                                Ao definir um e-mail, um usuário com perfil "Profissional" será criado ou vinculado a este cadastro, permitindo acesso à agenda pelo aplicativo/painel.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                <Shield size={16} className="text-indigo-600"/> Perfil de Acesso do Usuário
                            </label>
                            <select 
                                className="w-full border border-gray-300 rounded p-2 text-sm outline-none bg-white"
                                value={selectedProfileId}
                                onChange={(e) => setSelectedProfileId(e.target.value)}
                            >
                                <option value="">Sem perfil definido (Acesso Restrito)</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Define quais módulos este profissional poderá ver ao acessar o sistema.
                            </p>
                        </div>
                    </div>
                )}

                {/* 5. ENDEREÇO */}
                {activeTab === 'address' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">CEP</label>
                            <input type="text" value={editingProf.address?.zipCode || ''} onChange={e => setEditingProf({...editingProf, address: {...editingProf.address!, zipCode: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Logradouro</label>
                            <input type="text" value={editingProf.address?.street || ''} onChange={e => setEditingProf({...editingProf, address: {...editingProf.address!, street: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Número</label>
                            <input type="text" value={editingProf.address?.number || ''} onChange={e => setEditingProf({...editingProf, address: {...editingProf.address!, number: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label>
                            <input type="text" value={editingProf.address?.neighborhood || ''} onChange={e => setEditingProf({...editingProf, address: {...editingProf.address!, neighborhood: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Cidade</label>
                            <input type="text" value={editingProf.address?.city || ''} onChange={e => setEditingProf({...editingProf, address: {...editingProf.address!, city: e.target.value}})} className="w-full border border-gray-300 rounded p-2 text-sm outline-none" />
                        </div>
                    </div>
                )}

            </form>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
                >
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};