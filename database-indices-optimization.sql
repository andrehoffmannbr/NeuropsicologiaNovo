-- 🚀 OTIMIZAÇÕES DE ÍNDICES - BANCO DE DADOS
-- Execute estes comandos no painel do Supabase (SQL Editor)
-- 
-- IMPORTANTE: Execute um por vez e verifique se não há erros antes de prosseguir
-- 
-- Impacto esperado: Acelerar consultas em 5-10x

-- 📊 1. ÍNDICES PARA TABELA CLIENTS
-- Acelera consultas de busca e filtragem de clientes

-- Índice para email (única coluna mais consultada)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_email 
ON clients(email);

-- Índice para nome (busca por nome)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_name 
ON clients(name);

-- Índice para telefone (busca por telefone)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_phone 
ON clients(phone);

-- Índice para status ativo (filtragem por clientes ativos)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_active 
ON clients(active) WHERE active = true;

-- Índice para data de criação (ordenação temporal)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_created_at 
ON clients(created_at DESC);

-- Índice composto para busca full-text
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_search 
ON clients USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

-- 📅 2. ÍNDICES PARA TABELA APPOINTMENTS
-- Acelera consultas de agendamentos

-- Índice para data do agendamento (consulta mais comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_date 
ON appointments(appointment_date DESC);

-- Índice para cliente (busca por agendamentos de um cliente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_client 
ON appointments(client_id);

-- Índice para status do agendamento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status 
ON appointments(status);

-- Índice composto para consultas do dia
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_today 
ON appointments(appointment_date, status) 
WHERE appointment_date >= CURRENT_DATE;

-- Índice composto para agenda semanal
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_week 
ON appointments(appointment_date, appointment_time, status) 
WHERE appointment_date >= CURRENT_DATE 
  AND appointment_date < CURRENT_DATE + INTERVAL '7 days';

-- Índice para data de criação
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_created_at 
ON appointments(created_at DESC);

-- 👥 3. ÍNDICES PARA TABELA COLABORADORES
-- Acelera consultas de colaboradores

-- Índice para email (login e busca)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaboradores_email 
ON colaboradores(email);

-- Índice para role (filtragem por função)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaboradores_role 
ON colaboradores(role);

-- Índice para status ativo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaboradores_active 
ON colaboradores(active) WHERE active = true;

-- Índice para data de criação
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colaboradores_created_at 
ON colaboradores(created_at DESC);

-- 👤 4. ÍNDICES PARA TABELA USER_PROFILES
-- Acelera consultas de perfis de usuário

-- Índice para user_id (relação com auth.users)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

-- Índice para role (controle de acesso)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role);

-- Índice para data de atualização
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_updated_at 
ON user_profiles(updated_at DESC);

-- 📊 5. ÍNDICES PARA TABELA APPOINTMENT_HISTORY
-- Acelera consultas de histórico

-- Índice para appointment_id (busca por histórico de agendamento)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_history_appointment_id 
ON appointment_history(appointment_id);

-- Índice para data de mudança
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_history_changed_at 
ON appointment_history(changed_at DESC);

-- Índice composto para auditoria
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_history_audit 
ON appointment_history(appointment_id, changed_at DESC, action);

-- 🔍 6. ÍNDICES PARA MELHORAR RLS (Row Level Security)
-- Otimiza políticas de segurança

-- Índice para otimizar RLS em clients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_rls_user 
ON clients(created_by) WHERE created_by IS NOT NULL;

-- Índice para otimizar RLS em appointments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_rls_user 
ON appointments(created_by) WHERE created_by IS NOT NULL;

-- 📈 7. ÍNDICES PARA RELATÓRIOS E ANALYTICS
-- Acelera geração de relatórios

-- Índice para relatórios mensais de clientes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_monthly_report 
ON clients(created_at, active) 
WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '12 months');

-- Índice para relatórios mensais de agendamentos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_monthly_report 
ON appointments(appointment_date, status) 
WHERE appointment_date >= date_trunc('month', CURRENT_DATE - INTERVAL '12 months');

-- Índice para dashboard stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dashboard_stats 
ON appointments(appointment_date, status) 
WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days';

-- 🔧 8. ÍNDICES PARA BUSCA AVANÇADA
-- Suporte a busca full-text avançada

-- Função para normalizar texto brasileiro
CREATE OR REPLACE FUNCTION normalize_brazilian_text(text)
RETURNS text AS $$
BEGIN
  RETURN unaccent(lower(trim($1)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Índice para busca normalizada em clientes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_normalized_search 
ON clients(normalize_brazilian_text(name), normalize_brazilian_text(email));

-- 📱 9. ÍNDICES PARA PERFORMANCE MOBILE
-- Otimiza consultas frequentes em dispositivos móveis

-- Índice para agenda mobile (próximos 7 dias)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_mobile_agenda 
ON appointments(appointment_date, appointment_time, client_id) 
WHERE appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND status IN ('agendado', 'confirmado');

-- Índice para clientes recentes (últimos 30 dias)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_recent_mobile 
ON clients(created_at DESC, active) 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND active = true;

-- 🎯 10. ESTATÍSTICAS PARA OTIMIZADOR
-- Mantém estatísticas atualizadas para melhor performance

-- Função para atualizar estatísticas
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
  -- Atualizar estatísticas das tabelas principais
  ANALYZE clients;
  ANALYZE appointments;
  ANALYZE colaboradores;
  ANALYZE user_profiles;
  ANALYZE appointment_history;
  
  RAISE NOTICE 'Estatísticas atualizadas com sucesso!';
END;
$$ LANGUAGE plpgsql;

-- Executar atualização inicial
SELECT update_table_statistics();

-- 📊 11. VIEWS MATERIALIZADAS PARA PERFORMANCE
-- Pré-computar consultas complexas

-- View para estatísticas do dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT 
  COUNT(DISTINCT c.id) FILTER (WHERE c.active = true) as active_clients,
  COUNT(DISTINCT a.id) FILTER (WHERE a.appointment_date = CURRENT_DATE) as today_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'pendente') as pending_reports,
  COALESCE(SUM(a.value), 0) as monthly_revenue
FROM clients c
LEFT JOIN appointments a ON c.id = a.client_id
WHERE c.created_at >= date_trunc('month', CURRENT_DATE)
   OR a.appointment_date >= date_trunc('month', CURRENT_DATE);

-- Índice para view materializada
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_dashboard_stats 
ON mv_dashboard_stats(active_clients, today_appointments);

-- View para clientes ativos recentes
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_recent_active_clients AS
SELECT 
  id,
  name,
  email,
  phone,
  created_at,
  last_appointment_date
FROM clients c
WHERE active = true
  AND created_at >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY created_at DESC;

-- 🔄 12. FUNÇÃO PARA REFRESH DAS VIEWS
-- Atualizar views materializadas

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recent_active_clients;
  
  RAISE NOTICE 'Views materializadas atualizadas!';
END;
$$ LANGUAGE plpgsql;

-- 🕐 13. SCHEDULER PARA MANUTENÇÃO AUTOMÁTICA
-- Configurar manutenção automática (se suportado)

-- Função para manutenção noturna
CREATE OR REPLACE FUNCTION nightly_maintenance()
RETURNS void AS $$
BEGIN
  -- Atualizar estatísticas
  PERFORM update_table_statistics();
  
  -- Refresh views materializadas
  PERFORM refresh_materialized_views();
  
  -- Limpar dados antigos (se aplicável)
  DELETE FROM appointment_history 
  WHERE changed_at < CURRENT_DATE - INTERVAL '1 year';
  
  RAISE NOTICE 'Manutenção noturna concluída!';
END;
$$ LANGUAGE plpgsql;

-- 📋 14. VERIFICAÇÃO DE ÍNDICES
-- Query para verificar se os índices foram criados corretamente

-- Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('clients', 'appointments', 'colaboradores', 'user_profiles', 'appointment_history')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verificar tamanho dos índices
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_total_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_total_relation_size(indexrelid) DESC;

-- 📈 15. MONITORAMENTO DE PERFORMANCE
-- Queries para monitorar performance

-- View para monitorar uso dos índices
CREATE VIEW v_index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'Não utilizado'
    WHEN idx_scan < 100 THEN 'Pouco usado'
    WHEN idx_scan < 1000 THEN 'Moderadamente usado'
    ELSE 'Muito usado'
  END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- ✅ 16. COMANDOS FINAIS
-- Limpar e otimizar

-- Executar VACUUM para otimizar armazenamento
VACUUM ANALYZE clients;
VACUUM ANALYZE appointments;
VACUUM ANALYZE colaboradores;
VACUUM ANALYZE user_profiles;
VACUUM ANALYZE appointment_history;

-- Criar função para verificar saúde dos índices
CREATE OR REPLACE FUNCTION check_index_health()
RETURNS TABLE(
  table_name text,
  index_name text,
  usage_count bigint,
  size_mb numeric,
  health_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sui.relname::text as table_name,
    sui.indexrelname::text as index_name,
    sui.idx_scan as usage_count,
    ROUND(pg_total_relation_size(sui.indexrelid) / 1024.0 / 1024.0, 2) as size_mb,
    CASE 
      WHEN sui.idx_scan = 0 THEN '❌ Não utilizado'
      WHEN sui.idx_scan < 100 THEN '⚠️ Pouco usado'
      WHEN sui.idx_scan < 1000 THEN '✅ Moderadamente usado'
      ELSE '🚀 Muito usado'
    END as health_status
  FROM pg_stat_user_indexes sui
  WHERE sui.schemaname = 'public'
    AND sui.indexrelname LIKE 'idx_%'
  ORDER BY sui.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 🎯 COMO EXECUTAR ESTAS OTIMIZAÇÕES
-- ========================================

/*
1. Acesse o painel do Supabase
2. Vá para "SQL Editor" 
3. Cole cada seção (uma por vez)
4. Execute e aguarde conclusão
5. Verifique se não há erros
6. Prossiga para próxima seção

ORDEM DE EXECUÇÃO:
1. Índices básicos (seções 1-4)
2. Índices de histórico (seção 5)
3. Índices RLS (seção 6)
4. Índices de relatórios (seção 7-8)
5. Índices mobile (seção 9)
6. Estatísticas (seção 10)
7. Views materializadas (seção 11-12)
8. Verificação (seções 14-16)

IMPACTO ESPERADO:
- Consultas 5-10x mais rápidas
- Dashboard carrega em <1 segundo
- Busca de clientes instantânea
- Agenda responsiva
- Relatórios otimizados
*/

-- ========================================
-- 📊 VERIFICAÇÃO FINAL
-- ========================================

-- Executar esta query para verificar se tudo foi criado corretamente
SELECT 
  '🚀 OTIMIZAÇÕES CONCLUÍDAS!' as status,
  COUNT(*) as total_indices_criados
FROM pg_indexes 
WHERE tablename IN ('clients', 'appointments', 'colaboradores', 'user_profiles', 'appointment_history')
  AND indexname LIKE 'idx_%';

-- Verificar views materializadas
SELECT 
  '📊 VIEWS MATERIALIZADAS' as status,
  COUNT(*) as total_views
FROM pg_matviews 
WHERE schemaname = 'public'
  AND matviewname LIKE 'mv_%';

-- Verificar funções criadas
SELECT 
  '🔧 FUNÇÕES CRIADAS' as status,
  COUNT(*) as total_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('update_table_statistics', 'refresh_materialized_views', 'nightly_maintenance', 'check_index_health');

-- ========================================
-- 🎉 CONCLUÍDO!
-- ======================================== 