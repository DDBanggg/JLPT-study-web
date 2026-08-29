# N3 Study Web — Delivery Roadmaps

Last updated: 2026-08-29

Progress is tracked in three independent workstreams. Product integration happens through the frozen contracts in `docs/specs/`; workstream ownership must not be inferred from feature overlap.

## Workstreams

| Workstream | Owner | Current milestone | Status | Tracker |
| --- | --- | --- | --- | --- |
| Backend (`B*`) | Codex | B5 — Roadmap + Schedule backend | NOT_STARTED | [Backend roadmap](./BACKEND_ROADMAP.md) |
| Frontend (`F*`) | Antigravity | F1 — Desktop AppShell | NOT_STARTED | [Frontend roadmap](./FRONTEND_ROADMAP.md) |
| CI/CD (`CI*`) | Repository/platform maintainer | CI1 — Repository governance | IN_PROGRESS | [CI/CD roadmap](./CICD_ROADMAP.md) |

## Ownership rule

Codex is a backend-only implementation agent.

Codex owns:

```text
backend APIs
server-side auth/session behavior
Supabase schema and backend migrations
server/data/progress/scoring logic
content validation backend tooling
backend tests
```

Codex does not own:

```text
frontend pages or components
frontend styling or local UI interactions
GitHub Actions
Vercel configuration or deployment
branch protection and repository administration
release promotion or production secrets
```

Frontend belongs to Antigravity. CI/CD belongs to the repository/platform maintainer.

## Status definitions

- `NOT_STARTED`: no implementation work has begun.
- `IN_PROGRESS`: implementation or verification is active.
- `BLOCKED`: progress requires a decision or external dependency.
- `COMPLETE`: acceptance criteria and required validation have passed.

## Integration gates

1. Frontend consumes only frozen DTOs/routes; it does not reproduce backend business logic.
2. Backend does not modify frontend presentation areas.
3. CI/CD runs validation and deployment; it does not redefine application contracts.
4. A product milestone is complete only when its relevant Backend, Frontend, and CI/CD gates all pass.
5. Mobile work begins only after the desktop frontend and backend are stable.

## History

The previous combined Sprint 1 tracker is preserved at [history/sprint-01-auth-program.md](./history/sprint-01-auth-program.md). It is historical evidence, not the active roadmap format.

## Tracking rules

1. Update only the workstream that owns the change.
2. Mark a milestone complete only with acceptance and validation evidence.
3. Record contract ambiguities in the owning roadmap and resolve them in `docs/specs/` before implementation.
4. Keep commit hashes and validation results as evidence.
5. Never record secrets, passwords, tokens, or environment values.
