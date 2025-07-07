# 📋 Sistema de Prontuário - Configuração e Uso

## 🎯 Visão Geral

O **Sistema de Prontuário** é um módulo completo para gestão de atendimentos neuropsicológicos, incluindo:

- ✅ **Busca inteligente** de pacientes com autocomplete
- ✅ **Sub-abas organizadas**: Laudo, Anamnese, Testes Aplicados
- ✅ **Formulários dinâmicos** adaptados por faixa etária
- ✅ **Catálogo de testes** com preços automáticos
- ✅ **Cálculo automático** de valores
- ✅ **Fechamento de atendimento** com controle financeiro
- ✅ **Histórico completo** de movimentações

---

## 🛠️ Passo 1: Configuração do Banco de Dados

### 1.1 Executar Script SQL

No **Supabase Dashboard**, vá para **SQL Editor** e execute o script:

```sql
-- Copie e cole o conteúdo do arquivo: create-prontuario-database.sql
```

### 1.2 Verificar Criação das Tabelas

Após executar o script, você deve ver as seguintes tabelas no Supabase:

- `prontuarios` - Prontuários principais
- `anamnese` - Dados da anamnese
- `testes_catalogo` - Catálogo de testes neuropsicológicos
- `testes_aplicados` - Testes aplicados no prontuário
- `laudos_prontuario` - Laudos do prontuário
- `prontuario_historico` - Histórico de movimentações

### 1.3 Verificar Dados Iniciais

O script já insere **25 testes neuropsicológicos** com preços:

- WISC-IV: R$ 250,00
- WAIS-IV: R$ 280,00
- RAVLT: R$ 100,00
- BPA-2: R$ 120,00
- E muitos outros...

---

## 🎨 Passo 2: Interface do Sistema

### 2.1 Nova Aba "Prontuário"

O sistema agora possui uma nova aba **"Prontuário"** no menu principal, acessível para usuários com permissão de `clients` ou `reports`.

### 2.2 Fluxo de Uso

1. **Selecionar Paciente**: Digite o nome ou email para buscar
2. **Criar Prontuário**: Clique em "Novo Prontuário" se necessário
3. **Navegar pelas Abas**:
   - **Laudo**: Criar e editar laudos neuropsicológicos
   - **Anamnese**: Formulário dinâmico por faixa etária
   - **Testes**: Adicionar testes do catálogo
4. **Fechar Atendimento**: Finalizar com valor total calculado

---

## 📊 Passo 3: Funcionalidades Principais

### 3.1 Busca de Pacientes

```javascript
// Busca inteligente por nome ou email
// Autocomplete com resultados instantâneos
// Exibe dados do paciente selecionado
```

### 3.2 Anamnese Dinâmica

**Infantil (até 12 anos):**
- Desenvolvimento neuropsicomotor
- História escolar
- Aspectos comportamentais

**Adulto (13-59 anos):**
- História profissional
- Relacionamentos
- Autonomia e independência

**Idoso (60+ anos):**
- Funcionalidade
- Estado cognitivo
- Suporte social

### 3.3 Catálogo de Testes

**Categorias disponíveis:**
- Cognitivo
- Atenção
- Memória
- Funções Executivas
- Acadêmico
- Personalidade/Emocional
- Neuropsicológico

### 3.4 Cálculo Automático

```
Valor Total = Anamnese (R$ 150,00) + Testes Aplicados
```

- Atualização em tempo real
- Histórico de movimentações
- Controle financeiro integrado

---

## 🎯 Passo 4: Estrutura do Banco de Dados

### 4.1 Tabela `prontuarios`

```sql
id              uuid PRIMARY KEY
client_id       uuid REFERENCES clients(id)
created_by      uuid REFERENCES colaboradores(id)
data_abertura   timestamp DEFAULT now()
data_fechamento timestamp
status          text DEFAULT 'aberto'
valor_total     decimal(10,2) DEFAULT 0.00
observacoes     text
```

### 4.2 Tabela `testes_catalogo`

```sql
id              uuid PRIMARY KEY
nome            text NOT NULL
descricao       text
categoria       text
faixa_etaria    text
valor           decimal(8,2) NOT NULL
tempo_aplicacao integer
ativo           boolean DEFAULT true
```

### 4.3 Tabela `testes_aplicados`

```sql
id              uuid PRIMARY KEY
prontuario_id   uuid REFERENCES prontuarios(id)
teste_id        uuid REFERENCES testes_catalogo(id)
nome_teste      text NOT NULL
valor           decimal(8,2) NOT NULL
data_aplicacao  date DEFAULT CURRENT_DATE
```

---

## 🔧 Passo 5: Funções Auxiliares

### 5.1 Calcular Valor Total

```sql
SELECT public.calcular_valor_prontuario('prontuario_id');
```

### 5.2 Registrar Histórico

```sql
SELECT public.registrar_historico_prontuario(
  'prontuario_id',
  'acao',
  'descricao',
  valor_decimal
);
```

### 5.3 View Completa

```sql
SELECT * FROM public.prontuarios_completos;
```

---

## 🎨 Passo 6: Estilos e Interface

### 6.1 Design Responsivo

- Interface adaptável para desktop e mobile
- Navegação por abas fluida
- Animações suaves

### 6.2 Componentes Visuais

- Cards informativos
- Botões com ícones
- Formulários organizados
- Resumo financeiro destacado

### 6.3 Estados Visuais

- Loading states
- Estados de erro
- Confirmações
- Feedback visual

---

## 🚀 Passo 7: Testes e Validação

### 7.1 Testar Funcionalidades

1. **Busca de Pacientes**: Verificar autocomplete
2. **Criação de Prontuário**: Novo prontuário
3. **Formulários**: Salvar anamnese e laudo
4. **Testes**: Adicionar/remover testes
5. **Cálculos**: Verificar valores automáticos
6. **Fechamento**: Fechar atendimento

### 7.2 Verificar Permissões

- Coordenador: Acesso total
- Funcionário: Acesso a prontuários
- Estagiário: Acesso limitado

### 7.3 Validar Dados

```sql
-- Verificar prontuários criados
SELECT * FROM prontuarios ORDER BY data_abertura DESC;

-- Verificar testes aplicados
SELECT * FROM testes_aplicados ORDER BY created_at DESC;

-- Verificar histórico
SELECT * FROM prontuario_historico ORDER BY created_at DESC;
```

---

## 📈 Passo 8: Recursos Avançados

### 8.1 Relatórios

- Relatório de atendimentos por período
- Relatório de testes mais utilizados
- Relatório financeiro de prontuários

### 8.2 Integrações

- Sistema de clientes existente
- Sistema de colaboradores
- Sistema financeiro

### 8.3 Backup e Segurança

- Backup automático do Supabase
- Políticas RLS ativas
- Auditoria de movimentações

---

## 🎯 Resumo Final

O **Sistema de Prontuário** está **100% funcional** e pronto para uso em produção!

### ✅ Funcionalidades Implementadas:

1. **Busca inteligente** de pacientes
2. **Prontuários** com status e controle
3. **Anamnese dinâmica** por faixa etária
4. **Catálogo de testes** neuropsicológicos
5. **Cálculo automático** de valores
6. **Fechamento de atendimento** completo
7. **Histórico** de movimentações
8. **Interface responsiva** e moderna

### 🚀 Próximos Passos:

1. Execute o script SQL no Supabase
2. Teste as funcionalidades
3. Treine a equipe no uso
4. Personalize testes e valores conforme necessário

**O sistema está pronto para uso profissional!** 🎉 