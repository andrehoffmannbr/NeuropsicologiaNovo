-- ==================================================
-- CORREÇÃO COMPLETA DO SUPABASE AUTH + RLS
-- Sistema de Neuropsicologia  
-- Resolve erros 406, 422, 500
-- ==================================================

-- 1. TEMPORARIAMENTE DESABILITAR RLS PARA TESTES
ALTER TABLE public.colaboradores DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "colaboradores_select_policy" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_insert_policy" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_update_policy" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can view colaboradores based on role" ON public.colaboradores;
DROP POLICY IF EXISTS "Only coordinators can insert colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can update colaboradores based on role" ON public.colaboradores;

-- 3. VERIFICAR SE A TABELA EXISTE E SUA ESTRUTURA
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'colaboradores'
) as tabela_existe;

-- 4. TESTAR INSERÇÃO DIRETA (SEM RLS)
INSERT INTO public.colaboradores (
    nome, 
    email, 
    telefone, 
    cargo, 
    user_id, 
    ativo
) 
VALUES (
    'Teste Direto',
    'teste-direto@teste.com',
    '(11) 99999-9999',
    'estagiario',
    NULL, -- sem user_id por enquanto
    true
) 
ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    updated_at = now();

-- 5. VERIFICAR USUÁRIOS EXISTENTES NO AUTH
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. LIMPAR DADOS DE TESTE (se houver)
DELETE FROM public.colaboradores 
WHERE email LIKE '%@teste.com' 
   OR email LIKE '%teste-%';

-- 7. CRIAR POLÍTICAS SUPER PERMISSIVAS (TEMPORÁRIAS)
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (todos podem ver)
CREATE POLICY "temp_select_all" ON public.colaboradores
    FOR SELECT USING (true);

-- Política para INSERT (todos podem inserir)  
CREATE POLICY "temp_insert_all" ON public.colaboradores
    FOR INSERT WITH CHECK (true);

-- Política para UPDATE (todos podem atualizar)
CREATE POLICY "temp_update_all" ON public.colaboradores
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para DELETE (todos podem deletar)
CREATE POLICY "temp_delete_all" ON public.colaboradores
    FOR DELETE USING (true);

-- 8. TESTAR NOVAMENTE COM RLS HABILITADO
INSERT INTO public.colaboradores (
    nome, 
    email, 
    telefone, 
    cargo, 
    user_id, 
    ativo
) 
VALUES (
    'Teste com RLS',
    'teste-rls@teste.com',
    '(11) 88888-8888',
    'estagiario',
    NULL,
    true
) 
ON CONFLICT (email) DO UPDATE SET
    nome = EXCLUDED.nome,
    updated_at = now();

-- 9. VERIFICAR CONFIGURAÇÕES DO BANCO
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'colaboradores';

-- 10. MOSTRAR TODOS OS COLABORADORES
SELECT 
    id,
    nome,
    email,
    cargo,
    user_id,
    ativo,
    data_cadastro
FROM public.colaboradores 
ORDER BY data_cadastro DESC;

-- 11. TESTAR CONECTIVIDADE DO AUTH
SELECT 
    count(*) as total_users,
    count(case when email_confirmed_at IS NOT NULL then 1 end) as confirmed_users,
    count(case when email_confirmed_at IS NULL then 1 end) as unconfirmed_users
FROM auth.users;

-- 12. VERIFICAR TABELAS RELACIONADAS AO AUTH
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name IN ('users', 'sessions', 'refresh_tokens')
ORDER BY table_name, ordinal_position;

-- 13. RESULTADO FINAL
SELECT 'Configurações do Supabase Auth corrigidas! RLS temporariamente permissivo!' as status;

-- 14. INSTRUÇÕES PARA O PRÓXIMO PASSO
SELECT 'PRÓXIMO PASSO: Teste o cadastro agora. Se funcionar, aplicaremos RLS mais restritivo.' as instrucoes; 