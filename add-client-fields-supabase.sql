-- Script simplificado para Supabase - Adicionar campos na tabela clients
-- Execute este script no SQL Editor do Supabase

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

-- Remover constraint UNIQUE do CPF se existir
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_cpf_key;

-- Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS clients_cpf_unique_idx ON public.clients (cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS clients_client_id_unique_idx ON public.clients (client_id) WHERE client_id IS NOT NULL;

-- Adicionar comentários
COMMENT ON COLUMN public.clients.gender IS 'Gênero do cliente';
COMMENT ON COLUMN public.clients.client_id IS 'ID único do cliente no formato CLIN-XXXX';
COMMENT ON COLUMN public.clients.school_name IS 'Nome da escola (menores de idade)';
COMMENT ON COLUMN public.clients.school_type IS 'Tipo de escola (menores de idade)';
COMMENT ON COLUMN public.clients.rg IS 'RG do cliente (maiores de idade)';
COMMENT ON COLUMN public.clients.adult_financial_responsible IS 'Responsável financeiro do cliente maior de idade';

-- Atualizar timestamps
UPDATE public.clients SET updated_at = now() WHERE updated_at IS NULL;

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND table_schema = 'public'
ORDER BY ordinal_position; 