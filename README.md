# Sistema de Neuropsicologia

Sistema completo de gestão de clínica de neuropsicologia com interface moderna e funcionalidades avançadas.

## 🚀 Funcionalidades

- **Gestão de Clientes**: Cadastro completo para adultos e menores
- **Sistema de Agendamentos**: Calendário interativo com diferentes tipos de serviços
- **Módulo Financeiro**: Dashboard com KPIs e controle de receitas/despesas
- **Gestão de Estoque**: Controle de materiais e alertas de estoque baixo
- **Gestão de Estagiários**: Cadastro e atribuição de pacientes
- **Sistema de Documentos**: Upload e gerenciamento de laudos e documentos
- **Relatórios Interativos**: Gráficos e exportação em PDF/Excel
- **Controle de Permissões**: Sistema de roles (Coordenador, Staff, Estagiário)

## 🛠️ Tecnologias

- **Frontend**: Vite + JavaScript ES6+ + CSS3 moderno
- **Backend**: Supabase (Database + Storage + Auth)
- **Gráficos**: Chart.js
- **Exportação**: jsPDF + xlsx
- **Ícones**: Lucide
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 16+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd neuropsicologia-system
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Crie um arquivo .env na raiz do projeto
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Execute em desenvolvimento:
```bash
npm run dev
```

5. Para build de produção:
```bash
npm run build
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/         # Componentes reutilizáveis
├── config/            # Configurações (Supabase)
├── pages/             # Páginas da aplicação
├── services/          # Serviços (Auth, API)
├── styles/            # Estilos CSS
├── utils/             # Utilitários e helpers
├── App.js             # Componente principal
└── main.js            # Ponto de entrada
```

## 👤 Níveis de Acesso

### Coordenador
- Acesso total ao sistema
- Gerenciamento financeiro
- Controle de estoque
- Gestão de estagiários

### Staff
- Gestão de clientes
- Agendamentos
- Relatórios
- Documentos

### Estagiário
- Próprios pacientes
- Próprios agendamentos
- Agenda pessoal

## 🔐 Segurança

- Row Level Security (RLS) no Supabase
- Content Security Policy (CSP)
- Sanitização de inputs
- Validação de arquivos
- Controle de acesso baseado em roles

## 📱 Responsividade

Interface totalmente responsiva otimizada para:
- Desktop
- Tablet
- Mobile

## 🚀 Deploy

O projeto está configurado para deploy automático na Vercel:

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 📄 Licença

Este projeto é privado e confidencial.

---

**Desenvolvido com ❤️ para gestão eficiente de clínicas de neuropsicologia** 