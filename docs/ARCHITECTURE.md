# WasteWise — Architecture

## Overview

Monorepo (npm workspaces) with three packages:

```
wastewise/
├── shared/   — Zod schemas, domain configs, API types (imported by both client + server)
├── server/   — Express API (TypeScript)
└── client/   — Vite + React + Tailwind SPA
```

## Key Design Decisions

- **Scope simplification (hackathon):** No elaborate DB migrations. Supabase used for Auth + one `advisories` table created via dashboard. No RLS migrations file. No admin view. No follow-up chat.
- **AWS requirement satisfied by:** deploying frontend on AWS Amplify and backend on AWS App Runner.
- **Shared package** acts as a single source of truth for domain configs, Zod schemas, and API types — no drift between client and server validation.

## Data Flow (Advisory Generation)

```
Client form submit
  → POST /api/advisories (with Bearer JWT)
  → auth middleware verifies Supabase JWT
  → Zod validates body + domain-specific inputs
  → advisoryService: calls Gemini with structured output schema
  → Gemini returns JSON → Zod validates against AdvisorySchema
  → insert into Supabase advisories table
  → return advisory to client
```

## Server Layer Structure

```
src/
├── index.ts          — Bootstrap + listen
├── app.ts            — Express app, middleware order
├── config/env.ts     — Zod-validated env vars (crashes on boot if missing)
├── lib/
│   ├── logger.ts     — pino instance
│   ├── errors.ts     — AppError class + error codes
│   └── supabase.ts   — Supabase client & admin instances
├── middleware/
│   ├── errorHandler.ts
│   └── auth.ts       — requireAuth & optionalAuth middleware
├── routes/
│   ├── health.ts     — GET /api/health
│   ├── domains.ts    — GET /api/domains, GET /api/domains/:slug
│   ├── profile.ts    — GET /api/me, PATCH /api/me (and /api/auth/me)
│   └── advisories.ts — POST /api/advisories, GET /api/advisories, GET /:id, PATCH /:id, POST /:id/feedback
├── controllers/
│   ├── domainsController.ts
│   ├── profileController.ts
│   └── advisoriesController.ts
├── services/
│   └── ai/
│       ├── promptBuilder.ts      — Indian context domain prompt generators
│       ├── geminiClient.ts       — @google/genai client with retry/timeout/schema
│       ├── advisoryAiService.ts  — AI service facade
│       └── index.ts
└── repositories/
    ├── advisoryRepository.ts    — Supabase CRUD, pagination, filtering, search, feedback
    └── index.ts
```

## Database Schema (Supabase PostgreSQL)

The `public.advisories` table stores all generated user advisories, inputs, metadata, and optional user feedback:

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

-- Indexes for efficient queries
create index advisories_user_id_idx on public.advisories(user_id);
create index advisories_created_at_idx on public.advisories(created_at desc);
create index advisories_domain_slug_idx on public.advisories(domain_slug);

-- Row Level Security
alter table public.advisories enable row level security;

create policy "Users can manage their own advisories"
  on public.advisories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Client Layer Structure (Phase 5)

```
src/
├── main.tsx                    — React root mount, AuthProvider wrapper
├── App.tsx                     — BrowserRouter + full route tree
├── vite-env.d.ts               — VITE_* ImportMeta type declarations
├── styles/index.css            — Tailwind directives + global CSS
├── lib/
│   ├── supabase.ts             — Supabase browser client (localStorage session)
│   ├── apiClient.ts            — JWT-auto-attaching fetch wrapper; ApiError class
│   ├── utils.ts                — cn() utility (clsx + tailwind-merge)
│   ├── domainMeta.ts           — Client emoji-mapped domain metadata array
│   └── advisoryExport.ts       — Markdown/JSON advisory formatting and download helper
├── context/
│   ├── authContextDef.ts       — AuthContext + AuthContextType (pure TS, no JSX)
│   ├── AuthProvider.tsx        — AuthProvider component + Supabase session lifecycle
│   ├── useAuth.ts              — useAuth() hook (Fast Refresh isolated)
│   ├── AuthContext.ts          — Barrel re-export for legacy imports
│   └── index.ts                — Barrel re-export of all context members
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx  — Route guard, redirect to /login with location memory
│   ├── layout/
│   │   ├── LiveBackground.tsx  — Animated mesh gradient orbs + floating eco particles
│   │   ├── Navbar.tsx          — Sticky frosted glass nav, domain dropdown, avatar menu, mobile drawer
│   │   ├── Footer.tsx          — Domain links, regulatory tags, brand
│   │   └── AppShell.tsx        — LiveBackground + Navbar + <Outlet /> + Footer
│   ├── form/
│   │   ├── FieldRenderer.tsx   — Dynamic field component resolver for all FieldTypes
│   │   ├── DynamicForm.tsx     — Dynamic form container, Zod client validator, draft sync
│   │   ├── GenerationProgress.tsx — Live progress animation with checkpoints and eco facts
│   │   └── index.ts            — Barrel export
│   ├── advisory/
│   │   ├── AdvisoryHeader.tsx  — Title with inline editing, metadata badges, Markdown/JSON/print actions
│   │   ├── AdvisorySummary.tsx — Executive summary, confidence score meter, key insights grid
│   │   ├── AdvisoryRecommendations.tsx — Actionable recommendations with priority & effort badges
│   │   ├── AdvisoryActionPlan.tsx — Sequential roadmap with checklist completion state in localStorage
│   │   ├── AdvisoryRisks.tsx   — Identified hazards with severity badges and mitigation strategies
│   │   ├── AdvisoryResources.tsx — Authorized frameworks, links, and statutory disclaimer
│   │   ├── AdvisoryInputDrawer.tsx — Collapsible accordion of submitted user intake parameters
│   │   ├── AdvisoryFeedback.tsx — Binary sentiment rating (thumbs up/down) + qualitative comment form
│   │   └── index.ts            — Barrel export
│   └── ui/
│       ├── Button.tsx          — Spring-animated button (hover/tap scale), variants, sizes
│       ├── Input.tsx           — Label, icons, error state
│       ├── Select.tsx          — Animated ChevronDown indicator
│       ├── Textarea.tsx        — Character-counted frosted textarea
│       ├── Slider.tsx          — Range slider with gradient track & live value badge
│       ├── Multiselect.tsx     — Card-based multi-select grid with check animations
│       ├── RadioGroup.tsx      — Card-based radio option selector
│       ├── Checkbox.tsx        — Custom styled checkbox with description
│       ├── Card.tsx            — Spring y-lift on hover + CardHeader/Title/Description/Content/Footer
│       ├── Badge.tsx           — 6 color variants + pulse-dot live variant
│       ├── Modal.tsx           — AnimatePresence spring entrance + backdrop blur
│       ├── Alert.tsx           — Dismissible banner with semantic icons
│       ├── Spinner.tsx         — Spinner + Skeleton loader
│       ├── KineticTextReveal.tsx — Word-by-word mask clipping 3D entrance
│       ├── ScrollKineticReveal.tsx — Scroll-triggered masked text entrance
│       ├── ErrorBoundary.tsx   — React ErrorBoundary with fallback UI & reset handler
│       └── index.ts            — Barrel export
└── pages/
    ├── LandingPage.tsx         — Hero + domain cards grid + feature highlights
    ├── LoginPage.tsx           — Email/password + OTP magic-link modes
    ├── SignupPage.tsx          — Registration form
    ├── DomainsPage.tsx         — Domain verticals showcase
    ├── DomainDetailPage.tsx    — Formulation studio with dynamic schema form & launch CTA
    ├── AdvisoriesPage.tsx      — Paginated history with debounced search, domain/sort filters & metrics
    ├── AdvisoryDetailPage.tsx  — Interactive results hub with title edit, checklist, export & feedback
    ├── ProfilePage.tsx         — Enhanced profile & settings with advisory stats & session danger zone
    └── NotFoundPage.tsx        — 404 error page with quick recovery navigation
```

## External Dependencies

| Service | Purpose | Notes |
|---------|---------|-------|
| Supabase | Auth (JWT) + advisories table | Free tier sufficient |
| Google Gemini API | AI advisory generation | gemini-2.5-flash |
| AWS Amplify | Frontend hosting | Free tier |
| AWS App Runner | Backend hosting | Builds from Dockerfile |

## Security Notes

- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only env vars
- Client only receives `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
- Helmet + CORS allowlist active on every request
- Global rate limiter: 60 req/min

## Deployment Architecture (Phase 9)

```
[User Browser]
       │
       ▼
[AWS Amplify Hosting (CDN)]
  - Serves React Vite SPA bundle (`dist/`)
  - SPA Rewrites (`/<*>` -> `/index.html` [200]) via `client/amplify-redirects.json`
  - Automated CI/CD configured via root `amplify.yml`
       │
       │ (REST API HTTPS calls with Supabase Bearer JWT)
       ▼
[AWS App Runner API Service]
  - Multi-stage minimal Node 20 Alpine container (`Dockerfile`)
  - Runs Express API (`server/dist/index.js`) as unprivileged `apprunner` user
  - Continuous health check monitoring at `/api/health`
  - Environment variables: `CLIENT_ORIGIN`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
       │
       ▼
[Supabase Platform]
  - Supabase Auth: User signup, login, session tokens (JWT)
  - Supabase PostgreSQL: `public.advisories` table with Row Level Security (RLS)
```
