# Backend Roadmap

Owner: **Codex**
Scope: backend implementation only
Last updated: 2026-08-29

## Boundary

Codex implements APIs, server-side auth, Supabase/database behavior, roadmap/progress/scoring logic, backend validation, and backend tests.

Codex must not implement frontend UI or CI/CD. Contract changes require an explicit source-of-truth task before backend implementation changes.

## Milestones

| ID | Milestone | Status | Evidence / exit condition |
| --- | --- | --- | --- |
| B1 | Backend foundation | COMPLETE | Supabase/server/API envelope foundation committed |
| B2 | SQL schema | COMPLETE | Initial schema, indexes, RLS and RPC applied to the linked development project |
| B3 | Authentication backend | COMPLETE | Login/logout/session and admin bootstrap verified; commit `9fa1c2c` |
| B4 | Program backend | COMPLETE | Program GET/POST and date derivation verified; commit `9fa1c2c` |
| B5 | Roadmap + Schedule backend | COMPLETE | Authenticated Schedule route, canonical roadmap loader, task/content/progress derivation, 18 passing tests and live Day 2/3 verification |
| B6 | Learn progress core | NOT_STARTED | Grammar viewed, task completion, Reading/Listening completion, idempotency |
| B7 | Vocabulary + Kanji state | NOT_STARTED | Frozen learning sets, Known replacement, pool exhaustion |
| B8 | Shared Test Engine backend | NOT_STARTED | Grammar/Daily raw scoring, JLPT-style scoring, sanitized payload, latest result |
| B9 | Calendar backend | NOT_STARTED | Month/day DTOs and Finished/Late/Not Finished derivation |
| B10 | Content validation + backend stabilization | IN_PROGRESS | Validator foundation exists; full content/security/error/integration coverage remains |

## B5 — Completion evidence

Delivered:

- canonical roadmap loader;
- `GET /api/schedule/day/[day]`;
- Study Day validation;
- task state and progress DTOs;
- Content Pending detection;
- roadmap-derived `next_task` including Grammar → Grammar Test → Vocabulary;
- backend tests for missing content, task ordering, progress, Study Day validation and auth.

Verified:

- published and pending resources both return valid contract responses;
- frontend never needs direct Supabase progress-table access;
- task ordering is not hardcoded in individual APIs;
- lint, typecheck, backend tests, build, and content validation pass.

Live authenticated checks passed for:

- Day 2: seven roadmap tasks; unpublished Daily Test is pending while six published resources are available;
- Day 3: published Daily Test is available while the six unpublished resources are pending;
- planned dates are derived from the configured program start date.

## B6 — Next Codex milestone

Deliver:

- Grammar viewed API and idempotent viewed-state persistence;
- task completion API;
- Reading/Listening item completion;
- roadmap-derived `next_task` in completion responses;
- backend tests for duplicate mutations and day-completion behavior.

## Backend validation gate

```text
npm run lint
npm run typecheck
npm run test
npm run build
npm run validate-content
```
