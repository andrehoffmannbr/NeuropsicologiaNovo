-- ==================================================
-- ESTRUTURA COMPLETA DO SISTEMA DE PRONTUÁRIOS
-- Sistema de Neuropsicologia - VERSÃO CORRIGIDA
-- ==================================================

-- 1. TABELA DE PRONTUÁRIOS (Principal)
CREATE TABLE IF NOT EXISTS public.prontuarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.colaboradores(id),
    data_abertura timestamp with time zone DEFAULT now(),
    data_fechamento timestamp with time zone,
    status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'fechado')),
    valor_total decimal(10,2) DEFAULT 0.00,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. TABELA DE ANAMNESE
CREATE TABLE IF NOT EXISTS public.anamnese (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prontuario_id uuid REFERENCES public.prontuarios(id) ON DELETE CASCADE,
    tipo_atendimento text DEFAULT 'infantil' CHECK (tipo_atendimento IN ('infantil', 'adulto', 'idoso')),
    queixa_principal text,
    historia_clinica text,
    antecedentes_medicos text,
    medicamentos_uso text,
    historia_familiar text,
    desenvolvimento_neuropsicomotor text,
    historia_escolar text,
    aspectos_comportamentais text,
    observacoes_clinicas text,
    campos_customizados jsonb, -- Para campos dinâmicos
    valor decimal(8,2) DEFAULT 150.00, -- Valor padrão da anamnese
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. CATÁLOGO DE TESTES NEUROPSICOLÓGICOS
CREATE TABLE IF NOT EXISTS public.testes_catalogo (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    descricao text,
    categoria text, -- Ex: 'cognitivo', 'atencao', 'memoria'
    faixa_etaria text, -- Ex: '6-16 anos', 'adultos'
    valor decimal(8,2) NOT NULL,
    tempo_aplicacao integer, -- em minutos
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(nome) -- Adicionando constraint única para evitar duplicatas
);

-- 4. TESTES APLICADOS NO PRONTUÁRIO
CREATE TABLE IF NOT EXISTS public.testes_aplicados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prontuario_id uuid REFERENCES public.prontuarios(id) ON DELETE CASCADE,
    teste_id uuid REFERENCES public.testes_catalogo(id),
    nome_teste text NOT NULL, -- Snapshot do nome no momento da aplicação
    valor decimal(8,2) NOT NULL, -- Snapshot do valor no momento da aplicação
    data_aplicacao date DEFAULT CURRENT_DATE,
    observacoes text,
    resultados_arquivo text, -- URL ou caminho do arquivo de resultados
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. LAUDOS DO PRONTUÁRIO (Diferentes dos laudos gerais)
CREATE TABLE IF NOT EXISTS public.laudos_prontuario (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prontuario_id uuid REFERENCES public.prontuarios(id) ON DELETE CASCADE,
    titulo text DEFAULT 'Laudo Neuropsicológico',
    queixa_principal text,
    historia_clinica text,
    observacoes_comportamentais text,
    resultados_testes text,
    conclusoes text,
    recomendacoes text,
    arquivo_anexo text, -- URL ou caminho do arquivo
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. HISTÓRICO DE MOVIMENTAÇÕES
CREATE TABLE IF NOT EXISTS public.prontuario_historico (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prontuario_id uuid REFERENCES public.prontuarios(id) ON DELETE CASCADE,
    acao text NOT NULL, -- 'abertura', 'teste_adicionado', 'laudo_criado', 'fechamento'
    descricao text,
    valor_envolvido decimal(8,2),
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_prontuarios_client_id ON public.prontuarios(client_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_status ON public.prontuarios(status);
CREATE INDEX IF NOT EXISTS idx_prontuarios_data_abertura ON public.prontuarios(data_abertura);
CREATE INDEX IF NOT EXISTS idx_anamnese_prontuario_id ON public.anamnese(prontuario_id);
CREATE INDEX IF NOT EXISTS idx_testes_aplicados_prontuario_id ON public.testes_aplicados(prontuario_id);
CREATE INDEX IF NOT EXISTS idx_testes_catalogo_categoria ON public.testes_catalogo(categoria);
CREATE INDEX IF NOT EXISTS idx_testes_catalogo_ativo ON public.testes_catalogo(ativo);
CREATE INDEX IF NOT EXISTS idx_laudos_prontuario_prontuario_id ON public.laudos_prontuario(prontuario_id);

-- 8. HABILITAR RLS PARA TODAS AS TABELAS
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnese ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testes_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testes_aplicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laudos_prontuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuario_historico ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLÍTICAS RLS PERMISSIVAS (TEMPORÁRIAS)
-- Prontuários
DROP POLICY IF EXISTS "temp_prontuarios_all" ON public.prontuarios;
CREATE POLICY "temp_prontuarios_all" ON public.prontuarios FOR ALL USING (true) WITH CHECK (true);

-- Anamnese
DROP POLICY IF EXISTS "temp_anamnese_all" ON public.anamnese;
CREATE POLICY "temp_anamnese_all" ON public.anamnese FOR ALL USING (true) WITH CHECK (true);

-- Catálogo de Testes
DROP POLICY IF EXISTS "temp_testes_catalogo_all" ON public.testes_catalogo;
CREATE POLICY "temp_testes_catalogo_all" ON public.testes_catalogo FOR ALL USING (true) WITH CHECK (true);

-- Testes Aplicados
DROP POLICY IF EXISTS "temp_testes_aplicados_all" ON public.testes_aplicados;
CREATE POLICY "temp_testes_aplicados_all" ON public.testes_aplicados FOR ALL USING (true) WITH CHECK (true);

-- Laudos Prontuário
DROP POLICY IF EXISTS "temp_laudos_prontuario_all" ON public.laudos_prontuario;
CREATE POLICY "temp_laudos_prontuario_all" ON public.laudos_prontuario FOR ALL USING (true) WITH CHECK (true);

-- Histórico
DROP POLICY IF EXISTS "temp_prontuario_historico_all" ON public.prontuario_historico;
CREATE POLICY "temp_prontuario_historico_all" ON public.prontuario_historico FOR ALL USING (true) WITH CHECK (true);

-- 10. INSERIR CATÁLOGO DE TESTES NEUROPSICOLÓGICOS
-- Primeiro verificar se a tabela está vazia para evitar duplicatas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.testes_catalogo LIMIT 1) THEN
        INSERT INTO public.testes_catalogo (nome, descricao, categoria, faixa_etaria, valor, tempo_aplicacao) VALUES
        -- Testes Cognitivos Infantis
        ('WISC-IV', 'Escala de Inteligência Wechsler para Crianças - 4ª Edição', 'cognitivo', '6-16 anos', 250.00, 90),
        ('WPPSI-IV', 'Escala de Inteligência Wechsler para Pré-escolares - 4ª Edição', 'cognitivo', '2-7 anos', 220.00, 60),
        ('RAVEN', 'Matrizes Progressivas de Raven', 'cognitivo', '5-65 anos', 80.00, 30),
        ('BPA-2', 'Bateria Psicológica para Avaliação da Atenção - 2ª Edição', 'atencao', '6-82 anos', 120.00, 45),
        
        -- Testes de Memória
        ('RAVLT', 'Teste de Aprendizagem Auditivo-Verbal de Rey', 'memoria', '7-89 anos', 100.00, 45),
        ('Figura de Rey', 'Teste da Figura Complexa de Rey', 'memoria_visual', '4-88 anos', 90.00, 30),
        ('WMTB-C', 'Bateria de Teste de Memória de Trabalho para Crianças', 'memoria', '5-15 anos', 150.00, 60),
        
        -- Testes de Atenção
        ('TAC', 'Teste de Atenção Concentrada', 'atencao', '10-68 anos', 70.00, 20),
        ('TEACO-FF', 'Teste de Atenção Concentrada e Flexibilidade Cognitiva', 'atencao', '4-14 anos', 110.00, 40),
        ('CPT-3', 'Teste de Performance Contínua - 3ª Edição', 'atencao', '8-25 anos', 180.00, 30),
        
        -- Testes Executivos
        ('WISCONSIN', 'Teste de Classificação de Cartas Wisconsin', 'funcoes_executivas', '6-89 anos', 130.00, 45),
        ('Stroop', 'Teste de Stroop', 'funcoes_executivas', '7-80 anos', 85.00, 15),
        ('FDT', 'Teste dos Cinco Dígitos', 'funcoes_executivas', '7-93 anos', 95.00, 25),
        
        -- Testes Acadêmicos
        ('TDE-II', 'Teste de Desempenho Escolar - 2ª Edição', 'academico', '1º-9º ano', 140.00, 60),
        ('PROLEC', 'Avaliação dos Processos de Leitura', 'academico', '7-12 anos', 160.00, 45),
        ('EOCA', 'Entrevista Operativa Centrada na Aprendizagem', 'academico', '6-14 anos', 120.00, 90),
        
        -- Testes de Personalidade/Emocionais
        ('CAT-A', 'Teste de Apercepção Temática Infantil', 'personalidade', '3-10 anos', 110.00, 60),
        ('HTP', 'Casa-Árvore-Pessoa', 'personalidade', '3-99 anos', 80.00, 45),
        ('Escala Beck', 'Inventários de Depressão e Ansiedade de Beck', 'emocional', '13-80 anos', 90.00, 20),
        
        -- Testes Adultos
        ('WAIS-IV', 'Escala de Inteligência Wechsler para Adultos - 4ª Edição', 'cognitivo', '16-90 anos', 280.00, 120),
        ('WMS-IV', 'Escala de Memória Wechsler - 4ª Edição', 'memoria', '16-90 anos', 200.00, 90),
        ('MMSE', 'Mini Exame do Estado Mental', 'cognitivo', '18-99 anos', 50.00, 15),
        
        -- Testes Específicos
        ('NEPSY-II', 'Bateria Neuropsicológica para Crianças - 2ª Edição', 'neuropsicologico', '3-16 anos', 300.00, 120),
        ('VMI', 'Teste de Integração Visomotora', 'visomotor', '2-18 anos', 85.00, 30),
        ('Token Test', 'Teste de Compreensão de Linguagem', 'linguagem', '3-12 anos', 75.00, 25);
    END IF;
END $$;

-- 11. CRIAR FUNÇÕES AUXILIARES

-- Função para calcular valor total do prontuário
CREATE OR REPLACE FUNCTION public.calcular_valor_prontuario(prontuario_uuid uuid)
RETURNS decimal AS $$
DECLARE
    valor_anamnese decimal := 0;
    valor_testes decimal := 0;
    valor_total decimal := 0;
BEGIN
    -- Somar valor da anamnese
    SELECT COALESCE(valor, 0) INTO valor_anamnese
    FROM public.anamnese 
    WHERE prontuario_id = prontuario_uuid;
    
    -- Somar valores dos testes aplicados
    SELECT COALESCE(SUM(valor), 0) INTO valor_testes
    FROM public.testes_aplicados 
    WHERE prontuario_id = prontuario_uuid;
    
    valor_total := valor_anamnese + valor_testes;
    
    -- Atualizar o prontuário
    UPDATE public.prontuarios 
    SET valor_total = valor_total, updated_at = now()
    WHERE id = prontuario_uuid;
    
    RETURN valor_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar histórico
CREATE OR REPLACE FUNCTION public.registrar_historico_prontuario(
    prontuario_uuid uuid,
    acao_texto text,
    descricao_texto text DEFAULT NULL,
    valor_decimal decimal DEFAULT NULL,
    user_uuid uuid DEFAULT auth.uid()
)
RETURNS uuid AS $$
DECLARE
    historico_id uuid;
BEGIN
    INSERT INTO public.prontuario_historico (
        prontuario_id, acao, descricao, valor_envolvido, user_id
    ) VALUES (
        prontuario_uuid, acao_texto, descricao_texto, valor_decimal, user_uuid
    ) RETURNING id INTO historico_id;
    
    RETURN historico_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. CRIAR TRIGGERS PARA ATUALIZAÇÕES AUTOMÁTICAS

-- Trigger para updated_at nas tabelas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_prontuarios_updated_at ON public.prontuarios;
CREATE TRIGGER update_prontuarios_updated_at BEFORE UPDATE ON public.prontuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_anamnese_updated_at ON public.anamnese;
CREATE TRIGGER update_anamnese_updated_at BEFORE UPDATE ON public.anamnese FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_testes_aplicados_updated_at ON public.testes_aplicados;
CREATE TRIGGER update_testes_aplicados_updated_at BEFORE UPDATE ON public.testes_aplicados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_laudos_prontuario_updated_at ON public.laudos_prontuario;
CREATE TRIGGER update_laudos_prontuario_updated_at BEFORE UPDATE ON public.laudos_prontuario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. CRIAR VIEWS ÚTEIS

-- View com dados completos do prontuário
CREATE OR REPLACE VIEW public.prontuarios_completos AS
SELECT 
    p.id,
    p.client_id,
    c.name as client_name,
    c.email as client_email,
    c.birth_date,
    p.data_abertura,
    p.data_fechamento,
    p.status,
    p.valor_total,
    p.observacoes,
    (SELECT COUNT(*) FROM public.testes_aplicados WHERE prontuario_id = p.id) as total_testes,
    (SELECT COUNT(*) FROM public.laudos_prontuario WHERE prontuario_id = p.id) as total_laudos,
    (SELECT nome FROM public.colaboradores WHERE id = p.created_by) as created_by_name
FROM public.prontuarios p
LEFT JOIN public.clients c ON p.client_id = c.id
ORDER BY p.data_abertura DESC;

-- 14. VERIFICAÇÕES FINAIS
SELECT 'Verificando tabelas criadas...' as status;

SELECT 
    table_name,
    'Criada' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('prontuarios', 'anamnese', 'testes_catalogo', 'testes_aplicados', 'laudos_prontuario', 'prontuario_historico')
ORDER BY table_name;

SELECT 'Verificando catálogo de testes...' as status;
SELECT COUNT(*) as total_testes FROM public.testes_catalogo;

SELECT 'Verificando views...' as status;
SELECT COUNT(*) as total_views FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'prontuarios_completos';

SELECT 'Sistema de Prontuários criado com sucesso!' as resultado_final; 