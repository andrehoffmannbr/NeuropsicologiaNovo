-- ========================================
-- TESTAR TABELA DE AGENDAMENTOS
-- ========================================

-- 1. Verificar se a tabela existe
\echo 'Verificando se a tabela appointments existe...'
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments'
) as appointments_exists;

-- 2. Mostrar estrutura da tabela
\echo 'Estrutura da tabela appointments:'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se existem clientes para testar
\echo 'Verificando clientes disponíveis:'
SELECT id, name FROM public.clients LIMIT 3;

-- 4. Verificar se existem usuários para testar
\echo 'Verificando usuários disponíveis:'
SELECT id, email FROM auth.users LIMIT 3;

-- 5. Inserir agendamento de teste
\echo 'Inserindo agendamento de teste...'
INSERT INTO public.appointments (
    client_id, 
    appointment_date, 
    appointment_time, 
    appointment_type, 
    status, 
    notes, 
    room
) 
SELECT 
    (SELECT id FROM public.clients LIMIT 1),
    CURRENT_DATE,
    '09:00:00',
    'consulta',
    'agendado',
    'Agendamento de teste',
    'Sala 1'
WHERE EXISTS (SELECT 1 FROM public.clients LIMIT 1);

-- 6. Verificar se o agendamento foi inserido
\echo 'Verificando agendamentos inseridos:'
SELECT 
    id,
    appointment_date,
    appointment_time,
    appointment_type,
    status,
    notes,
    room,
    created_at
FROM public.appointments 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Testar consulta com JOIN (como o sistema usa)
\echo 'Testando consulta com JOIN como o sistema usa:'
SELECT 
    a.*,
    c.name as client_name,
    c.phone as client_phone
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
ORDER BY a.appointment_date DESC, a.appointment_time DESC
LIMIT 3;

-- 8. Contar total de agendamentos
\echo 'Total de agendamentos:'
SELECT COUNT(*) as total_appointments FROM public.appointments;

-- 9. Testar busca por data de hoje
\echo 'Agendamentos de hoje:'
SELECT COUNT(*) as today_appointments 
FROM public.appointments 
WHERE appointment_date = CURRENT_DATE;

-- 10. Verificar políticas RLS
\echo 'Verificando políticas RLS:'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'appointments';

\echo 'Teste da tabela appointments concluído!' 