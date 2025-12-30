
import React, { useEffect, useState } from 'react';
import { getAccessProfiles, saveAccessProfile, deleteAccessProfile } from '../../services/mockData';
import { AccessProfile, AVAILABLE_MODULES, PermissionKey } from '../../types';
import { Plus, Edit2, Trash2, X, Shield, CheckSquare, Square, Save, AlertCircle } from 'lucide-react';

export const ManageProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<AccessProfile> | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const data = await getAccessProfiles();
    setProfiles(data);
  };

  const handleCreate = () => {
    setEditingProfile({
      name: '',
      description: '',
      permissions: [],
      isSystem: false
    });
    setIsModalOpen(true);
  };

  const handleEdit = (profile: AccessProfile) => {
    setEditingProfile({ ...profile });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este perfil de acesso? Usuários associados perderão as permissões específicas.')) {
      await deleteAccessProfile(id);
      loadProfiles();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProfile && editingProfile.name) {
      await saveAccessProfile(editingProfile as AccessProfile);
      setIsModalOpen(false);
      loadProfiles();
    }
  };

  const togglePermission = (key: PermissionKey) => {
    if (!editingProfile) return;
    const currentPerms = editingProfile.permissions || [];
    const newPerms = currentPerms.includes(key)
      ? currentPerms.filter(k => k !== key)
      : [...currentPerms, key];
    setEditingProfile({ ...editingProfile, permissions: newPerms });
  };

  const toggleAllGroup = (group: string, enable: boolean) => {
      if (!editingProfile) return;
      const groupKeys = AVAILABLE_MODULES.filter(m => m.group === group).map(m => m.key);
      let newPerms = [...(editingProfile.permissions || [])];
      
      if (enable) {
          // Add all group keys that aren't already present
          groupKeys.forEach(k => {
              if (!newPerms.includes(k)) newPerms.push(k);
          });
      } else {
          // Remove all group keys
          newPerms = newPerms.filter(k => !groupKeys.includes(k));
      }
      setEditingProfile({ ...editingProfile, permissions: newPerms });
  };

  // Group modules for display
  const groupedModules = AVAILABLE_MODULES.reduce((acc, module) => {
      if (!acc[module.group]) acc[module.group] = [];
      acc[module.group].push(module);
      return acc;
  }, {} as Record<string, typeof AVAILABLE_MODULES>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Perfis de Acesso</h1>
          <p className="text-slate-500 text-sm">Defina quais módulos cada grupo de usuários pode acessar.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Novo Perfil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
            <div key={profile.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Shield size={24} />
                    </div>
                    {profile.isSystem ? (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">Sistema</span>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(profile)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(profile.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </div>
                    )}
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 mb-1">{profile.name}</h3>
                <p className="text-sm text-slate-500 mb-4 h-10">{profile.description || 'Sem descrição.'}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Permissões</p>
                    <div className="flex flex-wrap gap-1">
                        {profile.permissions.slice(0, 3).map(p => {
                            const label = AVAILABLE_MODULES.find(m => m.key === p)?.label.split(' ')[0] || p;
                            return (
                                <span key={p} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{label}</span>
                            );
                        })}
                        {profile.permissions.length > 3 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">+{profile.permissions.length - 3}</span>
                        )}
                        {profile.permissions.length === 0 && <span className="text-xs text-slate-400 italic">Nenhuma</span>}
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && editingProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900">{editingProfile.id ? 'Editar Perfil' : 'Novo Perfil'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome do Perfil</label>
                        <input 
                            required 
                            type="text" 
                            value={editingProfile.name} 
                            onChange={e => setEditingProfile({...editingProfile, name: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: Gerente Financeiro"
                            disabled={editingProfile.isSystem}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Descrição</label>
                        <input 
                            type="text" 
                            value={editingProfile.description} 
                            onChange={e => setEditingProfile({...editingProfile, description: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Breve descrição da função"
                        />
                    </div>
                </div>

                {editingProfile.isSystem && (
                    <div className="bg-amber-50 p-3 rounded-lg flex items-center gap-2 text-sm text-amber-800 border border-amber-100">
                        <AlertCircle size={16} />
                        <p>Perfis de sistema possuem permissões críticas. Cuidado ao editar.</p>
                    </div>
                )}

                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-gray-100 pb-2">Permissões de Acesso</h3>
                    
                    <div className="space-y-6">
                        {Object.entries(groupedModules).map(([group, modules]) => (
                            <div key={group} className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{group}</h4>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => toggleAllGroup(group, true)}
                                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                                        >
                                            Marcar Todos
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button 
                                            type="button" 
                                            onClick={() => toggleAllGroup(group, false)}
                                            className="text-[10px] text-slate-500 hover:text-slate-700 font-bold"
                                        >
                                            Desmarcar
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {modules.map(module => {
                                        const isSelected = editingProfile.permissions?.includes(module.key);
                                        return (
                                            <div 
                                                key={module.key} 
                                                onClick={() => togglePermission(module.key)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'}`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}>
                                                    {isSelected && <CheckSquare size={14} />}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'font-medium text-indigo-900' : 'text-slate-600'}`}>
                                                    {module.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </form>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 border border-gray-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                    <Save size={18} /> Salvar Perfil
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
