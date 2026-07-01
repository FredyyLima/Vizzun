# Vizzun

Marketplace de segunda opinião de orçamentos: clientes publicam projetos de reforma, arquitetura,
marcenaria e outros serviços de construção, negociam com profissionais pelo chat integrado da
plataforma e fecham negócio com um fluxo de confirmação em duas etapas.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS, TanStack Query para
  data-fetching, React Router, react-hook-form + zod para formulários.
- **Backend**: Node.js + Express 5, Prisma 6 + PostgreSQL, autenticação via JWT em cookie
  HttpOnly, bcryptjs para hash de senha, multer para upload de arquivos.
- **Testes**: Vitest + Testing Library (frontend) e Vitest + Supertest (rotas da API).

## Requisitos

- Node.js 22.x
- PostgreSQL 14+ (local ou remoto)

## Configuração local

1. Instale as dependências:

   ```sh
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente e preencha os valores:

   ```sh
   cp .env.example .env
   ```

   | Variável | Descrição |
   |---|---|
   | `DATABASE_URL` | String de conexão do PostgreSQL (`postgresql://usuario:senha@host:porta/banco?schema=public`) |
   | `CORS_ORIGIN` | Origem(ns) permitida(s) para o frontend acessar a API, separadas por vírgula |
   | `PORT` | Porta em que a API Express escuta (padrão `8081`) |
   | `VITE_API_BASE_URL` | URL base da API usada pelo frontend. Deixe vazio em dev (usa o proxy do Vite para `localhost:8081`) |
   | `JWT_SECRET` | Segredo usado para assinar o token de sessão. Gere um valor único por ambiente: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |

3. Aplique as migrations do Prisma no banco configurado em `DATABASE_URL`:

   ```sh
   npx prisma migrate deploy
   ```

4. Rode o backend e o frontend em dois terminais separados:

   ```sh
   npm run dev:server   # API Express em http://localhost:8081
   npm run dev           # Frontend Vite em http://localhost:8080
   ```

   O Vite já está configurado para fazer proxy de `/api` para `http://localhost:8081` em
   desenvolvimento (ver `vite.config.ts`), então não é necessário configurar `VITE_API_BASE_URL`
   localmente.

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Sobe o frontend em modo desenvolvimento (Vite) |
| `npm run dev:server` | Sobe a API Express localmente |
| `npm run build` | Gera o build de produção do frontend em `dist/` |
| `npm run preview` | Serve o build de produção localmente para validação |
| `npm run lint` | Roda o ESLint |
| `npm test` | Roda a suíte de testes (Vitest) uma vez |
| `npm run test:watch` | Roda a suíte de testes em modo watch |
| `npm run db:push` | Sincroniza o schema do Prisma com o banco sem gerar migration (uso pontual em dev) |
| `npm run db:deploy` | Aplica as migrations pendentes (`prisma migrate deploy`) |
| `npm run db:studio` | Abre o Prisma Studio para inspecionar o banco |
| `npm start` | Fluxo completo de deploy: normaliza migrations, gera o client, aplica migrations e sobe a API (ver `start:server:deploy`) |

## Testes

```sh
npm test
```

Os testes de rotas de autenticação (`server/__tests__/`) rodam contra um banco PostgreSQL real —
aponte `DATABASE_URL` para um banco de desenvolvimento/teste antes de rodar (nunca aponte para um
banco de produção, os testes criam e removem usuários). Os testes de componentes React
(`src/**/*.test.tsx`) usam jsdom e não precisam de banco.

## Estrutura do projeto

```
server/              API Express (rotas, autenticação, upload, integração com Prisma)
  __tests__/          Testes de integração das rotas
prisma/
  schema.prisma        Modelo de dados
  migrations/           Migrations versionadas
src/
  pages/               Páginas (rotas do React Router)
  components/          Componentes de UI reutilizáveis e específicos de features
  components/dashboard/ Seções da área logada (anúncios, chats, perfil, configurações)
  hooks/               Hooks de estado/dados (auth, dashboard, etc.)
  lib/                 Tipos, formatadores e utilitários compartilhados
uploads/               Arquivos enviados pelos usuários (avatar, anexos de chat, cartão CNPJ) — não versionado
```

## Deploy

O `Dockerfile` na raiz builda **apenas a API** (Node + Express + Prisma) — o frontend (`dist/`)
não é servido por esse container e precisa ser hospedado separadamente (ex.: um serviço de
static hosting), apontando `VITE_API_BASE_URL` para a URL pública da API. Essa separação é o
motivo de `VITE_API_BASE_URL` existir: em dev fica vazio (usa o proxy do Vite), em produção deve
apontar para a API publicada.

O container roda `npm start` (`start:server:deploy`), que executa, nesta ordem:

1. Normaliza o histórico de migrations (`scripts/normalize-migrations.cjs`) — necessário apenas
   para compatibilizar bancos que já existiam antes da adoção do Prisma Migrate.
2. `prisma generate` — gera o client do Prisma.
3. `prisma migrate deploy` — aplica migrations pendentes de forma segura e idempotente (não
   recria dados existentes; se uma migration já foi marcada como aplicada, ela é ignorada).
4. Inicia a API Express.

O `Dockerfile` instala todas as dependências (`npm ci`, incluindo devDependencies) porque a CLI
do Prisma (`prisma`) — necessária para `generate`/`migrate deploy` no passo acima — está
declarada como devDependency. Não trocar para `npm ci --omit=dev` sem antes mover `prisma` para
`dependencies` ou migrar para um build multi-stage, senão o container quebra ao subir.

Antes de subir em produção:

- Defina todas as variáveis de `.env.example` no ambiente de destino (nunca copie o `.env` de
  desenvolvimento).
- Gere um `JWT_SECRET` novo e exclusivo do ambiente de produção.
- Publique o frontend (`npm run build` gera `dist/`) em um static host separado e configure
  `VITE_API_BASE_URL` com a URL pública da API antes de buildar.
- Garanta que o volume/diretório `uploads/` seja persistente entre deploys, já que arquivos
  enviados pelos usuários são salvos em disco local pela API.
- Atualize o domínio de exemplo (`https://www.vizzun.com.br`) em `public/sitemap.xml` e
  `public/robots.txt` para o domínio real de produção.
- O envio de email de recuperação de senha (`/api/forgot-password`) ainda não está integrado a
  um provedor real — hoje o link de redefinição é apenas logado no servidor. Antes de usar em
  produção, integrar um provedor (Resend, SMTP, etc.) em `server/index.js` e remover o campo
  `resetUrl` da resposta da API.
