
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfessionals, saveProfessional, getUserById, saveUser, updateUserPassword, uploadImage } from '../services/mockData';
import { Professional, User, UserRole } from '../types';
import { Save, User as UserIcon, Image as ImageIcon, FileText, Shield, Lock, Bell, Mail, Smartphone, Check, Upload, Trash2, Camera, X } from 'lucide-react';

type SettingsTab = 'profile' | 'account' | 'notifications';

interface ProfileSettingsProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isModal = false, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [prof, setProf] = useState<Professional | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const [allProfs, fullUser] = await Promise.all([
      getProfessionals(),
      getUserById(user.id)
    ]);
    
    const foundProf = allProfs.find(p => p.userId === user.id);
    
    setProf(foundProf || null);
    setUserData(fullUser || null);
    
    // Initialize preferences if missing
    if (fullUser && !fullUser.preferences) {
        setUserData({
            ...fullUser,
            preferences: {
                emailNotifications: true,
                smsNotifications: true,
                marketingEmails: false
            }
        });
    }

    setLoading(false);
  };

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userData) {
      if (file.size > 2 * 1024 * 1024) { 
        showMessage('A imagem deve ter no máximo 2MB.', 'error');
        return;
      }
      
      try {
        const base64Image = await uploadImage(file);
        setUserData({ ...userData, avatarUrl: base64Image });
        if (prof) setProf({ ...prof, avatarUrl: base64Image });
      } catch (error) {
        console.error("Erro ao processar imagem", error);
        showMessage('Erro ao processar a imagem.', 'error');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setIsSaving(true);
    
    // Save User Data (Main Identity)
    await saveUser(userData);

    // If professional, save public bio/details
    if (prof) {
      await saveProfessional({
          ...prof,
          name: userData.name,
          avatarUrl: userData.avatarUrl || prof.avatarUrl
      });
    }
    
    setIsSaving(false);
    showMessage('Perfil atualizado com sucesso!');
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setIsSaving(true);

    // Save User Email/Info
    await saveUser(userData);

    // Handle Password Change if fields are filled
    if (passwords.new) {
        if (passwords.new !== passwords.confirm) {
            showMessage('As senhas não coincidem!', 'error');
            setIsSaving(false);
            return;
        }
        await updateUserPassword(userData.id, passwords.new);
        setPasswords({ current: '', new: '', confirm: '' });
    }

    setIsSaving(false);
    showMessage('Dados da conta atualizados com sucesso!');
  };

  const handleSaveNotifications = async () => {
      if(!userData) return;
      setIsSaving(true);
      await saveUser(userData);
      setIsSaving(false);
      showMessage('Preferências salvas com sucesso!');
  };

  const togglePreference = (key: keyof NonNullable<User['preferences']>) => {
    if (!userData || !userData.preferences) return;
    setUserData({
        ...userData,
        preferences: {
            ...userData.preferences,
            [key]: !userData.preferences[key]
        }
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;
  if (!userData) return <div className="p-8 text-center">Usuário não encontrado.</div>;

  return (
    <div className={isModal ? "bg-white h-full flex flex-col" : "max-w-4xl mx-auto animate-fade-in"}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isModal ? 'p-6 border-b border-gray-100 bg-white sticky top-0 z-10' : 'mb-6'}`}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações de Perfil</h1>
          <p className="text-slate-500 text-sm">Gerencie sua identidade e segurança.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            {message && (
                <div className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-sm animate-fade-in text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
            {isModal && onClose && (
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-colors ml-auto sm:ml-0">
                    <X size={24} />
                </button>
            )}
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-6 ${isModal ? 'flex-1 overflow-hidden p-6 pt-2' : ''}`}>
        {/* Sidebar Tabs */}
        <div className={`lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar shrink-0 ${isModal ? 'lg:border-r lg:border-gray-100 lg:pr-4' : ''}`}>
            <button 
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal shrink-0 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-gray-50 border border-transparent'}`}
            >
                <UserIcon size={20} /> Perfil Pessoal
            </button>
            <button 
                type="button"
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal shrink-0 ${activeTab === 'account' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-gray-50 border border-transparent'}`}
            >
                <Shield size={20} /> Segurança & Conta
            </button>
            <button 
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal shrink-0 ${activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-gray-50 border border-transparent'}`}
            >
                <Bell size={20} /> Notificações
            </button>
        </div>

        {/* Content Area */}
        <div className={`flex-1 ${isModal ? 'overflow-y-auto custom-scrollbar pr-2' : 'bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-8 min-h-[500px]'}`}>
            
            {/* --- TAB: PROFILE --- */}
            {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Dados Pessoais</h2>
                        <p className="text-xs text-slate-500">
                            {userData.role === UserRole.PROFESSIONAL 
                                ? 'Essas informações aparecerão no seu perfil público.' 
                                : 'Suas informações básicas de cadastro.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        
                        {/* Avatar Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Foto de Perfil</label>
                            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                                <div className="relative group">
                                    <img 
                                        src={userData.avatarUrl || 'https://via.placeholder.com/150'} 
                                        alt="Avatar" 
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-transform group-hover:scale-105" 
                                    />
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                                    >
                                        <Camera size={24} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 items-center sm:items-start">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/jpg"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Upload size={16} /> Carregar Nova Foto
                                    </button>
                                    <p className="text-[10px] text-slate-400 text-center sm:text-left">
                                        PNG, JPG (Máx. 2MB).
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                            <div className="relative">
                                <UserIcon size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                <input 
                                    type="text" 
                                    required
                                    value={userData.name}
                                    onChange={e => setUserData({...userData, name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {prof && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Biografia Profissional</label>
                                <div className="relative">
                                    <FileText size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                    <textarea 
                                        rows={4}
                                        value={prof.bio}
                                        onChange={e => setProf({...prof, bio: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Conte um pouco sobre sua experiência..."
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1 text-right">{prof.bio.length} caracteres</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70">
                            {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Perfil</>}
                        </button>
                    </div>
                </form>
            )}

            {/* --- TAB: ACCOUNT --- */}
            {activeTab === 'account' && (
                <form onSubmit={handleSaveAccount} className="space-y-8 animate-fade-in">
                     <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Segurança & Conta</h2>
                        <p className="text-xs text-slate-500">Gerencie seu acesso e proteção da conta.</p>
                    </div>

                    <div className="space-y-4">
                         <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Identidade</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="email" 
                                        required
                                        value={userData.email}
                                        onChange={e => setUserData({...userData, email: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                                <div className="relative">
                                    <Smartphone size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={userData.phone || ''}
                                        onChange={e => setUserData({...userData, phone: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                             <Lock size={16} /> Alterar Senha
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Senha Atual</label>
                                <input 
                                    type="password" 
                                    value={passwords.current}
                                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nova Senha</label>
                                    <input 
                                        type="password" 
                                        value={passwords.new}
                                        onChange={e => setPasswords({...passwords, new: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        placeholder="Nova senha"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Confirmar Senha</label>
                                    <input 
                                        type="password" 
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        placeholder="Repita a senha"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70">
                            {isSaving ? 'Salvando...' : <><Save size={20} /> Atualizar Segurança</>}
                        </button>
                    </div>
                </form>
            )}

            {/* --- TAB: NOTIFICATIONS --- */}
            {activeTab === 'notifications' && userData.preferences && (
                <div className="space-y-8 animate-fade-in">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Canais de Notificação</h2>
                        <p className="text-xs text-slate-500">Controle como e quando deseja receber alertas.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Notificações por E-mail</h4>
                                    <p className="text-xs text-slate-500">Alertas críticos e confirmações de serviço.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={userData.preferences.emailNotifications}
                                    onChange={() => togglePreference('emailNotifications')}
                                />
                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Alertas por Mobile/WhatsApp</h4>
                                    <p className="text-xs text-slate-500">Lembretes de 1h antes do agendamento.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={userData.preferences.smsNotifications}
                                    onChange={() => togglePreference('smsNotifications')}
                                />
                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">E-mails Promocionais</h4>
                                    <p className="text-xs text-slate-500">Novos serviços, descontos e novidades.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={userData.preferences.marketingEmails}
                                    onChange={() => togglePreference('marketingEmails')}
                                />
                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button onClick={handleSaveNotifications} disabled={isSaving} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70">
                            {isSaving ? 'Salvando...' : <><Check size={20} /> Salvar Preferências</>}
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
