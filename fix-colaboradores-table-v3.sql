-- ==================================================
-- CORREÇÃO DA TABELA COLABORADORES - VERSÃO 3
-- Sistema de Neuropsicologia
-- Remove dependências na ordem correta
-- ==================================================

-- 1. REMOVER TRIGGERS PRIMEIRO (para quebrar dependências)
DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;

-- 2. REMOVER POLÍTICAS EXISTENTES (para evitar conflitos)
DROP POLICY IF EXISTS "Users can view colaboradores based on role" ON public.colaboradores;
DROP POLICY IF EXISTS "Only coordinators can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can update colaboradores based on role" ON public.colaboradores;

-- 3. REMOVER FUNÇÕES EXISTENTES (agora sem dependências)
DROP FUNCTION IF EXISTS public.is_coordenador(uuid);
DROP FUNCTION IF EXISTS public.get_user_cargo(uuid);
DROP FUNCTION IF EXISTS public.promover_colaborador(uuid, text);
DROP FUNCTION IF EXISTS public.update_colaboradores_updated_at();

-- 4. VERIFICAR SE A TABELA COLABORADORES EXISTE
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'colaboradores'
) as colaboradores_table_exists;

-- 5. CRIAR A TABELA COLABORADORES (se não existir)
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

-- 6. CRIAR ÍNDICES PARA PERFORMANCE (se não existirem)
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON public.colaboradores(user_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON public.colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON public.colaboradores(ativo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON public.colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_data_cadastro ON public.colaboradores(data_cadastro);

-- 7. HABILITAR RLS (ROW LEVEL SECURITY)
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR POLÍTICAS DE SEGURANÇA PERMISSIVAS (para teste)

-- Política para SELECT (visualizar)
CREATE POLICY "colaboradores_select_policy" ON public.colaboradores
    FOR SELECT USING (true);

-- Política para INSERT (cadastrar)  
CREATE POLICY "colaboradores_insert_policy" ON public.colaboradores
    FOR INSERT WITH CHECK (true);

-- Política para UPDATE (atualizar)
CREATE POLICY "colaboradores_update_policy" ON public.colaboradores
    FOR UPDATE USING (true) WITH CHECK (true);

-- 9. CRIAR FUNÇÕES AUXILIARES

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

-- 10. CRIAR FUNÇÃO E TRIGGER PARA UPDATED_AT

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_colaboradores_updated_at 
    BEFORE UPDATE ON public.colaboradores 
    FOR EACH ROW EXECUTE FUNCTION public.update_colaboradores_updated_at();

-- 11. INSERIR COORDENADOR PADRÃO (baseado no usuário logado atual)
DO $$
DECLARE
    current_user_id uuid;
    current_user_email text;
BEGIN
    -- Buscar o ID do usuário atual
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        -- Buscar email do usuário atual
        SELECT email INTO current_user_email 
        FROM auth.users 
        WHERE id = current_user_id;
        
        -- Inserir como coordenador
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
            current_user_email,
            '(11) 99999-9999',
            'coordenador',
            current_user_id,
            true
        )
        ON CONFLICT (email) DO UPDATE SET
            user_id = current_user_id,
            cargo = 'coordenador',
            ativo = true,
            updated_at = now();
        
        RAISE NOTICE 'Coordenador padrão criado/atualizado: %', current_user_email;
    ELSE
        RAISE NOTICE 'Nenhum usuário logado - coordenador padrão não criado';
    END IF;
END $$;

-- 12. VERIFICAR ESTRUTURA DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 13. VERIFICAR POLÍTICAS RLS
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'colaboradores';

-- 14. VERIFICAR FUNÇÕES CRIADAS
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_coordenador', 'get_user_cargo', 'update_colaboradores_updated_at');

-- 15. VERIFICAR TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'colaboradores';

-- 16. CONTAR REGISTROS
SELECT COUNT(*) as total_colaboradores FROM public.colaboradores;

-- 17. MOSTRAR COLABORADORES CADASTRADOS
SELECT 
    id,
    nome,
    email,
    cargo,
    ativo,
    data_cadastro
FROM public.colaboradores 
ORDER BY data_cadastro DESC;

-- 18. RESULTADO FINAL
SELECT 'Tabela colaboradores configurada com sucesso! Dependências resolvidas!' as status; 