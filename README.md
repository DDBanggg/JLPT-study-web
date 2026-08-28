# N3 Study Web

N3 Study Web is a personal, desktop-first application for following a fixed 100 Study Day JLPT N3 roadmap. Static study content is versioned as JSON in Git; Supabase stores authentication and user progress only.

## Stack

- Next.js App Router, React and strict TypeScript
- Tailwind CSS, Light Mode only
- Supabase Auth and PostgreSQL
- npm, Git, Vercel-ready build

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

On PowerShell, copy the environment template with `Copy-Item .env.example .env.local`.

Required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_LOGIN_DOMAIN=n3study.local
```

The service-role key is server-only. Never commit `.env` or `.env.local`.

## Commands

```text
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run validate-content
```

## Folder ownership

Codex owns backend implementation in:

```text
src/app/api/**
src/lib/auth/**
src/lib/data/**
src/lib/progress/**
src/lib/roadmap/**
src/lib/scoring/**
src/lib/supabase/**
src/lib/utils/**
supabase/**
scripts/content-validation/**
tests/backend/**
```

Antigravity owns later frontend work in:

```text
src/app frontend pages
src/components/**
frontend presentation/styles
tests/frontend/**
```

Shared/frozen areas are:

```text
content/**
src/types/**
docs/specs/**
```

## Source of truth

Read [`docs/README.md`](docs/README.md) and the authoritative files in [`docs/specs`](docs/specs) before implementation. Contract or schema changes must be resolved in source-of-truth documents first.

## Rolling content model

Future roadmap tasks may exist before their resource JSON is published. This is a supported `Content Pending` state, not an application error. Content is prepared, validated, committed and deployed progressively; published IDs remain stable.

## Delivery rule

Desktop is authoritative for the MVP. Mobile adaptation, detailed frontend UI and full backend business logic are outside this bootstrap.
