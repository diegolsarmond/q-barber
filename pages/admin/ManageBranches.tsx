import React, { useEffect, useState } from 'react';
import { getBranches, saveBranch, deleteBranch, addAuditLog } from '../../services/mockData';
import { Branch } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, X, MapPin, Phone, Building2 } from 'lucide-react';

export const ManageBranches: React.FC = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    const data = await getBranches();
    setBranches(data);
  };

  const handleCreate = () => {
    setEditingBranch({
      name: '',
      address: '',
      phone: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch({ ...branch });
    setIsModalOpen(true);
  };

  const handleDelete = async (branch: Branch) => {
    if (window.confirm('Deseja realmente excluir esta filial? Os profissionais associados precisarão ser realocados.')) {
      await deleteBranch(branch.id);
      
      // LOG AUDIT
      if (user) {
        await addAuditLog({
            action: 'DELETE',
            entity: 'BRANCH',
            performedBy: user.name,
            description: `Filial removida: ${branch.name}`
        });
      }

      loadBranches();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch && editingBranch.name) {
      await saveBranch(editingBranch as Branch);
      
      // LOG AUDIT
      if (user) {
        const action = editingBranch.id ? 'UPDATE' : 'CREATE';
        await addAuditLog({
            action: action,
            entity: 'BRANCH',
            performedBy: user.name,
            description: `${action === 'CREATE' ? 'Nova filial criada' : 'Filial atualizada'}: ${editingBranch.name}`
        });
      }

      setIsModalOpen(false);
      loadBranches();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Filiais</h1>
          <p className="text-slate-500 text-sm">Gerencie as unidades e locais de atendimento.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Nova Filial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Nenhuma filial cadastrada.</p>
          </div>
        ) : (
          branches.map(branch => (
            <div key={branch.id} className={`bg-white p-6 rounded-3xl border shadow-sm transition-all hover:shadow-lg flex flex-col ${branch.active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Building2 size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(branch)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(branch)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-900 text-lg mb-1">{branch.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${branch.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {branch.active ? 'Ativa' : 'Inativa'}
                 </span>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-start gap-3 text-slate-600 text-sm">
                    <MapPin size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Phone size={16} className="text-indigo-400 shrink-0" />
                    <span>{branch.phone}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && editingBranch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                {editingBranch.id ? 'Editar Filial' : 'Nova Filial'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-gray-50"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome da Unidade</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={editingBranch.name}
                    onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Matriz - Centro"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Endereço Completo</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={editingBranch.address}
                    onChange={e => setEditingBranch({ ...editingBranch, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Rua, Número, Bairro, Cidade"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Telefone de Contato</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={editingBranch.phone}
                    onChange={e => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Status da Unidade</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="active" 
                            checked={editingBranch.active} 
                            onChange={() => setEditingBranch({...editingBranch, active: true})}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">Ativa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="active" 
                            checked={!editingBranch.active} 
                            onChange={() => setEditingBranch({...editingBranch, active: false})}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">Inativa</span>
                    </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]">
                Salvar Filial
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};