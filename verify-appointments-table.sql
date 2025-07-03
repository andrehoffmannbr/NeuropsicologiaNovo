-- ========================================
-- VERIFICAR E CRIAR TABELA DE AGENDAMENTOS
-- ========================================

-- Verificar se a tabela appointments existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'appointments';

-- Se não existir, criar a tabela
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    professional_id uuid REFERENCES auth.users(id),
    appointment_date date NOT NULL,
    appointment_time time NOT NULL,
    duration_minutes integer DEFAULT 60,
    appointment_type text NOT NULL CHECK (appointment_type IN ('consulta', 'avaliacao', 'sessao', 'retorno')),
    status text DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'realizado', 'cancelado', 'faltou')),
    notes text,
    room text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON public.appointments;

-- Criar políticas de segurança
CREATE POLICY "Authenticated users can view appointments" ON public.appointments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update appointments" ON public.appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete appointments" ON public.appointments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Criar índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se existem registros
SELECT COUNT(*) as total_appointments FROM public.appointments;

-- Mostrar alguns registros de exemplo (se existirem)
SELECT 
    id,
    appointment_date,
    appointment_time,
    appointment_type,
    status,
    created_at
FROM public.appointments 
ORDER BY appointment_date DESC, appointment_time DESC 
LIMIT 5; 