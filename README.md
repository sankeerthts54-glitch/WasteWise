# WasteWise ♻️

> AI-powered waste management and energy advisory for urban households and small businesses in India.

**WeMakeDevs × AWS Environmental Hacks 2026 — Track 03: Waste & Energy**

## What It Does

Users pick a domain (Waste Segregation, E-Waste Disposal, Recycling & Upcycling, or Rooftop Solar & Energy), fill in a dynamic intake form, and receive a structured AI-generated advisory powered by Google Gemini — complete with action plans, risk analysis, and resource recommendations.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Auth + DB | Supabase (Auth + PostgreSQL) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Deploy | AWS Amplify (frontend) + AWS App Runner (backend) |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & install

```sh
git clone <repo-url> wastewise
cd wastewise
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project.
2. In the Supabase **Table Editor**, create the `advisories` table:

```sql
create table public.advisories (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  domain_slug      text not null,
  title            text not null default '',
  inputs           jsonb not null,
  output           jsonb,
  style            text not null default 'concise',
  language         text not null default 'en',
  status           text not null default 'completed',
  error_message    text,
  model            text,
  latency_ms       integer,
  feedback_rating  smallint,
  feedback_comment text,
  feedback_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Indexes for performance
create index advisories_user_id_idx on public.advisories(user_id);
create index advisories_created_at_idx on public.advisories(created_at desc);
create index advisories_domain_slug_idx on public.advisories(domain_slug);

-- Enable Row Level Security
alter table public.advisories enable row level security;

create policy "Users can manage their own advisories"
  on public.advisories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

3. Copy your Supabase URL and keys from **Settings → API**.

### 3. Configure environment variables

```sh
copy server\.env.example server\.env
copy client\.env.example client\.env.local
```

Fill in the values in both files.

### 4. Run in development

```sh
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/api/health

### 5. Build for production

```sh
npm run build
```

## AWS Deployment

WasteWise is architected and pre-configured for automated cloud deployment:
- **Frontend SPA**: Hosted on [AWS Amplify](https://aws.amazon.com/amplify/) with global CDN distribution and SPA routing rewrite rules.
- **Backend API**: Hosted on [AWS App Runner](https://aws.amazon.com/apprunner/) via multi-stage Alpine Docker container with auto-scaling and continuous health checks.
- **Database & Auth**: Hosted on [Supabase](https://supabase.com/) PostgreSQL with Row-Level Security (RLS).

For comprehensive step-by-step instructions, see the dedicated [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### 1. Backend Container → AWS App Runner

Build and push the multi-stage production Docker container:

```sh
# Authenticate with Amazon ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# Build & push image using root Dockerfile
docker build -t wastewise-api:latest -f Dockerfile .
docker tag wastewise-api:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/wastewise-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/wastewise-api:latest
```

In the AWS App Runner console:
1. Connect the ECR image or link the repository with `apprunner.yaml`.
2. Configure container port `4000` and health check path `/api/health`.
3. Set production environment variables (see table below).

### 2. Frontend SPA → AWS Amplify

1. In the [AWS Amplify Console](https://console.aws.amazon.com/amplify/), connect your repository.
2. Amplify automatically detects the monorepo build configuration in [`amplify.yml`](amplify.yml).
3. Set client environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous public key
   - `VITE_API_BASE_URL`: Live App Runner API URL (`https://<service-id>.<region>.awsapprunner.com/api`)
4. Verify SPA rewrite rule under **App settings → Rewrites and redirects** (source: `/<*>`, target: `/index.html`, status: `200`). Reference: [`client/amplify-redirects.json`](client/amplify-redirects.json).
5. Update `CLIENT_ORIGIN` in App Runner with the generated Amplify domain.

### Environment Variables Manifest

| Variable | Target | Purpose | Secret? |
|---|---|---|---|
| `NODE_ENV` | App Runner | Set to `production` | No |
| `PORT` | App Runner | Container listening port (`4000`) | No |
| `CLIENT_ORIGIN` | App Runner | Allowed CORS frontend origins (e.g. `https://main.<id>.amplifyapp.com`) | No |
| `SUPABASE_URL` | App Runner | Supabase REST / Auth URL | No |
| `SUPABASE_ANON_KEY` | App Runner | Public anon key for token verification | No |
| `SUPABASE_SERVICE_ROLE_KEY` | App Runner | Admin key for server operations | **YES** |
| `GEMINI_API_KEY` | App Runner | Google Gemini API key | **YES** |
| `GEMINI_MODEL` | App Runner | Defaults to `gemini-2.5-flash` | No |
| `VITE_SUPABASE_URL` | Amplify | Supabase URL for client auth session | No |
| `VITE_SUPABASE_ANON_KEY` | Amplify | Supabase public key for client auth session | No |
| `VITE_API_BASE_URL` | Amplify | Base URL pointing to App Runner Express API | No |


## Project Structure

```
wastewise/
├── shared/          # Shared Zod schemas, domain configs, API types
├── server/          # Express API
├── client/          # React SPA
├── docs/            # PROGRESS.md, ARCHITECTURE.md, DECISIONS.md
└── AGENTS.md        # Agent rules for continued AI development
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server and client in watch mode |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | TypeScript check all workspaces |
| `npm test` | Run server tests |

## Domains

| Domain | Slug | Description |
|--------|------|-------------|
| Waste Segregation | `waste-segregation` | Sort, reduce, and correctly dispose household/business waste |
| E-Waste Disposal | `ewaste-disposal` | Safe disposal of electronics, batteries, and electrical equipment |
| Recycling & Upcycling | `recycling-upcycling` | Turn waste into value — sell recyclables or upcycle |
| Rooftop Solar & Energy | `solar-energy` | Solar potential assessment + energy efficiency tips |

## Hackathon Info

- **Event:** WeMakeDevs × AWS Environmental Hacks #02 — Bharat Builds Tour
- **Track:** 03 — Waste and Energy
- **AWS requirement:** Frontend hosted on AWS Amplify; backend on AWS App Runner
- **Built:** Oct 8–11, 2026
