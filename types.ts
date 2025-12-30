
export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL',
  CLIENT = 'CLIENT',
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileId?: string; // Link para o Perfil de Acesso Personalizado
  avatarUrl?: string;
  phone?: string;
  birthDate?: string; // YYYY-MM-DD
  address?: string;
  preferences?: UserPreferences;
}

// --- PERMISSIONS SYSTEM ---

export type PermissionKey =
  | 'view_dashboard'
  | 'view_reports'        // Novo: Módulo de Relatórios
  | 'manage_appointments' // Agenda Geral
  | 'manage_queue'        // Fila
  | 'manage_waiting_list' // Lista Espera
  | 'manage_financial'    // Financeiro
  | 'manage_professionals'
  | 'manage_clients'
  | 'manage_services'
  | 'manage_products'
  | 'manage_branches'
  | 'manage_subscriptions'
  | 'manage_settings'     // Site & Permissões
  | 'view_logs';

export interface AccessProfile {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionKey[];
  isSystem?: boolean; // Se true, não pode ser deletado (ex: Admin Principal)
}

export const AVAILABLE_MODULES: { key: PermissionKey; label: string; group: string }[] = [
  { key: 'view_dashboard', label: 'Visão Geral (Dashboard)', group: 'Geral' },
  { key: 'view_reports', label: 'Relatórios Avançados', group: 'Geral' },
  { key: 'manage_appointments', label: 'Agenda Completa', group: 'Operacional' },
  { key: 'manage_queue', label: 'Ordem de Chegada', group: 'Operacional' },
  { key: 'manage_waiting_list', label: 'Lista de Espera', group: 'Operacional' },
  { key: 'manage_financial', label: 'Gestão Financeira', group: 'Administrativo' },
  { key: 'manage_professionals', label: 'Profissionais', group: 'Cadastros' },
  { key: 'manage_clients', label: 'Clientes', group: 'Cadastros' },
  { key: 'manage_services', label: 'Serviços', group: 'Cadastros' },
  { key: 'manage_products', label: 'Produtos/Estoque', group: 'Cadastros' },
  { key: 'manage_branches', label: 'Filiais', group: 'Cadastros' },
  { key: 'manage_subscriptions', label: 'Planos de Assinatura', group: 'Administrativo' },
  { key: 'manage_settings', label: 'Configurações & Perfis', group: 'Sistema' },
  { key: 'view_logs', label: 'Logs de Auditoria', group: 'Sistema' },
];

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
}

export interface LoyaltyConfig {
  enabled: boolean;
  pointsToRedeem: number;
  pointsToAccumulate: number;
}

export interface Product {
  id: string;
  name: string; // Descrição
  brand: string; // Marca
  category: string;
  price: number; // Valor Venda
  costPrice: number; // Valor Custo (para relatórios de lucro)
  commission: number; // % Comissão por venda
  quantity: number; // Qtde Atual
  minStock: number; // Estoque Mínimo
  barcode?: string;
  imageUrl?: string;
  description?: string; // Obs
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: 'Barbearia' | 'Clínica' | 'Spa' | 'Médico' | 'Outro';
  imageUrl?: string;
  // New fields based on screenshot
  commission?: number; // %
  priceType?: 'FIXED' | 'FROM';
  returnDays?: number; // Tempo de retorno
  availableOnline?: boolean; // Disponível para Agendamento
  availableInPresentation?: boolean;
  showPriceInPresentation?: boolean;
  simultaneousQuantity?: number;
  loyalty?: LoyaltyConfig;
}

export interface WorkScheduleItem {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  breakStart?: string; // "12:00"
  breakEnd?: string;   // "13:00"
  isActive: boolean;
  branchId?: string;
}

export interface ProfessionalAddress {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Professional {
  id: string;
  userId: string;
  name: string;
  specialties: string[];
  bio: string;
  rating: number;
  avatarUrl: string;
  schedule: WorkScheduleItem[];
  // New fields based on screenshot
  isManager?: boolean;
  email?: string; // Contact email separate from User login if needed, or same
  mobilePhone?: string;
  phone?: string;
  cpf?: string; // CPF/CNPJ
  rg?: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro';
  birthDate?: string;
  nickname?: string;
  availableInApp?: boolean;
  availableInPresentation?: boolean;
  address?: ProfessionalAddress;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  branchId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'BLOCKED';
  price: number;
  notes?: string;
  rating?: number;
  review?: string;
  isSqueezeIn?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Aluguel' | 'Contas' | 'Salários' | 'Estoque' | 'Marketing' | 'Outros';
  status: 'PAID' | 'PENDING';
  recurrence?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  active: boolean;
  billingCycle: 'MONTHLY' | 'YEARLY';
  externalId?: string;
}

export interface ClientSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  startDate: string;
  nextBillingDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface DaySchedule {
  start: string;
  end: string;
  isOpen: boolean;
}

export interface SiteConfig {
  appName: string;
  primaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutText: string;
  address: string;
  phone: string;
  workingHours: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'SERVICE' | 'PROFESSIONAL' | 'CLIENT' | 'EXPENSE' | 'SYSTEM' | 'BRANCH' | 'PRODUCT';
  description: string;
  performedBy: string;
  timestamp: string;
}

export type QueueStatus = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO';

// LISTA DE ESPERA (CANCELLATION STANDBY)
export interface WaitingListEntry {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId?: string;
  date: string; // Data desejada que está cheia
  notes: string;
  createdAt: string;
  notified: boolean; // Se já foi avisado de uma vaga
  status: 'AGUARDANDO' | 'NOTIFICADO' | 'CONCLUIDO' | 'CANCELADO';
}

// ORDEM DE CHEGADA (WALK-IN QUEUE)
export interface QueueEntry {
  id: string;
  clientId: string; // Pode ser ID de cliente ou "WalkIn"
  clientName: string;
  serviceId: string;
  professionalId?: string;
  status: QueueStatus;
  arrivalTime: string; // HH:mm
  queueNumber: number; // Senha/Ordem
  date: string; // YYYY-MM-DD
}

// --- FINANCIAL TYPES ---

export interface CashRegisterSession {
  id: string;
  openedAt: string; // ISO String
  closedAt?: string | null;
  initialValue: number;
  finalValue?: number;
  status: 'OPEN' | 'CLOSED';
  openedBy: string; // User Name
  date: string; // YYYY-MM-DD (Accounting Date)
  notes?: string;
}

export interface Voucher {
  id: string;
  professionalId: string;
  professionalName: string;
  amount: number;
  date: string;
  description?: string;
  type: 'VALE' | 'ADIANTAMENTO';
  paymentMethod?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  status: 'PAID' | 'PENDING';
  dueDate?: string;
  paymentDate?: string;
}

// --- CLIENT RESTRICTION ---
export interface ClientRestriction {
  id: string;
  clientId: string;
  professionalId?: string; // If null, blocked for everyone (future feature)
  type: 'BLOCK_PROFESSIONAL' | 'BLOCK_ALL';
  reason: string;
  createdAt: string;
}

// --- WhatsApp Types ---

export type WhatsAppInstanceStatus = 'disconnected' | 'connecting' | 'connected';
export type WhatsAppPresence = 'available' | 'unavailable';
export type WhatsAppChatPresence = 'composing' | 'recording' | 'paused';
export type WhatsAppMessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'ptt' | 'ptv' | 'sticker' | 'contact' | 'location' | 'poll' | 'list' | 'buttons';
export type WhatsAppMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type WhatsAppMediaType = 'image' | 'video' | 'document' | 'audio' | 'myaudio' | 'ptt' | 'ptv' | 'sticker';

export interface WhatsAppInstance {
  id: string;
  name: string;
  status: WhatsAppInstanceStatus;
  token: string;
  profileName?: string;
  profilePicUrl?: string;
  number?: string;
  qrcode?: string;
  paircode?: string;
  isBusiness?: boolean;
  platform?: string;
  systemName?: string;
  owner?: string;
  currentPresence?: WhatsAppPresence;
  lastDisconnect?: string;
  lastDisconnectReason?: string;
  adminField01?: string;
  adminField02?: string;
  chatbotEnabled?: boolean;
  chatbotIgnoreGroups?: boolean;
  chatbotStopConversation?: string;
  chatbotStopMinutes?: number;
  created?: string;
  updated?: string;
}

export interface WhatsAppChat {
  id: string;
  name: string;
  image?: string;
  imagePreview?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTimestamp?: number;
  lastMessageType?: string;
  lastMessageSender?: string;
  isGroup: boolean;
  isGroupAdmin?: boolean;
  isGroupAnnounce?: boolean;
  phone: string;
  wa_archived?: boolean;
  wa_isBlocked?: boolean;
  wa_isPinned?: boolean;
  wa_label?: string[];
  wa_ephemeralExpiration?: number;
  wa_muteEndTime?: number;
  // Lead/CRM fields
  lead_name?: string;
  lead_fullName?: string;
  lead_email?: string;
  lead_personalId?: string;
  lead_status?: string;
  lead_tags?: string[];
  lead_notes?: string;
  lead_isTicketOpen?: boolean;
  lead_assignedAttendantId?: string;
  commonGroups?: string;
}

export interface WhatsAppMessage {
  id: string;
  messageId?: string;
  chatId: string;
  sender?: string;
  senderName?: string;
  fromMe: boolean;
  isGroup?: boolean;
  type: WhatsAppMessageType;
  source?: string;
  text?: string;
  caption?: string;
  fileUrl?: string;
  fileName?: string;
  mimetype?: string;
  timestamp: number;
  status: WhatsAppMessageStatus;
  quoted?: string;
  quotedMessage?: WhatsAppMessage;
  edited?: string;
  reaction?: string;
  vote?: string;
  convertOptions?: string;
  buttonOrListId?: string;
  wasSentByApi?: boolean;
  sendFunction?: string;
  trackSource?: string;
  trackId?: string;
  error?: string;
  // Contact message
  contactName?: string;
  contactPhone?: string;
  // Location message
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
}

// --- WhatsApp Webhook Types ---

export type WhatsAppWebhookEvent =
  | 'connection'
  | 'history'
  | 'messages'
  | 'messages_update'
  | 'call'
  | 'contacts'
  | 'presence'
  | 'groups'
  | 'labels'
  | 'chats'
  | 'chat_labels'
  | 'blocks'
  | 'leads';

export type WhatsAppMessageFilter =
  | 'wasSentByApi'
  | 'wasNotSentByApi'
  | 'fromMeYes'
  | 'fromMeNo'
  | 'isGroupYes'
  | 'isGroupNo';

export interface WhatsAppWebhook {
  id?: string;
  enabled: boolean;
  url: string;
  events: WhatsAppWebhookEvent[];
  addUrlTypesMessages?: boolean;
  addUrlEvents?: boolean;
  excludeMessages?: WhatsAppMessageFilter[];
}

// --- WhatsApp Send Payloads ---

export interface WhatsAppSendTextPayload {
  number: string;
  text: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  mentions?: string;
  forward?: boolean;
  linkPreview?: boolean;
  linkPreviewTitle?: string;
  linkPreviewDescription?: string;
  linkPreviewImage?: string;
  linkPreviewLarge?: boolean;
  trackSource?: string;
  trackId?: string;
  async?: boolean;
}

export interface WhatsAppSendMediaPayload {
  number: string;
  type: WhatsAppMediaType;
  file: string; // URL or base64
  text?: string; // Caption
  docName?: string;
  thumbnail?: string;
  mimetype?: string;
  delay?: number;
  readchat?: boolean;
  readmessages?: boolean;
  replyid?: string;
  mentions?: string;
  forward?: boolean;
  trackSource?: string;
  trackId?: string;
  async?: boolean;
}

export interface WhatsAppSendContactPayload {
  number: string;
  fullName: string;
  phoneNumber: string; // Can be comma-separated for multiple phones
  organization?: string;
  email?: string;
  url?: string;
  delay?: number;
  readchat?: boolean;
  replyid?: string;
  trackSource?: string;
  trackId?: string;
}

export interface WhatsAppSendLocationPayload {
  number: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  delay?: number;
  readchat?: boolean;
  replyid?: string;
  trackSource?: string;
  trackId?: string;
}

export interface WhatsAppPresencePayload {
  number: string;
  presence: WhatsAppChatPresence;
  delay?: number; // Duration in ms (max 5 min)
}

// --- WhatsApp Label Types ---

export interface WhatsAppLabel {
  id: string;
  labelId?: string;
  name: string;
  color: number;
  colorHex?: string;
  created?: string;
  updated?: string;
}