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
- [x] `origin` configured and `main` pushed.
- [ ] Supabase project created.
- [ ] Initial SQL migration applied to a fresh Supabase database.
- [ ] Local environment variables configured without committing secrets.
- [ ] Vercel project connected and environment variables documented.

## Backend — Codex

- [x] Common API success/error helpers match FE/BE Contract v1.
- [x] Supabase session user is resolved server-side.
- [x] Login ID normalization and validation are covered by tests.
- [x] `POST /api/auth/login` implemented.
- [x] `POST /api/auth/logout` implemented.
- [x] `GET /api/program` implemented.
- [x] `POST /api/program` implemented.
- [x] Program date derivation helpers implemented and tested.
- [x] Generic invalid-login response does not reveal account existence.
- [x] Frontend never receives the generated internal auth email.

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
| `npm run lint` | PASS | 2026-08-28 |
| `npm run typecheck` | PASS | 2026-08-28 |
| `npm run test` | PASS | 11 tests, 2026-08-28 |
| `npm run build` | PASS | Auth and Program routes compiled, 2026-08-28 |
| `npm run validate-content` | PASS | 0 published JSON files, 2026-08-28 |

## Blockers and decisions

- GitHub `origin` is configured and `main` is pushed; private visibility has not been independently verified in the local environment.
- Supabase project and `.env.local` do not exist yet, so migration, initial account creation, and live Auth/Program acceptance tests are pending.
- Requested initial Login ID is `bagn-11032005`; password must be supplied locally after Supabase is ready.
- Program timezone is fixed to `Asia/Ho_Chi_Minh`; Study Day is clamped to `1..100` and overdue exam countdown is clamped to `0`.
- Vercel setup is deferred by user decision.
- The official roadmap remains pending. Initial Program progress is correctly `0`; non-empty progress requires the official roadmap for completed-day derivation.
- No frozen-contract deviation is currently recorded.

## Change log

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-08-28 | Bootstrap completed | Commit `29015b8` |
| 2026-08-28 | Sprint tracking initialized | Commit `d6eca74` |
| 2026-08-28 | Application code moved into `src/` | Commit `1ac5338` |
| 2026-08-28 | Auth and Program backend implemented | Commit `9fa1c2c` |
