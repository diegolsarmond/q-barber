-- ============================================
-- Q-Barber - Sistema de Agendamento
-- Database Migration: 001_init_schema.sql
-- Criado em: 2024
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- Papel do usuário no sistema
CREATE TYPE user_role AS ENUM ('ADMIN', 'PROFESSIONAL', 'CLIENT');

-- Status de agendamento
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'BLOCKED');

-- Status de despesa
CREATE TYPE expense_status AS ENUM ('PAID', 'PENDING');

-- Categoria de despesa
CREATE TYPE expense_category AS ENUM ('Aluguel', 'Contas', 'Salários', 'Estoque', 'Marketing', 'Outros');

-- Recorrência de despesa
CREATE TYPE expense_recurrence AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- Categoria de serviço
CREATE TYPE service_category AS ENUM ('Barbearia', 'Clínica', 'Spa', 'Médico', 'Outro');

-- Tipo de preço do serviço
CREATE TYPE service_price_type AS ENUM ('FIXED', 'FROM');

-- Ciclo de cobrança da assinatura
CREATE TYPE billing_cycle AS ENUM ('MONTHLY', 'YEARLY');

-- Status de assinatura do cliente
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE');

-- Ação de auditoria
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- Entidade de auditoria
CREATE TYPE audit_entity AS ENUM ('SERVICE', 'PROFESSIONAL', 'CLIENT', 'EXPENSE', 'SYSTEM', 'BRANCH', 'PRODUCT');

-- Status da fila
CREATE TYPE queue_status AS ENUM ('AGUARDANDO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO');

-- Status da lista de espera
CREATE TYPE waiting_list_status AS ENUM ('AGUARDANDO', 'NOTIFICADO', 'CONCLUIDO', 'CANCELADO');

-- Status do caixa
CREATE TYPE cash_register_status AS ENUM ('OPEN', 'CLOSED');

-- Tipo de vale
CREATE TYPE voucher_type AS ENUM ('VALE', 'ADIANTAMENTO');

-- Gênero
CREATE TYPE gender_type AS ENUM ('Masculino', 'Feminino', 'Outro');

-- Tipo de restrição de cliente
CREATE TYPE restriction_type AS ENUM ('BLOCK_PROFESSIONAL', 'BLOCK_ALL');

-- Status de transação financeira
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');

-- Status de instância WhatsApp
CREATE TYPE whatsapp_instance_status AS ENUM ('disconnected', 'connecting', 'connected');

-- Tipo de mensagem WhatsApp
CREATE TYPE whatsapp_message_type AS ENUM ('text', 'image', 'video', 'audio', 'document');

-- Status de mensagem WhatsApp
CREATE TYPE whatsapp_message_status AS ENUM ('pending', 'sent', 'delivered', 'read');

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela de Filiais
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para branches
CREATE INDEX idx_branches_active ON branches(active);

-- ============================================

-- Tabela de Perfis de Acesso
CREATE TABLE access_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para access_profiles
CREATE INDEX idx_access_profiles_is_system ON access_profiles(is_system);

-- ============================================

-- Tabela de Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'CLIENT',
    profile_id UUID REFERENCES access_profiles(id) ON DELETE SET NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    birth_date DATE,
    address TEXT,
    -- Preferências do usuário (JSON)
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_profile_id ON users(profile_id);

-- ============================================

-- Tabela de Serviços
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    category service_category NOT NULL DEFAULT 'Outro',
    image_url TEXT,
    commission DECIMAL(5, 2) DEFAULT 0.00,
    price_type service_price_type DEFAULT 'FIXED',
    return_days INTEGER,
    available_online BOOLEAN DEFAULT TRUE,
    available_in_presentation BOOLEAN DEFAULT TRUE,
    show_price_in_presentation BOOLEAN DEFAULT TRUE,
    simultaneous_quantity INTEGER DEFAULT 1,
    -- Configuração de fidelidade (JSON)
    loyalty_enabled BOOLEAN DEFAULT FALSE,
    loyalty_points_to_redeem INTEGER DEFAULT 0,
    loyalty_points_to_accumulate INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para services
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_services_available_online ON services(available_online);

-- ============================================

-- Tabela de Profissionais
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    avatar_url TEXT,
    is_manager BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    mobile_phone VARCHAR(50),
    phone VARCHAR(50),
    cpf VARCHAR(20),
    rg VARCHAR(20),
    gender gender_type,
    birth_date DATE,
    nickname VARCHAR(100),
    available_in_app BOOLEAN DEFAULT TRUE,
    available_in_presentation BOOLEAN DEFAULT TRUE,
    -- Endereço
    address_zip_code VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para professionals
CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_active ON professionals(active);
CREATE INDEX idx_professionals_is_manager ON professionals(is_manager);

-- ============================================

-- Tabela de Especialidades do Profissional (relacionamento N:N)
CREATE TABLE professional_specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(professional_id, service_id)
);

-- Índices para professional_specialties
CREATE INDEX idx_professional_specialties_professional ON professional_specialties(professional_id);
CREATE INDEX idx_professional_specialties_service ON professional_specialties(service_id);

-- ============================================

-- Tabela de Horários de Trabalho do Profissional
CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(professional_id, day_of_week, branch_id)
);

-- Índices para work_schedules
CREATE INDEX idx_work_schedules_professional ON work_schedules(professional_id);
CREATE INDEX idx_work_schedules_branch ON work_schedules(branch_id);
CREATE INDEX idx_work_schedules_day ON work_schedules(day_of_week);

-- ============================================

-- Tabela de Produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) DEFAULT 0.00,
    commission DECIMAL(5, 2) DEFAULT 0.00,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    barcode VARCHAR(100),
    image_url TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_low_stock ON products(quantity, min_stock) WHERE quantity <= min_stock;

-- ============================================

-- Tabela de Agendamentos
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'PENDING',
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_squeeze_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para appointments
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_branch ON appointments(branch_id);
CREATE INDEX idx_appointments_service ON appointments(service_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_professional ON appointments(date, professional_id);
CREATE INDEX idx_appointments_date_branch ON appointments(date, branch_id);

-- ============================================

-- Tabela de Despesas
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL,
    category expense_category NOT NULL DEFAULT 'Outros',
    status expense_status NOT NULL DEFAULT 'PENDING',
    recurrence expense_recurrence,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para expenses
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_branch ON expenses(branch_id);

-- ============================================

-- Tabela de Planos de Assinatura
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    features TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    billing_cycle billing_cycle NOT NULL DEFAULT 'MONTHLY',
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para subscription_plans
CREATE INDEX idx_subscription_plans_active ON subscription_plans(active);
CREATE INDEX idx_subscription_plans_external ON subscription_plans(external_id);

-- ============================================

-- Tabela de Assinaturas de Clientes
CREATE TABLE client_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para client_subscriptions
CREATE INDEX idx_client_subscriptions_user ON client_subscriptions(user_id);
CREATE INDEX idx_client_subscriptions_plan ON client_subscriptions(plan_id);
CREATE INDEX idx_client_subscriptions_status ON client_subscriptions(status);
CREATE INDEX idx_client_subscriptions_next_billing ON client_subscriptions(next_billing_date);

-- ============================================

-- Tabela de Logs de Auditoria
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action audit_action NOT NULL,
    entity audit_entity NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);

-- ============================================

-- Tabela de Lista de Espera
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    notes TEXT,
    notified BOOLEAN DEFAULT FALSE,
    status waiting_list_status NOT NULL DEFAULT 'AGUARDANDO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para waiting_list
CREATE INDEX idx_waiting_list_client ON waiting_list(client_id);
CREATE INDEX idx_waiting_list_service ON waiting_list(service_id);
CREATE INDEX idx_waiting_list_professional ON waiting_list(professional_id);
CREATE INDEX idx_waiting_list_date ON waiting_list(date);
CREATE INDEX idx_waiting_list_status ON waiting_list(status);

-- ============================================

-- Tabela de Fila (Ordem de Chegada)
CREATE TABLE queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    status queue_status NOT NULL DEFAULT 'AGUARDANDO',
    arrival_time TIME NOT NULL,
    queue_number INTEGER NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para queue
CREATE INDEX idx_queue_date ON queue(date);
CREATE INDEX idx_queue_status ON queue(status);
CREATE INDEX idx_queue_professional ON queue(professional_id);
CREATE INDEX idx_queue_branch ON queue(branch_id);
CREATE INDEX idx_queue_date_status ON queue(date, status);

-- ============================================

-- Tabela de Sessões de Caixa
CREATE TABLE cash_register_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_value DECIMAL(10, 2),
    status cash_register_status NOT NULL DEFAULT 'OPEN',
    opened_by VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para cash_register_sessions
CREATE INDEX idx_cash_register_date ON cash_register_sessions(date);
CREATE INDEX idx_cash_register_status ON cash_register_sessions(status);
CREATE INDEX idx_cash_register_branch ON cash_register_sessions(branch_id);

-- ============================================

-- Tabela de Vales/Adiantamentos
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    professional_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL,
    description TEXT,
    type voucher_type NOT NULL DEFAULT 'VALE',
    payment_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para vouchers
CREATE INDEX idx_vouchers_professional ON vouchers(professional_id);
CREATE INDEX idx_vouchers_date ON vouchers(date);
CREATE INDEX idx_vouchers_type ON vouchers(type);

-- ============================================

-- Tabela de Transações Financeiras
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type transaction_type NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL,
    category VARCHAR(100),
    status expense_status NOT NULL DEFAULT 'PENDING',
    due_date DATE,
    payment_date DATE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para financial_transactions
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_branch ON financial_transactions(branch_id);
CREATE INDEX idx_financial_transactions_appointment ON financial_transactions(appointment_id);

-- ============================================

-- Tabela de Restrições de Clientes
CREATE TABLE client_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    type restriction_type NOT NULL DEFAULT 'BLOCK_PROFESSIONAL',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para client_restrictions
CREATE INDEX idx_client_restrictions_client ON client_restrictions(client_id);
CREATE INDEX idx_client_restrictions_professional ON client_restrictions(professional_id);
CREATE INDEX idx_client_restrictions_type ON client_restrictions(type);

-- ============================================

-- Tabela de Configuração do Site
CREATE TABLE site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_name VARCHAR(255) NOT NULL DEFAULT 'Q-Barber',
    primary_color VARCHAR(50) DEFAULT '#F59E0B',
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_image TEXT,
    about_text TEXT,
    address TEXT,
    phone VARCHAR(50),
    -- Horários de funcionamento (JSONB para flexibilidade)
    working_hours JSONB DEFAULT '{
        "monday": {"start": "09:00", "end": "18:00", "isOpen": true},
        "tuesday": {"start": "09:00", "end": "18:00", "isOpen": true},
        "wednesday": {"start": "09:00", "end": "18:00", "isOpen": true},
        "thursday": {"start": "09:00", "end": "18:00", "isOpen": true},
        "friday": {"start": "09:00", "end": "18:00", "isOpen": true},
        "saturday": {"start": "09:00", "end": "14:00", "isOpen": true},
        "sunday": {"start": "00:00", "end": "00:00", "isOpen": false}
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- Tabela de Instâncias WhatsApp
CREATE TABLE whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status whatsapp_instance_status NOT NULL DEFAULT 'disconnected',
    token VARCHAR(500),
    profile_name VARCHAR(255),
    profile_pic_url TEXT,
    number VARCHAR(50),
    qrcode TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para whatsapp_instances
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX idx_whatsapp_instances_branch ON whatsapp_instances(branch_id);

-- ============================================

-- Tabela de Chats WhatsApp
CREATE TABLE whatsapp_chats (
    id VARCHAR(100) PRIMARY KEY, -- JID
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image TEXT,
    unread_count INTEGER DEFAULT 0,
    last_message TEXT,
    last_message_timestamp BIGINT,
    is_group BOOLEAN DEFAULT FALSE,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para whatsapp_chats
CREATE INDEX idx_whatsapp_chats_instance ON whatsapp_chats(instance_id);
CREATE INDEX idx_whatsapp_chats_phone ON whatsapp_chats(phone);

-- ============================================

-- Tabela de Mensagens WhatsApp
CREATE TABLE whatsapp_messages (
    id VARCHAR(100) PRIMARY KEY,
    chat_id VARCHAR(100) NOT NULL REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
    from_me BOOLEAN DEFAULT FALSE,
    type whatsapp_message_type NOT NULL DEFAULT 'text',
    text TEXT,
    file_url TEXT,
    timestamp BIGINT NOT NULL,
    status whatsapp_message_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para whatsapp_messages
CREATE INDEX idx_whatsapp_messages_chat ON whatsapp_messages(chat_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

-- ============================================
-- FUNCTIONS E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at em todas as tabelas relevantes
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_access_profiles_updated_at BEFORE UPDATE ON access_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_schedules_updated_at BEFORE UPDATE ON work_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_subscriptions_updated_at BEFORE UPDATE ON client_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waiting_list_updated_at BEFORE UPDATE ON waiting_list FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queue_updated_at BEFORE UPDATE ON queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_register_sessions_updated_at BEFORE UPDATE ON cash_register_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_chats_updated_at BEFORE UPDATE ON whatsapp_chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS (SEED DATA)
-- ============================================

-- Inserir perfis de acesso padrão
INSERT INTO access_profiles (id, name, description, permissions, is_system) VALUES
    (uuid_generate_v4(), 'Administrador Geral', 'Acesso total ao sistema', 
     ARRAY['view_dashboard', 'view_reports', 'manage_appointments', 'manage_queue', 'manage_waiting_list', 
           'manage_financial', 'manage_professionals', 'manage_clients', 'manage_services', 
           'manage_products', 'manage_branches', 'manage_subscriptions', 'manage_settings', 'view_logs'], 
     TRUE),
    (uuid_generate_v4(), 'Profissional Padrão', 'Acesso à agenda e clientes', 
     ARRAY['view_dashboard', 'manage_appointments', 'manage_clients', 'manage_waiting_list'], 
     TRUE),
    (uuid_generate_v4(), 'Recepcionista', 'Gestão de agenda, fila e clientes', 
     ARRAY['view_dashboard', 'manage_appointments', 'manage_queue', 'manage_waiting_list', 
           'manage_clients', 'manage_services'], 
     FALSE);

-- Inserir configuração padrão do site
INSERT INTO site_config (app_name, primary_color, hero_title, hero_subtitle, about_text, address, phone) VALUES
    ('Q-Barber', '#F59E0B', 'Estilo, Tradição, Excelência', 
     'Agende seu horário com os melhores profissionais da cidade e transforme seu visual.',
     'Somos referência em cuidados masculinos e estéticos. Nossa equipe é formada por profissionais altamente qualificados prontos para oferecer a melhor experiência.',
     'Rua das Navalhas, 123 - Centro', '(11) 99999-9999');

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE branches IS 'Filiais/unidades do estabelecimento';
COMMENT ON TABLE access_profiles IS 'Perfis de acesso com permissões customizáveis';
COMMENT ON TABLE users IS 'Usuários do sistema (admins, profissionais e clientes)';
COMMENT ON TABLE services IS 'Serviços oferecidos pelo estabelecimento';
COMMENT ON TABLE professionals IS 'Profissionais que prestam serviços';
COMMENT ON TABLE professional_specialties IS 'Relacionamento N:N entre profissionais e serviços';
COMMENT ON TABLE work_schedules IS 'Horários de trabalho dos profissionais por dia da semana';
COMMENT ON TABLE products IS 'Produtos para venda e controle de estoque';
COMMENT ON TABLE appointments IS 'Agendamentos de serviços';
COMMENT ON TABLE expenses IS 'Despesas e contas a pagar';
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura oferecidos';
COMMENT ON TABLE client_subscriptions IS 'Assinaturas ativas dos clientes';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para rastreamento de ações';
COMMENT ON TABLE waiting_list IS 'Lista de espera para vagas em datas específicas';
COMMENT ON TABLE queue IS 'Fila de atendimento por ordem de chegada';
COMMENT ON TABLE cash_register_sessions IS 'Sessões de caixa (abertura/fechamento)';
COMMENT ON TABLE vouchers IS 'Vales e adiantamentos para profissionais';
COMMENT ON TABLE financial_transactions IS 'Transações financeiras (receitas e despesas)';
COMMENT ON TABLE client_restrictions IS 'Restrições de clientes com profissionais';
COMMENT ON TABLE site_config IS 'Configurações visuais e informações do site';
COMMENT ON TABLE whatsapp_instances IS 'Instâncias de conexão com WhatsApp';
COMMENT ON TABLE whatsapp_chats IS 'Conversas do WhatsApp';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens do WhatsApp';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================