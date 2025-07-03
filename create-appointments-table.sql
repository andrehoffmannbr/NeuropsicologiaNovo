-- ========================================
-- CRIAR TABELA DE AGENDAMENTOS
-- ========================================

-- Remover tabela se existir (para recriar limpa)
DROP TABLE IF EXISTS public.appointments CASCADE;

-- Criar tabela appointments
CREATE TABLE public.appointments (
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

-- Habilitar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Authenticated users can view appointments" ON public.appointments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update appointments" ON public.appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete appointments" ON public.appointments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Criar índices para performance
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Inserir agendamentos de exemplo (apenas se existirem clientes e usuários)
DO $$ 
DECLARE
    sample_user_id uuid;
    sample_client_id uuid;
BEGIN
    -- Buscar usuário de exemplo
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Buscar cliente de exemplo
    SELECT id INTO sample_client_id FROM public.clients LIMIT 1;
    
    -- Inserir apenas se existirem usuário e cliente
    IF sample_user_id IS NOT NULL AND sample_client_id IS NOT NULL THEN
        INSERT INTO public.appointments (
            client_id, 
            professional_id, 
            appointment_date, 
            appointment_time, 
            appointment_type, 
            status, 
            notes, 
            room, 
            created_by
        ) VALUES 
        (
            sample_client_id,
            sample_user_id,
            CURRENT_DATE,
            '09:00:00',
            'consulta',
            'agendado',
            'Primeira consulta',
            'Sala 1',
            sample_user_id
        ),
        (
            sample_client_id,
            sample_user_id,
            CURRENT_DATE,
            '14:00:00',
            'retorno',
            'agendado',
            'Consulta de retorno',
            'Sala 2',
            sample_user_id
        ),
        (
            sample_client_id,
            sample_user_id,
            CURRENT_DATE + 1,
            '10:00:00',
            'avaliacao',
            'agendado',
            'Avaliação neuropsicológica',
            'Sala 1',
            sample_user_id
        );
    END IF;
END $$;

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar contagem de registros
SELECT COUNT(*) as total_appointments FROM public.appointments; 