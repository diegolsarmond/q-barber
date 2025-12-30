
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserRole, PermissionKey } from '../types';
import { ACCESS_PROFILES_STORE } from '../services/mockData';
import { LogOut, Calendar, Home, Settings, Briefcase, PieChart, Users, Bell, X, Sliders, ClipboardList, User, DollarSign, Crown, Menu, CheckSquare, Sparkles, FileText, Building2, CheckCircle2, ShoppingBag, MessageSquare, List, Timer, Users2, Shield, BarChart3, ChevronDown, ChevronRight as ChevronRightIcon, Star } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ProfileSettings } from '../pages/ProfileSettings';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, latestNotification, clearLatestNotification, clearNotifications } = useNotification();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // State for collapsible menus
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Auto-hide notification toast
  useEffect(() => {
    if (latestNotification) {
      const timer = setTimeout(() => {
        clearLatestNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification, clearLatestNotification]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!user) return null;

  const isClient = user.role === UserRole.CLIENT;
  const isAdmin = user.role === UserRole.ADMIN;
  const isProfessional = user.role === UserRole.PROFESSIONAL;
  const isAdminOrProf = user.role === UserRole.ADMIN || user.role === UserRole.PROFESSIONAL;

  const hasPermission = (permission: PermissionKey): boolean => {
    if (user.role === UserRole.ADMIN) return true;
    if (user.profileId) {
      const profile = ACCESS_PROFILES_STORE.find(p => p.id === user.profileId);
      if (profile) {
        return profile.permissions.includes(permission);
      }
    }
    return false;
  };

  const handleNavClick = (path: string) => {
    if ((path === '/admin/appointments' || path === '/professional/appointments') && unreadCount > 0) {
      clearNotifications();
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-gray-100 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            {isClient ? 'C' : isProfessional ? 'P' : 'A'}
          </div>
          <span className="font-bold text-slate-800 truncate">
            {isClient ? 'Agendamentos' : isProfessional ? 'Painel Profissional' : 'Administração'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="relative">
              <Bell size={24} className="text-indigo-600" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {isAdminOrProf && latestNotification && (
        <div className="fixed top-24 md:top-6 right-4 z-[100] max-w-[calc(100vw-2rem)] w-full md:w-96 animate-slide-in-right">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5">
            <div className="p-4 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center relative">
                  <Bell size={24} className="text-indigo-600" />
                  <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-slate-900">Novo Agendamento!</h4>
                  <button onClick={clearLatestNotification} className="text-slate-400 hover:text-slate-600 p-1 -mt-1 -mr-2"><X size={16} /></button>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                  <span className="font-bold text-slate-700">{latestNotification.clientName}</span> agendou para <span className="font-bold text-indigo-600">{new Date(latestNotification.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {latestNotification.time}</span>.
                </p>
                <button
                  onClick={() => {
                    navigate(isProfessional ? '/professional/appointments' : '/admin/appointments');
                    clearNotifications();
                    clearLatestNotification();
                  }}
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg w-full transition-colors shadow-lg shadow-indigo-100"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
            <div className="h-1 bg-gray-100 w-full">
              <div className="h-full bg-indigo-500 w-full animate-[width_7s_linear_forwards]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-white w-72 md:w-64 h-screen shadow-2xl md:shadow-md flex-shrink-0 flex flex-col z-50 
        fixed md:sticky top-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100 hidden md:flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            {isClient ? 'C' : isProfessional ? 'P' : 'A'}
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">
            Mestre
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {isClient ? (
            <>
              <NavLink to="/book" icon={<Home size={20} />} active={location.pathname === '/book'}>
                Agendar Serviço
              </NavLink>
              <NavLink to="/my-appointments" icon={<Calendar size={20} />} active={location.pathname === '/my-appointments'}>
                Meus Agendamentos
              </NavLink>
              <NavLink to="/subscription" icon={<Crown size={20} />} active={location.pathname === '/subscription'}>
                Minha Assinatura
              </NavLink>
            </>
          ) : (
            <>
              {isProfessional && (
                <>
                  <NavLink to="/professional" icon={<ClipboardList size={20} />} active={location.pathname === '/professional'}>
                    Minha Agenda
                  </NavLink>
                  <NavLink
                    to="/professional/appointments"
                    icon={<CheckSquare size={20} />}
                    active={location.pathname === '/professional/appointments'}
                    badge={unreadCount > 0 ? unreadCount : undefined}
                    onClick={() => handleNavClick('/professional/appointments')}
                  >
                    Meus Atendimentos
                  </NavLink>
                  <NavLink
                    to="/professional/settings"
                    icon={<Sliders size={20} />}
                    active={location.pathname === '/professional/settings'}
                  >
                    Minhas Configurações
                  </NavLink>
                </>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: DASHBOARD
                  ════════════════════════════════════════════════════════════ */}
              {hasPermission('view_dashboard') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📊 Dashboard</p>
                  <NavLink to="/admin" icon={<PieChart size={20} />} active={location.pathname === '/admin'}>
                    Visão Geral
                  </NavLink>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: ATENDIMENTOS
                  ════════════════════════════════════════════════════════════ */}
              {(hasPermission('manage_appointments') || hasPermission('manage_queue') || hasPermission('manage_waiting_list')) && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📅 Atendimentos</p>

                  {hasPermission('manage_appointments') && (
                    <NavLink to="/admin/appointments"
                      icon={<Calendar size={20} />}
                      active={location.pathname === '/admin/appointments'}
                      onClick={() => handleNavClick('/admin/appointments')}
                      badge={unreadCount > 0 ? unreadCount : undefined}
                    >
                      Agendamentos
                    </NavLink>
                  )}

                  {hasPermission('manage_queue') && (
                    <NavLink to="/admin/queue"
                      icon={<List size={20} />}
                      active={location.pathname === '/admin/queue'}
                    >
                      Ordem de Chegada
                    </NavLink>
                  )}

                  {hasPermission('manage_waiting_list') && (
                    <NavLink to="/admin/waiting-list"
                      icon={<Timer size={20} />}
                      active={location.pathname === '/admin/waiting-list'}
                    >
                      Lista de Espera
                    </NavLink>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: COMUNICAÇÃO
                  ════════════════════════════════════════════════════════════ */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">💬 Comunicação</p>

                <NavLink to="/admin/conversations"
                  icon={<MessageSquare size={20} />}
                  active={location.pathname.includes('conversations')}
                >
                  WhatsApp
                </NavLink>

                <NavLink to="/admin/reviews"
                  icon={<Star size={20} />}
                  active={location.pathname === '/admin/reviews'}
                >
                  Avaliações
                </NavLink>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: RELATÓRIOS
                  ════════════════════════════════════════════════════════════ */}
              {hasPermission('view_reports') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📈 Relatórios</p>

                  <div className="space-y-1">
                    <button
                      onClick={() => toggleMenu('reports')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${location.pathname.includes('/admin/reports') || expandedMenus.includes('reports')
                        ? 'text-slate-900 bg-gray-50 font-bold'
                        : 'text-slate-600 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 size={20} className={location.pathname.includes('/admin/reports') ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className="text-sm">Ver Relatórios</span>
                      </div>
                      {expandedMenus.includes('reports') ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
                    </button>

                    {expandedMenus.includes('reports') && (
                      <div className="pl-4 ml-4 border-l-2 border-gray-100 space-y-1 py-1">
                        <SubMenuTrigger
                          label="Agendamentos"
                          isOpen={expandedMenus.includes('reports-agendamentos')}
                          onClick={() => toggleMenu('reports-agendamentos')}
                        >
                          <SubLink to="/admin/reports?tab=geral" label="Geral" active={location.search.includes('tab=geral')} />
                          <SubLink to="/admin/reports?tab=clientes" label="Clientes" active={location.search.includes('tab=clientes')} />
                          <SubLink to="/admin/reports?tab=profissionais" label="Profissionais" active={location.search.includes('tab=profissionais')} />
                        </SubMenuTrigger>

                        <SubMenuTrigger
                          label="Gerencial"
                          isOpen={expandedMenus.includes('reports-gerencial')}
                          onClick={() => toggleMenu('reports-gerencial')}
                        >
                          <SubLink to="/admin/reports?tab=financeiro" label="Financeiro" active={location.search.includes('tab=financeiro')} />
                          <SubLink to="/admin/reports?tab=estoque" label="Estoque" active={location.search.includes('tab=estoque')} />
                          <SubLink to="/admin/reports?tab=rankings" label="Rankings" active={location.search.includes('tab=rankings')} />
                        </SubMenuTrigger>

                        <Link to="/admin/reports?tab=aniversariantes" className="block px-4 py-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          Aniversariantes
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: CATÁLOGO
                  ════════════════════════════════════════════════════════════ */}
              {(hasPermission('manage_services') || hasPermission('manage_products')) && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">📦 Catálogo</p>

                  {hasPermission('manage_services') && (
                    <NavLink to="/admin/services" icon={<Sparkles size={20} />} active={location.pathname.includes('services')}>
                      Serviços
                    </NavLink>
                  )}

                  {hasPermission('manage_products') && (
                    <NavLink to="/admin/products" icon={<ShoppingBag size={20} />} active={location.pathname.includes('products')}>
                      Produtos
                    </NavLink>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: PESSOAS
                  ════════════════════════════════════════════════════════════ */}
              {(hasPermission('manage_clients') || hasPermission('manage_professionals')) && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">👥 Pessoas</p>

                  {hasPermission('manage_clients') && (
                    <NavLink to="/admin/clients" icon={<Users size={20} />} active={location.pathname.includes('clients')}>
                      Clientes
                    </NavLink>
                  )}

                  {hasPermission('manage_professionals') && (
                    <NavLink to="/admin/professionals" icon={<Briefcase size={20} />} active={location.pathname.includes('professionals')}>
                      Profissionais
                    </NavLink>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: ORGANIZAÇÃO
                  ════════════════════════════════════════════════════════════ */}
              {(hasPermission('manage_branches') || hasPermission('manage_subscriptions')) && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">🏢 Organização</p>

                  {hasPermission('manage_branches') && (
                    <NavLink to="/admin/branches" icon={<Building2 size={20} />} active={location.pathname.includes('branches')}>
                      Filiais
                    </NavLink>
                  )}

                  {hasPermission('manage_subscriptions') && (
                    <NavLink to="/admin/subscriptions" icon={<Crown size={20} />} active={location.pathname.includes('subscriptions')}>
                      Assinaturas
                    </NavLink>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: FINANCEIRO
                  ════════════════════════════════════════════════════════════ */}
              {hasPermission('manage_financial') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">💰 Financeiro</p>

                  <NavLink to="/admin/financial" icon={<DollarSign size={20} />} active={location.pathname === '/admin/financial'}>
                    Gestão Financeira
                  </NavLink>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SEÇÃO: SISTEMA
                  ════════════════════════════════════════════════════════════ */}
              {(hasPermission('manage_settings') || hasPermission('view_logs')) && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">⚙️ Sistema</p>

                  {hasPermission('manage_settings') && (
                    <>
                      <NavLink to="/admin/settings" icon={<Sliders size={20} />} active={location.pathname.includes('settings') && !location.pathname.includes('profiles')}>
                        Site & CMS
                      </NavLink>
                      <NavLink to="/admin/profiles" icon={<Shield size={20} />} active={location.pathname.includes('profiles')}>
                        Perfis de Acesso
                      </NavLink>
                    </>
                  )}

                  {hasPermission('view_logs') && (
                    <NavLink to="/admin/logs" icon={<FileText size={20} />} active={location.pathname.includes('logs')}>
                      Logs do Sistema
                    </NavLink>
                  )}
                </div>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group text-left"
          >
            <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white flex-shrink-0 group-hover:border-indigo-200" />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">Editar Perfil</p>
            </div>
            <Settings size={16} className="text-slate-300 group-hover:text-indigo-400" />
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            <ProfileSettings isModal={true} onClose={() => setIsProfileModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components for Menu
interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}

const NavLink = ({ to, icon, children, active, badge, onClick }: NavLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all relative overflow-hidden ${active
      ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
      : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
      }`}
  >
    <div className="flex items-center gap-3 relative z-10">
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
      <span className="text-sm">{children}</span>
    </div>
    {badge && (
      <div className="flex items-center justify-center">
        <span className={`animate-ping absolute right-4 inline-flex h-4 w-4 rounded-full ${active ? 'bg-white opacity-40' : 'bg-red-400 opacity-75'}`}></span>
        <span className={`relative inline-flex rounded-full h-5 w-5 text-[10px] font-bold items-center justify-center ${active ? 'bg-white text-indigo-600' : 'bg-red-500 text-white shadow-sm'}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      </div>
    )}
  </Link>
);

const SubMenuTrigger = ({ label, isOpen, onClick, children }: any) => (
  <div>
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <span className="flex items-center gap-2 font-medium">{isOpen ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />} {label}</span>
    </button>
    {isOpen && <div className="pl-6 space-y-1 mt-1">{children}</div>}
  </div>
);

const SubLink = ({ to, label, active }: any) => (
  <Link
    to={to}
    className={`block px-4 py-2 text-xs rounded-lg transition-colors ${active ? 'text-indigo-700 bg-indigo-50 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
  >
    {label}
  </Link>
);
