# 🎯 Formulário Dinâmico de Clientes - Sistema de Neuropsicologia

## 📋 Resumo da Implementação

O formulário de cadastro de clientes foi completamente redesenhado para ser **dinâmico** e **adaptativo**, ajustando-se automaticamente baseado na idade do cliente. Quando o usuário insere a data de nascimento, o sistema detecta se é maior ou menor de idade e exibe campos específicos.

## 🚀 Funcionalidades Implementadas

### ✅ **Detecção Automática de Idade**
- Calcula automaticamente a idade baseada na data de nascimento
- Determina se é maior ou menor de 18 anos
- Exibe badge visual com idade e status (MENOR/MAIOR DE IDADE)

### ✅ **Formulário para Menores de Idade**
**Dados Pessoais do Menor:**
- Nome da Escola *
- Tipo de Escola (Pública, Privada, Técnica, Outro) *
- Ano Escolar (Educação Infantil até 3º Médio) *
- Telefone de Contato *

**Dados dos Pais/Responsáveis:**
- **Pai:** Nome, Idade, Profissão, Telefone
- **Mãe:** Nome, Idade, Profissão, Telefone
- Responsável Financeiro (Pai, Mãe, Ambos, Outro) *
- Outro Responsável (Nome e parentesco)

### ✅ **Formulário para Maiores de Idade**
**Dados Pessoais:**
- CPF (com validação automática) *
- RG *
- Naturalidade *
- Estado Civil *
- Escolaridade *
- Profissão *
- E-mail *
- Telefone *
- Contato de Emergência *
- Telefone de Emergência *

### ✅ **Funcionalidades Avançadas**
- **Busca Automática de CEP** via API ViaCEP
- **Formatação Automática** de CPF, telefones e CEP
- **Validação de CPF** com algoritmo completo
- **Layout Responsivo** para mobile e desktop
- **Integração com Supabase** para salvamento

## 🗄️ Estrutura do Banco de Dados

### Campos Adicionados na Tabela `clients`

```sql
-- Campos comuns
gender text

-- Campos para menores de idade
school_name text
school_type text
school_grade text
father_name text
father_age integer
father_profession text
father_phone text
mother_name text
mother_age integer
mother_profession text
mother_phone text
financial_responsible text
other_responsible text

-- Campos para maiores de idade
rg text
birth_place text
marital_status text
education text
profession text
```

### ⚠️ **Importante: Executar Script SQL**

Antes de usar o formulário dinâmico, execute o script `add-client-fields.sql` no seu banco Supabase:

```bash
# No painel do Supabase, vá em SQL Editor e execute:
# add-client-fields.sql
```

## 🎨 Design e UX

### **Interface Moderna**
- Badge visual colorido para identificação da idade
- Seções organizadas com ícones e cores
- Formulário de loading enquanto o usuário escolhe a data
- Campos com placeholders explicativos

### **Validação e Feedback**
- Validação em tempo real
- Mensagens de erro claras
- Preenchimento automático de endereço
- Formatação automática de campos

### **Responsividade**
- Layout adaptativo para mobile
- Campos organizados em grid responsivo
- Botões e elementos otimizados para toque

## 💻 Arquivos Modificados

### **JavaScript**
- `src/pages/ClientsPage.js` - Completamente reescrito
  - Detecção automática de idade
  - Renderização dinâmica de formulários
  - Validação e formatação automática
  - Integração com APIs externas

### **CSS**
- `src/styles/clients.css` - Novos estilos adicionados
  - Estilos para badge de idade
  - Seções de pais/responsáveis
  - Estados de loading
  - Suporte a modo escuro
  - Design responsivo

### **Banco de Dados**
- `add-client-fields.sql` - Script para adicionar campos necessários

## 🔧 Como Usar

### **1. Para Cadastrar um Cliente**

1. **Navegue** para "Cadastrar Cliente"
2. **Preencha** Nome, Data de Nascimento e Gênero
3. **Aguarde** o formulário adaptar-se automaticamente
4. **Complete** os campos específicos (menor ou maior de idade)
5. **Digite** o CEP para preenchimento automático do endereço
6. **Clique** em "Cadastrar Cliente"

### **2. Para Menores de Idade**

- **Preencha** dados da escola
- **Complete** informações dos pais/responsáveis
- **Defina** o responsável financeiro
- **Adicione** observações se necessário

### **3. Para Maiores de Idade**

- **Insira** CPF (será validado automaticamente)
- **Complete** dados pessoais (RG, naturalidade, etc.)
- **Defina** contato de emergência
- **Adicione** observações se necessário

## 📱 Funcionalidades Técnicas

### **Validações Implementadas**
- CPF: Algoritmo completo de validação
- Data de nascimento: Validação de idade
- Campos obrigatórios: Verificação antes do envio
- Telefones: Formatação automática
- CEP: Integração com ViaCEP

### **APIs Integradas**
- **ViaCEP**: Busca automática de endereço
- **Supabase**: Salvamento e autenticação

### **Formatação Automática**
- CPF: 000.000.000-00
- Telefones: (11) 99999-9999
- CEP: 00000-000

## 🎯 Benefícios

1. **UX Melhorada**: Formulário intuitivo e adaptativo
2. **Menos Erros**: Validação em tempo real
3. **Eficiência**: Preenchimento automático de dados
4. **Organização**: Campos específicos para cada tipo de cliente
5. **Profissionalismo**: Interface moderna e responsiva

## 🐛 Solução de Problemas

### **Erro ao Salvar Cliente**
- Verifique se executou o script `add-client-fields.sql`
- Confirme se todos os campos obrigatórios estão preenchidos
- Verifique a conexão com o Supabase

### **CEP Não Encontrado**
- Verifique se o CEP tem 8 dígitos
- Confirme se há conexão com a internet
- Teste com um CEP conhecido

### **CPF Inválido**
- O sistema valida automaticamente
- Insira apenas números (formatação é automática)
- Verifique se o CPF está correto

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se executou o script SQL
2. Confirme se todos os arquivos foram atualizados
3. Teste em um navegador atualizado
4. Verifique o console do navegador para erros

---

## 🎉 Conclusão

O formulário dinâmico de clientes representa um avanço significativo na usabilidade e funcionalidade do sistema. Com detecção automática de idade, validação em tempo real e interface moderna, proporciona uma experiência profissional e eficiente para o cadastro de clientes.

**Próximos Passos Sugeridos:**
- Implementar histórico de alterações
- Adicionar exportação de dados
- Criar validação de duplicatas
- Implementar upload de documentos 