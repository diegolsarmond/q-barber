import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Calendar, Clock, MapPin, Star, ChevronRight, User } from 'lucide-react';
import { getSiteConfig, getServices } from '../services/mockData';
import { SiteConfig, Service, DaySchedule } from '../types';

export const LandingPage: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    getSiteConfig().then(setConfig);
    getServices().then(setServices);
  }, []);

  if (!config) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;

  // Helper to split title for visual effect (just an example of logic)
  const titleParts = config.heroTitle.split(',');
  const mainTitle = titleParts[0];
  const highlightedTitle = titleParts.slice(1).join(',');

  const formatHours = (schedule: DaySchedule) => {
    return schedule.isOpen ? `${schedule.start} - ${schedule.end}` : 'Fechado';
  };

  const renderWorkingHours = () => {
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = config.workingHours;
    
    // Check if Weekdays (Mon-Fri) are identical
    const isWeekdaysSame = 
      JSON.stringify(monday) === JSON.stringify(tuesday) &&
      JSON.stringify(tuesday) === JSON.stringify(wednesday) &&
      JSON.stringify(wednesday) === JSON.stringify(thursday) &&
      JSON.stringify(thursday) === JSON.stringify(friday);

    if (isWeekdaysSame) {
      return (
        <>
          <p>Segunda a Sexta: {formatHours(monday)}</p>
          <p>Sábado: {formatHours(saturday)}</p>
          <p>Domingo: {formatHours(sunday)}</p>
        </>
      );
    }

    // Fallback to listing all if they differ
    return (
      <div className="space-y-1">
        <p>Segunda: {formatHours(monday)}</p>
        <p>Terça: {formatHours(tuesday)}</p>
        <p>Quarta: {formatHours(wednesday)}</p>
        <p>Quinta: {formatHours(thursday)}</p>
        <p>Sexta: {formatHours(friday)}</p>
        <p>Sábado: {formatHours(saturday)}</p>
        <p>Domingo: {formatHours(sunday)}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md fixed w-full z-50 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg text-slate-900" style={{ backgroundColor: config.primaryColor }}>
                <Scissors size={24} />
              </div>
              <span className="text-xl font-bold tracking-wider text-white uppercase">{config.appName}</span>
            </div>
            <div className="hidden md:block space-x-8">
              <a href="#servicos" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: config.primaryColor }}>SERVIÇOS</a>
              <a href="#sobre" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: config.primaryColor }}>SOBRE</a>
              <a href="#contato" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: config.primaryColor }}>CONTATO</a>
            </div>
            <div>
              <Link 
                to="/login" 
                className="text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                style={{ backgroundColor: config.primaryColor }}
              >
                <User size={16} />
                ÁREA DO CLIENTE
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={config.heroImage}
            alt="Interior" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <div className="md:w-2/3">
            <div className="inline-block px-3 py-1 mb-6 border rounded-full bg-opacity-10 text-xs font-bold tracking-widest uppercase" 
                 style={{ borderColor: `${config.primaryColor}80`, backgroundColor: `${config.primaryColor}10`, color: config.primaryColor }}>
              Desde 2015
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              {mainTitle}
              {highlightedTitle && <br/>}
              <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${config.primaryColor}, #ffffff)` }}>
                {highlightedTitle}
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-xl leading-relaxed">
              {config.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link 
                to="/login" 
                className="text-slate-900 text-lg px-8 py-4 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-2"
                style={{ backgroundColor: config.primaryColor, boxShadow: `0 10px 15px -3px ${config.primaryColor}20` }}
              >
                <Calendar size={20} />
                AGENDE AGORA
              </Link>
              <a 
                href="#servicos" 
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-lg px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center"
              >
                Conhecer Serviços
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section (Dynamic) */}
      <div id="servicos" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Nossos Serviços</h2>
            <div className="w-20 h-1 mx-auto rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.slice(0, 3).map((service, idx) => (
              <div key={service.id} className="bg-slate-900 p-8 rounded-2xl border border-white/5 hover:border-opacity-50 transition-all group"
                   style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 transition-colors group-hover:bg-opacity-20"
                     style={{ color: config.primaryColor }}>
                   {/* Rotate Icons based on index just for visual variety if desired */}
                   {idx % 3 === 0 ? <Scissors size={32} /> : idx % 3 === 1 ? <User size={32} /> : <Star size={32} />}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{service.name}</h3>
                <p className="text-slate-400 mb-6 line-clamp-2">{service.description}</p>
                <span className="font-bold text-lg" style={{ color: config.primaryColor }}>R$ {service.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
           {services.length === 0 && <p className="text-center text-slate-500">Nenhum serviço cadastrado.</p>}
        </div>
      </div>

      {/* About Section (Dynamic from Config) */}
      <div id="sobre" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
                <div className="inline-block px-3 py-1 mb-4 border rounded-full bg-opacity-10 text-xs font-bold uppercase" 
                     style={{ borderColor: config.primaryColor, color: config.primaryColor }}>
                  Sobre Nós
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Tradição e Modernidade</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                    {config.aboutText}
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <h4 className="font-bold text-white text-xl">500+</h4>
                        <p className="text-slate-500 text-sm">Clientes Mensais</p>
                    </div>
                     <div className="bg-slate-800 p-4 rounded-xl">
                        <h4 className="font-bold text-white text-xl">4.9</h4>
                        <p className="text-slate-500 text-sm">Avaliação Média</p>
                    </div>
                </div>
            </div>
             <div className="flex-1">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <img src="https://images.unsplash.com/photo-1503951914875-befbb6491842?ixlib=rb-4.0.3&auto=format&fit=crop&w=1760&q=80" alt="Sobre" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                </div>
            </div>
        </div>
      </div>

      {/* CTA Strip */}
      <div className="py-16 relative overflow-hidden" style={{ backgroundColor: config.primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-slate-900 text-center md:text-left">
            <h2 className="text-3xl font-extrabold mb-2">Pronto para renovar o visual?</h2>
            <p className="font-medium text-slate-800/80">Agende seu horário online em menos de 1 minuto.</p>
          </div>
          <Link 
            to="/login" 
            className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-2xl flex items-center gap-2"
          >
            QUERO AGENDAR <ChevronRight />
          </Link>
        </div>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
      </div>

      {/* Info/Footer */}
      <div id="contato" className="bg-slate-950 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-400 text-sm">
          <div>
            <div className="flex items-center gap-2 text-white mb-4">
              <Clock style={{ color: config.primaryColor }} />
              <span className="font-bold">Horário de Funcionamento</span>
            </div>
            {renderWorkingHours()}
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-white mb-4">
              <MapPin style={{ color: config.primaryColor }} />
              <span className="font-bold">Localização e Contato</span>
            </div>
            <p>{config.address}</p>
            <p className="mt-2 text-lg font-bold text-white">{config.phone}</p>
          </div>

          <div className="md:text-right">
             <div className="flex items-center gap-2 text-white mb-4 md:justify-end">
              <div className="p-1 rounded-md text-slate-900" style={{ backgroundColor: config.primaryColor }}>
                <Scissors size={16} />
              </div>
              <span className="font-bold tracking-wider uppercase">{config.appName}</span>
            </div>
            <p>© 2024 Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};