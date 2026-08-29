# Sprint 1 — Infrastructure, Auth and Program

> Historical combined tracker. Active planning is now split into Backend, Frontend, and CI/CD roadmaps under `docs/progress/`.

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
- [x] Supabase project created.
- [x] Initial SQL migration applied to a fresh Supabase database.
- [x] Local environment variables configured without committing secrets.
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

- [x] Valid user can log in and retain a session after reload.
- [x] User without a program is redirected to `/setup`.
- [x] Program setup persists start date and exam date.
- [x] Configured user is redirected to `/schedule`.
- [x] Authenticated APIs derive `user_id` from the session.
- [x] Progress tables are not accessed directly from frontend code.

## Required validation

| Command | Status | Last result |
| --- | --- | --- |
| `npm run lint` | PASS | 2026-08-29 |
| `npm run typecheck` | PASS | 2026-08-29 |
| `npm run test` | PASS | 12 tests, 2026-08-29 |
| `npm run build` | PASS | Auth and Program routes compiled, 2026-08-29 |
| `npm run validate-content` | PASS | 0 published JSON files, 2026-08-29 |

## Blockers and decisions

- GitHub `origin` is configured and `main` is pushed. An unauthenticated GitHub API lookup returned HTTP 200 on 2026-08-29, confirming the repository is public; it still needs to be changed to private by the owner.
- Supabase project is linked locally; migration `0001` is present both locally and remotely, and all six application tables exist.
- Initial Login ID `bagn` was created through the server-only Admin API. Its password remains local and is not committed.
- Live Auth verification passed: valid login, session-authenticated Program request, generic invalid-login response, logout invalidation, `/setup` redirect before setup, and `/schedule` redirect after setup.
- Program was configured with start date `2026-08-27` and exam date `2026-12-06`; repeat setup returns `409 PROGRAM_ALREADY_CONFIGURED`.
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
| 2026-08-29 | Supabase migration, Auth configuration, account bootstrap, and live Program verification completed | Migration `0001` and live API evidence |
