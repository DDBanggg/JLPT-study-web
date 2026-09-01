# Frontend Roadmap

Owner: **Antigravity**
Scope: desktop frontend first; mobile only after desktop stabilization
Last updated: 2026-09-02

Codex is not assigned to this roadmap.

## Milestones

| ID | Milestone | Status | Exit condition |
| --- | --- | --- | --- |
| F1 | Desktop AppShell | COMPLETE | Layout, collapsible Sidebar, navigation and light visual system |
| F2 | Login + Setup | COMPLETE | Login/setup flows consume Auth and Program APIs |
| F3 | Schedule | COMPLETE | Study Day navigation, task cards and Content Pending render safely |
| F4 | Grammar | COMPLETE | Grammar cards, viewed progress, completion and Grammar Test CTA |
| F5 | Vocabulary | COMPLETE | List/Quiz/Known replacement/Shuffle behavior works without frontend business logic |
| F6 | Kanji | COMPLETE | List/Quiz/Known remove-only behavior and dynamic active-set count work without frontend business logic |
| F7 | Reading | COMPLETE | Text-only, visual-only, and mixed stimuli; independent translation and answer checks; text/image MCQ and Matching work |
| F8 | Listening | COMPLETE | Embedded YouTube, fallback and manual completion work |
| F9 | Test list pages | COMPLETE | Grammar, Daily, Weekly, Monthly, End and Mock lists consume metadata API |
| F10 | Desktop test-taking | COMPLETE | Shared question UI, navigator, submit warning and review work |
| F11 | Calendar | COMPLETE | Month/day views render backend-derived statuses read-only |
| F12 | Desktop stabilization | COMPLETE | Chrome QA, accessibility and error/pending/loading states pass |
| F13 | Mobile adaptation | COMPLETE | Responsive layout, mobile navigation drawer, touch and card list views pass |

## Frontend rules

- Consume frozen routes and DTOs from FE/BE Contract v1.1.
- Do not access Supabase user-state tables directly.
- Do not hardcode next-task ordering.
- Keep Grammar and Grammar Test progress separate.
- Keep mobile work out of scope until desktop is approved.
- Coordinate contract mismatches before changing shared types or payload shapes.
