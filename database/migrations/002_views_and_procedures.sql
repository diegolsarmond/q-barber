-- ============================================
-- Q-Barber - Sistema de Agendamento
-- Database Migration: 002_views_and_procedures.sql
-- Views e Procedures para Relatórios
-- ============================================

-- ============================================
-- VIEWS PARA DASHBOARD E RELATÓRIOS
-- ============================================

-- View: Resumo diário de agendamentos
CREATE OR REPLACE VIEW vw_daily_appointments_summary AS
SELECT 
    a.date,
    a.branch_id,
    b.name AS branch_name,
    COUNT(*) AS total_appointments,
    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) AS completed,
    COUNT(CASE WHEN a.status = 'CANCELLED' THEN 1 END) AS cancelled,
    COUNT(CASE WHEN a.status = 'CONFIRMED' THEN 1 END) AS confirmed,
    COUNT(CASE WHEN a.status = 'PENDING' THEN 1 END) AS pending,
    SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price ELSE 0 END) AS total_revenue
FROM appointments a
LEFT JOIN branches b ON a.branch_id = b.id
GROUP BY a.date, a.branch_id, b.name
ORDER BY a.date DESC;

COMMENT ON VIEW vw_daily_appointments_summary IS 'Resumo diário de agendamentos por filial';

-- ============================================

-- View: Performance dos profissionais
CREATE OR REPLACE VIEW vw_professional_performance AS
SELECT 
    p.id AS professional_id,
    p.name AS professional_name,
    p.avatar_url,
    COUNT(a.id) AS total_appointments,
    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) AS completed_appointments,
    AVG(a.rating)::DECIMAL(3,2) AS average_rating,
    SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price ELSE 0 END) AS total_revenue,
    COUNT(DISTINCT a.client_id) AS unique_clients
FROM professionals p
LEFT JOIN appointments a ON p.id = a.professional_id
WHERE p.active = TRUE
GROUP BY p.id, p.name, p.avatar_url
ORDER BY total_revenue DESC;

COMMENT ON VIEW vw_professional_performance IS 'Métricas de performance por profissional';

-- ============================================

-- View: Clientes com aniversário hoje
CREATE OR REPLACE VIEW vw_birthday_clients AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date))::INTEGER AS age
FROM users u
WHERE u.role = 'CLIENT'
    AND u.birth_date IS NOT NULL
    AND EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM u.birth_date) = EXTRACT(DAY FROM CURRENT_DATE);

COMMENT ON VIEW vw_birthday_clients IS 'Clientes que fazem aniversário hoje';

-- ============================================

-- View: Produtos com estoque baixo
CREATE OR REPLACE VIEW vw_low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.quantity AS current_stock,
    p.min_stock,
    p.min_stock - p.quantity AS deficit,
    p.cost_price,
    (p.min_stock - p.quantity) * p.cost_price AS restock_cost_estimate
FROM products p
WHERE p.active = TRUE
    AND p.quantity <= p.min_stock
ORDER BY deficit DESC;

COMMENT ON VIEW vw_low_stock_products IS 'Produtos com estoque abaixo do mínimo';

-- ============================================

-- View: Resumo financeiro mensal
CREATE OR REPLACE VIEW vw_monthly_financial_summary AS
SELECT 
    TO_CHAR(t.date, 'YYYY-MM') AS month,
    t.branch_id,
    b.name AS branch_name,
    SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END) AS net_profit
FROM financial_transactions t
LEFT JOIN branches b ON t.branch_id = b.id
WHERE t.status = 'PAID'
GROUP BY TO_CHAR(t.date, 'YYYY-MM'), t.branch_id, b.name
ORDER BY month DESC;

COMMENT ON VIEW vw_monthly_financial_summary IS 'Resumo financeiro mensal por filial';

-- ============================================

-- View: Fila atual (somente hoje)
CREATE OR REPLACE VIEW vw_current_queue AS
SELECT 
    q.id,
    q.queue_number,
    q.client_name,
    q.arrival_time,
    q.status,
    s.name AS service_name,
    s.duration_minutes,
    p.name AS professional_name,
    b.name AS branch_name
FROM queue q
LEFT JOIN services s ON q.service_id = s.id
LEFT JOIN professionals p ON q.professional_id = p.id
LEFT JOIN branches b ON q.branch_id = b.id
WHERE q.date = CURRENT_DATE
    AND q.status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
ORDER BY q.queue_number;

COMMENT ON VIEW vw_current_queue IS 'Fila de atendimento do dia atual';

-- ============================================

-- View: Lista de espera ativa
CREATE OR REPLACE VIEW vw_active_waiting_list AS
SELECT 
    wl.id,
    wl.date,
    u.name AS client_name,
    u.phone AS client_phone,
    u.email AS client_email,
    s.name AS service_name,
    p.name AS preferred_professional,
    wl.notes,
    wl.notified,
    wl.created_at
FROM waiting_list wl
LEFT JOIN users u ON wl.client_id = u.id
LEFT JOIN services s ON wl.service_id = s.id
LEFT JOIN professionals p ON wl.professional_id = p.id
WHERE wl.status = 'AGUARDANDO'
    AND wl.date >= CURRENT_DATE
ORDER BY wl.date, wl.created_at;

COMMENT ON VIEW vw_active_waiting_list IS 'Lista de espera ativa (datas futuras)';

-- ============================================

-- View: Agenda do dia com detalhes
CREATE OR REPLACE VIEW vw_today_schedule AS
SELECT 
    a.id,
    a.time,
    a.status,
    a.client_name,
    u.phone AS client_phone,
    s.name AS service_name,
    s.duration_minutes,
    p.name AS professional_name,
    b.name AS branch_name,
    a.price,
    a.notes
FROM appointments a
LEFT JOIN users u ON a.client_id = u.id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN professionals p ON a.professional_id = p.id
LEFT JOIN branches b ON a.branch_id = b.id
WHERE a.date = CURRENT_DATE
    AND a.status NOT IN ('CANCELLED')
ORDER BY a.time;

COMMENT ON VIEW vw_today_schedule IS 'Agenda completa do dia atual';

-- ============================================

-- View: Clientes mais frequentes
CREATE OR REPLACE VIEW vw_top_clients AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    COUNT(a.id) AS total_appointments,
    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) AS completed_appointments,
    SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price ELSE 0 END) AS total_spent,
    MAX(a.date) AS last_visit,
    AVG(a.rating)::DECIMAL(3,2) AS avg_rating_given
FROM users u
LEFT JOIN appointments a ON u.id = a.client_id
WHERE u.role = 'CLIENT'
GROUP BY u.id, u.name, u.email, u.phone
HAVING COUNT(a.id) > 0
ORDER BY total_spent DESC;

COMMENT ON VIEW vw_top_clients IS 'Ranking de clientes por valor gasto';

-- ============================================

-- View: Assinaturas ativas com próxima cobrança
CREATE OR REPLACE VIEW vw_active_subscriptions AS
SELECT 
    cs.id,
    u.name AS client_name,
    u.email AS client_email,
    u.phone AS client_phone,
    cs.plan_name,
    cs.price,
    cs.start_date,
    cs.next_billing_date,
    cs.next_billing_date - CURRENT_DATE AS days_to_billing,
    cs.status
FROM client_subscriptions cs
LEFT JOIN users u ON cs.user_id = u.id
WHERE cs.status = 'ACTIVE'
ORDER BY cs.next_billing_date;

COMMENT ON VIEW vw_active_subscriptions IS 'Assinaturas ativas com dias até próxima cobrança';

-- ============================================

-- View: Serviços mais populares
CREATE OR REPLACE VIEW vw_popular_services AS
SELECT 
    s.id,
    s.name,
    s.category,
    s.price,
    s.duration_minutes,
    COUNT(a.id) AS total_bookings,
    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) AS completed,
    SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price ELSE 0 END) AS total_revenue,
    AVG(a.rating)::DECIMAL(3,2) AS avg_rating
FROM services s
LEFT JOIN appointments a ON s.id = a.service_id
WHERE s.active = TRUE
GROUP BY s.id, s.name, s.category, s.price, s.duration_minutes
ORDER BY total_bookings DESC;

COMMENT ON VIEW vw_popular_services IS 'Ranking de serviços mais agendados';

-- ============================================

-- View: Caixa atual (sessão aberta)
CREATE OR REPLACE VIEW vw_current_cash_register AS
SELECT 
    cr.id,
    cr.opened_at,
    cr.opened_by,
    cr.initial_value,
    cr.notes,
    b.name AS branch_name,
    CURRENT_TIMESTAMP - cr.opened_at AS time_open,
    (
        SELECT COALESCE(SUM(
            CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END
        ), 0)
        FROM financial_transactions t
        WHERE t.date = cr.date
            AND (t.branch_id = cr.branch_id OR cr.branch_id IS NULL)
            AND t.status = 'PAID'
    ) AS transactions_balance
FROM cash_register_sessions cr
LEFT JOIN branches b ON cr.branch_id = b.id
WHERE cr.status = 'OPEN';

COMMENT ON VIEW vw_current_cash_register IS 'Sessão de caixa atualmente aberta';

-- ============================================
-- FUNCTIONS UTILITÁRIAS
-- ============================================

-- Função: Obter próximos horários disponíveis de um profissional
CREATE OR REPLACE FUNCTION fn_get_available_slots(
    p_professional_id UUID,
    p_date DATE,
    p_branch_id UUID,
    p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(slot_time TIME, is_available BOOLEAN) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_schedule RECORD;
    v_current_time TIME;
    v_end_time TIME;
    v_break_start TIME;
    v_break_end TIME;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Busca o horário de trabalho do profissional para o dia
    SELECT ws.start_time, ws.end_time, ws.break_start, ws.break_end, ws.is_active
    INTO v_schedule
    FROM work_schedules ws
    WHERE ws.professional_id = p_professional_id
        AND ws.day_of_week = v_day_of_week
        AND (ws.branch_id = p_branch_id OR ws.branch_id IS NULL)
    LIMIT 1;
    
    -- Se não tem horário ou não está ativo, retorna vazio
    IF v_schedule IS NULL OR NOT v_schedule.is_active THEN
        RETURN;
    END IF;
    
    v_current_time := v_schedule.start_time;
    v_end_time := v_schedule.end_time;
    v_break_start := v_schedule.break_start;
    v_break_end := v_schedule.break_end;
    
    -- Gera slots de 30 em 30 minutos
    WHILE v_current_time + (p_duration_minutes || ' minutes')::INTERVAL <= v_end_time LOOP
        slot_time := v_current_time;
        
        -- Verifica se está no horário de intervalo
        IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL 
           AND v_current_time >= v_break_start AND v_current_time < v_break_end THEN
            is_available := FALSE;
        ELSE
            -- Verifica se já tem agendamento nesse horário
            is_available := NOT EXISTS (
                SELECT 1 FROM appointments a
                WHERE a.professional_id = p_professional_id
                    AND a.date = p_date
                    AND a.time = v_current_time
                    AND a.status NOT IN ('CANCELLED')
            );
        END IF;
        
        RETURN NEXT;
        v_current_time := v_current_time + '30 minutes'::INTERVAL;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_available_slots IS 'Retorna horários disponíveis de um profissional em uma data';

-- ============================================

-- Função: Calcular comissão de um profissional no período
CREATE OR REPLACE FUNCTION fn_calculate_commission(
    p_professional_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    service_id UUID,
    service_name VARCHAR,
    total_appointments INTEGER,
    total_revenue DECIMAL,
    commission_percentage DECIMAL,
    commission_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS service_id,
        s.name AS service_name,
        COUNT(a.id)::INTEGER AS total_appointments,
        SUM(a.price) AS total_revenue,
        COALESCE(s.commission, 0) AS commission_percentage,
        SUM(a.price) * COALESCE(s.commission, 0) / 100 AS commission_value
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.professional_id = p_professional_id
        AND a.date BETWEEN p_start_date AND p_end_date
        AND a.status = 'COMPLETED'
    GROUP BY s.id, s.name, s.commission
    ORDER BY commission_value DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_calculate_commission IS 'Calcula comissão de um profissional por serviço no período';

-- ============================================

-- Função: Adicionar entrada na fila
CREATE OR REPLACE FUNCTION fn_add_to_queue(
    p_client_id UUID,
    p_client_name VARCHAR,
    p_service_id UUID,
    p_professional_id UUID DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_queue_number INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Calcula próximo número da fila
    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO v_queue_number
    FROM queue
    WHERE date = v_today;
    
    -- Insere na fila
    INSERT INTO queue (
        client_id, client_name, service_id, professional_id, branch_id,
        status, arrival_time, queue_number, date
    ) VALUES (
        p_client_id, p_client_name, p_service_id, p_professional_id, p_branch_id,
        'AGUARDANDO', CURRENT_TIME, v_queue_number, v_today
    );
    
    RETURN v_queue_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_add_to_queue IS 'Adiciona cliente na fila de atendimento e retorna número da senha';

-- ============================================

-- Procedure: Notificar clientes da lista de espera quando vaga abrir
CREATE OR REPLACE FUNCTION fn_check_waiting_list_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um agendamento é cancelado, verifica lista de espera
    IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
        -- Marca como notificado os clientes na lista de espera para esse dia/serviço
        UPDATE waiting_list
        SET notified = TRUE, 
            status = 'NOTIFICADO',
            updated_at = CURRENT_TIMESTAMP
        WHERE date = NEW.date
            AND service_id = NEW.service_id
            AND status = 'AGUARDANDO'
            AND (professional_id = NEW.professional_id OR professional_id IS NULL);
        
        -- Log de auditoria
        INSERT INTO audit_logs (action, entity, entity_id, description, performed_by)
        VALUES ('UPDATE', 'CLIENT', NEW.client_id, 
                'Agendamento cancelado - Lista de espera notificada para ' || NEW.date,
                'System');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_waiting_list_on_cancel
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_waiting_list_on_cancel();

COMMENT ON FUNCTION fn_check_waiting_list_on_cancel IS 'Notifica lista de espera quando agendamento é cancelado';

-- ============================================

-- Função: Estatísticas do dashboard
CREATE OR REPLACE FUNCTION fn_dashboard_stats(
    p_branch_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    appointments_today INTEGER,
    completed_today INTEGER,
    revenue_today DECIMAL,
    revenue_month DECIMAL,
    new_clients_month INTEGER,
    queue_waiting INTEGER,
    waiting_list_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Agendamentos hoje
        (SELECT COUNT(*)::INTEGER FROM appointments 
         WHERE date = p_date 
         AND status != 'CANCELLED'
         AND (branch_id = p_branch_id OR p_branch_id IS NULL)),
        
        -- Concluídos hoje
        (SELECT COUNT(*)::INTEGER FROM appointments 
         WHERE date = p_date 
         AND status = 'COMPLETED'
         AND (branch_id = p_branch_id OR p_branch_id IS NULL)),
        
        -- Receita hoje
        (SELECT COALESCE(SUM(price), 0) FROM appointments 
         WHERE date = p_date 
         AND status = 'COMPLETED'
         AND (branch_id = p_branch_id OR p_branch_id IS NULL)),
        
        -- Receita do mês
        (SELECT COALESCE(SUM(price), 0) FROM appointments 
         WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM p_date)
         AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM p_date)
         AND status = 'COMPLETED'
         AND (branch_id = p_branch_id OR p_branch_id IS NULL)),
        
        -- Novos clientes no mês
        (SELECT COUNT(*)::INTEGER FROM users 
         WHERE role = 'CLIENT'
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM p_date)
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM p_date)),
        
        -- Na fila aguardando
        (SELECT COUNT(*)::INTEGER FROM queue 
         WHERE date = p_date 
         AND status = 'AGUARDANDO'
         AND (branch_id = p_branch_id OR p_branch_id IS NULL)),
        
        -- Lista de espera
        (SELECT COUNT(*)::INTEGER FROM waiting_list 
         WHERE date >= p_date 
         AND status = 'AGUARDANDO');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_dashboard_stats IS 'Retorna estatísticas para o dashboard';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
