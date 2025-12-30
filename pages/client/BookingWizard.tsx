
import React, { useState, useEffect } from 'react';
import { Service, Professional, Branch, WaitingListEntry } from '../../types';
import { getServices, getProfessionalsByService, getAvailableSlots, createAppointment, getBranches, saveWaitingListEntry } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, Calendar, Clock, CheckCircle, User, Scissors, Sun, Sunset, Moon, Building2, MapPin, ListPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BookingWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step state (0 = Branch, 1 = Service, 2 = Professional, 3 = Date, 4 = Confirm)
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  
  // Selection state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBranches().then(data => setBranches(data.filter(b => b.active)));
    getServices().then(setServices);
  }, []);

  useEffect(() => {
    if (selectedService && selectedBranch) {
      setLoading(true);
      getProfessionalsByService(selectedService.id).then((profs) => {
        // Filter professionals: Must work at selected branch on AT LEAST one day
        const branchProfs = profs.filter(p => 
            p.schedule.some(s => s.isActive && s.branchId === selectedBranch.id)
        );
        setProfessionals(branchProfs);
        setLoading(false);
      });
    }
  }, [selectedService, selectedBranch]);

  useEffect(() => {
    if (selectedProf && selectedDate && selectedService && selectedBranch) {
      setLoading(true);
      // Pass the selectedBranch.id to getAvailableSlots to verify the prof is at this branch on this date
      getAvailableSlots(selectedProf.id, selectedDate, selectedService.durationMinutes, selectedBranch.id).then((slots) => {
        setAvailableSlots(slots);
        setLoading(false);
      });
    }
  }, [selectedProf, selectedDate, selectedService, selectedBranch]);

  const handleBooking = async () => {
    if (!user || !selectedService || !selectedProf || !selectedDate || !selectedTime || !selectedBranch) return;

    setLoading(true);
    await createAppointment({
      clientId: user.id,
      clientName: user.name,
      professionalId: selectedProf.id,
      branchId: selectedBranch.id,
      serviceId: selectedService.id,
      date: selectedDate,
      time: selectedTime,
      price: selectedService.price,
    });
    setLoading(false);
    navigate('/my-appointments');
  };

  const handleJoinWaitingList = async () => {
      if (!user || !selectedService || !selectedDate) return;
      
      if (window.confirm('Deseja entrar na lista de espera para este dia? Avisaremos se surgir um horário.')) {
          setLoading(true);
          
          const entry: WaitingListEntry = {
              id: '', // Mock handle ID
              clientId: user.id,
              serviceId: selectedService.id,
              professionalId: selectedProf?.id, // Optional, can be any
              date: selectedDate,
              notes: 'Cadastro via App do Cliente',
              createdAt: new Date().toISOString(),
              notified: false,
              status: 'AGUARDANDO'
          };

          await saveWaitingListEntry(entry);
          setLoading(false);
          alert('Você foi adicionado à lista de espera! Fique atento às notificações.');
          navigate('/my-appointments'); // Or redirect home
      }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4) as any);
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0) as any);

  // Helper to group slots
  const groupSlots = (slots: string[]) => {
    const morning = slots.filter(t => parseInt(t.split(':')[0]) < 12);
    const afternoon = slots.filter(t => {
      const h = parseInt(t.split(':')[0]);
      return h >= 12 && h < 18;
    });
    const evening = slots.filter(t => parseInt(t.split(':')[0]) >= 18);
    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlots(availableSlots);

  const renderSlotGroup = (title: string, icon: React.ReactNode, slots: string[]) => {
    if (slots.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
          {icon} {title}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(time => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`py-2 text-sm rounded-lg border transition-all ${
                selectedTime === time 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                : 'border-gray-200 text-slate-700 hover:border-indigo-500 hover:bg-indigo-50'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Agendar Horário</h1>
      
      {/* Progress Bar */}
      <div className="flex items-center mb-8 text-xs sm:text-sm font-medium text-slate-500 overflow-x-auto whitespace-nowrap pb-2">
        <span className={`${step >= 0 ? 'text-indigo-600' : ''}`}>Local</span>
        <ChevronRight size={16} className="mx-2" />
        <span className={`${step >= 1 ? 'text-indigo-600' : ''}`}>Serviço</span>
        <ChevronRight size={16} className="mx-2" />
        <span className={`${step >= 2 ? 'text-indigo-600' : ''}`}>Profissional</span>
        <ChevronRight size={16} className="mx-2" />
        <span className={`${step >= 3 ? 'text-indigo-600' : ''}`}>Horário</span>
        <ChevronRight size={16} className="mx-2" />
        <span className={`${step >= 4 ? 'text-indigo-600' : ''}`}>Confirmar</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {/* Step 0: Branch Selection */}
        {step === 0 && (
          <div>
             <h2 className="text-xl font-bold mb-4">Selecione a Unidade</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map(branch => (
                    <div 
                        key={branch.id}
                        onClick={() => { setSelectedBranch(branch); nextStep(); }}
                        className="cursor-pointer border border-gray-200 rounded-xl p-5 hover:border-indigo-500 hover:bg-indigo-50 transition-all group flex items-start gap-4"
                    >
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-200">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{branch.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <MapPin size={14} /> {branch.address}
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* Step 1: Services */}
        {step === 1 && (
          <div>
            <button onClick={prevStep} className="mb-4 text-sm text-slate-500 hover:text-indigo-600">← Voltar</button>
            <h2 className="text-xl font-bold mb-4">Escolha o Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                <div
                    key={service.id}
                    onClick={() => { setSelectedService(service); nextStep(); }}
                    className="cursor-pointer border border-gray-200 rounded-xl p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                    <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <Scissors size={20} />
                    </div>
                    <span className="font-bold text-slate-900">R$ {service.price.toFixed(2)}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">{service.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                    <div className="mt-3 text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {service.durationMinutes} min
                    </div>
                </div>
                ))}
            </div>
          </div>
        )}

        {/* Step 2: Professionals */}
        {step === 2 && (
          <div>
             <button onClick={prevStep} className="mb-4 text-sm text-slate-500 hover:text-indigo-600">← Voltar</button>
             <h2 className="text-xl font-bold mb-4">Selecione um Profissional</h2>
             {professionals.length === 0 ? (
                 <div className="text-center py-12 text-slate-400">
                     <p>Nenhum profissional disponível para este serviço nesta unidade.</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professionals.map(prof => (
                    <div
                    key={prof.id}
                    onClick={() => { setSelectedProf(prof); nextStep(); }}
                    className="cursor-pointer flex items-center gap-4 border border-gray-200 rounded-xl p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                    >
                    <img src={prof.avatarUrl} alt={prof.name} className="w-16 h-16 rounded-full object-cover" />
                    <div>
                        <h3 className="font-bold text-slate-900">{prof.name}</h3>
                        <p className="text-sm text-slate-500">{prof.bio}</p>
                        <div className="mt-1 flex items-center text-yellow-500 text-sm">
                        ★ {prof.rating}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
             )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div>
            <button onClick={prevStep} className="mb-4 text-sm text-slate-500 hover:text-indigo-600">← Voltar</button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Data</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Horários Disponíveis</label>
                {!selectedDate ? (
                  <p className="text-sm text-slate-400 p-4 border border-dashed rounded-lg text-center">Por favor, selecione uma data primeiro.</p>
                ) : loading ? (
                  <div className="flex items-center justify-center p-8 text-indigo-500">
                    <Clock className="animate-spin mr-2" size={20} /> Verificando disponibilidade...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex flex-col gap-3">
                      <p className="text-sm text-red-500 p-4 border border-red-100 bg-red-50 rounded-lg text-center">
                          Sem horários disponíveis para esta data nesta unidade.
                      </p>
                      
                      {/* WAITING LIST BUTTON */}
                      <button 
                        onClick={handleJoinWaitingList}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                      >
                          <ListPlus size={18} /> Entrar na Lista de Espera
                      </button>
                      <p className="text-xs text-center text-slate-500">
                          Nós te avisaremos caso algum horário fique disponível!
                      </p>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {renderSlotGroup('Manhã', <Sun size={14} className="text-yellow-500" />, morning)}
                    {renderSlotGroup('Tarde', <Sunset size={14} className="text-orange-500" />, afternoon)}
                    {renderSlotGroup('Noite', <Moon size={14} className="text-indigo-500" />, evening)}
                  </div>
                )}
              </div>
            </div>
            
            {availableSlots.length > 0 && (
                <button
                disabled={!selectedDate || !selectedTime}
                onClick={nextStep}
                className="mt-8 w-full bg-slate-900 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-slate-800 transition-colors shadow-lg"
                >
                Continuar para Confirmação
                </button>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && selectedService && selectedProf && selectedBranch && (
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Confirmar Agendamento</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 text-left space-y-4 mb-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-slate-500">Unidade</span>
                <span className="font-medium text-slate-900">{selectedBranch.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-slate-500">Serviço</span>
                <span className="font-medium text-slate-900">{selectedService.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-slate-500">Profissional</span>
                <span className="font-medium text-slate-900">{selectedProf.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-slate-500">Data & Hora</span>
                <span className="font-medium text-slate-900">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {selectedTime}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-bold">Preço Total</span>
                <span className="font-bold text-indigo-600 text-lg">R$ {selectedService.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">Voltar</button>
              <button 
                onClick={handleBooking} 
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-transform active:scale-95"
              >
                {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};