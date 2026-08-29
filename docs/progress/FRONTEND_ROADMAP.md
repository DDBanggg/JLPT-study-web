# Frontend Roadmap

Owner: **Antigravity**
Scope: desktop frontend first; mobile only after desktop stabilization
Last updated: 2026-08-29

Codex is not assigned to this roadmap.

## Milestones

| ID | Milestone | Status | Exit condition |
| --- | --- | --- | --- |
| F1 | Desktop AppShell | COMPLETE | Layout, collapsible Sidebar, navigation and light visual system |
| F2 | Login + Setup | COMPLETE | Login/setup flows consume Auth and Program APIs |
| F3 | Schedule | COMPLETE | Study Day navigation, task cards and Content Pending render safely |
| F4 | Grammar | COMPLETE | Grammar cards, viewed progress, completion and Grammar Test CTA |
| F5 | Vocabulary | NOT_STARTED | List/Quiz/Known/Shuffle behavior works without frontend business logic |
| F6 | Kanji | NOT_STARTED | List/Quiz/Known/Shuffle behavior works without frontend business logic |
| F7 | Reading | NOT_STARTED | Passage, questions and local-only comparison flow work |
| F8 | Listening | NOT_STARTED | Embedded YouTube, fallback and manual completion work |
| F9 | Test list pages | NOT_STARTED | Grammar, Daily, Weekly, Monthly, End and Mock lists consume metadata API |
| F10 | Desktop test-taking | NOT_STARTED | Shared question UI, navigator, submit warning and review work |
| F11 | Calendar | NOT_STARTED | Month/day views render backend-derived statuses read-only |
| F12 | Desktop stabilization | NOT_STARTED | Chrome QA, accessibility and error/pending/loading states pass |
| F13 | Mobile adaptation | NOT_STARTED | Starts only after F12 and backend stabilization are complete |

## Frontend rules

- Consume frozen routes and DTOs from FE/BE Contract v1.1.
- Do not access Supabase user-state tables directly.
- Do not hardcode next-task ordering.
- Keep Grammar and Grammar Test progress separate.
- Keep mobile work out of scope until desktop is approved.
- Coordinate contract mismatches before changing shared types or payload shapes.
