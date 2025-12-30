import React, { useEffect, useState } from 'react';
import { getSiteConfig, saveSiteConfig } from '../../services/mockData';
import { SiteConfig, DaySchedule } from '../../types';
import { Save, Layout, Type, Clock, MapPin, Smartphone, Image as ImageIcon } from 'lucide-react';

export const SiteSettings: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    getSiteConfig().then(data => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    
    await saveSiteConfig(config);
    setSuccessMsg('Configurações salvas com sucesso!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const updateSchedule = (key: keyof SiteConfig['workingHours'], field: keyof DaySchedule, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      workingHours: {
        ...config.workingHours,
        [key]: {
          ...config.workingHours[key],
          [field]: value
        }
      }
    });
  };

  if (loading || !config) return <div>Carregando...</div>;

  const daysConfig: { key: keyof SiteConfig['workingHours'], label: string }[] = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações do Site</h1>
          <p className="text-slate-500 text-sm">Personalize a aparência e informações da página inicial.</p>
        </div>
        {successMsg && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium animate-fade-in">
            {successMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <Layout className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Identidade Visual</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Barbearia/Clínica</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.appName}
              onChange={e => setConfig({ ...config, appName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cor Primária (Hex)</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                className="w-12 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
                value={config.primaryColor}
                onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
              />
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                value={config.primaryColor}
                onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Imagem de Capa (URL)</label>
             <div className="relative">
               <ImageIcon size={18} className="absolute left-3 top-2.5 text-slate-400" />
               <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.heroImage}
                onChange={e => setConfig({ ...config, heroImage: e.target.value })}
              />
             </div>
             <p className="text-xs text-slate-500 mt-1">Recomendado: Imagem de alta resolução horizontal.</p>
          </div>
        </div>

        {/* Text Content */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <Type className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Conteúdo</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título Principal</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.heroTitle}
              onChange={e => setConfig({ ...config, heroTitle: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.heroSubtitle}
              onChange={e => setConfig({ ...config, heroSubtitle: e.target.value })}
            />
          </div>
          
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Texto "Sobre Nós"</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.aboutText}
              onChange={e => setConfig({ ...config, aboutText: e.target.value })}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <MapPin className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Localização e Contato</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.address}
                onChange={e => setConfig({ ...config, address: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
            <div className="relative">
              <Smartphone size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.phone}
                onChange={e => setConfig({ ...config, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <Clock className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Horário de Funcionamento</h2>
          </div>

          <div className="space-y-4">
            {daysConfig.map((day) => (
              <div key={day.key} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-700">{day.label}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-indigo-600" 
                        checked={config.workingHours[day.key].isOpen}
                        onChange={(e) => updateSchedule(day.key, 'isOpen', e.target.checked)}
                     />
                     <span className="text-sm text-slate-600">Aberto</span>
                  </label>
                </div>
                {config.workingHours[day.key].isOpen && (
                  <div className="flex gap-4 items-center">
                     <div className="flex-1">
                       <label className="text-xs text-slate-500 block mb-1">Abertura</label>
                       <input 
                          type="time" 
                          className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                          value={config.workingHours[day.key].start}
                          onChange={(e) => updateSchedule(day.key, 'start', e.target.value)}
                       />
                     </div>
                     <span className="text-slate-400 pt-5">-</span>
                     <div className="flex-1">
                       <label className="text-xs text-slate-500 block mb-1">Fechamento</label>
                       <input 
                          type="time" 
                          className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                          value={config.workingHours[day.key].end}
                          onChange={(e) => updateSchedule(day.key, 'end', e.target.value)}
                       />
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-2">
            <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-colors text-lg shadow-lg flex items-center justify-center gap-2"
            >
            <Save size={20} />
            Salvar Todas as Configurações
            </button>
        </div>

      </form>
    </div>
  );
};