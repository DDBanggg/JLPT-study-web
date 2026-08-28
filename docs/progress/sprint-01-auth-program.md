# Sprint 1 — Infrastructure, Auth and Program

Status: `IN_PROGRESS`  
Started: 2026-08-28  
Completed: —

## Objective

Deliver the first vertical flow:

```text
Login → Program Setup → Schedule redirect
```

The backend remains authoritative for authentication, user identity, program dates, and derived program values.

## Infrastructure

- [x] Local Git repository initialized on `main`.
- [x] Bootstrap commit created.
- [ ] Private GitHub repository created.
- [ ] `origin` configured and `main` pushed.
- [ ] Supabase project created.
- [ ] Initial SQL migration applied to a fresh Supabase database.
- [ ] Local environment variables configured without committing secrets.
- [ ] Vercel project connected and environment variables documented.

## Backend — Codex

- [ ] Common API success/error helpers match FE/BE Contract v1.
- [ ] Supabase session user is resolved server-side.
- [ ] Login ID normalization and validation are covered by tests.
- [ ] `POST /api/auth/login` implemented.
- [ ] `POST /api/auth/logout` implemented.
- [ ] `GET /api/program` implemented.
- [ ] `POST /api/program` implemented.
- [ ] Program date derivation helpers implemented and tested.
- [ ] Generic invalid-login response does not reveal account existence.
- [ ] Frontend never receives the generated internal auth email.

## Frontend — Antigravity

- [ ] Desktop AppShell foundation implemented.
- [ ] `/login` implemented.
- [ ] `/setup` implemented.
- [ ] Day 1 and projected Day 100 preview implemented.
- [ ] `DAY_100_AFTER_EXAM` warning implemented without blocking setup.
- [ ] Loading and error states match the contract.

## Acceptance criteria

- [ ] Valid user can log in and retain a session after reload.
- [ ] User without a program is redirected to `/setup`.
- [ ] Program setup persists start date and exam date.
- [ ] Configured user is redirected to `/schedule`.
- [ ] Authenticated APIs derive `user_id` from the session.
- [ ] Progress tables are not accessed directly from frontend code.

## Required validation

| Command | Status | Last result |
| --- | --- | --- |
| `npm run lint` | PENDING | — |
| `npm run typecheck` | PENDING | — |
| `npm run test` | PENDING | — |
| `npm run build` | PENDING | — |
| `npm run validate-content` | PENDING | — |

## Blockers and decisions

- GitHub remote is not configured; GitHub CLI was unavailable during bootstrap.
- No contract deviation is currently recorded.

## Change log

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-08-28 | Bootstrap completed | Commit `29015b8` |
| 2026-08-28 | Sprint tracking initialized | Pending commit |
