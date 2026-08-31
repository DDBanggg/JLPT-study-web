# Backend Roadmap

Owner: **Codex**
Scope: backend implementation only
Last updated: 2026-08-31

## Content semantics synchronization (specification v1.3)

Vocabulary remains source-bounded, priority-ranked, quota-based (`target = 50`, pool
`<= 100`) with persisted frozen `learning_sets` and same-day Known replacement. Kanji is
source-exhaustive with no fixed target or Reserve: active IDs are current source IDs minus
Known IDs, persisted legacy Kanji `learning_sets` rows are ignored, and Known writes only
`known_items`. Runtime `schema_version` remains `1`; no database migration is required.

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
| B7 | Vocabulary + Kanji state | COMPLETE | Vocabulary frozen sets/replacement plus source-derived Kanji active IDs and remove-only Known behavior verified |
| B8 | Shared Test Engine backend | COMPLETE | Test list/payload/submit, answer stripping, raw/JLPT-style scoring and atomic latest-result persistence verified |
| B9 | Calendar backend | COMPLETE | Month/day DTOs, timezone-safe Finished/Late/Not Finished derivation and Day 1–2 historical import verified live |
| B10 | Content validation + backend stabilization | COMPLETE | API-only writes, server-only RPCs, 36 tests, content/build/db validation and isolated live integration pass |

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
- idempotent Vocabulary frozen sets/replacement and source-derived Kanji Known state;
- test list, sanitized active payload, strict answer validation, submit/review and retake behavior;
- Grammar/Daily raw scoring and project-defined JLPT-style linear scoring;
- atomic `test_results` upsert plus `task_progress` completion through migration `202608290002`;
- roadmap-derived `next_task` for Learn and Test completion responses.

Verified with a temporary isolated Supabase user, removed after the run:

- repeated Grammar viewed/completion calls remain idempotent;
- frozen learning sets survive reload without regeneration;
- Vocabulary replacement follows pool priority;
- Kanji active IDs equal source IDs minus Known IDs, including source sets larger or smaller than 30;
- active test payloads contain no answer or explanation fields;
- pending test resources return a safe pending DTO;
- Grammar Test and Daily Test submit/retake persist valid latest results;
- Reading item completion derives the next Listening task;
- Schedule reflects persisted B6–B8 state.

Validation: lint, typecheck, 28 backend tests, content validation and production build pass.

## B9–B10 — Completion evidence

Delivered:

- `GET /api/calendar?month=YYYY-MM` and `GET /api/calendar/day/[day]`;
- Asia/Ho_Chi_Minh-aware Finished, Late Finished, Not Finished and neutral-future derivation;
- reusable historical completion import utility that preserves existing completion rows;
- direct authenticated writes removed from all six application tables;
- server-only admin mutations and RPC execution for Program, progress, learning sets, Known and tests;
- malformed input, auth, pending content, scoring, ordering, replacement, pool exhaustion and Calendar tests;
- full lint, typecheck, content validation, production build and linked Supabase database lint gates.

Live verification:

- Login ID `bagn` retains start date `2026-08-27` and exam date `2026-12-06`;
- Study Days 1 and 2 were imported with planned-date timestamps and both derive `finished`;
- Program progress derives exactly two completed Study Days;
- direct session write is rejected by PostgreSQL RLS with `42501`;
- the same mutations succeed through authenticated backend APIs;
- server-only Known/Test RPCs remain operational after hardening;
- temporary integration user was removed after verification.

## Backend implementation status

Backend status: FROZEN FOR DESKTOP FRONTEND

Milestones B1–B10 are complete for the currently published rolling-content set. Future
Weekly/Monthly/End/Mock resources remain valid `Content Pending` until their JSON files are
published; the validator and Test Engine are already prepared for them.

After this freeze, backend changes are allowed only when desktop frontend integration
demonstrates a real backend or FE/BE contract defect. Frontend presentation preferences
or convenience changes do not reopen the backend.

## Backend validation gate

```text
npm run lint
npm run typecheck
npm run test
npm run build
npm run validate-content
```
