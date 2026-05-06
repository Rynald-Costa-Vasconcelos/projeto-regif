# REGIF

Projeto fullstack em TypeScript com frontend React (Vite) e backend Express + Prisma.

## Objetivo

O sistema atende o site institucional da REGIF, incluindo:
- area publica (noticias e documentos),
- painel administrativo (usuarios, papeis, conteudos),
- fluxo de setup inicial para criacao do primeiro admin.

## Stack

- Frontend: React, Vite, TypeScript, React Router, Axios, Tailwind.
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT.
- Infra local: Docker Compose para PostgreSQL.

## Estrutura

- `frontend/`: aplicacao web.
- `backend/`: API REST e regras de negocio.
- `infra/`: artefatos de apoio (ex.: dados persistidos do banco local).
- `docker-compose.yml`: sobe o PostgreSQL local.

## Convencoes de arquitetura

- Backend:
  - contrato de erro padrao: `{ code, message, details }`;
  - middleware global de erro em `backend/src/core/http/error-middleware.ts`;
  - helpers HTTP/validacao em `backend/src/core/http`;
  - modulo `documents` dividido em `query`, `mutation` e `categories` services.
- Frontend:
  - sessao/autorizacao em `frontend/src/shared/auth/session.ts`;
  - guards de rota em `frontend/src/app/routes/guards.tsx`;
  - contratos de API compartilhados em `frontend/src/shared/api/contracts.ts`.

## Desenvolvimento local (Windows / PowerShell)

### 1) Banco de dados (PostgreSQL)

Na raiz do projeto:

```powershell
docker compose up -d
```

Se voce estiver sem Docker, use PostgreSQL local e ajuste apenas a `DATABASE_URL` no `backend/.env`.

### 2) Backend

```powershell
cd backend
npm install
copy .env.example .env
```

Edite o `.env` se necessario.

Depois execute:

```powershell
npm run prisma:generate
npm run db:migrate
npm run db:seed:all
npm run dev
```

API local: `http://127.0.0.1:3000`  
Healthcheck: `http://127.0.0.1:3000/health`

### 3) Frontend

Em outro terminal:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

App local: `http://127.0.0.1:5173`

## Fluxo de primeiro acesso

1. Rode os seeds no backend (`npm run db:seed:all`).
2. Abra `http://127.0.0.1:5173/setup`.
3. Use o `SETUP_TOKEN` definido no `.env` do backend.
4. Crie o primeiro usuario admin.

## Preparado para deploy futuro

A configuracao local separa claramente:
- URL de API por variavel de ambiente (`VITE_API_URL`),
- segredos e conexoes por `.env`,
- servico de banco isolado por Docker.

Com isso, para publicar depois em VPS, basta trocar variaveis e camada de proxy sem refatorar o codigo principal.
