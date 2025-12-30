
import React, { useEffect, useState, useRef } from 'react';
import { getProducts, saveProduct, deleteProduct, uploadImage, addAuditLog } from '../../services/mockData';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, X, Search, Package, Image as ImageIcon, ShoppingBag, Barcode, AlertTriangle, TrendingUp } from 'lucide-react';

export const ManageProducts: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    getProducts().then(setProducts);
  };

  const handleCreate = () => {
    setEditingProduct({
      name: '',
      brand: '',
      category: 'Geral',
      price: 0,
      costPrice: 0,
      commission: 0,
      quantity: 0,
      minStock: 5,
      description: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm('Deseja realmente excluir este produto?')) {
      await deleteProduct(product.id);
      
      if (user) {
        await addAuditLog({
            action: 'DELETE',
            entity: 'PRODUCT',
            performedBy: user.name,
            description: `Produto removido: ${product.name}`
        });
      }

      loadProducts();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      try {
        const base64 = await uploadImage(file);
        setEditingProduct({ ...editingProduct, imageUrl: base64 });
      } catch (err) {
        console.error("Erro ao carregar imagem", err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct && editingProduct.name) {
      await saveProduct(editingProduct as Product);
      
      if (user) {
        const action = editingProduct.id ? 'UPDATE' : 'CREATE';
        await addAuditLog({
            action: action,
            entity: 'PRODUCT',
            performedBy: user.name,
            description: `${action === 'CREATE' ? 'Novo produto criado' : 'Produto atualizado'}: ${editingProduct.name}`
        });
      }

      setIsModalOpen(false);
      loadProducts();
    }
  };

  const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
  });

  // Extract unique categories for filter
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Controle de Estoque</h1>
          <p className="text-slate-500 text-sm">Gerencie os produtos para venda e consumo interno.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-md font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Plus size={18} /> Produto
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
          <div className="bg-white p-2 rounded-md border border-gray-200 shadow-sm flex items-center gap-3 flex-1">
            <Search className="text-gray-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por produto ou marca..." 
              className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
              {categories.map(cat => (
                  <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap border ${
                          filterCategory === cat 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                      {cat === 'ALL' ? 'Todos' : cat}
                  </button>
              ))}
          </div>
      </div>

      {/* Table for Desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="p-3 font-bold w-16">Img</th>
              <th className="p-3 font-bold">Descrição</th>
              <th className="p-3 font-bold">Categoria/Marca</th>
              <th className="p-3 font-bold text-center">Qtde</th>
              <th className="p-3 font-bold">Valor Venda</th>
              <th className="p-3 font-bold">Comissão</th>
              <th className="p-3 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400">Nenhum produto encontrado.</td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <Package size={20} className="text-gray-400" />
                        )}
                      </div>
                  </td>
                  <td className="p-3">
                      <div className="font-bold text-gray-800">{product.name}</div>
                      {product.barcode && <div className="text-[10px] text-gray-400 font-mono">{product.barcode}</div>}
                  </td>
                  <td className="p-3 text-gray-600">
                      <div className="text-xs">{product.category}</div>
                      <div className="text-[10px] text-gray-400">{product.brand}</div>
                  </td>
                  <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                          product.quantity <= product.minStock 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                          {product.quantity}
                      </span>
                  </td>
                  <td className="p-3 font-bold text-slate-700">R$ {product.price.toFixed(2)}</td>
                  <td className="p-3 text-gray-600">{product.commission}%</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(product)} className="text-gray-400 hover:text-sky-600 p-1 hover:bg-sky-50 rounded transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(product)} className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid md:hidden grid-cols-1 gap-4">
          {filteredProducts.map(product => (
              <div key={product.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex gap-4">
                  <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <Package size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 truncate pr-2">{product.name}</h3>
                          <span className="font-bold text-slate-900">R$ {product.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{product.brand} • {product.category}</p>
                      
                      <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  product.quantity <= product.minStock 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                  Estoque: {product.quantity}
                              </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(product)} className="p-2 bg-gray-50 text-sky-600 rounded-lg"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(product)} className="p-2 bg-gray-50 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2 text-slate-800">
                  <ShoppingBag size={20} /> 
                  <h2 className="text-lg font-bold">Cadastro de Produto</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
                <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">Dados Gerais</h3>
                
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Descrição (Nome)*</label>
                    <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="Ex: Pomada Modeladora" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Marca</label>
                        <input type="text" value={editingProduct.brand} onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                        <input type="text" list="categories" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                        <datalist id="categories">
                            <option value="Cabelo" />
                            <option value="Barba" />
                            <option value="Pele" />
                            <option value="Acessórios" />
                            <option value="Bebidas" />
                        </datalist>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Valor Venda (R$)*</label>
                        <input required type="number" min="0" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Valor Custo (R$)</label>
                        <input type="number" min="0" step="0.01" value={editingProduct.costPrice} onChange={e => setEditingProduct({...editingProduct, costPrice: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Comissão (%)</label>
                        <input type="number" min="0" max="100" value={editingProduct.commission} onChange={e => setEditingProduct({...editingProduct, commission: parseFloat(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Estoque Atual</label>
                        <input type="number" value={editingProduct.quantity} onChange={e => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mínimo (Alerta)</label>
                        <div className="relative">
                            <AlertTriangle size={14} className="absolute right-2 top-2.5 text-orange-400" />
                            <input type="number" min="0" value={editingProduct.minStock} onChange={e => setEditingProduct({...editingProduct, minStock: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Código de Barras</label>
                    <div className="relative">
                        <Barcode size={18} className="absolute left-2 top-2 text-gray-400" />
                        <input type="text" value={editingProduct.barcode || ''} onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} className="w-full border border-gray-300 rounded pl-8 p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Imagem do Produto</label>
                    <div className="flex gap-2">
                        <input type="text" readOnly value={editingProduct.imageUrl ? 'Imagem selecionada' : 'Selecionar arquivo ...'} className="flex-1 border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-500" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-sky-600 text-white px-4 rounded text-sm font-medium hover:bg-sky-700 flex items-center gap-2">
                            <ImageIcon size={16} /> Procurar
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Observações</label>
                    <textarea rows={2} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>

                <p className="text-xs font-bold text-gray-800 mt-2">(*) Campos Obrigatórios.</p>
            </form>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-start gap-2">
                <button type="button" onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded text-sm font-bold shadow-sm">
                    {editingProduct.id ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
