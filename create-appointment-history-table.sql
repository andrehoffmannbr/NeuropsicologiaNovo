-- =====================================================
-- SCRIPT: Criar Tabela de Histórico de Agendamentos
-- DESCRIÇÃO: Registra todas as ações realizadas nos agendamentos
-- DATA: 2024
-- =====================================================

-- Criar tabela de histórico de agendamentos
CREATE TABLE IF NOT EXISTS public.appointment_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    appointment_id uuid, -- Pode ser NULL se o agendamento foi deletado
    action varchar(50) NOT NULL, -- 'redirecionado', 'cancelado', 'confirmado', 'realizado'
    description text,
    performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_appointment_history_client_id ON public.appointment_history(client_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id ON public.appointment_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_action ON public.appointment_history(action);
CREATE INDEX IF NOT EXISTS idx_appointment_history_performed_at ON public.appointment_history(performed_at);

-- Comentários para documentação
COMMENT ON TABLE public.appointment_history IS 'Histórico de todas as ações realizadas nos agendamentos';
COMMENT ON COLUMN public.appointment_history.id IS 'ID único do registro de histórico';
COMMENT ON COLUMN public.appointment_history.client_id IS 'ID do cliente vinculado ao agendamento';
COMMENT ON COLUMN public.appointment_history.appointment_id IS 'ID do agendamento (pode ser NULL se deletado)';
COMMENT ON COLUMN public.appointment_history.action IS 'Tipo de ação realizada no agendamento';
COMMENT ON COLUMN public.appointment_history.description IS 'Descrição detalhada da ação realizada';
COMMENT ON COLUMN public.appointment_history.performed_by IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN public.appointment_history.performed_at IS 'Data e hora em que a ação foi realizada';

-- RLS (Row Level Security)
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura apenas para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler histórico" ON public.appointment_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção apenas para usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir histórico" ON public.appointment_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para coordenadores poderem deletar histórico se necessário
CREATE POLICY "Coordenadores podem deletar histórico" ON public.appointment_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'coordenador'
        )
    );

-- Inserir dados de exemplo (opcional)
DO $$
DECLARE
    sample_client_id uuid;
    sample_appointment_id uuid;
    sample_user_id uuid;
BEGIN
    -- Buscar IDs de exemplo
    SELECT id INTO sample_client_id FROM public.clients LIMIT 1;
    SELECT id INTO sample_appointment_id FROM public.appointments LIMIT 1;
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Inserir apenas se existirem dados
    IF sample_client_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
        INSERT INTO public.appointment_history (
            client_id,
            appointment_id,
            action,
            description,
            performed_by,
            performed_at
        ) VALUES 
        (
            sample_client_id,
            sample_appointment_id,
            'confirmado',
            'Agendamento confirmado pelo sistema',
            sample_user_id,
            now() - interval '1 day'
        ),
        (
            sample_client_id,
            sample_appointment_id,
            'redirecionado',
            'Agendamento redirecionado para nova data por solicitação do cliente',
            sample_user_id,
            now() - interval '2 hours'
        );
    END IF;
END $$; 