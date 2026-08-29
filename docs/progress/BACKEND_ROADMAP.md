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
| B6 | Learn progress core | COMPLETE | Learn DTOs, idempotent Grammar/task progress, Reading/Listening item completion and roadmap next-task verified live |
| B7 | Vocabulary + Kanji state | COMPLETE | Frozen learning sets, Known replacement, stable reload and pool-exhaustion behavior verified live |
| B8 | Shared Test Engine backend | COMPLETE | Test list/payload/submit, answer stripping, raw/JLPT-style scoring and atomic latest-result persistence verified |
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

## B6–B8 — Completion evidence

Delivered:

- `GET /api/learn/[type]/[day]` with available/pending content and per-type user state;
- idempotent Grammar viewed and generic Learn completion APIs;
- Reading/Listening item completion with automatic canonical task completion;
- idempotent Vocabulary/Kanji frozen sets, Known replacement and pool exhaustion;
- test list, sanitized active payload, strict answer validation, submit/review and retake behavior;
- Grammar/Daily raw scoring and project-defined JLPT-style linear scoring;
- atomic `test_results` upsert plus `task_progress` completion through migration `202608290002`;
- roadmap-derived `next_task` for Learn and Test completion responses.

Verified with a temporary isolated Supabase user, removed after the run:

- repeated Grammar viewed/completion calls remain idempotent;
- frozen learning sets survive reload without regeneration;
- Vocabulary replacement follows pool priority;
- Kanji reserve exhaustion safely reduces active count below target;
- active test payloads contain no answer or explanation fields;
- pending test resources return a safe pending DTO;
- Grammar Test and Daily Test submit/retake persist valid latest results;
- Reading item completion derives the next Listening task;
- Schedule reflects persisted B6–B8 state.

Validation: lint, typecheck, 28 backend tests, content validation and production build pass.

## B9 — Next Codex milestone

Deliver:

- calendar month status API;
- calendar day detail API;
- Finished/Late Finished/Not Finished derivation;
- historical migration validation and utilities.

## Backend validation gate

```text
npm run lint
npm run typecheck
npm run test
npm run build
npm run validate-content
```
