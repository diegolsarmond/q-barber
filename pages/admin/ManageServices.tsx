
import React, { useEffect, useState, useRef } from 'react';
import { getServices, saveService, deleteService, addAuditLog, uploadImage } from '../../services/mockData';
import { Service } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, X, Clock, DollarSign, Tag, FileText, LayoutGrid, Image as ImageIcon, Upload, Filter, Mail } from 'lucide-react';

export const ManageServices: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const categories = ['ALL', 'Barbearia', 'Clínica', 'Spa', 'Médico'];

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    getServices().then(setServices);
  };

  const handleCreate = () => {
    setEditingService({
      name: '',
      description: '',
      durationMinutes: 30,
      price: 0,
      category: 'Barbearia',
      imageUrl: '',
      commission: 0,
      priceType: 'FIXED',
      returnDays: 0,
      availableOnline: true,
      availableInPresentation: true,
      showPriceInPresentation: true,
      simultaneousQuantity: 0,
      loyalty: { enabled: false, pointsToRedeem: 0, pointsToAccumulate: 0 }
    });
    setIsModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService({ 
        ...service,
        // Ensure nested objects exist if legacy data
        loyalty: service.loyalty || { enabled: false, pointsToRedeem: 0, pointsToAccumulate: 0 }
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (service: Service) => {
    if (window.confirm('Deseja realmente excluir este serviço?')) {
      await deleteService(service.id);
      
      if (user) {
        await addAuditLog({
            action: 'DELETE',
            entity: 'SERVICE',
            performedBy: user.name,
            description: `Serviço removido: ${service.name}`
        });
      }

      loadServices();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingService) {
      try {
        const base64 = await uploadImage(file);
        setEditingService({ ...editingService, imageUrl: base64 });
      } catch (err) {
        console.error("Erro ao carregar imagem", err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService && editingService.name) {
      await saveService(editingService as Service);
      
      if (user) {
        const action = editingService.id ? 'UPDATE' : 'CREATE';
        await addAuditLog({
            action: action,
            entity: 'SERVICE',
            performedBy: user.name,
            description: `${action === 'CREATE' ? 'Novo serviço criado' : 'Serviço atualizado'}: ${editingService.name}. Valor: R$ ${editingService.price}`
        });
      }

      setIsModalOpen(false);
      loadServices();
    }
  };

  const filteredServices = services.filter(s => filterCategory === 'ALL' || s.category === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cadastro de Serviços</h1>
          <p className="text-slate-500 text-sm">Gerencie o catálogo de serviços oferecidos.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-md font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Plus size={18} /> Serviço
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
          {categories.map(cat => (
              <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border ${
                      filterCategory === cat 
                      ? 'bg-sky-600 text-white border-sky-600' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                  {cat === 'ALL' ? 'Todos' : cat}
              </button>
          ))}
      </div>

      {/* Table for Desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="p-3 font-bold w-16">Img</th>
              <th className="p-3 font-bold">Descrição</th>
              <th className="p-3 font-bold">Valor</th>
              <th className="p-3 font-bold">Tempo</th>
              <th className="p-3 font-bold">Comissão</th>
              <th className="p-3 font-bold">Categoria</th>
              <th className="p-3 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">Nenhum serviço encontrado.</td>
              </tr>
            ) : (
              filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                      <img 
                        src={service.imageUrl || 'https://via.placeholder.com/40'} 
                        className="w-8 h-8 rounded object-cover bg-gray-100" 
                        alt="" 
                      />
                  </td>
                  <td className="p-3 font-medium text-gray-700">{service.name}</td>
                  <td className="p-3 font-bold text-gray-700">R$ {service.price.toFixed(2)}</td>
                  <td className="p-3 text-gray-600">{service.durationMinutes} min</td>
                  <td className="p-3 text-gray-600">{service.commission ? `${service.commission}%` : '-'}</td>
                  <td className="p-3 text-gray-600"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{service.category}</span></td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(service)} className="text-gray-400 hover:text-sky-600 p-1 hover:bg-sky-50 rounded transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(service)} className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2 text-slate-800">
                  <Mail size={20} /> 
                  <h2 className="text-lg font-bold">Novo Cadastro</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
                <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Dados Serviço</h3>
                
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Descrição*</label>
                    <input required type="text" value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="Descrição" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tempo*</label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-2 top-2.5 text-gray-400"/>
                            <input required type="number" min="5" step="5" value={editingService.durationMinutes} onChange={e => setEditingService({...editingService, durationMinutes: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded pl-8 p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Valor*</label>
                        <div className="relative">
                            <input required type="number" min="0" step="0.01" value={editingService.price} onChange={e => setEditingService({...editingService, price: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="0,00" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Preço</label>
                        <select value={editingService.priceType || 'FIXED'} onChange={e => setEditingService({...editingService, priceType: e.target.value as any})} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none">
                            <option value="FIXED">Igual a</option>
                            <option value="FROM">A partir de</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Comissão</label>
                        <div className="flex items-center">
                            <input type="number" min="0" max="100" value={editingService.commission || 0} onChange={e => setEditingService({...editingService, commission: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded-l p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                            <span className="bg-gray-100 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm text-gray-600">%</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tempo de Retorno (Dias)</label>
                        <input type="number" min="0" value={editingService.returnDays || 0} onChange={e => setEditingService({...editingService, returnDays: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Disponível para Agendamento?</label>
                        <select value={editingService.availableOnline ? 'Sim' : 'Não'} onChange={e => setEditingService({...editingService, availableOnline: e.target.value === 'Sim'})} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none">
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Imagem</label>
                    <div className="flex gap-2">
                        <input type="text" readOnly value={editingService.imageUrl ? 'Imagem selecionada' : 'Selecionar arquivo ...'} className="flex-1 border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-500" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-sky-600 text-white px-4 rounded text-sm font-medium hover:bg-sky-700">Procurar</button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <p className="text-xs text-gray-400 mt-1">PNG/JPG</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={editingService.availableInPresentation} onChange={e => setEditingService({...editingService, availableInPresentation: e.target.checked})} className="rounded text-sky-600" />
                        Disponível na apresentação
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={editingService.showPriceInPresentation} onChange={e => setEditingService({...editingService, showPriceInPresentation: e.target.checked})} className="rounded text-sky-600" />
                        Mostrar valor na apresentação
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Simultâneos</label>
                    <input type="number" min="0" value={editingService.simultaneousQuantity || 0} onChange={e => setEditingService({...editingService, simultaneousQuantity: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                    <select value={editingService.category} onChange={e => setEditingService({...editingService, category: e.target.value as any})} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none">
                        <option value="Barbearia">Barbearia</option>
                        <option value="Clínica">Clínica</option>
                        <option value="Spa">Spa</option>
                        <option value="Médico">Médico</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Observação</label>
                    <textarea rows={3} value={editingService.description} onChange={e => setEditingService({...editingService, description: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-bold text-gray-800 mb-4">Programa de Fidelidade</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Incluir no Programa de Fidelidade?</label>
                            <select value={editingService.loyalty?.enabled ? 'Sim' : 'Não'} onChange={e => setEditingService({...editingService, loyalty: {...editingService.loyalty!, enabled: e.target.value === 'Sim'}})} className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none">
                                <option value="Sim">Sim</option>
                                <option value="Não">Não</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Pontos para Resgate*</label>
                            <div className="flex">
                                <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l px-3 py-2 text-sm text-gray-600">Pts</span>
                                <input type="number" min="0" value={editingService.loyalty?.pointsToRedeem || 0} onChange={e => setEditingService({...editingService, loyalty: {...editingService.loyalty!, pointsToRedeem: parseInt(e.target.value)}})} className="w-full border border-gray-300 rounded-r p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" disabled={!editingService.loyalty?.enabled} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Pontos para Acumular</label>
                            <div className="flex">
                                <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l px-3 py-2 text-sm text-gray-600">Pts</span>
                                <input type="number" min="0" value={editingService.loyalty?.pointsToAccumulate || 0} onChange={e => setEditingService({...editingService, loyalty: {...editingService.loyalty!, pointsToAccumulate: parseInt(e.target.value)}})} className="w-full border border-gray-300 rounded-r p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" disabled={!editingService.loyalty?.enabled} />
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-xs font-bold text-gray-800 mt-2">(*) Campos Obrigatórios.</p>
            </form>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-start gap-2">
                <button type="button" onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded text-sm font-bold shadow-sm">Cadastrar</button>
                <button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded text-sm font-bold shadow-sm">Limpar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
