# WasteWise — Decisions & Deviations

## Phase 0

| Decision | Rationale |
|----------|-----------|
| npm workspaces (not Turborepo) | Simpler for a hackathon; no extra tooling needed |
| `tsx watch` for server dev | Zero-config TS execution; avoids `ts-node` compatibility issues |
| Skipping DB migrations folder | Hackathon scope: advisories table will be created manually via Supabase dashboard. Documented in README. |
| Skipping RLS SQL migrations | Same reason. RLS will be set via Supabase dashboard instead of migration files. |
| Skipping admin view | Not needed for hackathon judging; adds scope without demo value |
| Skipping follow-up chat | Cuts scope; core advisory generation is the key demo feature |
| Skipping quota enforcement | Replaced by basic rate limiting middleware; acceptable for hackathon |
| 4 domains (not more) | Waste Segregation, E-Waste Disposal, Recycling & Upcycling, Rooftop Solar & Energy — covers Track 03 breadth |
| ESLint v9 flat config | Required by ESLint v9; @typescript-eslint supports it |
| `@google/genai` v0.14.0 | Current SDK (not deprecated `@google/generative-ai`) |
| AWS: Amplify (frontend) + App Runner (backend) | Satisfies hackathon AWS requirement; both have free tier |
| Tailwind brand color = green | Environmental theme; aligns with recycling/sustainability branding |

## Phase 2

| Decision | Rationale |
|----------|-----------|
| Supabase Auth verification via `auth.getUser(token)` | Verifies token authenticity against Supabase Auth without managing local JWT signing secret rotation |
| Dual Supabase clients (`supabaseClient` & `supabaseAdmin`) | Least privilege: anon key for token verification; service-role key strictly for administrative user metadata updates |
| Aliasing `/api/auth/me` to `/api/me` | Supports RESTful `/api/me` while maintaining compatibility with frontends expecting `/api/auth/me` |
| Profile stored in `user_metadata` | Aligns with hackathon scope simplification: no extra profiles table needed |
| Native `fetch` + ephemeral server in integration tests | Avoids additional `supertest` dependencies; tests real HTTP pipeline cleanly |
| ESLint v9 flat config across all workspaces | Standardizes linting rules across server and client with zero warnings/errors |

## Phase 3

| Decision | Rationale |
|----------|-----------|
| `@google/genai` Structured Outputs with `responseSchema` | Guarantees deterministic adherence to `AdvisorySchema` structure directly at Gemini model inference time |
| Multi-level Schema Validation (`Type.OBJECT` + `AdvisorySchema.safeParse`) | Defence-in-depth: Gemini constraints JSON generation; Zod guarantees exact character limits, array bounds, and field rules |
| Exponential backoff with jitter on transient codes (429, 503) | Prevents thundering herds and gracefully recovers from transient Gemini quota bursts or network hiccups |
| Hard timeout wrapper (`GEMINI_TIMEOUT_MS`) | Prevents hanging client connections if upstream API experiences latency degradation |
| Indian regulatory & municipal grounding in system instructions | Ensures practical accuracy for Indian users (SWM Rules 2016, PM Surya Ghar, DISCOM net metering, kabadiwalas) |

## Phase 4

| Decision | Rationale |
|----------|-----------|
| Supabase `advisories` table with JSONB inputs & output | Schema flexibility across all 4 domains while retaining indexed relational filtering (`user_id`, `domain_slug`, `created_at`) |
| Service role client (`supabaseAdmin`) in repository with strict query-level `user_id` filters | Backend server controls authentication via JWT verification; avoids passing client credentials or session tokens down to DB connection layer while strictly preserving tenant isolation |
| Separate `getById` check distinguishing 404 from 403 | Provides clear security boundaries: returns 404 when resource does not exist, and 403 Forbidden when resource belongs to a different authenticated user |
| Dependency injection in `AdvisoriesController` & `AdvisoryRepository` | Allows 100% deterministic unit testing and isolation with mocked repositories and AI service without requiring live external services |
| 201 Created on `POST /api/advisories` | Conforms to RESTful resource creation standards returning the newly persisted `AdvisoryRecord` envelope |
| Strict schema validation on feedback (`rating: 1 \| -1`) | Ensures clean, binary sentiment telemetry with optional qualitative comments |

## Phase 5

| Decision | Rationale |
|----------|-----------| 
| Framer Motion for all interactive UI | Provides spring physics animations (hover, tap, entrance, exit) with `AnimatePresence` for mounted/unmounted transitions; the premium "alive" feel requested by spec |
| AuthContext split across 3 files (`authContextDef.ts`, `AuthProvider.tsx`, `useAuth.ts`) | React Fast Refresh requires each file to export only components or only non-component exports — mixing both triggers a warning. Splitting ensures HMR works cleanly |
| `wastewise-shared` Vite alias pointing to `../shared/src/index.ts` | The shared package compiles to CommonJS (`dist/index.js`); Rollup can't consume it because it uses `require()`. Alias bypasses compiled output entirely during Vite build while TypeScript resolves types via the workspace symlink |
| `domainMeta.ts` maps `DOMAINS` slugs to emoji icons | `DomainConfig.icon` field is a Lucide component name string (e.g. `'Trash2'`), not renderable in isolation. Client-side mapping to emoji avoids importing heavy Lucide tree in non-icon contexts |
| `AdvisoryRecord.output` narrowed via `'summary' in advisory.output` | Output is typed as `Advisory \| Record<string, unknown> \| null`. TypeScript rejects optional chaining (`output?.summary`) on this union; explicit `in` narrowing is required and type-safe |
| `ProtectedRoute` uses `<Navigate state={{ from: location }}>` | Preserves the attempted URL across the login redirect so the user lands back on their original page after authenticating |
| `LiveBackground` mesh orbs use `keyframes` + infinite `animate` loop | Orbs are purely CSS-transform-animated via Framer Motion infinite loops — GPU-composited, no layout thrash, smooth 60fps on mobile |
| `UnicornStudio` scene integrated into `LiveBackground` | Replaces static gradient backdrop with WebGL interactive scene from UnicornStudio (`unicornstudio-react`), keeping eco particle floating animations layered on top |
| Vitest over Jest for client tests | Native ESM support, identical to Vite's pipeline — no babel transforms needed; resolves module aliases consistently with production build |

## Phase 6

| Decision | Rationale |
|----------|-----------|
| Dynamic Zod schema compilation on visible fields only | Prevents validation blocking when conditionally hidden fields (`visibleWhen`) lack values; aligns form validation with active UI state |
| `localStorage` draft auto-save per domain slug | Prevents user loss of customized inputs during browser refresh or unexpected navigation |
| Client-side multiselect & radio cards rather than native selects | Improves accessibility, touch surface, and modern look aligned with design guidelines |
| Multi-stage checkpoint & eco tips carousel during generation | Replaces indeterminate spinning with engaging, educational feedback during 5-15s AI latency |
| Formulation Studio embedded directly in `/domains/:slug` | Reduces unnecessary redirects; user lands on the domain overview with immediate action to formulate and generate |

## Phase 7

| Decision | Rationale |
|----------|-----------|
| Modular Advisory component architecture (`client/src/components/advisory/`) | Isolates rendering concerns for header/editing, summary/confidence, recommendations, action plan, risks, resources, inputs drawer, and feedback into reusable, testable subcomponents |
| Client-side roadmap task completion via `localStorage` keyed by `advisoryId` | Gives users instant satisfaction checking off completed physical tasks without imposing extra database write latency |
| Multi-format export (Markdown, JSON, native Print/PDF) | Enables easy physical posting of action plans on home notice boards or corporate waste compliance binder storage |
| Debounced query (`300ms`) with immediate page reset | Prevents rapid API requests while typing search queries while guaranteeing pagination resets to page 1 for fresh search sets |
| Dynamic field label mapping in `AdvisoryInputDrawer` | Inspects original intake fields against `DOMAINS` config to present human-friendly labels rather than raw camelCase property keys |
| Optimistic inline title editing on detail page (`PATCH /api/advisories/:id`) | Immediate visual response with fallback revert on error, maintaining clean editing flow |
| Binary sentiment with optional qualitative comment feedback flow | Maximizes completion rate with simple thumbs-up/down while giving engaged users room to provide nuanced local municipal feedback |

## Phase 8

| Decision | Rationale |
|----------|-----------|
| Head inline script for anti-FOUC theme resolution | Reading `localStorage.getItem('theme')` before render blocks flash of unstyled light content when system or preference is dark |
| "Skip to main content" high-contrast keyboard anchor | Satisfies WCAG 2.1 AA keyboard accessibility; bypasses lengthy header/navigation on repetitive keyboard strokes |
| Multi-card skeleton loader instead of indeterminate spinner | Lowers perceived latency and prevents layout shift (CLS) by reserving card dimensions during async fetches |
| Granular per-domain advisory statistics in Profile | Surfaces user impact and domain engagement using existing `/api/advisories` queries with no backend schema alterations |
| Class-based React ErrorBoundary with reset & home options | Prevents white-screen application crashes on unexpected rendering failures while offering an immediate self-healing retry mechanism |
| Dedicated 404 NotFound page over silent redirect | Enhances user clarity and orientation by acknowledging missing paths and offering sensible navigation exits |

## Phase 9

| Decision | Rationale |
|----------|-----------|
| Monorepo Amplify build spec (`amplify.yml` at root) | Builds `shared` package before building `client`, ensuring dependency resolution without requiring pre-publishing to npm registry |
| SPA 200 Rewrite Rule (`/<*>` -> `/index.html`) | Prevents 404 HTTP errors on deep React Router client routes (e.g. `/domains/:slug`, `/advisories/:id`) when refreshed or directly bookmarked |
| Multi-stage Docker build for App Runner | Separates build tooling (TypeScript compiler, devDependencies) from runtime image; `npm prune --omit=dev` minimizes container size and eliminates security vulnerabilities |
| Non-root container user (`apprunner:nodejs` UID 1001) | Security hardening according to least-privilege standards; prevents container escape vulnerabilities in production |
| Native container `HEALTHCHECK` + App Runner health check on `/api/health` | Unifies local container validation with App Runner's automated container lifecycle management and zero-downtime rolling deploys |
| Centralized `docs/DEPLOYMENT.md` with environment manifests | Provides step-by-step guidance for cloud setups, separating secret server variables (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) from safe client variables |


