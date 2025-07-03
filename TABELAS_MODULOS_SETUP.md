# 🔧 CORREÇÃO: Tabelas dos Módulos - Setup Completo

## ⚠️ PROBLEMA IDENTIFICADO
O erro **400** que você está vendo acontece porque as tabelas dos novos módulos não existem no Supabase:
- `financial_transactions` (Módulo Financeiro)
- `inventory_items` (Módulo Estoque)  
- `supervision_sessions` (Módulo Estagiários)
- `reports` (Módulo Laudos)

## 🚀 SOLUÇÃO RÁPIDA

### 1. Acesse o Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto **NeuroPsicologia**
4. Clique em **SQL Editor** no menu lateral

### 2. Execute o Script
1. Abra o arquivo `create-all-tables.sql` (que acabei de criar)
2. **Copie todo o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **RUN** (ou pressione Ctrl+Enter)

### 3. Aguarde a Execução
- O script vai criar todas as 4 tabelas necessárias
- Vai configurar as políticas de segurança (RLS)
- Vai inserir dados de exemplo para testar
- Vai mostrar uma mensagem de sucesso

## 📋 TABELAS QUE SERÃO CRIADAS

### 1. 💰 **financial_transactions** (Controle Financeiro)
```sql
- id (UUID)
- transaction_type (receita/despesa)
- category (Consulta, Avaliação, etc.)
- description (Descrição)
- amount (Valor em decimal)
- payment_method (dinheiro, cartão, pix, transferência)
- payment_status (pendente, pago)
- created_by (quem criou)
- created_at/updated_at (timestamps)
```

### 2. 📦 **inventory_items** (Controle de Estoque)
```sql
- id (UUID)
- name (Nome do item)
- category (Material de Escritório, Clínico, etc.)
- description (Descrição)
- quantity (Quantidade atual)
- minimum_stock (Estoque mínimo)
- unit_price (Preço unitário)
- supplier (Fornecedor)
- location (Localização)
- created_by (quem criou)
- created_at/updated_at (timestamps)
```

### 3. 👥 **supervision_sessions** (Supervisões de Estagiários)
```sql
- id (UUID)
- intern_id (ID do estagiário)
- supervisor_id (ID do supervisor)
- session_date (Data da supervisão)
- session_time (Horário)
- duration_minutes (Duração em minutos)
- status (agendado, realizado, cancelado)
- topics (Tópicos a discutir)
- notes (Observações)
- created_by (quem criou)
- created_at/updated_at (timestamps)
```

### 4. 📋 **reports** (Laudos Neuropsicológicos)
```sql
- id (UUID)
- client_id (FK para clients)
- report_type (tipo de laudo)
- report_date (Data do laudo)
- status (rascunho, finalizado, entregue)
- main_complaint (Queixa principal)
- history (Histórico)
- assessment (Avaliação)
- conclusion (Conclusão)
- created_by (quem criou)
- created_at/updated_at (timestamps)
```

## 🔐 SEGURANÇA CONFIGURADA

Todas as tabelas terão:
- **RLS (Row Level Security)** habilitado
- **Políticas de acesso** baseadas no perfil do usuário
- Apenas **Coordenadores** e **Staff** podem acessar
- **Índices** para performance otimizada

## 🎯 DADOS DE EXEMPLO

O script inclui dados de exemplo para você testar:
- **Transações financeiras** (receitas e despesas)
- **Itens de estoque** (materiais de escritório e clínicos)
- **Estrutura completa** para começar a usar imediatamente

## ✅ APÓS EXECUTAR O SCRIPT

1. **Teste o módulo Financeiro**: Cadastre uma transação
2. **Teste o módulo Estoque**: Adicione um item
3. **Teste o módulo Estagiários**: Agende uma supervisão
4. **Teste o módulo Laudos**: Crie um laudo

## 🆘 SE HOUVER PROBLEMAS

1. **Verifique se executou todo o script** (não apenas uma parte)
2. **Confirme que está logado** com o usuário correto
3. **Verifique se a tabela user_profiles existe** (necessária para RLS)
4. **Me informe se ainda houver erros** - vou ajudar!

## 📞 SUPORTE

Se ainda houver problemas após executar o script:
1. Copie e cole a mensagem de erro
2. Informe em qual módulo está dando erro
3. Eu vou ajudar a resolver imediatamente!

---

**✨ Depois de executar este script, todos os módulos funcionarão perfeitamente!** 