# bendy-music-nextjs

DdMusic, Next.js-based music API gateway and admin dashboard.

## Features

- GitHub OAuth admin login
- PostgreSQL persistence
- Redis cache with Upstash compatibility
- Admin pages for providers, APIs, docs, and system settings
- Tailwind CSS 4 + shadcn-style UI primitives
- Neutral black/white/gray theme with light and dark mode toggle
- README and API doc config can be committed back to GitHub
- README and API doc config are written back to local UTF-8 files before syncing
- Redis keys are isolated with a business prefix
- `/docs` supports password protection with config fallback and Vercel env override
- Provider config and API config are persisted in structured PostgreSQL tables
- Dockerized development environment with PostgreSQL and Redis

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives
- next-themes
- PostgreSQL
- Redis

## Local setup

1. Install dependencies

```bash
npm install
```

2. Configure env vars

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000

GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
GITHUB_ADMIN_USERS=fntp,yokeay.52bendy,dqnu,sceaxy
DOCS_ACCESS_PASSWORD=fntp@polofox.com
GITHUB_OAUTH_SCOPES=read:user
AUTH_SESSION_SECRET=replace_with_a_long_random_secret

DATABASE_URL=postgresql://username:password@localhost:5432/ddmusic
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=bendywork_ddmusic_nextjs_
REDIS_CACHE_TTL_SECONDS=60

GITHUB_REPO=bendywork/bendy-music-nextjs
DOCS_REPO_SYNC_ENABLED=true
DOCS_REPO_SYNC_BRANCH=main
DOCS_REPO_TOKEN_ENV=GITHUB_REPO_TOKEN
GITHUB_REPO_TOKEN=github_pat_xxx
```

3. Run the SQL migration

```bash
psql "$DATABASE_URL" -f db/migrations/20260328_postgres_store.sql
psql "$DATABASE_URL" -f db/migrations/20260331_structured_admin_config.sql
```

4. Start dev server

```bash
npm run dev
```

## Docker development

Start the full development stack:

```bash
docker compose up --build
```

Services started by Compose:

- Next.js app on `http://localhost:3000`
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Compose defaults:

- `DATABASE_URL=postgresql://dev:dev@postgres:5432/ddmusic_dev`
- `REDIS_URL=redis://redis:6379/0`
- Docs repo sync is disabled by default in Docker

To stop the stack:

```bash
docker compose down
```

## Vercel deployment

Required variables:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_BASE_URL=https://your-domain.com

GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_REDIRECT_URI=https://your-domain.com/api/auth/github/callback
GITHUB_ADMIN_USERS=fntp,yokeay.52bendy,dqnu,sceaxy
DOCS_ACCESS_PASSWORD=fntp@polofox.com
AUTH_SESSION_SECRET=replace_with_a_long_random_secret

DATABASE_URL=postgresql://username:password@host:5432/database
REDIS_URL=rediss://default:password@your-upstash-endpoint:6379
REDIS_KEY_PREFIX=bendywork_ddmusic_nextjs_

GITHUB_REPO=bendywork/bendy-music-nextjs
DOCS_REPO_SYNC_ENABLED=true
DOCS_REPO_SYNC_BRANCH=main
DOCS_REPO_TOKEN_ENV=GITHUB_REPO_TOKEN
GITHUB_REPO_TOKEN=github_pat_xxx
```

Optional variables:

- `UPSTASH_REDIS_URL`
- `REDIS_CACHE_TTL_SECONDS`
- `GITHUB_OAUTH_BASE_URL`
- `DOCS_ACCESS_PASSWORD`
- `DOCS_REPO_README_PATH`
- `DOCS_REPO_API_PATH`
- `DOCS_REPO_COMMIT_PREFIX`
- `DOCS_REPO_COMMIT_AUTHOR`
- `DOCS_REPO_COMMIT_EMAIL`

## Docs access

- `/docs` now requires a password.
- Runtime password priority: Vercel environment variable `DOCS_ACCESS_PASSWORD` -> `config/app.config.json` -> default `fntp@polofox.com`.
- Project config stores the env var name and the fallback default in `config/app.config.json`.

## Structured config tables

- `system_configurations`: runtime system settings.
- `provider_configurations`: provider records with `BaseURL`, status, and metadata.
- `api_configurations`: API master records, bound provider, request type, and status.
- When an API or provider is `disabled`, `/api` returns `该接口已下架`.
- When an API or provider is `maintenance`, `/api` returns `该接口维护中暂不可用`.

## Redis key prefix

All Redis keys for this project must use:

```env
REDIS_KEY_PREFIX=bendywork_ddmusic_nextjs_
```

## Doc sync

The dashboard writes docs to PostgreSQL first, then syncs these files back to GitHub when enabled:

- `README.md`
- `doc/doc.html`

## Verification

```bash
npm run lint
npm run build
```

`npm test` is not defined in the current repository.
