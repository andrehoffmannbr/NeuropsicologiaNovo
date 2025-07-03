-- Criar tabela user_profiles no Supabase
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('coordinator', 'staff', 'intern')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar policy para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Criar policy para permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Criar policy para permitir inserção de novos perfis
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Inserir perfil do usuário de teste
INSERT INTO public.user_profiles (id, email, name, role) 
VALUES ('bbe5230c-404b-4a54-988f-357ab8bd322c', 'test@example.com', 'Administrador', 'coordinator')
ON CONFLICT (id) DO NOTHING; 