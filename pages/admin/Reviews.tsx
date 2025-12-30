
import React, { useEffect, useState } from 'react';
import { getAppointments, getProfessionals } from '../../services/mockData';
import { Appointment, Professional } from '../../types';
import { Star, MessageSquare, User, Calendar, Quote } from 'lucide-react';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<{appointment: Appointment, professionalName: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [appointments, professionals] = await Promise.all([
      getAppointments(),
      getProfessionals()
    ]);

    // Filter appointments that have ratings
    const ratedAppointments = appointments.filter(a => a.rating && a.rating > 0);
    
    // Sort by date desc
    ratedAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const enriched = ratedAppointments.map(a => {
        const prof = professionals.find(p => p.id === a.professionalId);
        return {
            appointment: a,
            professionalName: prof ? prof.name : 'Profissional Desconhecido'
        };
    });

    setReviews(enriched);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Avaliações/Comentários</h1>
                <p className="text-slate-500 text-sm">Feedback e avaliações realizadas pelos usuários.</p>
            </div>
        </div>

        {loading ? (
            <div className="text-center py-20 text-slate-400">Carregando avaliações...</div>
        ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <MessageSquare size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Você ainda não possui nenhuma avaliação.</p>
                <p className="text-sm text-slate-400 mt-1">Incentive seus clientes a avaliarem o serviço após o atendimento.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((item) => (
                    <div key={item.appointment.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                    {item.appointment.clientName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">{item.appointment.clientName}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        Atendido por <span className="font-medium text-indigo-600">{item.professionalName}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex text-yellow-400 gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < (item.appointment.rating || 0) ? "currentColor" : "none"} className={i < (item.appointment.rating || 0) ? "" : "text-gray-200"} />
                                    ))}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Calendar size={10}/>
                                    {new Date(item.appointment.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                        
                        {item.appointment.review ? (
                            <div className="bg-slate-50 p-3 rounded-xl relative">
                                <Quote size={16} className="text-slate-300 absolute top-2 left-2 opacity-50" />
                                <p className="text-sm text-slate-600 italic pl-6">{item.appointment.review}</p>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-2">Sem comentário escrito.</p>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
