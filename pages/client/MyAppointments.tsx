
import React, { useEffect, useState } from 'react';
import { Appointment } from '../../types';
import { getAppointments, cancelAppointment, rateAppointment } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Star, X } from 'lucide-react';

export const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  
  // Rating Modal State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const fetchAppts = () => {
    getAppointments().then(all => {
      const myAppts = all.filter(a => a.clientId === user?.id);
      setAppointments(myAppts);
    });
  };

  useEffect(() => {
    fetchAppts();
  }, [user]);

  const handleCancel = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await cancelAppointment(id);
      fetchAppts();
    }
  };

  const openRatingModal = (apptId: string) => {
      setSelectedAppointmentId(apptId);
      setRatingValue(0);
      setReviewText('');
      setIsRatingModalOpen(true);
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedAppointmentId && ratingValue > 0) {
          await rateAppointment(selectedAppointmentId, ratingValue, reviewText);
          setIsRatingModalOpen(false);
          fetchAppts();
      }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'CONFIRMED': return 'CONFIRMADO';
      case 'CANCELLED': return 'CANCELADO';
      case 'COMPLETED': return 'CONCLUÍDO';
      case 'PENDING': return 'PENDENTE';
      default: return status;
    }
  };

  // Helper function to format YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const today = new Date().toISOString().split('T')[0];
  
  const filteredAppointments = appointments.filter(a => {
    const isFuture = a.date >= today;
    return filter === 'UPCOMING' ? (isFuture && a.status !== 'CANCELLED') : (!isFuture || a.status === 'CANCELLED' || a.status === 'COMPLETED');
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort history desc

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Meus Agendamentos</h1>
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          <button 
            onClick={() => setFilter('UPCOMING')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'UPCOMING' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            Próximos
          </button>
          <button 
            onClick={() => setFilter('HISTORY')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'HISTORY' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            Histórico
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-slate-400">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          filteredAppointments.map(appt => (
            <div key={appt.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-100 transition-colors">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${appt.status === 'CANCELLED' ? 'bg-red-100 text-red-500' : 'bg-indigo-100 text-indigo-600'}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{formatDate(appt.date)} às {appt.time}</h3>
                  <p className="text-sm text-slate-600 font-medium">{appt.clientName} com {appt.professionalId === 'p1' ? 'João Barbeiro' : appt.professionalId === 'p2' ? 'Dra. Ana Silva' : 'Profissional'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                      appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {getStatusLabel(appt.status)}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> R${appt.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                  {appt.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => handleCancel(appt.id)}
                      className="text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100 w-full md:w-auto"
                    >
                      Cancelar
                    </button>
                  )}

                  {(appt.status === 'COMPLETED' || appt.status === 'CONFIRMED') && filter === 'HISTORY' && (
                      <div className="w-full md:w-auto text-right">
                          {appt.rating ? (
                              <div className="flex flex-col items-end">
                                  <div className="flex gap-0.5 text-yellow-400">
                                      {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={14} fill={i < appt.rating! ? "currentColor" : "none"} className={i < appt.rating! ? "" : "text-gray-300"} />
                                      ))}
                                  </div>
                                  <span className="text-xs text-slate-400 mt-1">Obrigado por avaliar!</span>
                              </div>
                          ) : (
                              <button 
                                  onClick={() => openRatingModal(appt.id)}
                                  className="w-full md:w-auto text-sm text-amber-600 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
                              >
                                  <Star size={16} /> Avaliar
                              </button>
                          )}
                      </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rating Modal */}
      {isRatingModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
                  <button onClick={() => setIsRatingModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  
                  <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Como foi seu atendimento?</h2>
                      <p className="text-slate-500 text-sm mt-1">Sua opinião é muito importante para nós.</p>
                  </div>

                  <form onSubmit={handleRateSubmit}>
                      <div className="flex justify-center gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                  key={star}
                                  type="button"
                                  className="transition-transform hover:scale-110 focus:outline-none"
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => setRatingValue(star)}
                              >
                                  <Star 
                                      size={32} 
                                      className={`${(hoverRating || ratingValue) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                      strokeWidth={1.5}
                                  />
                              </button>
                          ))}
                      </div>

                      <div className="mb-4">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Comentário (Opcional)</label>
                          <textarea
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none bg-slate-50"
                              placeholder="Elogios, sugestões ou críticas..."
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                          />
                      </div>

                      <button
                          type="submit"
                          disabled={ratingValue === 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                      >
                          Enviar Avaliação
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
