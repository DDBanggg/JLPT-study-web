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

## Repository layout

- `src/` contains the application and shared runtime code.
- `content/` contains versioned study content.
- `tests/` contains backend and frontend tests.
- `scripts/` contains administrative and content-validation tools.
- `supabase/` contains database configuration and migrations.
- `public/` contains static assets.
- `docs/` contains current specifications, operational guides, roadmaps, and archived
  historical records.

## Source of truth

Read [`docs/README.md`](docs/README.md) and the authoritative files in [`docs/specs`](docs/specs) before implementation. Contract or schema changes must be resolved in source-of-truth documents first.

## Rolling content model

Future roadmap tasks may exist before their resource JSON is published. This is a supported `Content Pending` state, not an application error. Content is prepared, validated, committed and deployed progressively; published IDs remain stable.

## Learning and Reading semantics (content specification v1.4)

- Vocabulary is source-bounded, priority-ranked and quota-based: `target = 50`, pool `<= 100`, with same-day Reserve replacement.
- Kanji is source-exhaustive: publish all canonical Kanji taught by the assigned lessons; there is no fixed target or Reserve, and Known removes only the item (`active = source - Known`).
- Reading supports text, visual media, or both; questions remain structured and translation applies only to passage text.
- Runtime content files continue to use `schema_version: 1`; legacy JSON metadata remains compatible where documented.

## Delivery rule

Desktop remains authoritative for the MVP. Current implementation status is tracked in
the backend, frontend, and CI/CD roadmaps under `docs/progress/`. Historical bootstrap,
handoff, and implementation-planning records live under `docs/archive/` and are not
current sources of truth.
