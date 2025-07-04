-- SCRIPT SUPER SIMPLES PARA SUPABASE
-- Copie e cole este script no SQL Editor do Supabase

-- Campos comuns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_id text;

-- Campos para menores
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

-- Campos para maiores
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_place text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS marital_status text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS adult_financial_responsible text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS adult_other_responsible text;

-- Tornar CPF opcional
ALTER TABLE public.clients ALTER COLUMN cpf DROP NOT NULL; 