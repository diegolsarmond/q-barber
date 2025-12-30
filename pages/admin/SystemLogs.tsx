import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../../services/mockData';
import { AuditLog } from '../../types';
import { FileText, Clock, User, Activity, Search, ShieldAlert } from 'lucide-react';

export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: AuditLog['action']) => {
    const styles = {
        'CREATE': 'bg-green-100 text-green-700',
        'UPDATE': 'bg-blue-100 text-blue-700',
        'DELETE': 'bg-red-100 text-red-700'
    };
    return (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles[action]}`}>
            {action}
        </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logs do Sistema</h1>
          <p className="text-slate-500 text-sm">Histórico de alterações e atividades importantes.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por usuário, ação ou detalhe..." 
          className="flex-1 outline-none text-slate-700 placeholder-slate-400 text-sm bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-slate-400">Carregando histórico...</div>
        ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center">
                <ShieldAlert size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Nenhum registro encontrado.</p>
            </div>
        ) : (
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-gray-200 text-xs text-slate-500 uppercase tracking-widest font-bold">
                    <tr>
                        <th className="p-4 w-48">Data/Hora</th>
                        <th className="p-4 w-48">Usuário</th>
                        <th className="p-4 w-32 text-center">Ação</th>
                        <th className="p-4 w-32 text-center">Entidade</th>
                        <th className="p-4">Descrição</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-slate-500 font-mono text-xs">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    {new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2 text-slate-700 font-bold">
                                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs">
                                        <User size={12} />
                                    </div>
                                    {log.performedBy}
                                </div>
                            </td>
                            <td className="p-4 text-center">
                                {getActionBadge(log.action)}
                            </td>
                            <td className="p-4 text-center text-xs font-bold text-slate-500 bg-gray-50 rounded-lg mx-2 border border-gray-100">
                                {log.entity}
                            </td>
                            <td className="p-4 text-slate-600">
                                {log.description}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};