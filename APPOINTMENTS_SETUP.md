# 📅 RESOLUÇÃO DO PROBLEMA - TABELA APPOINTMENTS

## 🔍 Problema Identificado

A tabela `appointments` não está funcionando corretamente no sistema de agendamentos. Embora ela esteja definida no schema principal, pode não ter sido criada no Supabase ou ter problemas de estrutura/permissões.

## 📋 Sintomas

- ❌ Não consegue agendar consultas
- ❌ Dashboard não mostra agendamentos
- ❌ Erro ao tentar salvar agendamentos
- ❌ Tabela pode aparecer no Table Editor mas não funciona

## 🛠️ Soluções Disponíveis

### 🚀 SOLUÇÃO 1: Verificar e Criar Tabela (RECOMENDADA)

Execute o arquivo `verify-appointments-table.sql` no **SQL Editor do Supabase**:

```sql
-- Este arquivo vai:
✅ Verificar se a tabela existe
✅ Criar se não existir (sem perder dados)
✅ Configurar políticas de segurança
✅ Criar índices de performance
✅ Mostrar estrutura da tabela
```

### 🔄 SOLUÇÃO 2: Recriar Tabela Completamente

Se a Solução 1 não resolver, execute `create-appointments-table.sql`:

```sql
-- Este arquivo vai:
⚠️ Remover tabela existente (perda de dados)
✅ Criar tabela nova e limpa
✅ Inserir dados de exemplo
✅ Configurar tudo do zero
```

### 🧪 SOLUÇÃO 3: Testar Funcionalidade

Execute `test-appointments-table.sql` para diagnosticar problemas:

```sql
-- Este arquivo vai:
🔍 Verificar se tabela existe
🔍 Mostrar estrutura
🔍 Testar inserção de dados
🔍 Testar consultas com JOIN
🔍 Verificar políticas RLS
```

## 📝 Passos para Resolver

### 1️⃣ Acessar o Supabase
1. Entre no [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**

### 2️⃣ Executar Script de Verificação
1. Copie o conteúdo de `verify-appointments-table.sql`
2. Cole no SQL Editor
3. Clique em **Run**
4. Verifique os resultados

### 3️⃣ Verificar Resultado
Se der certo, você verá:
```
✅ Tabela appointments criada
✅ Políticas RLS configuradas
✅ Índices criados
✅ Estrutura da tabela mostrada
```

### 4️⃣ Testar no Sistema
1. Acesse o sistema
2. Vá para **Agendamentos**
3. Tente criar um novo agendamento
4. Verifique se aparece na lista

## 🎯 Estrutura da Tabela Appointments

```sql
CREATE TABLE public.appointments (
    id uuid PRIMARY KEY,
    client_id uuid REFERENCES clients(id),
    professional_id uuid REFERENCES auth.users(id),
    appointment_date date NOT NULL,
    appointment_time time NOT NULL,
    duration_minutes integer DEFAULT 60,
    appointment_type text CHECK (IN 'consulta', 'avaliacao', 'sessao', 'retorno'),
    status text DEFAULT 'agendado',
    notes text,
    room text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

## 🔐 Políticas de Segurança

```sql
-- Usuários autenticados podem:
✅ Visualizar agendamentos (SELECT)
✅ Criar agendamentos (INSERT)
✅ Atualizar agendamentos (UPDATE)
✅ Deletar agendamentos (DELETE)
```

## 📊 Campos Obrigatórios

- **client_id**: ID do cliente (obrigatório)
- **appointment_date**: Data do agendamento (obrigatório)
- **appointment_time**: Hora do agendamento (obrigatório)
- **appointment_type**: Tipo de consulta (obrigatório)

## 🔄 Tipos de Agendamento

- `consulta`: Consulta regular
- `avaliacao`: Avaliação neuropsicológica
- `sessao`: Sessão de terapia
- `retorno`: Consulta de retorno

## 📈 Status de Agendamento

- `agendado`: Agendamento confirmado
- `confirmado`: Cliente confirmou presença
- `realizado`: Consulta realizada
- `cancelado`: Agendamento cancelado
- `faltou`: Cliente não compareceu

## 🚨 Troubleshooting

### Problema: "Tabela não encontrada"
**Solução**: Execute `verify-appointments-table.sql`

### Problema: "Permissão negada"
**Solução**: Verifique as políticas RLS no script

### Problema: "Erro ao inserir dados"
**Solução**: Verifique se existem clientes cadastrados

### Problema: "JOIN não funciona"
**Solução**: Execute `test-appointments-table.sql` para diagnosticar

## ✅ Verificação Final

Após executar os scripts, verifique:

1. **No Supabase Table Editor**:
   - Tabela `appointments` aparece
   - Tem os campos corretos
   - Políticas RLS ativas

2. **No Sistema**:
   - Página de agendamentos carrega
   - Consegue criar agendamentos
   - Agendamentos aparecem na lista
   - Dashboard mostra estatísticas

3. **No Console do Navegador**:
   - Sem erros de SQL
   - Sem erros de permissão
   - Consultas retornam dados

## 📞 Suporte

Se ainda houver problemas após seguir estes passos:

1. Verifique o console do navegador (F12)
2. Copie qualquer erro que aparecer
3. Verifique se as tabelas `clients` e `auth.users` existem
4. Teste com um cliente cadastrado

---

**💡 Dica**: Sempre execute primeiro a **Solução 1** para preservar dados existentes! 