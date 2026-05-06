# REGIF

Projeto fullstack em TypeScript com frontend React (Vite) e backend Express + Prisma.

## Objetivo

O sistema atende o site institucional da REGIF, incluindo:
- **Área pública** (notícias e documentos).
- **Painel administrativo** (usuários, papéis, conteúdos).
- **Fluxo de setup inicial** para criação do primeiro admin.

## Stack

- **Frontend**: React, Vite, TypeScript, React Router, Axios, Tailwind.
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT.
- **Infra local**: Docker Compose para PostgreSQL.

## Estrutura

- `frontend/`: aplicação web.
- `backend/`: API REST e regras de negócio.
- `infra/`: artefatos de apoio (ex.: dados persistidos do banco local).
- `docker-compose.yml`: sobe o PostgreSQL local.

## Convenções de arquitetura

- **Backend**:
  - Contrato de erro padrão: `{ code, message, details }`.
  - Middleware global de erro em `backend/src/core/http/error-middleware.ts`.
  - Helpers HTTP/validação em `backend/src/core/http`.
  - Módulo `documents` dividido em `query`, `mutation` e `categories` services.
- **Frontend**:
  - Sessão/autorização em `frontend/src/shared/auth/session.ts`.
  - Guards de rota em `frontend/src/app/routes/guards.tsx`.
  - Contratos de API compartilhados em `frontend/src/shared/api/contracts.ts`.

## Desenvolvimento local (Windows / PowerShell)

### 1) Banco de dados (PostgreSQL)

Na raiz do projeto:

```powershell
docker compose up -d
```

Se você estiver sem Docker, use PostgreSQL local e ajuste apenas a `DATABASE_URL` no `backend/.env`.

### 2) Backend

```powershell
cd backend
npm install
copy .env.example .env
```

Edite o `.env` se necessário. Depois execute:

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
4. Crie o primeiro usuário admin.

## Preparado para deploy futuro

A configuração local separa claramente:
- URL de API por variável de ambiente (`VITE_API_URL`).
- Segredos e conexões por `.env`.
- Serviço de banco isolado por Docker.

Com isso, para publicar depois em uma VPS, basta trocar variáveis e a camada de proxy sem refatorar o código principal.
