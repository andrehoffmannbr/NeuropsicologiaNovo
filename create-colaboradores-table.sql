-- ==================================================
-- SISTEMA DE GESTÃO DE COLABORADORES
-- Tabela + Políticas RLS + Funções Auxiliares
-- ==================================================

-- 1. CRIAR TABELA COLABORADORES
-- ==================================================
CREATE TABLE IF NOT EXISTS public.colaboradores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    email text UNIQUE NOT NULL,
    telefone text,
    cargo text NOT NULL DEFAULT 'estagiario' CHECK (cargo IN ('estagiario', 'funcionario', 'coordenador')),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    data_cadastro timestamp with time zone DEFAULT now(),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON public.colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON public.colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON public.colaboradores(user_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON public.colaboradores(ativo);

-- 2. HABILITAR RLS (Row Level Security)
-- ==================================================
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURANÇA
-- ==================================================

-- Política de Leitura: Usuários podem ver seus próprios dados + coordenadores veem todos
DROP POLICY IF EXISTS "Colaboradores podem ler dados baseado em permissões" ON public.colaboradores;
CREATE POLICY "Colaboradores podem ler dados baseado em permissões" ON public.colaboradores
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.colaboradores c 
            WHERE c.user_id = auth.uid() 
            AND c.cargo = 'coordenador' 
            AND c.ativo = true
        )
    );

-- Política de Inserção: Apenas coordenadores podem cadastrar novos colaboradores
DROP POLICY IF EXISTS "Apenas coordenadores podem cadastrar colaboradores" ON public.colaboradores;
CREATE POLICY "Apenas coordenadores podem cadastrar colaboradores" ON public.colaboradores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.colaboradores c
            WHERE c.user_id = auth.uid() 
            AND c.cargo = 'coordenador' 
            AND c.ativo = true
        )
    );

-- Política de Atualização: Coordenadores podem promover outros (não a si mesmos)
DROP POLICY IF EXISTS "Coordenadores podem promover outros colaboradores" ON public.colaboradores;
CREATE POLICY "Coordenadores podem promover outros colaboradores" ON public.colaboradores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.colaboradores c
            WHERE c.user_id = auth.uid() 
            AND c.cargo = 'coordenador' 
            AND c.ativo = true
        ) AND user_id != auth.uid()
    );

-- Política de Atualização própria: Usuários podem atualizar seus próprios dados (exceto cargo)
DROP POLICY IF EXISTS "Colaboradores podem atualizar próprios dados" ON public.colaboradores;
CREATE POLICY "Colaboradores podem atualizar próprios dados" ON public.colaboradores
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND 
        cargo = (SELECT cargo FROM public.colaboradores WHERE user_id = auth.uid())
    );

-- 4. FUNÇÕES AUXILIARES
-- ==================================================

-- Função para verificar se usuário é coordenador
CREATE OR REPLACE FUNCTION public.is_coordenador(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.colaboradores 
        WHERE user_id = user_uuid 
        AND cargo = 'coordenador' 
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter cargo do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_cargo(user_uuid uuid DEFAULT auth.uid())
RETURNS text AS $$
DECLARE
    user_cargo text;
BEGIN
    SELECT cargo INTO user_cargo 
    FROM public.colaboradores 
    WHERE user_id = user_uuid AND ativo = true;
    
    RETURN COALESCE(user_cargo, 'sem_cargo');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para promover colaborador
CREATE OR REPLACE FUNCTION public.promover_colaborador(
    colaborador_id uuid,
    novo_cargo text
)
RETURNS json AS $$
DECLARE
    current_user_cargo text;
    colaborador_atual record;
    result json;
BEGIN
    -- Verificar se usuário atual é coordenador
    SELECT cargo INTO current_user_cargo 
    FROM public.colaboradores 
    WHERE user_id = auth.uid() AND ativo = true;
    
    IF current_user_cargo != 'coordenador' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Apenas coordenadores podem promover colaboradores'
        );
    END IF;
    
    -- Verificar se novo cargo é válido
    IF novo_cargo NOT IN ('estagiario', 'funcionario', 'coordenador') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cargo inválido'
        );
    END IF;
    
    -- Obter dados do colaborador a ser promovido
    SELECT * INTO colaborador_atual 
    FROM public.colaboradores 
    WHERE id = colaborador_id AND ativo = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Colaborador não encontrado'
        );
    END IF;
    
    -- Impedir autopromocão
    IF colaborador_atual.user_id = auth.uid() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Você não pode promover a si mesmo'
        );
    END IF;
    
    -- Atualizar cargo
    UPDATE public.colaboradores 
    SET cargo = novo_cargo, updated_at = now()
    WHERE id = colaborador_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Colaborador promovido com sucesso',
        'colaborador', colaborador_atual.nome,
        'novo_cargo', novo_cargo
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER PARA UPDATED_AT
-- ==================================================
CREATE OR REPLACE FUNCTION public.update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;
CREATE TRIGGER update_colaboradores_updated_at
    BEFORE UPDATE ON public.colaboradores
    FOR EACH ROW EXECUTE FUNCTION public.update_colaboradores_updated_at();

-- 6. DADOS INICIAIS (COORDENADOR PADRÃO)
-- ==================================================
-- Inserir coordenador padrão se não existir
INSERT INTO public.colaboradores (nome, email, telefone, cargo, ativo)
VALUES (
    'Coordenador Sistema',
    'test@example.com',
    '(11) 99999-9999',
    'coordenador',
    true
) ON CONFLICT (email) DO NOTHING;

-- 7. VERIFICAÇÕES FINAIS
-- ==================================================

-- Verificar se a tabela foi criada
SELECT 
    'Tabela colaboradores criada com sucesso!' as status,
    count(*) as total_colaboradores
FROM public.colaboradores;

-- Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'colaboradores'
ORDER BY policyname;

-- Verificar funções criadas
SELECT 
    'Funções auxiliares criadas:' as status,
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_coordenador', 'get_user_cargo', 'promover_colaborador')
ORDER BY routine_name;

-- CONCLUÍDO!
SELECT 'Sistema de colaboradores configurado com sucesso!' as resultado; 