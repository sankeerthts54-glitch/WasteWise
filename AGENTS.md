# WasteWise — Agent Rules

- Stack: React+Vite+TS+Tailwind (client), Express+TS (server), Supabase Auth, @google/genai, Zod.
- Always read docs/PROGRESS.md, docs/ARCHITECTURE.md, docs/DECISIONS.md BEFORE coding.
- Do ONE phase per thread. Stop after the Phase Handoff Report.
- Never expose GEMINI_API_KEY or SUPABASE_SERVICE_ROLE_KEY to the client.
- All input validated with Zod from /shared. No placeholders, no TODOs.
- After finishing: run build + lint + typecheck + tests; update the three docs.
- Prefer small, focused diffs; do not refactor unrelated files.
- Full spec lives in docs/MASTER_PROMPT.md.
- SCOPE SIMPLIFICATIONS (hackathon): No DB migrations folder, no RLS migrations, no admin view, no follow-up chat, no quota system. Supabase used for auth only; advisories stored in one simple table.
- AWS: Frontend on AWS Amplify, Backend on AWS App Runner.
