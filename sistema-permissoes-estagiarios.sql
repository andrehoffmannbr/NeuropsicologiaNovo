-- Script para implementar sistema de permissões para estagiários
-- Permite que estagiários vejam apenas seus próprios clientes e agendamentos

-- 1. Modificar tabela de clientes para incluir estagiario_id
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS estagiario_id uuid REFERENCES public.colaboradores(id);

-- 2. Criar índice para otimizar consultas por estagiário
CREATE INDEX IF NOT EXISTS idx_clients_estagiario_id ON public.clients(estagiario_id);

-- 3. Modificar tabela de agendamentos para incluir created_by
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.colaboradores(id);

-- 4. Criar índice para otimizar consultas por criador
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);

-- 5. Função para verificar se usuário é estagiário
CREATE OR REPLACE FUNCTION public.is_estagiario(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.colaboradores 
        WHERE user_id = user_uuid 
        AND cargo = 'estagiario' 
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para obter ID do colaborador pelo user_id
CREATE OR REPLACE FUNCTION public.get_colaborador_id(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid AS $$
DECLARE
    colaborador_uuid uuid;
BEGIN
    SELECT id INTO colaborador_uuid
    FROM public.colaboradores 
    WHERE user_id = user_uuid AND ativo = true;
    
    RETURN colaborador_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para verificar se usuário pode ver cliente
CREATE OR REPLACE FUNCTION public.can_view_client(client_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
    user_cargo text;
    colaborador_uuid uuid;
BEGIN
    -- Buscar cargo do usuário
    SELECT cargo INTO user_cargo
    FROM public.colaboradores 
    WHERE user_id = user_uuid AND ativo = true;
    
    -- Se não encontrou cargo, não pode ver
    IF user_cargo IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Coordenadores e funcionários podem ver todos os clientes
    IF user_cargo IN ('coordenador', 'funcionario') THEN
        RETURN TRUE;
    END IF;
    
    -- Estagiários só podem ver seus próprios clientes
    IF user_cargo = 'estagiario' THEN
        SELECT id INTO colaborador_uuid
        FROM public.colaboradores 
        WHERE user_id = user_uuid AND ativo = true;
        
        RETURN EXISTS (
            SELECT 1 FROM public.clients 
            WHERE id = client_uuid 
            AND estagiario_id = colaborador_uuid
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Políticas RLS para tabela clients
DROP POLICY IF EXISTS "estagiarios_view_own_clients" ON public.clients;
CREATE POLICY "estagiarios_view_own_clients" ON public.clients
    FOR SELECT USING (
        can_view_client(id, auth.uid())
    );

DROP POLICY IF EXISTS "estagiarios_insert_clients" ON public.clients;
CREATE POLICY "estagiarios_insert_clients" ON public.clients
    FOR INSERT WITH CHECK (
        -- Usuários podem inserir clientes
        EXISTS (
            SELECT 1 FROM public.colaboradores 
            WHERE user_id = auth.uid() 
            AND ativo = true
        )
    );

DROP POLICY IF EXISTS "estagiarios_update_own_clients" ON public.clients;
CREATE POLICY "estagiarios_update_own_clients" ON public.clients
    FOR UPDATE USING (
        can_view_client(id, auth.uid())
    );

DROP POLICY IF EXISTS "estagiarios_delete_own_clients" ON public.clients;
CREATE POLICY "estagiarios_delete_own_clients" ON public.clients
    FOR DELETE USING (
        can_view_client(id, auth.uid())
    );

-- 9. Políticas RLS para tabela appointments
DROP POLICY IF EXISTS "estagiarios_view_own_appointments" ON public.appointments;
CREATE POLICY "estagiarios_view_own_appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.colaboradores c
            WHERE c.user_id = auth.uid() 
            AND c.ativo = true
            AND (
                c.cargo IN ('coordenador', 'funcionario') 
                OR 
                (c.cargo = 'estagiario' AND c.id = created_by)
            )
        )
    );

DROP POLICY IF EXISTS "estagiarios_insert_appointments" ON public.appointments;
CREATE POLICY "estagiarios_insert_appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.colaboradores 
            WHERE user_id = auth.uid() 
            AND ativo = true
        )
    );

DROP POLICY IF EXISTS "estagiarios_update_own_appointments" ON public.appointments;
CREATE POLICY "estagiarios_update_own_appointments" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.colaboradores c
            WHERE c.user_id = auth.uid() 
            AND c.ativo = true
            AND (
                c.cargo IN ('coordenador', 'funcionario') 
                OR 
                (c.cargo = 'estagiario' AND c.id = created_by)
            )
        )
    );

DROP POLICY IF EXISTS "estagiarios_delete_own_appointments" ON public.appointments;
CREATE POLICY "estagiarios_delete_own_appointments" ON public.appointments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.colaboradores c
            WHERE c.user_id = auth.uid() 
            AND c.ativo = true
            AND (
                c.cargo IN ('coordenador', 'funcionario') 
                OR 
                (c.cargo = 'estagiario' AND c.id = created_by)
            )
        )
    );

-- 10. Trigger para definir automaticamente o estagiario_id ao inserir cliente
CREATE OR REPLACE FUNCTION public.set_client_estagiario_id()
RETURNS TRIGGER AS $$
DECLARE
    colaborador_uuid uuid;
    user_cargo text;
BEGIN
    -- Buscar dados do usuário atual
    SELECT c.id, c.cargo INTO colaborador_uuid, user_cargo
    FROM public.colaboradores c
    WHERE c.user_id = auth.uid() AND c.ativo = true;
    
    -- Se é estagiário, definir automaticamente como responsável
    IF user_cargo = 'estagiario' THEN
        NEW.estagiario_id = colaborador_uuid;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_client_estagiario_id ON public.clients;
CREATE TRIGGER trigger_set_client_estagiario_id
    BEFORE INSERT ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.set_client_estagiario_id();

-- 11. Trigger para definir automaticamente o created_by ao inserir agendamento
CREATE OR REPLACE FUNCTION public.set_appointment_created_by()
RETURNS TRIGGER AS $$
DECLARE
    colaborador_uuid uuid;
BEGIN
    -- Buscar ID do colaborador atual
    SELECT c.id INTO colaborador_uuid
    FROM public.colaboradores c
    WHERE c.user_id = auth.uid() AND c.ativo = true;
    
    -- Definir created_by automaticamente
    NEW.created_by = colaborador_uuid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_appointment_created_by ON public.appointments;
CREATE TRIGGER trigger_set_appointment_created_by
    BEFORE INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_appointment_created_by();

-- 12. View para "Meus Clientes" dos estagiários
CREATE OR REPLACE VIEW public.meus_clientes AS
SELECT 
    c.*,
    col.nome as estagiario_nome,
    col.email as estagiario_email,
    (
        SELECT COUNT(*) 
        FROM public.appointments a 
        WHERE a.client_id = c.id 
        AND a.created_by = col.id
    ) as total_agendamentos
FROM public.clients c
LEFT JOIN public.colaboradores col ON c.estagiario_id = col.id
WHERE c.estagiario_id = public.get_colaborador_id(auth.uid())
ORDER BY c.created_at DESC;

-- 13. View para agendamentos dos estagiários
CREATE OR REPLACE VIEW public.meus_agendamentos AS
SELECT 
    a.*,
    c.name as client_name,
    c.phone as client_phone,
    c.email as client_email,
    col.nome as created_by_name
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
LEFT JOIN public.colaboradores col ON a.created_by = col.id
WHERE a.created_by = public.get_colaborador_id(auth.uid())
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- 14. Função para obter estatísticas do estagiário
CREATE OR REPLACE FUNCTION public.get_estagiario_stats(user_uuid uuid DEFAULT auth.uid())
RETURNS json AS $$
DECLARE
    colaborador_uuid uuid;
    stats json;
BEGIN
    -- Buscar ID do colaborador
    SELECT id INTO colaborador_uuid
    FROM public.colaboradores 
    WHERE user_id = user_uuid AND ativo = true;
    
    -- Calcular estatísticas
    SELECT json_build_object(
        'total_clientes', (
            SELECT COUNT(*) 
            FROM public.clients 
            WHERE estagiario_id = colaborador_uuid
        ),
        'clientes_ativos', (
            SELECT COUNT(*) 
            FROM public.clients 
            WHERE estagiario_id = colaborador_uuid 
            AND status = 'ativo'
        ),
        'agendamentos_mes', (
            SELECT COUNT(*) 
            FROM public.appointments 
            WHERE created_by = colaborador_uuid
            AND appointment_date >= date_trunc('month', current_date)
        ),
        'agendamentos_hoje', (
            SELECT COUNT(*) 
            FROM public.appointments 
            WHERE created_by = colaborador_uuid
            AND appointment_date = current_date
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Comentários para documentação
COMMENT ON COLUMN public.clients.estagiario_id IS 'ID do estagiário responsável pelo cliente';
COMMENT ON COLUMN public.appointments.created_by IS 'ID do colaborador que criou o agendamento';
COMMENT ON FUNCTION public.is_estagiario(uuid) IS 'Verifica se o usuário é estagiário';
COMMENT ON FUNCTION public.get_colaborador_id(uuid) IS 'Retorna ID do colaborador baseado no user_id';
COMMENT ON FUNCTION public.can_view_client(uuid, uuid) IS 'Verifica se usuário pode visualizar cliente';
COMMENT ON VIEW public.meus_clientes IS 'View para estagiários verem apenas seus clientes';
COMMENT ON VIEW public.meus_agendamentos IS 'View para estagiários verem apenas seus agendamentos'; 