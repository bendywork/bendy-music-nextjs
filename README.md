# bendy-music-nextjs

Next.js-based music API gateway and admin dashboard.

## Features

- GitHub OAuth admin login
- PostgreSQL persistence
- Redis cache with Upstash compatibility
- Admin pages for providers, APIs, docs, and system settings
- README and API doc config can be committed back to GitHub
- Redis keys are isolated with a business prefix

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
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
```

4. Start dev server

```bash
npm run dev
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
- `DOCS_REPO_README_PATH`
- `DOCS_REPO_API_PATH`
- `DOCS_REPO_COMMIT_PREFIX`
- `DOCS_REPO_COMMIT_AUTHOR`
- `DOCS_REPO_COMMIT_EMAIL`

## Redis key prefix

All Redis keys for this project must use:

```env
REDIS_KEY_PREFIX=bendywork_ddmusic_nextjs_
```

## Doc sync

The dashboard writes docs to PostgreSQL first, then syncs these files back to GitHub when enabled:

- `README.md`
- `doc/doc-prop.json`

## Verification

```bash
npm run lint
npm run build
```

`npm test` is not defined in the current repository.
