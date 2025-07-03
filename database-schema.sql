-- ========================================
-- SISTEMA DE NEUROPSICOLOGIA - SCHEMA COMPLETO
-- ========================================

-- 1. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('coordinator', 'staff', 'intern')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    cpf text UNIQUE NOT NULL,
    birth_date date NOT NULL,
    phone text NOT NULL,
    email text,
    client_type text NOT NULL CHECK (client_type IN ('adulto', 'menor')),
    address text,
    emergency_contact text,
    emergency_phone text,
    medical_history text,
    status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. TABELA DE AGENDAMENTOS
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

-- 4. TABELA DE RELATÓRIOS
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES public.appointments(id),
    report_type text NOT NULL CHECK (report_type IN ('avaliacao', 'sessao', 'laudo', 'evolucao')),
    title text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizado', 'aprovado')),
    created_by uuid REFERENCES auth.users(id),
    reviewed_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. TABELA DE TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id),
    appointment_id uuid REFERENCES public.appointments(id),
    transaction_type text NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
    category text NOT NULL,
    description text NOT NULL,
    amount decimal(10,2) NOT NULL,
    payment_method text CHECK (payment_method IN ('dinheiro', 'cartao', 'pix', 'boleto', 'transferencia')),
    payment_status text DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'cancelado', 'estornado')),
    due_date date,
    paid_date date,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. TABELA DE ESTOQUE/INVENTÁRIO
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    minimum_stock integer DEFAULT 0,
    unit_price decimal(10,2),
    supplier text,
    location text,
    status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'descontinuado')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    movement_type text NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
    quantity integer NOT NULL,
    reason text,
    reference_id uuid,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- 8. TABELA DE DOCUMENTOS
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    title text NOT NULL,
    document_type text NOT NULL CHECK (document_type IN ('termo', 'contrato', 'receita', 'encaminhamento', 'outros')),
    file_path text,
    file_size integer,
    mime_type text,
    status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado', 'excluido')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9. TABELA DE SUPERVISÃO (ESTAGIÁRIOS)
CREATE TABLE IF NOT EXISTS public.supervision_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    intern_id uuid REFERENCES auth.users(id),
    supervisor_id uuid REFERENCES auth.users(id),
    session_date date NOT NULL,
    session_time time NOT NULL,
    duration_minutes integer DEFAULT 60,
    topics text,
    feedback text,
    goals text,
    status text DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervision_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para clients (todos os usuários autenticados podem acessar)
CREATE POLICY "Authenticated users can view clients" ON public.clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON public.clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON public.clients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para appointments
CREATE POLICY "Authenticated users can view appointments" ON public.appointments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update appointments" ON public.appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para reports
CREATE POLICY "Authenticated users can view reports" ON public.reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert reports" ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update reports" ON public.reports
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para financial_transactions
CREATE POLICY "Authenticated users can view financial transactions" ON public.financial_transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert financial transactions" ON public.financial_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update financial transactions" ON public.financial_transactions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para inventory_items
CREATE POLICY "Authenticated users can view inventory items" ON public.inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory items" ON public.inventory_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inventory items" ON public.inventory_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para inventory_movements
CREATE POLICY "Authenticated users can view inventory movements" ON public.inventory_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory movements" ON public.inventory_movements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para documents
CREATE POLICY "Authenticated users can view documents" ON public.documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert documents" ON public.documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents" ON public.documents
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para supervision_sessions
CREATE POLICY "Authenticated users can view supervision sessions" ON public.supervision_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert supervision sessions" ON public.supervision_sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update supervision sessions" ON public.supervision_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- INSERIR DADOS INICIAIS
-- ========================================

-- Inserir perfil do usuário de teste
INSERT INTO public.user_profiles (id, email, name, role) 
VALUES ('bbe5230c-404b-4a54-988f-357ab8bd322c', 'test@example.com', 'Administrador', 'coordinator')
ON CONFLICT (id) DO NOTHING;

-- Inserir algumas categorias financeiras padrão
INSERT INTO public.financial_transactions (id, transaction_type, category, description, amount, payment_status, created_by) 
VALUES 
    (gen_random_uuid(), 'receita', 'Consulta', 'Consulta Padrão', 150.00, 'pendente', 'bbe5230c-404b-4a54-988f-357ab8bd322c'),
    (gen_random_uuid(), 'despesa', 'Material', 'Material de Escritório', 50.00, 'pago', 'bbe5230c-404b-4a54-988f-357ab8bd322c')
ON CONFLICT (id) DO NOTHING;

-- Inserir alguns itens de inventário padrão
INSERT INTO public.inventory_items (name, description, category, quantity, minimum_stock, unit_price, created_by) 
VALUES 
    ('Papel A4', 'Papel sulfite A4 75g', 'Material de Escritório', 100, 20, 15.00, 'bbe5230c-404b-4a54-988f-357ab8bd322c'),
    ('Caneta Azul', 'Caneta esferográfica azul', 'Material de Escritório', 50, 10, 2.50, 'bbe5230c-404b-4a54-988f-357ab8bd322c'),
    ('Teste Neuropsicológico', 'Kit de testes neuropsicológicos', 'Material Clínico', 5, 2, 300.00, 'bbe5230c-404b-4a54-988f-357ab8bd322c')
ON CONFLICT (id) DO NOTHING; 