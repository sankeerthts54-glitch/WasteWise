# WasteWise Deployment Guide

This guide details the complete production deployment procedures for **WasteWise** across **AWS Amplify** (Frontend SPA), **AWS App Runner** (Backend Express API Container), and **Supabase** (Authentication & PostgreSQL Database).

---

## Architecture Topology

```
+-----------------------------------+             +----------------------------------+
|           AWS Amplify             |             |          AWS App Runner          |
|    (React + Vite SPA Hosting)     |             |    (Express + TypeScript API)    |
|                                   |             |                                  |
|  - Custom headers & caching       |   HTTPS     |  - Multi-stage Docker container  |
|  - SPA 200 rewrite rule           | ----------> |  - Health check: /api/health     |
|  - Client env vars (public only)  |             |  - Server env vars (Gemini, etc) |
+-----------------------------------+             +----------------------------------+
                 \                                                 /
                  \                                               /
                   \             +-------------------------------+
                    \----------->|            Supabase           |
                                 |  - Auth (JWT tokens)          |
                                 |  - PostgreSQL `advisories`    |
                                 +-------------------------------+
```

---

## 1. Supabase Setup & Database Provisioning

WasteWise relies on Supabase for JWT user authentication and persisting generated advisories.

### 1.1 Project Creation
1. Go to [supabase.com](https://supabase.com) and create a new project (e.g. `wastewise-prod`).
2. Choose your preferred AWS region (e.g. `ap-south-1` Mumbai).

### 1.2 Database Table & RLS Initialization
In the Supabase Dashboard, navigate to the **SQL Editor** and run the following schema definition:

```sql
-- Create the advisories table
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

-- Optimize query performance
create index if not exists advisories_user_id_idx on public.advisories(user_id);
create index if not exists advisories_created_at_idx on public.advisories(created_at desc);
create index if not exists advisories_domain_slug_idx on public.advisories(domain_slug);

-- Enable Row Level Security (RLS)
alter table public.advisories enable row level security;

-- Policy ensuring authenticated users can only access and modify their own advisories
create policy "Users can manage their own advisories"
  on public.advisories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 1.3 Supabase Authentication Configuration
1. Navigate to **Authentication -> URL Configuration**.
2. Set **Site URL** to your AWS Amplify frontend URL (e.g. `https://main.<app-id>.amplifyapp.com`).
3. Add the redirect URL (e.g. `https://main.<app-id>.amplifyapp.com/**`).

---

## 2. Backend Deployment: AWS App Runner

AWS App Runner provides fully managed container execution, automated TLS certificate provisioning, auto-scaling, and health monitoring.

### Option A: Deployment via AWS ECR & Docker Image (Recommended)

#### Step 1: Authenticate and Build Container
```bash
# Set your AWS region and account ID
export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID=123456789012
export ECR_REPO=wastewise-api

# Log in to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create repository if not already existing
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION || true

# Build image using root Dockerfile
docker build -t wastewise-api:latest -f Dockerfile .

# Tag and push image
docker tag wastewise-api:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

#### Step 2: Create App Runner Service
1. In the **AWS App Runner Console**, choose **Create service**.
2. **Source**: Container registry -> **Amazon ECR**.
3. Select your repository image URI: `<account-id>.dkr.ecr.<region>.amazonaws.com/wastewise-api:latest`.
4. **Deployment trigger**: Select **Automatic** (deploys whenever a new image is pushed) or **Manual**.
5. **ECR access role**: Use existing or let App Runner create the `AppRunnerECRAccessRole`.

#### Step 3: Configure Service Runtime & Environment
- **Service name**: `wastewise-api`
- **CPU & Memory**: 1 vCPU, 2 GB RAM (or 0.5 vCPU, 1 GB)
- **Port**: `4000`
- **Environment variables**:

| Variable Name | Required | Example / Description |
|---|---|---|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `4000` |
| `CLIENT_ORIGIN` | Yes | `https://main.<amplify-app-id>.amplifyapp.com` (comma-separated if multiple origins) |
| `SUPABASE_URL` | Yes | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | `eyJhbGciOi...` (from Supabase Settings -> API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJhbGciOi...` (service role secret) |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` (Google Gemini AI Studio API key) |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` (default) |
| `GEMINI_TIMEOUT_MS` | No | `30000` (default) |
| `LOG_LEVEL` | No | `info` (default) |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` (default) |
| `RATE_LIMIT_MAX` | No | `60` (default) |

#### Step 4: Configure Health Check
- **Protocol**: `HTTP`
- **Path**: `/api/health`
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 1
- **Unhealthy threshold**: 3

Click **Create & Deploy**. App Runner will output your service endpoint: `https://<service-id>.<region>.awsapprunner.com`.

---

## 3. Frontend Deployment: AWS Amplify

AWS Amplify hosts the Single Page Application (SPA), providing global CDN distribution and automated CI/CD.

### Step 1: Connect Repository in AWS Amplify Console
1. Navigate to **AWS Amplify Console** -> **Host web app**.
2. Connect your Git provider (GitHub, GitLab, AWS CodeCommit).
3. Select the repository `wastewise` and branch `main`.

### Step 2: Build Settings & Specifications
Amplify will detect the repository root `amplify.yml`. Verify the build specifications:

```yaml
version: 1
applications:
  - appRoot: client
    frontend:
      phases:
        preBuild:
          commands:
            - cd .. && npm ci
        build:
          commands:
            - npm run build --workspace=shared
            - npm run build --workspace=client
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - ../node_modules/**/*
          - node_modules/**/*
```

### Step 3: Add Client Environment Variables
In **App settings -> Environment variables**, configure:

| Variable Name | Value | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase endpoint |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase anonymous public key |
| `VITE_API_BASE_URL` | `https://<service-id>.<region>.awsapprunner.com/api` | Live App Runner API endpoint |

> **Security Reminder**: Never supply `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to Amplify or any client environment.

### Step 4: Configure SPA Rewrites & Redirects
For client-side routing (React Router v6) to resolve deep paths such as `/domains/waste-segregation` or `/advisories/123`:

1. In Amplify Console, navigate to **App settings -> Rewrites and redirects**.
2. Click **Add rule** or verify the rule:
   - **Source address**: `/<*>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`

*(Reference configuration is also stored in [`client/amplify-redirects.json`](file:///c:/awsenv/client/amplify-redirects.json)).*

### Step 5: Update CORS on Backend App Runner
Once Amplify provides your frontend URL (e.g. `https://main.<id>.amplifyapp.com`):
1. In the **AWS App Runner** console, edit **Configuration -> Environment variables**.
2. Update `CLIENT_ORIGIN` to match your Amplify domain:
   ```
   CLIENT_ORIGIN=https://main.<id>.amplifyapp.com
   ```
3. Save and deploy changes.

---

## 4. Verification & Validation Checklist

| Checkpoint | Command / Action | Expected Result |
|---|---|---|
| 1. API Health Check | `curl -i https://<apprunner-domain>/api/health` | `HTTP/1.1 200 OK` with JSON `{"success": true, "data": {"status": "ok"}}` |
| 2. API CORS Protection | `curl -H "Origin: https://malicious-site.com" https://<apprunner-domain>/api/domains` | Blocked / CORS Error |
| 3. API CORS Allowed | `curl -H "Origin: https://main.<id>.amplifyapp.com" https://<apprunner-domain>/api/domains` | Returns `Access-Control-Allow-Origin: https://main.<id>.amplifyapp.com` and domains data |
| 4. Frontend SPA Direct URL | Open browser to `https://main.<id>.amplifyapp.com/domains` directly | Loads Domains page without 404 error |
| 5. Supabase Auth | Sign up with email or magic link on the deployed URL | User created in Supabase Auth, redirects into app |
| 6. AI Advisory Generation | Fill form for "Waste Segregation" and submit | Progress checkpoints animate; advisory generated and stored under 15 seconds |
| 7. Profile & Advisory History | Visit `/advisories` and `/profile` | Shows newly generated advisory, metrics, and active member status |
