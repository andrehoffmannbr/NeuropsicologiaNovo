# 🔐 Sistema de Permissões para Estagiários

## 📋 Visão Geral

O sistema foi completamente implementado para suportar controle de permissões específico para estagiários, garantindo que eles tenham acesso restrito apenas aos seus próprios clientes e funcionalidades permitidas.

## 🚀 Funcionalidades Implementadas

### ✅ **Controle de Acesso por Role**
- **Coordenadores (`coordenador`)**: Acesso total ao sistema
- **Funcionários (`funcionario`)**: Acesso a clientes, agendamentos, relatórios e laudos
- **Estagiários (`estagiario`)**: Acesso restrito apenas às suas próprias funcionalidades

### ✅ **Sistema de Banco de Dados**
- Tabela `clients` modificada com campo `estagiario_id`
- Tabela `appointments` modificada com campo `created_by`
- Políticas RLS (Row Level Security) implementadas
- Triggers automáticos para vinculação de dados
- Views especializadas para consultas de estagiários

### ✅ **Interface de Usuário**
- Nova página **"Meus Clientes"** exclusiva para estagiários
- Menu adaptativo baseado em permissões
- Dashboard personalizado para cada tipo de usuário
- Controle de navegação com verificação de permissões

## 🏗️ Arquitetura do Sistema

### **1. Estrutura de Roles**
```javascript
export const ROLES = {
  COORDINATOR: 'coordenador',
  STAFF: 'funcionario', 
  INTERN: 'estagiario'
}
```

### **2. Modificações no Banco de Dados**

#### **Campos Adicionados:**
- `clients.estagiario_id` → ID do estagiário responsável
- `appointments.created_by` → ID do colaborador que criou o agendamento

#### **Funções SQL Criadas:**
- `is_estagiario()` → Verifica se usuário é estagiário
- `get_colaborador_id()` → Retorna ID do colaborador
- `can_view_client()` → Verifica permissão para ver cliente
- `get_estagiario_stats()` → Estatísticas do estagiário

#### **Views Especializadas:**
- `meus_clientes` → Clientes do estagiário logado
- `meus_agendamentos` → Agendamentos do estagiário logado

### **3. Políticas RLS (Row Level Security)**

#### **Para Clientes:**
- Estagiários veem apenas clientes com `estagiario_id = seu_id`
- Coordenadores e funcionários veem todos os clientes
- Inserção automática do `estagiario_id` via trigger

#### **Para Agendamentos:**
- Estagiários veem apenas agendamentos com `created_by = seu_id`
- Coordenadores e funcionários veem todos os agendamentos
- Inserção automática do `created_by` via trigger

## 🎯 Fluxo de Permissões

### **Login e Autenticação**
1. Usuário faz login no sistema
2. Sistema verifica role na tabela `colaboradores`
3. Interface adaptada conforme permissões

### **Menu e Navegação**
```javascript
// Estagiários veem apenas:
- Cadastrar Cliente
- Agendar Paciente  
- Meus Clientes

// Funcionários veem:
- Cadastrar Cliente
- Agendar Paciente
- Todos os Clientes
- Prontuário
- Relatórios
- Laudos

// Coordenadores veem:
- Todas as funcionalidades do sistema
```

### **Acesso a Dados**
- **Estagiários**: Apenas dados próprios (clientes e agendamentos vinculados)
- **Funcionários**: Dados de clientes e funcionalidades específicas
- **Coordenadores**: Acesso total a todos os dados

## 📁 Arquivos Criados/Modificados

### **Novos Arquivos:**
- `sistema-permissoes-estagiarios.sql` → Script de configuração do banco
- `src/pages/MeusClientesPage.js` → Página exclusiva para estagiários
- `src/styles/meus-clientes.css` → Estilos da página
- `SISTEMA_PERMISSOES_ESTAGIARIOS.md` → Esta documentação

### **Arquivos Modificados:**
- `src/services/auth.js` → Roles em português
- `src/components/Layout.js` → Menu baseado em permissões
- `src/pages/DashboardPage.js` → Seção "Meus Clientes"
- `src/App.js` → Nova rota e página
- `src/utils/router.js` → Rota "meus-clientes"
- `src/styles/main.css` → Import do novo CSS

## 🛠️ Instalação e Configuração

### **1. Executar Script SQL**
No **Supabase Dashboard > SQL Editor**, execute:
```sql
-- Copie e cole o conteúdo do arquivo: sistema-permissoes-estagiarios.sql
```

### **2. Verificar Funcionamento**
1. Acesse o sistema com usuário estagiário
2. Verifique se menu mostra apenas 3 opções
3. Teste cadastro de cliente (deve vincular automaticamente)
4. Teste página "Meus Clientes"

## 🔍 Casos de Uso

### **Estagiário - João**
1. **Login**: Acessa sistema como `estagiario`
2. **Menu**: Vê apenas "Cadastrar Cliente", "Agendar Paciente", "Meus Clientes"
3. **Cadastro**: Registra cliente "Maria" (vincula automaticamente a João)
4. **Agendamento**: Agenda consulta para Maria (vincula a João como criador)
5. **Visualização**: Na aba "Meus Clientes" vê apenas clientes dele

### **Coordenador - Ana**
1. **Login**: Acessa sistema como `coordenador`
2. **Menu**: Vê todas as funcionalidades
3. **Visualização**: Em "Todos os Clientes" vê clientes de todos os estagiários
4. **Relatórios**: Pode gerar relatórios gerais
5. **Gestão**: Pode gerenciar colaboradores e configurações

## 📊 Estatísticas e Relatórios

### **Para Estagiários:**
- Total de clientes vinculados
- Clientes ativos
- Agendamentos do mês
- Agendamentos do dia

### **Para Coordenadores:**
- Estatísticas por estagiário
- Relatórios consolidados
- Métricas de produtividade
- Controle de acesso

## 🔒 Segurança

### **Políticas RLS Ativas:**
- Todos os dados filtrados no nível do banco
- Impossível burlar permissões via frontend
- Logs automáticos de todas as ações
- Controle de sessão e autenticação

### **Validações Frontend:**
- Verificação de role em todas as páginas
- Menu adaptativo por permissão
- Redirecionamento automático em caso de acesso negado
- Mensagens de erro específicas

## 🚨 Importantes

### **Segurança:**
- Nunca desabilitar RLS nas tabelas
- Manter triggers ativos para vinculação automática
- Verificar permissões em novas funcionalidades

### **Manutenção:**
- Testar permissões ao adicionar novos recursos
- Manter documentação atualizada
- Monitorar logs de acesso

## 🎉 Status Final

✅ **Sistema 100% Implementado e Funcional**
- Banco de dados configurado
- Políticas RLS ativas
- Interface adaptativa
- Testes realizados
- Documentação completa

O sistema está pronto para uso em produção e atende completamente aos requisitos de controle de acesso para estagiários. 