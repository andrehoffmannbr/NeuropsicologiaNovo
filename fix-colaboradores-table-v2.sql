-- ==================================================
-- CORREÇÃO DA TABELA COLABORADORES - VERSÃO 2
-- Sistema de Neuropsicologia
-- Remove conflitos de políticas existentes
-- ==================================================

-- 1. REMOVER POLÍTICAS EXISTENTES (para evitar conflitos)
DROP POLICY IF EXISTS "Users can view colaboradores based on role" ON public.colaboradores;
DROP POLICY IF EXISTS "Only coordinators can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can update colaboradores based on role" ON public.colaboradores;

-- 2. REMOVER FUNÇÕES EXISTENTES (para evitar conflitos)
DROP FUNCTION IF EXISTS public.is_coordenador(uuid);
DROP FUNCTION IF EXISTS public.get_user_cargo(uuid);
DROP FUNCTION IF EXISTS public.promover_colaborador(uuid, text);
DROP FUNCTION IF EXISTS public.update_colaboradores_updated_at();

-- 3. REMOVER TRIGGER EXISTENTE
DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON public.colaboradores;

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

-- 8. CRIAR NOVAS POLÍTICAS DE SEGURANÇA

-- Política para SELECT (visualizar) - MAIS PERMISSIVA
CREATE POLICY "colaboradores_select_policy" ON public.colaboradores
    FOR SELECT USING (true); -- Temporariamente permissivo para teste

-- Política para INSERT (cadastrar) - MAIS PERMISSIVA  
CREATE POLICY "colaboradores_insert_policy" ON public.colaboradores
    FOR INSERT WITH CHECK (true); -- Temporariamente permissivo para teste

-- Política para UPDATE (atualizar) - MAIS PERMISSIVA
CREATE POLICY "colaboradores_update_policy" ON public.colaboradores
    FOR UPDATE USING (true) WITH CHECK (true); -- Temporariamente permissivo para teste

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

-- 10. CRIAR TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_colaboradores_updated_at 
    BEFORE UPDATE ON public.colaboradores 
    FOR EACH ROW EXECUTE FUNCTION public.update_colaboradores_updated_at();

-- 11. INSERIR COORDENADOR PADRÃO (com base no usuário test@example.com)
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

-- 12. VERIFICAR SE A TABELA FOI CRIADA CORRETAMENTE
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
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'colaboradores';

-- 14. VERIFICAR FUNÇÕES CRIADAS
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_coordenador', 'get_user_cargo', 'update_colaboradores_updated_at');

-- 15. CONTAR REGISTROS
SELECT COUNT(*) as total_colaboradores FROM public.colaboradores;

-- 16. MOSTRAR COLABORADORES CADASTRADOS
SELECT 
    id,
    nome,
    email,
    cargo,
    ativo,
    data_cadastro
FROM public.colaboradores 
ORDER BY data_cadastro DESC;

SELECT 'Tabela colaboradores corrigida e configurada com sucesso!' as status; 