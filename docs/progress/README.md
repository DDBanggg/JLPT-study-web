# N3 Study Web — Delivery Progress

Last updated: 2026-08-28

This directory tracks implementation progress. It does not replace the frozen specifications in `docs/specs/`.

## Status definitions

- `NOT_STARTED`: no implementation work has begun.
- `IN_PROGRESS`: implementation or verification is active.
- `BLOCKED`: progress requires a decision or external dependency.
- `COMPLETE`: acceptance criteria and required validation have passed.

## Sprint overview

| Sprint | Scope | Status | Evidence |
| --- | --- | --- | --- |
| 0 | Bootstrap | COMPLETE | Commit `29015b8` |
| 1 | Infrastructure, Auth and Program | IN_PROGRESS | [Sprint 1 tracker](./sprint-01-auth-program.md) |
| 2 | Roadmap and Schedule | NOT_STARTED | — |
| 3 | Grammar and shared completion | NOT_STARTED | — |
| 4 | Vocabulary and Kanji | NOT_STARTED | — |
| 5 | Reading and Listening | NOT_STARTED | — |
| 6 | Shared Test Engine | NOT_STARTED | — |
| 7 | Calendar and historical migration | NOT_STARTED | — |
| 8 | Desktop stabilization | NOT_STARTED | — |
| 9 | Mobile adaptation | NOT_STARTED | Starts only after Sprint 8 |

## Tracking rules

1. Update the current sprint file when scope, status, blockers, validation, or acceptance evidence changes.
2. Mark work complete only after its acceptance criteria and required commands pass.
3. Record contract ambiguities in the sprint tracker; resolve them in `docs/specs/` before implementation changes.
4. Keep commit hashes and validation results as evidence.
5. Do not record secrets, passwords, tokens, or environment values here.
