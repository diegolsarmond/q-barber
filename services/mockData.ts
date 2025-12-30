
import { Appointment, Professional, Service, User, UserRole, SiteConfig, WorkScheduleItem, Expense, SubscriptionPlan, ClientSubscription, AuditLog, Branch, Product, WaitingListEntry, QueueEntry, QueueStatus, AccessProfile, PermissionKey, CashRegisterSession, Voucher, ClientRestriction } from '../types';

const today = new Date();
const formattedToday = today.toISOString().split('T')[0];
const monthDayToday = formattedToday.substring(5); // MM-DD

// Helper
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

// --- RESTRICTIONS STORE ---
export let RESTRICTIONS_STORE: ClientRestriction[] = [];

export const getRestrictions = () => Promise.resolve([...RESTRICTIONS_STORE]);

export const saveRestriction = (restriction: ClientRestriction) => {
    RESTRICTIONS_STORE.push({ ...restriction, id: `res_${Date.now()}` });
    return Promise.resolve(true);
};

export const deleteRestriction = (id: string) => {
    RESTRICTIONS_STORE = RESTRICTIONS_STORE.filter(r => r.id !== id);
    return Promise.resolve(true);
};

// --- FINANCIAL STORES ---
export let CASH_REGISTERS_STORE: CashRegisterSession[] = [
    {
        id: 'cr1',
        openedAt: daysAgo(1) + 'T08:00:00.000Z',
        closedAt: daysAgo(1) + 'T19:00:00.000Z',
        initialValue: 150.00,
        finalValue: 1450.00,
        status: 'CLOSED',
        openedBy: 'Recepcionista',
        date: daysAgo(1)
    }
];

export let VOUCHERS_STORE: Voucher[] = [
    {
        id: 'v1',
        professionalId: 'p1',
        professionalName: 'João Barbeiro',
        amount: 200.00,
        date: daysAgo(5),
        description: 'Adiantamento quinzenal',
        type: 'VALE'
    }
];

// --- ACCESS PROFILES ---
export let ACCESS_PROFILES_STORE: AccessProfile[] = [
  {
    id: 'profile_admin',
    name: 'Administrador Geral',
    description: 'Acesso total ao sistema',
    isSystem: true,
    permissions: [
      'view_dashboard', 'view_reports', 'manage_appointments', 'manage_queue', 'manage_waiting_list', 
      'manage_financial', 'manage_professionals', 'manage_clients', 'manage_services', 
      'manage_products', 'manage_branches', 'manage_subscriptions', 'manage_settings', 'view_logs'
    ]
  },
  {
    id: 'profile_professional',
    name: 'Profissional Padrão',
    description: 'Acesso à agenda e clientes',
    isSystem: true,
    permissions: [
      'view_dashboard', 'manage_appointments', 'manage_clients', 'manage_waiting_list'
    ]
  },
  {
    id: 'profile_reception',
    name: 'Recepcionista',
    description: 'Gestão de agenda, fila e clientes',
    isSystem: false,
    permissions: [
      'view_dashboard', 'manage_appointments', 'manage_queue', 'manage_waiting_list', 
      'manage_clients', 'manage_services'
    ]
  }
];

export let BRANCHES: Branch[] = [
  { id: 'b1', name: 'Matriz - Centro', address: 'Rua das Navalhas, 123, Centro', phone: '(11) 3333-0001', active: true },
  { id: 'b2', name: 'Filial - Jardins', address: 'Av. Paulista, 2000, Jardins', phone: '(11) 3333-0002', active: true },
];

export let USERS: User[] = [
  // ... (existing users)
  { 
    id: 'u1', 
    name: 'Administrador', 
    email: 'admin@sistema.com', 
    role: UserRole.ADMIN,
    profileId: 'profile_admin', 
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    phone: '+55 (11) 99999-0001',
    birthDate: '1985-05-20',
    address: 'Av. Paulista, 1000',
    preferences: { emailNotifications: true, smsNotifications: true, marketingEmails: false }
  },
  { 
    id: 'u2', 
    name: 'João Barbeiro', 
    email: 'joao@barbearia.com', 
    role: UserRole.PROFESSIONAL,
    profileId: 'profile_professional',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
    phone: '+55 (11) 99999-0002',
    birthDate: '1990-08-15',
    address: 'Rua Augusta, 500',
    preferences: { emailNotifications: true, smsNotifications: true, marketingEmails: true }
  },
  { 
    id: 'u3', 
    name: 'Dra. Ana Silva', 
    email: 'ana@clinica.com', 
    role: UserRole.PROFESSIONAL,
    profileId: 'profile_professional',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    phone: '+55 (11) 99999-0003',
    birthDate: '1988-12-01',
    address: 'Rua Oscar Freire, 200',
    preferences: { emailNotifications: true, smsNotifications: false, marketingEmails: false }
  },
  { 
    id: 'u4', 
    name: 'Alice Oliveira', 
    email: 'alice@gmail.com', 
    role: UserRole.CLIENT, 
    // Clients dont necessarily need a profileId if logic relies on role CLIENT
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    phone: '+55 (11) 98888-1111',
    birthDate: `1995-${monthDayToday}`, // ANIVERSARIANTE HOJE
    address: 'Rua dos Clientes, 10, Apt 101',
    preferences: { emailNotifications: true, smsNotifications: true, marketingEmails: true }
  },
  { 
    id: 'u5', 
    name: 'Bob Santos', 
    email: 'bob@gmail.com', 
    role: UserRole.CLIENT, 
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    phone: '+55 (11) 98888-2222',
    birthDate: '1980-07-22',
    address: 'Av. Brasil, 5000',
    preferences: { emailNotifications: false, smsNotifications: true, marketingEmails: false }
  },
  { 
    id: 'u6', 
    name: 'Carla Souza', 
    email: 'carla@gmail.com', 
    role: UserRole.CLIENT, 
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carla',
    phone: '+55 (11) 97777-3333',
    birthDate: '1992-03-15',
    address: 'Rua das Flores, 123',
    preferences: { emailNotifications: true, smsNotifications: true, marketingEmails: true }
  }
];

export let SERVICES: Service[] = [
  { 
    id: 's1', 
    name: 'Corte Clássico', 
    description: 'Corte na tesoura e finalização', 
    durationMinutes: 45, 
    price: 35.00, 
    category: 'Barbearia',
    imageUrl: 'https://images.unsplash.com/photo-1599351431202-6e0c06e7afbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    commission: 50,
    availableOnline: true,
    availableInPresentation: true
  },
  { 
    id: 's2', 
    name: 'Barba e Bigode', 
    description: 'Toalha quente e modelagem', 
    durationMinutes: 30, 
    price: 25.00, 
    category: 'Barbearia',
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    commission: 40,
    availableOnline: true,
    availableInPresentation: true
  },
  { 
    id: 's3', 
    name: 'Consulta Dermatológica', 
    description: 'Avaliação inicial da pele', 
    durationMinutes: 60, 
    price: 120.00, 
    category: 'Clínica',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    commission: 70,
    availableOnline: true,
    availableInPresentation: true
  },
  { 
    id: 's4', 
    name: 'Limpeza de Pele', 
    description: 'Limpeza profunda facial', 
    durationMinutes: 60, 
    price: 80.00, 
    category: 'Spa',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    commission: 60,
    availableOnline: true,
    availableInPresentation: true
  },
];

export let PRODUCTS_STORE: Product[] = [
  {
    id: 'prod1',
    name: 'Pomada Modeladora Matte',
    brand: 'Mestre Men',
    category: 'Cabelo',
    price: 45.00,
    costPrice: 20.00,
    commission: 10,
    quantity: 15,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prod2',
    name: 'Óleo para Barba Wood',
    brand: 'Barba Forte',
    category: 'Barba',
    price: 35.00,
    costPrice: 15.00,
    commission: 10,
    quantity: 3,
    minStock: 5, // Low stock example
    imageUrl: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prod3',
    name: 'Shampoo Anti-Caspa',
    brand: 'Clear Pro',
    category: 'Cabelo',
    price: 28.90,
    costPrice: 12.00,
    commission: 5,
    quantity: 20,
    minStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

export let SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { 
    id: 'plan1', 
    name: 'Clube do Corte', 
    description: 'Acesso vip para cortes ilimitados.', 
    price: 89.90, 
    features: ['Cortes ilimitados', '10% de desconto em produtos', 'Agendamento prioritário'], 
    active: true, 
    billingCycle: 'MONTHLY',
    externalId: 'asaas_plan_882910'
  },
  { 
    id: 'plan2', 
    name: 'Barba de Respeito', 
    description: 'Manutenção semanal da barba.', 
    price: 59.90, 
    features: ['4 Barbas por mês', 'Toalha quente grátis', 'Bebida de cortesia'], 
    active: true, 
    billingCycle: 'MONTHLY' 
  },
];

export let CLIENT_SUBSCRIPTIONS_STORE: ClientSubscription[] = [];

// Audit Logs Store
export let AUDIT_LOGS_STORE: AuditLog[] = [
  { id: 'l1', action: 'UPDATE', entity: 'SYSTEM', description: 'Configurações iniciais do sistema aplicadas.', performedBy: 'System', timestamp: daysAgo(2) + 'T10:00:00.000Z' },
  { id: 'l2', action: 'CREATE', entity: 'CLIENT', description: 'Novo cliente cadastrado: Carla Souza.', performedBy: 'Administrador', timestamp: daysAgo(1) + 'T14:30:00.000Z' },
];

// LISTA DE ESPERA (Future Dates)
export let WAITING_LIST_STORE: WaitingListEntry[] = [
    { id: 'w1', clientId: 'u5', serviceId: 's1', date: formattedToday, notes: 'Cliente prefere período da tarde.', createdAt: new Date().toISOString(), notified: false, status: 'AGUARDANDO' }
];

// ORDEM DE CHEGADA (Walk-in Today)
export let QUEUE_STORE: QueueEntry[] = [
    { id: 'q1', clientId: 'u6', clientName: 'Carla Souza', serviceId: 's4', status: 'AGUARDANDO', arrivalTime: '09:15', queueNumber: 1, date: formattedToday }
];

export let APPOINTMENTS_STORE: Appointment[] = [
  { 
    id: 'a1', clientId: 'u4', clientName: 'Alice Oliveira', professionalId: 'p1', serviceId: 's1', branchId: 'b1', date: formattedToday, time: '10:00', status: 'CONFIRMED', price: 35.00 
  },
  { 
    id: 'a2', clientId: 'u5', clientName: 'Bob Santos', professionalId: 'p1', serviceId: 's2', branchId: 'b1', date: formattedToday, time: '11:00', status: 'COMPLETED', price: 25.00, rating: 5, review: 'Ótimo serviço!' 
  },
  { 
    id: 'a3', clientId: 'u6', clientName: 'Carla Souza', professionalId: 'p2', serviceId: 's3', branchId: 'b2', date: daysAgo(1), time: '14:00', status: 'COMPLETED', price: 120.00, rating: 4 
  },
];

export let EXPENSES_STORE: Expense[] = [
  { id: 'e1', description: 'Aluguel Sala Centro', amount: 2500, date: daysAgo(5), category: 'Aluguel', status: 'PAID', recurrence: 'MONTHLY' },
  { id: 'e2', description: 'Conta de Luz', amount: 350, date: daysAgo(2), category: 'Contas', status: 'PAID', recurrence: 'MONTHLY' },
  { id: 'e3', description: 'Produtos de Limpeza', amount: 150, date: daysAgo(1), category: 'Estoque', status: 'PAID' },
];

export let SITE_CONFIG_STORE: SiteConfig = {
  appName: 'Mestre da Navalha',
  primaryColor: '#F59E0B', 
  heroTitle: 'Estilo, Tradição,Excelência',
  heroSubtitle: 'Agende seu horário com os melhores profissionais da cidade e transforme seu visual.',
  heroImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
  aboutText: 'Somos referência em cuidados masculinos e estéticos desde 2015. Nossa equipe é formada por profissionais altamente qualificados prontos para oferecer a melhor experiência.',
  address: 'Rua das Navalhas, 123 - Centro, São Paulo',
  phone: '(11) 99999-9999',
  workingHours: {
    monday: { start: '09:00', end: '20:00', isOpen: true },
    tuesday: { start: '09:00', end: '20:00', isOpen: true },
    wednesday: { start: '09:00', end: '20:00', isOpen: true },
    thursday: { start: '09:00', end: '20:00', isOpen: true },
    friday: { start: '09:00', end: '20:00', isOpen: true },
    saturday: { start: '09:00', end: '18:00', isOpen: true },
    sunday: { start: '10:00', end: '14:00', isOpen: false },
  }
};

let appointmentListeners: ((appt: Appointment) => void)[] = [];
let cancellationListeners: ((appt: Appointment) => void)[] = [];

const createDefaultSchedule = (defaultBranchId: string): WorkScheduleItem[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    startTime: '09:00',
    endTime: '18:00',
    isActive: i >= 1 && i <= 5, // Default Mon-Fri
    branchId: i >= 1 && i <= 5 ? defaultBranchId : undefined
  }));
};

export let PROFESSIONALS: Professional[] = [
  { 
    id: 'p1', userId: 'u2', name: 'João Barbeiro', specialties: ['s1', 's2'], bio: 'Especialista em cortes clássicos.', rating: 4.8, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
    mobilePhone: '(11) 99999-0002',
    isManager: true,
    availableInApp: true,
    schedule: createDefaultSchedule('b1').map(d => {
      // Example: Works Mon-Wed at Branch 1, Thu-Fri at Branch 2
      if (d.dayOfWeek >= 1 && d.dayOfWeek <= 3) {
        return { ...d, branchId: 'b1', breakStart: '12:00', breakEnd: '13:00' };
      }
      if (d.dayOfWeek >= 4 && d.dayOfWeek <= 5) {
        return { ...d, branchId: 'b2', breakStart: '12:00', breakEnd: '13:00' };
      }
      return d;
    })
  },
  { 
    id: 'p2', userId: 'u3', name: 'Dra. Ana Silva', specialties: ['s3', 's4'], bio: 'Especialista em cuidados com a pele.', rating: 4.9, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    mobilePhone: '(11) 99999-0003',
    availableInApp: true,
    schedule: createDefaultSchedule('b2').map(d => {
       return { ...d, isActive: [1, 3, 5].includes(d.dayOfWeek), startTime: '10:00', endTime: '16:00', branchId: 'b2' };
    })
  },
];

export const getBranches = () => Promise.resolve([...BRANCHES]);
export const saveBranch = (branch: Branch) => {
  const index = BRANCHES.findIndex(b => b.id === branch.id);
  if (index >= 0) BRANCHES[index] = branch;
  else BRANCHES.push({ ...branch, id: `b${Date.now()}` });
  return Promise.resolve(true);
};
export const deleteBranch = (id: string) => {
  BRANCHES = BRANCHES.filter(b => b.id !== id);
  return Promise.resolve(true);
};
export const getBranchById = (id: string) => Promise.resolve(BRANCHES.find(b => b.id === id) || null);
export const getServices = () => Promise.resolve([...SERVICES]);
export const saveService = (service: Service) => {
  const index = SERVICES.findIndex(s => s.id === service.id);
  if (index >= 0) SERVICES[index] = service;
  else SERVICES.push({ ...service, id: `s${Date.now()}` });
  return Promise.resolve(true);
};
export const deleteService = (id: string) => {
  SERVICES = SERVICES.filter(s => s.id !== id);
  return Promise.resolve(true);
};
export const getAuditLogs = () => Promise.resolve([...AUDIT_LOGS_STORE].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
export const addAuditLog = (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = { ...entry, id: `log${Date.now()}`, timestamp: new Date().toISOString() };
    AUDIT_LOGS_STORE.push(newLog);
    return Promise.resolve(newLog);
};
export const getSubscriptionPlans = () => Promise.resolve([...SUBSCRIPTION_PLANS]);
export const saveSubscriptionPlan = (plan: SubscriptionPlan) => {
  const index = SUBSCRIPTION_PLANS.findIndex(p => p.id === plan.id);
  if (index >= 0) SUBSCRIPTION_PLANS[index] = plan;
  else SUBSCRIPTION_PLANS.push({ ...plan, id: `plan${Date.now()}` });
  return Promise.resolve(true);
};
export const deleteSubscriptionPlan = (id: string) => {
  SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter(p => p.id !== id);
  return Promise.resolve(true);
};
export const syncWithAsaas = (plan: SubscriptionPlan): Promise<string> => {
    return new Promise((resolve) => { setTimeout(() => { resolve(`asaas_plan_${Math.floor(Math.random() * 1000000)}`); }, 1500); });
};
export const getClientSubscription = (userId: string) => {
  const sub = CLIENT_SUBSCRIPTIONS_STORE.find(s => s.userId === userId && s.status === 'ACTIVE');
  return Promise.resolve(sub || null);
};
export const subscribeToPlan = (userId: string, plan: SubscriptionPlan) => {
  CLIENT_SUBSCRIPTIONS_STORE.forEach(s => { if(s.userId === userId) s.status = 'CANCELLED'; });
  const startDate = new Date();
  const nextBilling = new Date(startDate);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  const newSub: ClientSubscription = {
    id: `sub${Date.now()}`, userId, planId: plan.id, planName: plan.name, price: plan.price, startDate: startDate.toISOString().split('T')[0], nextBillingDate: nextBilling.toISOString().split('T')[0], status: 'ACTIVE'
  };
  CLIENT_SUBSCRIPTIONS_STORE.push(newSub);
  return Promise.resolve(newSub);
};
export const cancelClientSubscription = (userId: string) => {
  const sub = CLIENT_SUBSCRIPTIONS_STORE.find(s => s.userId === userId && s.status === 'ACTIVE');
  if (sub) sub.status = 'CANCELLED';
  return Promise.resolve(true);
};
export const getProfessionals = () => Promise.resolve([...PROFESSIONALS]);
export const getProfessionalsByService = (serviceId: string) => {
  return Promise.resolve(PROFESSIONALS.filter(p => p.specialties.includes(serviceId)));
};
export const saveProfessional = (prof: Professional) => {
  const index = PROFESSIONALS.findIndex(p => p.id === prof.id);
  if (index >= 0) PROFESSIONALS[index] = prof;
  else PROFESSIONALS.push({ ...prof, id: `p${Date.now()}` });
  return Promise.resolve(true);
};
export const deleteProfessional = (id: string) => {
  PROFESSIONALS = PROFESSIONALS.filter(p => p.id !== id);
  return Promise.resolve(true);
};
export const getUserById = (id: string) => Promise.resolve(USERS.find(u => u.id === id) || null);
export const getClients = () => Promise.resolve(USERS.filter(u => u.role === UserRole.CLIENT));
export const saveUser = (user: User) => {
  const index = USERS.findIndex(u => u.id === user.id);
  if (index >= 0) { USERS[index] = user; return Promise.resolve(user); } 
  else { const newUser = { ...user, id: user.id || `u${Date.now()}` }; USERS.push(newUser); return Promise.resolve(newUser); }
};
export const registerUser = (userData: Omit<User, 'id' | 'avatarUrl' | 'preferences'>) => {
  const newUser: User = { ...userData, id: `u${Date.now()}`, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`, preferences: { emailNotifications: true, smsNotifications: true, marketingEmails: false } };
  USERS.push(newUser);
  return Promise.resolve(newUser);
};
export const deleteUser = (id: string) => { USERS = USERS.filter(u => u.id !== id); return Promise.resolve(true); };
export const updateUserPassword = (userId: string, newPass: string) => { return new Promise((resolve) => { setTimeout(() => resolve(true), 800); }); };
export const uploadImage = (file: File): Promise<string> => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result as string); reader.onerror = (error) => reject(error); }); };
export const getSiteConfig = () => Promise.resolve({ ...SITE_CONFIG_STORE });
export const saveSiteConfig = (config: SiteConfig) => { SITE_CONFIG_STORE = { ...config }; return Promise.resolve(true); };
export const getAppointments = () => Promise.resolve([...APPOINTMENTS_STORE]);

// --- ACCESS PROFILE HELPERS ---
export const getAccessProfiles = () => Promise.resolve([...ACCESS_PROFILES_STORE]);
export const saveAccessProfile = (profile: AccessProfile) => {
    const index = ACCESS_PROFILES_STORE.findIndex(p => p.id === profile.id);
    if (index >= 0) {
        ACCESS_PROFILES_STORE[index] = profile;
    } else {
        ACCESS_PROFILES_STORE.push({ ...profile, id: `profile_${Date.now()}` });
    }
    return Promise.resolve(true);
};
export const deleteAccessProfile = (id: string) => {
    ACCESS_PROFILES_STORE = ACCESS_PROFILES_STORE.filter(p => p.id !== id);
    return Promise.resolve(true);
};
export const getProfileById = (id: string) => Promise.resolve(ACCESS_PROFILES_STORE.find(p => p.id === id));

// Notification Subscriptions
export const subscribeToNewAppointments = (listener: (appt: Appointment) => void) => {
  appointmentListeners.push(listener);
  return () => { const idx = appointmentListeners.indexOf(listener); if (idx > -1) appointmentListeners.splice(idx, 1); };
};

export const subscribeToCancellations = (listener: (appt: Appointment) => void) => {
  cancellationListeners.push(listener);
  return () => { const idx = cancellationListeners.indexOf(listener); if (idx > -1) cancellationListeners.splice(idx, 1); };
};

export const createAppointment = (appt: Omit<Appointment, 'id' | 'status'>) => {
  const newAppt: Appointment = { ...appt, id: `a${Date.now()}`, status: 'CONFIRMED' };
  APPOINTMENTS_STORE.push(newAppt);
  appointmentListeners.forEach(fn => fn(newAppt));
  return Promise.resolve(newAppt);
};
export const cancelAppointment = (id: string) => {
    const appt = APPOINTMENTS_STORE.find(a => a.id === id);
    if (appt) {
      appt.status = 'CANCELLED';
      // Trigger Listeners for Waiting List logic
      cancellationListeners.forEach(fn => fn(appt));
    }
    return Promise.resolve(true);
};
export const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    const appt = APPOINTMENTS_STORE.find(a => a.id === id);
    if (appt) {
      appt.status = status;
      if (status === 'CANCELLED') {
          cancellationListeners.forEach(fn => fn(appt));
      }
    }
    return Promise.resolve(true);
};
export const rateAppointment = (id: string, rating: number, review?: string) => {
    const appt = APPOINTMENTS_STORE.find(a => a.id === id);
    if (appt) {
      appt.rating = rating;
      appt.review = review;
    }
    return Promise.resolve(true);
};
export const getAvailableSlots = async (professionalId: string, date: string, duration: number, branchId: string): Promise<string[]> => {
    const prof = PROFESSIONALS.find(p => p.id === professionalId);
    if (!prof) return [];
    
    // Check if the whole day is blocked by a "Fechamento de Agenda" (status=BLOCKED and time=00:00)
    const existingAppts = APPOINTMENTS_STORE.filter(a => 
      a.professionalId === professionalId && 
      a.date === date && 
      a.status !== 'CANCELLED'
    );

    const isDayBlocked = existingAppts.some(a => a.status === 'BLOCKED' && a.time === '00:00');
    if (isDayBlocked) return [];

    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const schedule = prof.schedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule || !schedule.isActive) return [];
    if (branchId && schedule.branchId !== branchId) return [];
  
    const slots: string[] = [];
    let current = parseInt(schedule.startTime.split(':')[0]) * 60 + parseInt(schedule.startTime.split(':')[1]);
    const end = parseInt(schedule.endTime.split(':')[0]) * 60 + parseInt(schedule.endTime.split(':')[1]);
    
    let breakStart = 0;
    let breakEnd = 0;
    if (schedule.breakStart && schedule.breakEnd) {
        breakStart = parseInt(schedule.breakStart.split(':')[0]) * 60 + parseInt(schedule.breakStart.split(':')[1]);
        breakEnd = parseInt(schedule.breakEnd.split(':')[0]) * 60 + parseInt(schedule.breakEnd.split(':')[1]);
    }
  
    while (current + duration <= end) {
      const timeString = `${Math.floor(current / 60).toString().padStart(2, '0')}:${(current % 60).toString().padStart(2, '0')}`;
      
      const isBreak = current >= breakStart && current < breakEnd;
      
      const isTaken = existingAppts.some(a => a.time === timeString);
  
      if (!isBreak && !isTaken) {
        slots.push(timeString);
      }
      current += 30;
    }
    
    return Promise.resolve(slots);
};
export const simulateRealTimeAppointment = () => {
    const newAppt: Appointment = {
      id: `sim${Date.now()}`,
      clientId: 'u4',
      clientName: 'Alice Oliveira',
      professionalId: 'p1',
      serviceId: 's1',
      branchId: 'b1',
      date: formattedToday,
      time: '15:00',
      status: 'CONFIRMED',
      price: 35.00
    };
    APPOINTMENTS_STORE.push(newAppt);
    appointmentListeners.forEach(fn => fn(newAppt));
};

export const getExpenses = () => Promise.resolve([...EXPENSES_STORE]);
export const saveExpense = (expense: Expense) => {
  const index = EXPENSES_STORE.findIndex(e => e.id === expense.id);
  if (index >= 0) EXPENSES_STORE[index] = expense;
  else EXPENSES_STORE.push({ ...expense, id: `e${Date.now()}` });
  return Promise.resolve(true);
};
export const deleteExpense = (id: string) => { EXPENSES_STORE = EXPENSES_STORE.filter(e => e.id !== id); return Promise.resolve(true); };

// --- Products Helpers ---
export const getProducts = () => Promise.resolve([...PRODUCTS_STORE]);

export const saveProduct = (product: Product) => {
  const index = PRODUCTS_STORE.findIndex(p => p.id === product.id);
  if (index >= 0) {
    PRODUCTS_STORE[index] = product;
  } else {
    PRODUCTS_STORE.push({ ...product, id: `prod${Date.now()}` });
  }
  return Promise.resolve(true);
};

export const deleteProduct = (id: string) => {
  PRODUCTS_STORE = PRODUCTS_STORE.filter(p => p.id !== id);
  return Promise.resolve(true);
};

// --- WAITING LIST (CANCELLATION STANDBY) ---
export const getWaitingList = () => Promise.resolve([...WAITING_LIST_STORE]);

export const saveWaitingListEntry = (entry: WaitingListEntry) => {
    const index = WAITING_LIST_STORE.findIndex(w => w.id === entry.id);
    if (index >= 0) {
        WAITING_LIST_STORE[index] = entry;
    } else {
        WAITING_LIST_STORE.push({ 
            ...entry, 
            id: `w${Date.now()}`, 
            createdAt: new Date().toISOString(),
            notified: false
        });
    }
    return Promise.resolve(true);
};

export const deleteWaitingListEntry = (id: string) => {
    const idx = WAITING_LIST_STORE.findIndex(w => w.id === id);
    if (idx > -1) WAITING_LIST_STORE.splice(idx, 1);
    return Promise.resolve(true);
};

// --- QUEUE (ORDEM DE CHEGADA) ---
export const getQueue = () => Promise.resolve([...QUEUE_STORE]);

export const saveQueueEntry = (entry: QueueEntry) => {
    const index = QUEUE_STORE.findIndex(q => q.id === entry.id);
    if (index >= 0) {
        QUEUE_STORE[index] = entry;
    } else {
        // Calculate next queue number for TODAY
        const countToday = QUEUE_STORE.filter(q => q.date === entry.date).length;
        
        QUEUE_STORE.push({ 
            ...entry, 
            id: `q${Date.now()}`, 
            status: 'AGUARDANDO',
            queueNumber: countToday + 1
        });
    }
    return Promise.resolve(true);
};

export const updateQueueStatus = (id: string, status: QueueStatus) => {
    const entry = QUEUE_STORE.find(q => q.id === id);
    if (entry) {
        entry.status = status;
    }
    return Promise.resolve(true);
};

export const deleteQueueEntry = (id: string) => {
    const idx = QUEUE_STORE.findIndex(q => q.id === id);
    if (idx > -1) QUEUE_STORE.splice(idx, 1);
    return Promise.resolve(true);
};

export const clearDailyQueue = (date: string) => {
    // Keeps only active or waiting entries, clears completed/cancelled
    QUEUE_STORE = QUEUE_STORE.filter(q => q.date !== date || (q.status !== 'CONCLUIDO' && q.status !== 'CANCELADO'));
    return Promise.resolve(true);
};

// --- FINANCIAL HELPERS ---

export const getCashRegisters = () => Promise.resolve([...CASH_REGISTERS_STORE].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

export const openRegister = (session: Omit<CashRegisterSession, 'id'>) => {
    const newSession = { ...session, id: `cr${Date.now()}` };
    CASH_REGISTERS_STORE.unshift(newSession);
    return Promise.resolve(newSession);
};

export const getVouchers = () => Promise.resolve([...VOUCHERS_STORE]);

export const saveVoucher = (voucher: Voucher) => {
    const index = VOUCHERS_STORE.findIndex(v => v.id === voucher.id);
    if (index >= 0) {
        VOUCHERS_STORE[index] = voucher;
    } else {
        VOUCHERS_STORE.push({ ...voucher, id: `v${Date.now()}` });
    }
    return Promise.resolve(true);
};