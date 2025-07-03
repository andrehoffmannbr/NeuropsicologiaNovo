# 🚀 Sistema de Gestão de Colaboradores

## 📋 Visão Geral

Este sistema permite que coordenadores cadastrem e gerenciem colaboradores (estagiários, funcionários e coordenadores) com controle hierárquico completo.

## 🔧 Configuração Inicial

### 1. Executar Script SQL

Execute o script `create-colaboradores-table.sql` no seu painel do Supabase:

```sql
-- Copie e cole o conteúdo do arquivo create-colaboradores-table.sql
-- no SQL Editor do Supabase e execute
```

### 2. Verificar Instalação

Após executar o script, você deverá ter:
- ✅ Tabela `colaboradores` criada
- ✅ Políticas RLS configuradas
- ✅ Funções auxiliares criadas
- ✅ Coordenador padrão cadastrado

## 🎯 Funcionalidades

### 📝 Cadastro de Colaboradores

**Quem pode usar:** Apenas coordenadores

**Como funcionar:**
1. Acesse o sistema como coordenador
2. Clique na aba "Colaboradores"
3. Preencha o formulário:
   - Nome completo
   - E-mail (único no sistema)
   - Telefone (opcional)
   - Senha temporária (mínimo 6 caracteres)
4. Clique em "Cadastrar Colaborador"

**Processo interno:**
- Cria usuário no Supabase Auth
- Salva dados na tabela `colaboradores`
- Cargo inicial sempre é "estagiário"

### 👥 Gerenciamento de Colaboradores

**Visualização:**
- Lista todos os colaboradores ativos
- Estatísticas por cargo
- Filtros por cargo e nome
- Busca em tempo real

**Promoção de Colaboradores:**
- Estagiário → Funcionário → Coordenador
- Impossível promover a si mesmo
- Apenas coordenadores podem promover
- Histórico de mudanças registrado

### 🔒 Controle de Acesso

**Níveis de Permissão:**
- **Coordenador**: Acesso total - pode cadastrar, visualizar e promover
- **Funcionário**: Sem acesso ao módulo de colaboradores
- **Estagiário**: Sem acesso ao módulo de colaboradores

## 📊 Estrutura da Tabela

```sql
public.colaboradores (
    id: uuid PRIMARY KEY,
    nome: text NOT NULL,
    email: text UNIQUE NOT NULL,
    telefone: text,
    cargo: text CHECK (cargo IN ('estagiario', 'funcionario', 'coordenador')),
    user_id: uuid REFERENCES auth.users(id),
    data_cadastro: timestamp DEFAULT now(),
    ativo: boolean DEFAULT true,
    created_at: timestamp DEFAULT now(),
    updated_at: timestamp DEFAULT now()
)
```

## 🛡️ Segurança

### Políticas RLS (Row Level Security)

1. **Leitura**: Usuários veem seus dados + coordenadores veem todos
2. **Inserção**: Apenas coordenadores podem cadastrar
3. **Atualização**: Coordenadores podem promover outros (não a si mesmos)
4. **Atualização própria**: Usuários podem atualizar seus dados (exceto cargo)

### Funções Auxiliares

- `is_coordenador()`: Verifica se usuário é coordenador
- `get_user_cargo()`: Retorna cargo do usuário atual
- `promover_colaborador()`: Promove colaborador com validações

## 🎨 Interface do Usuário

### Navegação
- Aba "Colaboradores" visível apenas para coordenadores
- Integrada ao dashboard principal
- Sistema de tabs: Cadastro / Gerenciamento

### Formulário de Cadastro
- Campos validados
- Feedback visual
- Mensagens de sucesso/erro
- Limpeza automática após cadastro

### Lista de Colaboradores
- Cards informativos
- Badges coloridos por cargo
- Filtros e busca
- Ações de promoção inline

## 📈 Estatísticas

O sistema exibe:
- Total de colaboradores
- Quantidade por cargo
- Atualizações em tempo real
- Histórico de cadastros

## 🔄 Fluxo de Trabalho

### Cadastro de Novo Colaborador

1. **Coordenador** acessa o sistema
2. Navega para "Colaboradores"
3. Preenche formulário na aba "Cadastrar"
4. Sistema:
   - Valida dados
   - Cria usuário no Supabase Auth
   - Salva na tabela `colaboradores`
   - Envia feedback

### Promoção de Colaborador

1. **Coordenador** vai para aba "Gerenciar"
2. Localiza o colaborador
3. Seleciona novo cargo no dropdown
4. Clica em "Promover"
5. Sistema:
   - Valida permissões
   - Executa função SQL
   - Atualiza interface
   - Registra histórico

## 🚨 Solução de Problemas

### Erro: "Tabela não encontrada"
**Solução:** Execute o script `create-colaboradores-table.sql`

### Erro: "Acesso negado"
**Solução:** Verifique se o usuário tem cargo "coordenador"

### Erro: "E-mail já cadastrado"
**Solução:** Use um e-mail diferente ou verifique se o colaborador já existe

### Erro: "Não é possível promover a si mesmo"
**Solução:** Peça para outro coordenador fazer a promoção

## 📋 Credenciais de Teste

Para testar o sistema, use as credenciais padrão:

```
E-mail: test@example.com
Senha: admin123
Cargo: Coordenador
```

## 🔧 Manutenção

### Backup da Tabela
```sql
-- Backup dos dados de colaboradores
SELECT * FROM public.colaboradores;
```

### Logs de Auditoria
```sql
-- Verificar últimas promoções
SELECT * FROM public.colaboradores 
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;
```

### Estatísticas Gerais
```sql
-- Contagem por cargo
SELECT cargo, COUNT(*) as total 
FROM public.colaboradores 
WHERE ativo = true 
GROUP BY cargo;
```

## 📞 Suporte

Em caso de problemas:
1. Verifique se o script SQL foi executado corretamente
2. Confirme se as políticas RLS estão ativas
3. Verifique se o usuário tem permissões adequadas
4. Consulte os logs do console do navegador

---

## ✅ Checklist de Implementação

- [x] Tabela `colaboradores` criada
- [x] Políticas RLS configuradas
- [x] Funções auxiliares implementadas
- [x] Interface de usuário desenvolvida
- [x] Sistema de navegação integrado
- [x] Validações implementadas
- [x] Controle de acesso configurado
- [x] Testes de funcionalidade realizados
- [x] Documentação criada

🎉 **Sistema de Colaboradores está pronto para uso!** 