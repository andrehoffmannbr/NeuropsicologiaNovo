-- Script para adicionar campos adicionais na tabela clients
-- Para suportar o formulário dinâmico baseado na idade

-- Adicionar campos comuns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_id text;

-- Adicionar campos para menores de idade
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS school_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS school_type text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS school_grade text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS father_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS father_age integer;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS father_profession text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS father_phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS mother_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS mother_age integer;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS mother_profession text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS mother_phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS financial_responsible text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS other_responsible text;

-- Adicionar campos para maiores de idade
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_place text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS marital_status text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS adult_financial_responsible text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS adult_other_responsible text;

-- Tornar CPF opcional (apenas obrigatório para maiores de idade)
ALTER TABLE public.clients ALTER COLUMN cpf DROP NOT NULL;

-- Remover a constraint UNIQUE do CPF temporariamente para permitir NULL
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_cpf_key;

-- Adicionar constraint UNIQUE apenas para CPFs não nulos
CREATE UNIQUE INDEX IF NOT EXISTS clients_cpf_unique_idx ON public.clients (cpf) WHERE cpf IS NOT NULL;

-- Adicionar índice único para client_id
CREATE UNIQUE INDEX IF NOT EXISTS clients_client_id_unique_idx ON public.clients (client_id) WHERE client_id IS NOT NULL;

-- Adicionar checks para validação (remover constraints existentes primeiro)
DO $$ 
BEGIN
    -- Remover constraints se existirem
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS check_gender;
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS check_school_type;
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS check_financial_responsible;
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS check_marital_status;
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS check_education;
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS check_adult_financial_responsible;
    
    -- Adicionar constraints novamente
    ALTER TABLE public.clients ADD CONSTRAINT check_gender CHECK (gender IN ('masculino', 'feminino', 'nao-binario', 'prefiro-nao-informar'));
    ALTER TABLE public.clients ADD CONSTRAINT check_school_type CHECK (school_type IN ('publica', 'privada', 'tecnica', 'outro'));
    ALTER TABLE public.clients ADD CONSTRAINT check_financial_responsible CHECK (financial_responsible IN ('pai', 'mae', 'ambos', 'outro'));
    ALTER TABLE public.clients ADD CONSTRAINT check_marital_status CHECK (marital_status IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel'));
    ALTER TABLE public.clients ADD CONSTRAINT check_education CHECK (education IN ('fundamental-incompleto', 'fundamental-completo', 'medio-incompleto', 'medio-completo', 'superior-incompleto', 'superior-completo', 'pos-graduacao', 'mestrado', 'doutorado'));
    ALTER TABLE public.clients ADD CONSTRAINT check_adult_financial_responsible CHECK (adult_financial_responsible IN ('proprio-cliente', 'pai', 'mae', 'outro'));
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public.clients.gender IS 'Gênero do cliente';
COMMENT ON COLUMN public.clients.client_id IS 'ID único do cliente no formato CLIN-XXXX';
COMMENT ON COLUMN public.clients.school_name IS 'Nome da escola (menores de idade)';
COMMENT ON COLUMN public.clients.school_type IS 'Tipo de escola (menores de idade)';
COMMENT ON COLUMN public.clients.school_grade IS 'Ano escolar (menores de idade)';
COMMENT ON COLUMN public.clients.father_name IS 'Nome do pai (menores de idade)';
COMMENT ON COLUMN public.clients.father_age IS 'Idade do pai (menores de idade)';
COMMENT ON COLUMN public.clients.father_profession IS 'Profissão do pai (menores de idade)';
COMMENT ON COLUMN public.clients.father_phone IS 'Telefone do pai (menores de idade)';
COMMENT ON COLUMN public.clients.mother_name IS 'Nome da mãe (menores de idade)';
COMMENT ON COLUMN public.clients.mother_age IS 'Idade da mãe (menores de idade)';
COMMENT ON COLUMN public.clients.mother_profession IS 'Profissão da mãe (menores de idade)';
COMMENT ON COLUMN public.clients.mother_phone IS 'Telefone da mãe (menores de idade)';
COMMENT ON COLUMN public.clients.financial_responsible IS 'Responsável financeiro (menores de idade)';
COMMENT ON COLUMN public.clients.other_responsible IS 'Outro responsável (menores de idade)';
COMMENT ON COLUMN public.clients.rg IS 'RG do cliente (maiores de idade)';
COMMENT ON COLUMN public.clients.birth_place IS 'Naturalidade do cliente (maiores de idade)';
COMMENT ON COLUMN public.clients.marital_status IS 'Estado civil do cliente (maiores de idade)';
COMMENT ON COLUMN public.clients.education IS 'Escolaridade do cliente (maiores de idade)';
COMMENT ON COLUMN public.clients.profession IS 'Profissão do cliente (maiores de idade)';
COMMENT ON COLUMN public.clients.adult_financial_responsible IS 'Responsável financeiro do cliente maior de idade';
COMMENT ON COLUMN public.clients.adult_other_responsible IS 'Detalhes do outro responsável financeiro (maiores de idade)';

-- Atualizar a data de modificação
UPDATE public.clients SET updated_at = now();

-- Verificar se a estrutura foi aplicada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position; 