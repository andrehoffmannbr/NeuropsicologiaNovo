-- ==================================================
-- SCRIPT PARA CRIAR TODAS AS TABELAS NECESSÁRIAS
-- Sistema de Neuropsicologia - Módulos Completos
-- ==================================================

-- 1. TABELA FINANCIAL_TRANSACTIONS (Controle Financeiro)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type text NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
    category text NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method text DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'cartao', 'pix', 'transferencia')),
    payment_status text DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON public.financial_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON public.financial_transactions(category);

-- RLS (Row Level Security)
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso baseado no perfil do usuário
CREATE POLICY "Users can view financial transactions based on role" ON public.financial_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

CREATE POLICY "Users can insert financial transactions based on role" ON public.financial_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

-- 2. TABELA INVENTORY_ITEMS (Controle de Estoque)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('Material de Escritório', 'Material Clínico', 'Equipamentos', 'Limpeza')),
    description text,
    quantity integer NOT NULL DEFAULT 0,
    minimum_stock integer DEFAULT 0,
    unit_price numeric(10,2),
    supplier text,
    location text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_at ON public.inventory_items(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity ON public.inventory_items(quantity);

-- RLS (Row Level Security)
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso baseado no perfil do usuário
CREATE POLICY "Users can view inventory items based on role" ON public.inventory_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

CREATE POLICY "Users can insert inventory items based on role" ON public.inventory_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

-- 3. TABELA SUPERVISION_SESSIONS (Supervisões de Estagiários)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.supervision_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    intern_id text NOT NULL, -- Por enquanto como text, depois pode ser FK
    supervisor_id uuid REFERENCES public.user_profiles(id),
    session_date date NOT NULL,
    session_time time NOT NULL,
    duration_minutes integer DEFAULT 60,
    status text DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado')),
    topics text,
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_supervision_sessions_date ON public.supervision_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_supervision_sessions_supervisor ON public.supervision_sessions(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervision_sessions_status ON public.supervision_sessions(status);

-- RLS (Row Level Security)
ALTER TABLE public.supervision_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso baseado no perfil do usuário
CREATE POLICY "Users can view supervision sessions based on role" ON public.supervision_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

CREATE POLICY "Users can insert supervision sessions based on role" ON public.supervision_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

-- 4. TABELA REPORTS (Laudos Neuropsicológicos)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id),
    report_type text NOT NULL CHECK (report_type IN ('avaliacao_neuropsicologica', 'relatorio_psicologico', 'parecer_tecnico', 'laudo_pericial')),
    report_date date NOT NULL,
    status text DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizado', 'entregue')),
    main_complaint text,
    history text,
    assessment text,
    conclusion text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON public.reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);

-- RLS (Row Level Security)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso baseado no perfil do usuário
CREATE POLICY "Users can view reports based on role" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

CREATE POLICY "Users can insert reports based on role" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

-- ==================================================
-- TRIGGERS PARA UPDATED_AT
-- ==================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela
CREATE TRIGGER update_financial_transactions_updated_at 
    BEFORE UPDATE ON public.financial_transactions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON public.inventory_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supervision_sessions_updated_at 
    BEFORE UPDATE ON public.supervision_sessions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON public.reports 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ==================================================

-- Inserir algumas transações de exemplo
INSERT INTO public.financial_transactions (transaction_type, category, description, amount, payment_method, payment_status) 
VALUES 
    ('receita', 'Consulta', 'Consulta neuropsicológica - João Silva', 200.00, 'pix', 'pago'),
    ('receita', 'Avaliação', 'Avaliação completa - Maria Santos', 800.00, 'cartao', 'pago'),
    ('despesa', 'Material', 'Compra de material de escritório', 150.00, 'dinheiro', 'pago'),
    ('despesa', 'Aluguel', 'Aluguel do consultório - Janeiro', 1200.00, 'transferencia', 'pago')
ON CONFLICT DO NOTHING;

-- Inserir alguns itens de estoque de exemplo
INSERT INTO public.inventory_items (name, category, description, quantity, minimum_stock, unit_price, supplier, location) 
VALUES 
    ('Papel A4', 'Material de Escritório', 'Resma de papel A4 75g', 10, 2, 25.00, 'Papelaria Central', 'Armário 1'),
    ('Canetas Azuis', 'Material de Escritório', 'Caixa com 50 canetas azuis', 3, 1, 45.00, 'Papelaria Central', 'Gaveta 2'),
    ('Teste WISC-V', 'Material Clínico', 'Kit completo do teste WISC-V', 1, 1, 2500.00, 'Editora Hogrefe', 'Sala de Avaliação'),
    ('Álcool 70%', 'Limpeza', 'Frasco de álcool 70% - 1L', 5, 2, 15.00, 'Farmácia São João', 'Armário de Limpeza')
ON CONFLICT DO NOTHING;

-- ==================================================
-- VERIFICAÇÕES FINAIS
-- ==================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('financial_transactions', 'inventory_items', 'supervision_sessions', 'reports')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('financial_transactions', 'inventory_items', 'supervision_sessions', 'reports')
ORDER BY tablename, policyname;

-- Concluído!
SELECT 'Todas as tabelas foram criadas com sucesso!' as status; 