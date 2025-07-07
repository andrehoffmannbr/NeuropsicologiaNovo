-- ==================================================
-- CORREÇÃO DA TABELA REPORTS (LAUDOS)
-- Sistema de Neuropsicologia
-- ==================================================

-- 1. VERIFICAR SE A TABELA REPORTS EXISTE
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'reports'
) as reports_table_exists;

-- 2. MOSTRAR ESTRUTURA ATUAL DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. RECRIAR A TABELA REPORTS COM A ESTRUTURA CORRETA
DROP TABLE IF EXISTS public.reports CASCADE;

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
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

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON public.reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- 5. HABILITAR RLS (ROW LEVEL SECURITY)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS DE SEGURANÇA
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

CREATE POLICY "Users can update reports based on role" ON public.reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('coordinator', 'staff')
        )
    );

-- 7. CRIAR TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON public.reports 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. INSERIR DADOS DE TESTE (OPCIONAL)
DO $$
BEGIN
    -- Inserir apenas se existir pelo menos um cliente
    IF EXISTS (SELECT 1 FROM public.clients LIMIT 1) THEN
        INSERT INTO public.reports (
            client_id,
            report_type,
            report_date,
            status,
            main_complaint,
            history,
            assessment,
            conclusion
        ) 
        SELECT 
            (SELECT id FROM public.clients LIMIT 1),
            'avaliacao_neuropsicologica',
            CURRENT_DATE,
            'rascunho',
            'Dificuldades de atenção e concentração relatadas pela família',
            'Cliente apresenta histórico escolar com dificuldades de aprendizagem',
            'Durante a avaliação, observou-se dificuldades atencionais',
            'Sugere-se acompanhamento neuropsicológico para desenvolvimento das funções executivas'
        WHERE NOT EXISTS (SELECT 1 FROM public.reports);
    END IF;
END $$;

-- 9. VERIFICAR SE A TABELA FOI CRIADA CORRETAMENTE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
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
WHERE tablename = 'reports';

-- 11. CONTAR REGISTROS
SELECT COUNT(*) as total_reports FROM public.reports;

SELECT 'Tabela reports corrigida com sucesso!' as status; 