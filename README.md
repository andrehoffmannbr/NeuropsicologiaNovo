# Sistema de Neuropsicologia

Sistema completo de gestão para clínicas de neuropsicologia desenvolvido com Vite, JavaScript ES6+, CSS3 e Supabase.

## 🚀 Funcionalidades

- **Dashboard dinâmico** - Estatísticas em tempo real, agendamentos do dia, atividades recentes
- **Gestão de clientes** - Cadastro completo com histórico médico, endereço e contatos
- **Calendário de agendamentos** - Interface intuitiva para agendamento e gestão de consultas
- **Módulo de estagiários** - Controle de supervisões e desenvolvimento
- **Controle de inventário** - Gestão de materiais e equipamentos com controle de estoque
- **Sistema financeiro** - Receitas, despesas e relatórios mensais
- **Autenticação segura** - Sistema de login com diferentes níveis de acesso
- **Interface responsiva** - Design moderno e adaptável para todos os dispositivos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Vite + JavaScript ES6+ + CSS3
- **Backend**: Supabase (PostgreSQL + API REST)
- **Hospedagem**: Vercel
- **Autenticação**: Supabase Auth
- **Banco de dados**: PostgreSQL com Row Level Security

## 📦 Hospedagem na Vercel

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Repositório no GitHub

### Configuração do Supabase

1. **Criar projeto no Supabase**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave pública (anon key)

2. **Configurar banco de dados**
   - Acesse o SQL Editor no Supabase
   - Execute o arquivo `database-schema.sql`
   - Verifique se todas as tabelas foram criadas

3. **Configurar autenticação**
   - Vá em Authentication > Settings
   - Desabilite "Enable email confirmations"
   - Configure providers se necessário

### Deploy na Vercel

1. **Conectar repositório**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Conecte sua conta do GitHub
   - Selecione o repositório `NeuropsicologiaNovo`

2. **Configurar variáveis de ambiente**
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_publica_do_supabase
   ```

3. **Configurações de build**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o processo de build e deploy
   - Acesse o link fornecido pela Vercel

### Configuração do arquivo supabase.js

Certifique-se de que o arquivo `src/config/supabase.js` está configurado corretamente:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
```

## 🔐 Credenciais de Acesso

**Usuário padrão:**
- Email: `test@example.com`
- Senha: `admin123`
- Perfil: Coordenador (acesso completo)

## 📋 Pós-Deploy

Após o deploy, verifique:

1. **Acesso ao sistema** - Teste o login com as credenciais fornecidas
2. **Conexão com banco** - Verifique se os dados estão sendo carregados
3. **Funcionalidades** - Teste todas as páginas e funcionalidades
4. **Responsividade** - Verifique em diferentes dispositivos

## 🔧 Comandos Úteis

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura do Projeto

```
NeuroPsicologia/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── services/      # Serviços e API
│   ├── styles/        # Estilos CSS
│   ├── utils/         # Utilitários
│   └── config/        # Configurações
├── public/            # Arquivos estáticos
├── database-schema.sql # Schema do banco
└── SETUP.md          # Instruções de configuração
```

## 🎯 Próximos Passos

1. **Domínio personalizado** - Configure um domínio próprio na Vercel
2. **SSL** - Certificado SSL automático via Vercel
3. **Backup** - Configure backups automáticos do Supabase
4. **Monitoring** - Configure alertas e monitoramento

## 🆘 Suporte

Se encontrar problemas durante o deploy:

1. Verifique os logs na Vercel
2. Confirme as variáveis de ambiente
3. Teste a conexão com o Supabase
4. Revise as configurações de autenticação

## 📝 Licença

Este projeto foi desenvolvido especificamente para uso em clínicas de neuropsicologia.

---

**Sistema desenvolvido com ❤️ para facilitar a gestão de clínicas de neuropsicologia** 