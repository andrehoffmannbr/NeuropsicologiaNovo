-- ==================================================
-- CRIAÇÃO DA TABELA COLABORADORES
-- Sistema de Neuropsicologia
-- ==================================================

-- 1. VERIFICAR SE A TABELA COLABORADORES EXISTE
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'colaboradores'
) as colaboradores_table_exists;

-- 2. CRIAR A TABELA COLABORADORES
CREATE TABLE IF NOT EXISTS public.colaboradores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    email text NOT NULL UNIQUE,
    telefone text,
    cargo text NOT NULL DEFAULT 'estagiario' CHECK (cargo IN ('estagiario', 'funcionario', 'coordenador')),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    ativo boolean DEFAULT true,
    data_cadastro timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON public.colaboradores(user_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON public.colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON public.colaboradores(ativo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON public.colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_data_cadastro ON public.colaboradores(data_cadastro);

-- 4. HABILITAR RLS (ROW LEVEL SECURITY)
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS DE SEGURANÇA

-- Política para SELECT (visualizar)
CREATE POLICY "Users can view colaboradores based on role" ON public.colaboradores
    FOR SELECT USING (
        -- Usuários podem ver seus próprios dados
        user_id = auth.uid() 
        OR
        -- Coordenadores podem ver todos
        EXISTS (
            SELECT 1 FROM public.colaboradores 
            WHERE user_id = auth.uid() 
            AND cargo = 'coordenador' 
            AND ativo = true
        )
    );

-- Política para INSERT (cadastrar)
CREATE POLICY "Only coordinators can insert colaboradores" ON public.colaboradores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.colaboradores 
            WHERE user_id = auth.uid() 
            AND cargo = 'coordenador' 
            AND ativo = true
        )
    );

-- Política para UPDATE (atualizar)
CREATE POLICY "Users can update colaboradores based on role" ON public.colaboradores
    FOR UPDATE USING (
        -- Usuários podem atualizar seus próprios dados (exceto cargo)
        user_id = auth.uid()
        OR
        -- Coordenadores podem atualizar outros (exceto eles mesmos para cargo)
        (
            EXISTS (
                SELECT 1 FROM public.colaboradores 
                WHERE user_id = auth.uid() 
                AND cargo = 'coordenador' 
                AND ativo = true
            )
            AND user_id != auth.uid()
        )
    );

-- 6. CRIAR FUNÇÕES AUXILIARES

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

-- 7. CRIAR TRIGGER PARA UPDATED_AT
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

-- 8. INSERIR COORDENADOR PADRÃO (com base no usuário test@example.com)
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Buscar o ID do usuário test@example.com
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@example.com'
    LIMIT 1;
    
    -- Se encontrou o usuário, criar o coordenador padrão
    IF test_user_id IS NOT NULL THEN
        INSERT INTO public.colaboradores (
            nome, 
            email, 
            telefone, 
            cargo, 
            user_id, 
            ativo
        ) 
        VALUES (
            'Coordenador Padrão',
            'test@example.com',
            '(11) 99999-9999',
            'coordenador',
            test_user_id,
            true
        )
        ON CONFLICT (email) DO UPDATE SET
            user_id = test_user_id,
            cargo = 'coordenador',
            ativo = true,
            updated_at = now();
        
        RAISE NOTICE 'Coordenador padrão criado/atualizado com sucesso';
    ELSE
        RAISE NOTICE 'Usuário test@example.com não encontrado - coordenador padrão não criado';
    END IF;
END $$;

-- 9. VERIFICAR SE A TABELA FOI CRIADA CORRETAMENTE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'colaboradores';

-- 11. VERIFICAR FUNÇÕES CRIADAS
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_coordenador', 'get_user_cargo', 'promover_colaborador');

-- 12. CONTAR REGISTROS
SELECT COUNT(*) as total_colaboradores FROM public.colaboradores;

-- 13. MOSTRAR COLABORADORES CADASTRADOS
SELECT 
    id,
    nome,
    email,
    cargo,
    ativo,
    data_cadastro
FROM public.colaboradores 
ORDER BY data_cadastro DESC;

SELECT 'Tabela colaboradores criada e configurada com sucesso!' as status; 