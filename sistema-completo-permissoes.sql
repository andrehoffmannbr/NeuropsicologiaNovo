-- ===== SISTEMA COMPLETO DE PERMISSÕES - NEUROPSICOLOGIA =====
-- Baseado na especificação fornecida
-- Data: 2025-01-07

-- ===== LIMPEZA E PREPARAÇÃO =====
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admin e coordenador tem acesso total" ON clientes;
DROP POLICY IF EXISTS "Estagiario só vê seus clientes" ON clientes;
DROP POLICY IF EXISTS "Funcionario acesso limitado" ON clientes;

-- Remover tabelas existentes se houver (cuidado em produção)
DROP TABLE IF EXISTS logs_acao CASCADE;
DROP TABLE IF EXISTS movimentos_estoque CASCADE;
DROP TABLE IF EXISTS protocolos CASCADE;
DROP TABLE IF EXISTS prontuarios CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ===== TABELAS PRINCIPAIS =====

-- 1. TABELA DE USUÁRIOS (conectada ao Supabase Auth)
CREATE TABLE usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'coordenador', 'funcionario', 'estagiario')),
  ativo boolean DEFAULT true,
  telefone text,
  cargo text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 2. TABELA DE CLIENTES (adaptada da estrutura existente)
CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text UNIQUE,
  rg text,
  data_nascimento date,
  idade int,
  telefone text,
  email text,
  endereco jsonb, -- {rua, numero, bairro, cidade, cep, estado}
  responsavel_nome text,
  responsavel_telefone text,
  responsavel_email text,
  observacoes text,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  tipo_cliente text DEFAULT 'adulto' CHECK (tipo_cliente IN ('adulto', 'menor')),
  estagiario_id uuid REFERENCES usuarios(id),
  criado_por uuid REFERENCES usuarios(id),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 3. TABELA DE PRONTUÁRIOS E LAUDOS (unificada)
CREATE TABLE prontuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  responsavel_id uuid REFERENCES usuarios(id),
  tipo text NOT NULL CHECK (tipo IN ('prontuario', 'laudo', 'avaliacao', 'relatorio')),
  titulo text NOT NULL,
  data_atendimento date NOT NULL,
  conteudo jsonb NOT NULL, -- Estrutura flexível para diferentes tipos
  status text DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizado', 'revisao')),
  visibilidade text DEFAULT 'privado' CHECK (visibilidade IN ('privado', 'equipe', 'publico')),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 4. TABELA DE PROTOCOLOS/ESTOQUE
CREATE TABLE protocolos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  categoria text,
  estoque_atual int DEFAULT 0,
  estoque_minimo int DEFAULT 0,
  valor_unitario numeric(10,2),
  fornecedor text,
  codigo_produto text,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 5. TABELA DE MOVIMENTAÇÃO DE ESTOQUE
CREATE TABLE movimentos_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid REFERENCES protocolos(id) ON DELETE CASCADE,
  prontuario_id uuid REFERENCES prontuarios(id),
  usuario_id uuid REFERENCES usuarios(id),
  quantidade int NOT NULL,
  tipo_movimento text NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida', 'ajuste')),
  motivo text,
  observacoes text,
  data_movimento timestamptz DEFAULT now()
);

-- 6. TABELA DE AGENDAMENTOS (adaptada da estrutura existente)
CREATE TABLE agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES usuarios(id),
  estagiario_id uuid REFERENCES usuarios(id),
  data_agendamento timestamptz NOT NULL,
  duracao_minutos int DEFAULT 60,
  tipo_atendimento text,
  status text DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado')),
  observacoes text,
  criado_por uuid REFERENCES usuarios(id),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 7. TABELA DE LOGS/AUDITORIA
CREATE TABLE logs_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id),
  acao text NOT NULL,
  tabela text NOT NULL,
  registro_id uuid,
  dados_antigos jsonb,
  dados_novos jsonb,
  detalhes jsonb,
  ip_address text,
  user_agent text,
  data_hora timestamptz DEFAULT now()
);

-- ===== ÍNDICES PARA PERFORMANCE =====

-- Índices para usuários
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- Índices para clientes
CREATE INDEX idx_clientes_estagiario ON clientes(estagiario_id);
CREATE INDEX idx_clientes_criado_por ON clientes(criado_por);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_nome ON clientes(nome);

-- Índices para prontuários
CREATE INDEX idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX idx_prontuarios_responsavel ON prontuarios(responsavel_id);
CREATE INDEX idx_prontuarios_tipo ON prontuarios(tipo);
CREATE INDEX idx_prontuarios_data ON prontuarios(data_atendimento);

-- Índices para protocolos
CREATE INDEX idx_protocolos_ativo ON protocolos(ativo);
CREATE INDEX idx_protocolos_categoria ON protocolos(categoria);

-- Índices para movimentos
CREATE INDEX idx_movimentos_protocolo ON movimentos_estoque(protocolo_id);
CREATE INDEX idx_movimentos_usuario ON movimentos_estoque(usuario_id);
CREATE INDEX idx_movimentos_data ON movimentos_estoque(data_movimento);

-- Índices para agendamentos
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_usuario ON agendamentos(usuario_id);
CREATE INDEX idx_agendamentos_estagiario ON agendamentos(estagiario_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendamento);

-- Índices para logs
CREATE INDEX idx_logs_usuario ON logs_acao(usuario_id);
CREATE INDEX idx_logs_tabela ON logs_acao(tabela);
CREATE INDEX idx_logs_data ON logs_acao(data_hora);

-- ===== FUNÇÕES AUXILIARES =====

-- Função para obter role do usuário atual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é admin/coordenador
CREATE OR REPLACE FUNCTION is_admin_or_coordinator()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'coordenador')
    FROM usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é estagiário
CREATE OR REPLACE FUNCTION is_estagiario()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'estagiario'
    FROM usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para log de ações
CREATE OR REPLACE FUNCTION log_action(
  p_acao text,
  p_tabela text,
  p_registro_id uuid,
  p_dados_antigos jsonb DEFAULT NULL,
  p_dados_novos jsonb DEFAULT NULL,
  p_detalhes jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO logs_acao (
    usuario_id, acao, tabela, registro_id, 
    dados_antigos, dados_novos, detalhes
  ) VALUES (
    auth.uid(), p_acao, p_tabela, p_registro_id,
    p_dados_antigos, p_dados_novos, p_detalhes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TRIGGERS PARA AUDITORIA =====

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prontuarios_updated_at BEFORE UPDATE ON prontuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocolos_updated_at BEFORE UPDATE ON protocolos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== ATIVAÇÃO RLS =====

-- Ativar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocolos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acao ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS RLS =====

-- POLÍTICAS PARA USUARIOS
CREATE POLICY "Admin e coordenador veem todos os usuarios" ON usuarios
  FOR SELECT USING (is_admin_or_coordinator());

CREATE POLICY "Usuario ve proprio perfil" ON usuarios
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admin pode gerenciar usuarios" ON usuarios
  FOR ALL USING (
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

-- POLÍTICAS PARA CLIENTES
CREATE POLICY "Admin e coordenador veem todos os clientes" ON clientes
  FOR ALL USING (is_admin_or_coordinator());

CREATE POLICY "Funcionario ve todos os clientes" ON clientes
  FOR SELECT USING (
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'funcionario'
  );

CREATE POLICY "Estagiario ve apenas seus clientes" ON clientes
  FOR SELECT USING (
    is_estagiario() AND estagiario_id = auth.uid()
  );

CREATE POLICY "Estagiario pode criar clientes" ON clientes
  FOR INSERT WITH CHECK (
    is_estagiario() AND estagiario_id = auth.uid()
  );

CREATE POLICY "Estagiario pode editar seus clientes" ON clientes
  FOR UPDATE USING (
    is_estagiario() AND estagiario_id = auth.uid()
  );

-- POLÍTICAS PARA PRONTUÁRIOS
CREATE POLICY "Admin e coordenador veem todos os prontuarios" ON prontuarios
  FOR ALL USING (is_admin_or_coordinator());

CREATE POLICY "Funcionario ve prontuarios publicos e da equipe" ON prontuarios
  FOR SELECT USING (
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'funcionario'
    AND visibilidade IN ('publico', 'equipe')
  );

CREATE POLICY "Responsavel ve seus prontuarios" ON prontuarios
  FOR ALL USING (responsavel_id = auth.uid());

CREATE POLICY "Estagiario ve prontuarios de seus clientes" ON prontuarios
  FOR SELECT USING (
    is_estagiario() AND 
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = prontuarios.paciente_id 
      AND clientes.estagiario_id = auth.uid()
    )
  );

-- POLÍTICAS PARA PROTOCOLOS
CREATE POLICY "Admin e coordenador gerenciam protocolos" ON protocolos
  FOR ALL USING (is_admin_or_coordinator());

CREATE POLICY "Funcionario ve protocolos ativos" ON protocolos
  FOR SELECT USING (
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'funcionario'
    AND ativo = true
  );

CREATE POLICY "Estagiario ve protocolos ativos" ON protocolos
  FOR SELECT USING (
    is_estagiario() AND ativo = true
  );

-- POLÍTICAS PARA MOVIMENTOS DE ESTOQUE
CREATE POLICY "Admin e coordenador veem todos os movimentos" ON movimentos_estoque
  FOR ALL USING (is_admin_or_coordinator());

CREATE POLICY "Usuario ve seus movimentos" ON movimentos_estoque
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Funcionario pode criar movimentos" ON movimentos_estoque
  FOR INSERT WITH CHECK (
    (SELECT role FROM usuarios WHERE id = auth.uid()) IN ('funcionario', 'coordenador', 'admin')
  );

-- POLÍTICAS PARA AGENDAMENTOS
CREATE POLICY "Admin e coordenador veem todos os agendamentos" ON agendamentos
  FOR ALL USING (is_admin_or_coordinator());

CREATE POLICY "Funcionario ve agendamentos" ON agendamentos
  FOR SELECT USING (
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'funcionario'
  );

CREATE POLICY "Estagiario ve seus agendamentos" ON agendamentos
  FOR SELECT USING (
    is_estagiario() AND estagiario_id = auth.uid()
  );

CREATE POLICY "Estagiario pode criar agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (
    is_estagiario() AND estagiario_id = auth.uid()
  );

-- POLÍTICAS PARA LOGS
CREATE POLICY "Admin ve todos os logs" ON logs_acao
  FOR SELECT USING (
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Coordenador ve logs relevantes" ON logs_acao
  FOR SELECT USING (
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'coordenador'
  );

-- ===== VIEWS ÚTEIS =====

-- View para clientes de estagiário
CREATE VIEW meus_clientes AS
SELECT 
  c.*,
  u.nome as estagiario_nome,
  COUNT(a.id) as total_agendamentos
FROM clientes c
LEFT JOIN usuarios u ON c.estagiario_id = u.id
LEFT JOIN agendamentos a ON c.id = a.cliente_id
WHERE c.estagiario_id = auth.uid()
GROUP BY c.id, u.nome;

-- View para estatísticas de estagiário
CREATE VIEW estatisticas_estagiario AS
SELECT 
  COUNT(DISTINCT c.id) as total_clientes,
  COUNT(DISTINCT CASE WHEN c.status = 'ativo' THEN c.id END) as clientes_ativos,
  COUNT(DISTINCT CASE WHEN a.data_agendamento::date = CURRENT_DATE THEN a.id END) as agendamentos_hoje,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', a.data_agendamento) = DATE_TRUNC('month', CURRENT_DATE) THEN a.id END) as agendamentos_mes
FROM clientes c
LEFT JOIN agendamentos a ON c.id = a.cliente_id
WHERE c.estagiario_id = auth.uid();

-- View para dashboard administrativo
CREATE VIEW dashboard_admin AS
SELECT 
  (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as total_usuarios,
  (SELECT COUNT(*) FROM clientes WHERE status = 'ativo') as total_clientes,
  (SELECT COUNT(*) FROM agendamentos WHERE data_agendamento::date = CURRENT_DATE) as agendamentos_hoje,
  (SELECT COUNT(*) FROM protocolos WHERE ativo = true) as protocolos_ativos,
  (SELECT COUNT(*) FROM prontuarios WHERE DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', CURRENT_DATE)) as prontuarios_mes;

-- ===== DADOS INICIAIS =====

-- Inserir usuário admin padrão (se não existir)
INSERT INTO usuarios (id, nome, email, role)
SELECT 
  id,
  'Administrador Sistema',
  email,
  'admin'
FROM auth.users
WHERE email = 'admin@sistema.com'
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  role = EXCLUDED.role;

-- ===== COMENTÁRIOS FINAIS =====

COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema com roles e permissões';
COMMENT ON TABLE clientes IS 'Tabela de clientes/pacientes com vinculação a estagiários';
COMMENT ON TABLE prontuarios IS 'Tabela unificada para prontuários, laudos e relatórios';
COMMENT ON TABLE protocolos IS 'Tabela de protocolos/materiais para controle de estoque';
COMMENT ON TABLE movimentos_estoque IS 'Tabela para rastreamento de movimentação de estoque';
COMMENT ON TABLE agendamentos IS 'Tabela de agendamentos de consultas';
COMMENT ON TABLE logs_acao IS 'Tabela de auditoria para rastreamento de ações';

-- ===== SCRIPT FINALIZADO =====
-- Execute este script no SQL Editor do Supabase
-- Certifique-se de ter feito backup antes de executar em produção
-- Data: 2025-01-07
-- Versão: 1.0 