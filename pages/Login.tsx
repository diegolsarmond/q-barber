
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { Scissors, ArrowLeft, Mail, Shield, User, Smartphone, Chrome, Facebook, Briefcase, ChevronRight } from 'lucide-react';
import { registerUser } from '../services/mockData';

type AuthMethod = 'email' | 'phone';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  
  // Login Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);

  // Phone Mask Helper
  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    // Format: +XX (XX) XXXXX-XXXX
    if (phoneNumberLength <= 2) return `+${phoneNumber}`;
    if (phoneNumberLength <= 4) return `+${phoneNumber.slice(0, 2)} (${phoneNumber.slice(2, 4)}`;
    if (phoneNumberLength <= 9) return `+${phoneNumber.slice(0, 2)} (${phoneNumber.slice(2, 4)}) ${phoneNumber.slice(4)}`;
    return `+${phoneNumber.slice(0, 2)} (${phoneNumber.slice(2, 4)}) ${phoneNumber.slice(4, 9)}-${phoneNumber.slice(9, 13)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const formatted = formatPhone(e.target.value);
    setter(formatted);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = authMethod === 'email' ? email : phone;
    login(identifier || 'demo@user.com', role);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone) return;
    
    setLoading(true);
    try {
      const newUser = await registerUser({
        name: regName,
        email: regEmail,
        phone: regPhone,
        role: UserRole.CLIENT
      });
      login(newUser.email, UserRole.CLIENT);
    } catch (err) {
      console.error("Erro ao registrar", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    const fakeSocialEmail = `user.${provider}@social.com`;
    login(fakeSocialEmail, role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-slate-900">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
          alt="Barber Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/80"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Voltar ao Início
        </Link>

        <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex bg-amber-500 p-3 rounded-xl text-slate-900 mb-4 shadow-lg shadow-amber-500/20">
              <Scissors size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRegistering ? 'Criar Conta' : 'Bem-vindo'}
            </h1>
            <p className="text-slate-400">
              {isRegistering ? 'Apenas para novos clientes' : 'Escolha seu perfil para acessar'}
            </p>
          </div>

          {!isRegistering ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="bg-slate-900/50 p-1.5 rounded-xl flex gap-1">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.CLIENT)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    role === UserRole.CLIENT 
                      ? 'bg-amber-500 text-slate-900 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User size={18} />
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.PROFESSIONAL)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    role === UserRole.PROFESSIONAL 
                      ? 'bg-amber-500 text-slate-900 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Briefcase size={18} />
                  Profissional
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.ADMIN)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    role === UserRole.ADMIN 
                      ? 'bg-amber-500 text-slate-900 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shield size={18} />
                  Admin
                </button>
              </div>

              <div className="flex border-b border-white/10 mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 pb-3 text-sm font-medium transition-all relative ${
                    authMethod === 'email' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  E-mail
                  {authMethod === 'email' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></div>}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 pb-3 text-sm font-medium transition-all relative ${
                    authMethod === 'phone' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Telefone
                  {authMethod === 'phone' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></div>}
                </button>
              </div>

              <div>
                {authMethod === 'email' ? (
                  <div className="relative animate-fade-in">
                    <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="relative animate-fade-in">
                    <Smartphone className="absolute left-4 top-3.5 text-slate-500" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e, setPhone)}
                      placeholder="+55 (11) 99999-9999"
                      maxLength={19}
                      className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-mono"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {authMethod === 'email' ? 'Entrar com E-mail' : 'Entrar com Telefone'}
              </button>

              <div className="pt-4 border-t border-white/10">
                <p className="text-center text-xs text-slate-500 mb-4 uppercase tracking-wider">Ou continue com</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center gap-2 py-2.5 bg-white text-slate-900 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm"
                  >
                    <Chrome size={18} className="text-red-500" />
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    className="flex items-center justify-center gap-2 py-2.5 bg-[#1877F2] text-white rounded-xl hover:bg-[#166fe5] transition-colors font-medium text-sm"
                  >
                    <Facebook size={18} className="text-white" />
                    Facebook
                  </button>
                </div>
              </div>

              <div className="text-center mt-6">
                <button 
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-amber-500 hover:text-amber-400 text-sm font-bold transition-colors"
                >
                  Não tem uma conta? Criar Agora
                </button>
              </div>
            </form>
          ) : (
            /* --- REGISTER FORM --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Seu E-mail"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Smartphone className="absolute left-4 top-3.5 text-slate-500" size={20} />
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => handlePhoneChange(e, setRegPhone)}
                  placeholder="+55 (11) 99999-9999"
                  maxLength={19}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processando...' : 'Finalizar Cadastro'}
                {!loading && <ChevronRight size={18} />}
              </button>

              <div className="text-center mt-6">
                <button 
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Já tem uma conta? Voltar ao Login
                </button>
              </div>
            </form>
          )}
        </div>
        
        <p className="text-center text-slate-500 text-sm mt-8">
          &copy; 2024 Mestre da Navalha. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
