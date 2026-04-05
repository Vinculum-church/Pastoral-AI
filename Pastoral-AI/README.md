# Vinculum Pastoral

Sistema de gestão pastoral para catequese, perseverança e outras pastorais da Igreja Católica.

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Deploy](#deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Banco de Dados](#banco-de-dados)
- [Roles e Permissões](#roles-e-permissões)
- [Guia do Administrador](#guia-do-administrador)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

O Vinculum Pastoral é uma plataforma completa para gestão de pastorais, permitindo:

- **Coordenadores**: Gerenciar turmas, catequistas, encontros e catequizandos
- **Catequistas/Líderes**: Registrar presenças, gerar roteiros pastorais com IA
- **Fiéis**: Acessar informações da comunidade sem necessidade de cadastro
- **Administradores**: Criar paróquias, comunidades e coordenadores

---

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Cloudflare     │────▶│   Supabase      │
│   (React/Vite)  │     │  Pages Functions│     │   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        └──────────────▶│   Google Gemini │
                        │   (AI/LLM)      │
                        └─────────────────┘
```

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Cloudflare Pages Functions (serverless)
- **Banco de Dados**: Supabase (PostgreSQL + Auth)
- **IA**: Google Gemini API (roteiros e sugestões litúrgicas)

---

## Tecnologias

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React | 18.x |
| Build | Vite | 6.x |
| Estilização | TailwindCSS | 3.x |
| Ícones | Lucide React | - |
| Backend | Cloudflare Workers | - |
| Banco de Dados | Supabase (PostgreSQL) | - |
| Autenticação | Supabase Auth | - |
| IA | Google Gemini | 2.5 |
| Pagamentos | Stripe | - |

---

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com)
- Conta no [Cloudflare](https://cloudflare.com)
- API Key do [Google AI Studio](https://aistudio.google.com)

### 1. Clone o repositório

```bash
git clone <repo-url>
cd pastoralai/Pastoral-AI
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `Pastoral-AI`:

```env
# Supabase (Frontend)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Google Gemini (Frontend - para funções de IA)
VITE_GEMINI_API_KEY=sua-gemini-api-key
```

Para desenvolvimento local das Functions, crie `.dev.vars`:

```env
# Supabase (Backend)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
APP_URL=http://localhost:8788
```

---

## Desenvolvimento Local

### Modo Frontend + Backend Express (desenvolvimento rápido)

```bash
npm run dev
```

Acesse: http://localhost:3000

### Modo Cloudflare Pages (simula produção)

```bash
# Build do frontend
npm run build

# Inicia servidor local do Cloudflare
npm run pages:dev
```

Acesse: http://localhost:8788

---

## Deploy

### Deploy para Cloudflare Pages

```bash
npm run deploy
```

Ou manualmente:

```bash
npm run build
npx wrangler pages deploy dist --project-name vinculum-pastoral --commit-dirty=true
```

### Configurar Secrets no Cloudflare

```bash
# Supabase URL
echo "https://seu-projeto.supabase.co" | npx wrangler pages secret put VITE_SUPABASE_URL --project-name vinculum-pastoral

# Supabase Service Role Key
echo "sua-service-role-key" | npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name vinculum-pastoral

# App URL
echo "https://vinculum-pastoral.pages.dev" | npx wrangler pages secret put APP_URL --project-name vinculum-pastoral
```

### Configurar Supabase

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/auth/url-configuration
2. **Site URL**: `https://vinculum-pastoral.pages.dev`
3. **Redirect URLs**: `https://vinculum-pastoral.pages.dev/*`

---

## Estrutura do Projeto

```
Pastoral-AI/
├── src/                    # (não usado - código na raiz)
├── components/             # Componentes React
│   ├── Login.tsx          # Tela de login
│   ├── Dashboard.tsx      # Dashboard principal
│   ├── MeetingManager.tsx # Gestão de encontros
│   ├── AdminPanel.tsx     # Painel administrativo
│   ├── FielPage.tsx       # Portal do Fiel
│   └── ...
├── contexts/              # React Contexts
│   ├── AuthContext.tsx    # Autenticação
│   ├── DataContext.tsx    # Dados globais
│   ├── PastoralContext.tsx# Tipo de pastoral
│   └── FielContext.tsx    # Sessão do Fiel
├── services/              # Serviços externos
│   └── geminiService.ts   # Integração com Gemini AI
├── functions/             # Cloudflare Pages Functions
│   └── api/
│       ├── health.ts
│       ├── invite-user.ts
│       ├── create-lider.ts
│       ├── create-checkout-session.ts
│       ├── webhook.ts
│       └── admin/
│           ├── create-paroquia.ts
│           ├── create-comunidade.ts
│           └── create-coordinator.ts
├── types.ts               # TypeScript types/interfaces
├── constants.ts           # Constantes e configurações
├── App.tsx                # Componente raiz
├── main.tsx               # Entry point
├── server.ts              # Servidor Express (dev local)
├── wrangler.toml          # Config Cloudflare
├── vite.config.ts         # Config Vite
├── tailwind.config.js     # Config TailwindCSS
└── package.json
```

---

## API Endpoints

### Públicos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |

### Autenticados (Bearer Token)

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| POST | `/api/invite-user` | Convidar usuário por email | coordenador |
| POST | `/api/create-lider` | Criar catequista com senha | coordenador |
| POST | `/api/admin/create-paroquia` | Criar paróquia | admin |
| POST | `/api/admin/create-comunidade` | Criar comunidade | admin |
| POST | `/api/admin/create-coordinator` | Criar coordenador | admin |

### Stripe (Pagamentos)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/create-checkout-session` | Criar sessão de checkout |
| POST | `/api/webhook` | Webhook do Stripe |

---

## Banco de Dados

### Tabelas Principais

```sql
-- Paróquias
paroquias (id, nome, endereco, telefone, created_at)

-- Comunidades
comunidades (id, nome, paroquia_id, padroeiro, created_at)

-- Perfis de usuário
profiles (id, nome, email, role, pastoral_type, paroquia_id, comunidade_id)

-- Turmas
turmas (id, nome, comunidade_id, ano, etapa, created_at)

-- Catequizandos
catequizandos (id, nome, turma_id, data_nascimento, responsavel_id, ...)

-- Responsáveis
responsaveis (id, nome, telefone, email, parentesco, comunidade_id)

-- Encontros
encontros (id, turma_id, data, tema, observacoes, created_at)

-- Presenças
presencas (id, encontro_id, catequizando_id, presente, observacao)

-- Líderes (catequistas)
lideres (id, user_id, turma_id, nome, email, telefone)
```

### Row Level Security (RLS)

O Supabase usa RLS para controlar acesso. Cada usuário só vê dados da sua comunidade.

---

## Roles e Permissões

| Role | Permissões |
|------|------------|
| **admin** | Criar paróquias, comunidades, coordenadores. Acesso total. |
| **coordenador** | Gerenciar turmas, catequistas, catequizandos da sua comunidade. |
| **lider** | Registrar presenças, ver catequizandos da sua turma. |
| **fiel** | Acesso público (sem login) às informações da comunidade. |

### Tipos de Pastoral

- `catequese` - Catequese tradicional
- `perseveranca` - Perseverança
- `pastoral_crista` - Iniciação Cristã
- `fiel` - Portal do Fiel (acesso público)

---

## Guia do Administrador

### Primeiro Acesso

1. Acesse https://vinculum-pastoral.pages.dev
2. Faça login com as credenciais de admin
3. Você verá o **Painel Administrativo**

### Criar uma Nova Paróquia

1. No painel admin, clique em **"Nova Paróquia"**
2. Preencha: Nome, Endereço (opcional), Telefone (opcional)
3. Clique em **"Criar"**

### Criar uma Nova Comunidade

1. No painel admin, clique em **"Nova Comunidade"**
2. Selecione a Paróquia
3. Preencha: Nome, Padroeiro (opcional)
4. Clique em **"Criar"**

### Criar um Coordenador

1. No painel admin, clique em **"Novo Coordenador"**
2. Preencha:
   - Email
   - Senha (mínimo 6 caracteres)
   - Nome completo
   - Paróquia
   - Comunidade
   - Segmento pastoral (Catequese, Perseverança, etc.)
3. Clique em **"Criar"**

O coordenador poderá fazer login imediatamente.

### Fluxo Recomendado

```
1. Admin cria Paróquia
       ↓
2. Admin cria Comunidade (vinculada à Paróquia)
       ↓
3. Admin cria Coordenador (vinculado à Comunidade)
       ↓
4. Coordenador faz login e cria Turmas
       ↓
5. Coordenador cria Catequistas (vinculados às Turmas)
       ↓
6. Catequistas fazem login e gerenciam Encontros/Presenças
```

---

## Troubleshooting

### "Supabase não configurado"

- Verifique se `VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configurados nos secrets do Cloudflare.

### "Sessão inválida"

- O token JWT expirou. Faça logout e login novamente.

### "Cadastros somem após um tempo"

- Isso foi corrigido. O sistema agora mantém os dados mesmo se houver falha temporária de rede.

### "Erro ao consultar liturgia"

- Verifique se `VITE_GEMINI_API_KEY` está configurada no `.env`.

### "CORS error"

- As Functions já incluem headers CORS. Se persistir, verifique se a URL está correta.

### Deploy falha com "Binding name already in use"

- Remova variáveis duplicadas do `wrangler.toml` que já estão nos secrets.

### Verificar logs do Cloudflare

```bash
npx wrangler pages deployment tail --project-name vinculum-pastoral
```

---

## Contato e Suporte

Para dúvidas ou suporte, entre em contato com o desenvolvedor.

---

## Licença

Projeto privado. Todos os direitos reservados.
