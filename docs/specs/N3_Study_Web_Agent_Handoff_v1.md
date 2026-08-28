# N3 Study Web — Agent Handoff & Task Split v1.1

**Status:** Ready for execution  
**Date:** 2026-08-29

This document defines how work is split between:

- **ChatGPT** — context/specification authority
- **Codex** — backend implementation
- **Antigravity** — frontend implementation

The shared technical contract is defined by:

- `N3_Study_Web_FE_BE_Contract_v1.md`
- `N3_Study_Web_JSON_Schema_v1.md`
- `N3_Study_Web_SQL_Schema_v1.sql`
- `N3_Study_Web_Auth_LoginID_v1.md`
- `N3_Study_Web_Test_Scoring_v1.md`

No agent should silently change those contracts.

---

# 1. Core operating rule

The project is split by responsibility, not by feature ownership alone.

## ChatGPT

Owns:
- product/context truth
- architecture truth
- UI/UX truth
- shared contracts
- change decisions
- cross-agent conflict resolution
- context packaging
- implementation review against specs

ChatGPT does not own day-to-day backend/frontend coding unless explicitly reassigned.

## Codex

Owns:
- backend implementation
- Supabase
- database migrations
- authentication backend
- API Route Handlers
- server/data logic
- progress derivation
- Calendar derivation
- Known replacement
- learning-set freeze
- test scoring
- backend validation
- backend tests

## Antigravity

Owns:
- frontend implementation
- desktop AppShell
- navigation/sidebar
- pages and components
- Schedule UI
- Grammar UI
- Vocabulary UI
- Kanji UI
- Reading UI
- Listening UI
- Test UI
- Calendar UI
- visual styling
- client-side interactions

---

# 2. File ownership

## Codex-owned

```text
app/api/**
lib/server/**
lib/data/**
lib/auth/**
lib/progress/**
lib/scoring/**
supabase/**
scripts/content-validation/**
tests/backend/**
```

Codex may also create server-only utilities in:

```text
lib/**
```

provided they are clearly backend-specific.

## Antigravity-owned

```text
app/(authenticated)/**
app/login/**
app/setup/**
components/**
styles/**
public/**
tests/frontend/**
```

Actual Next.js folder grouping may vary, but frontend pages/components remain Antigravity-owned.

## Shared/frozen

```text
content/**
types/**
contracts/**
```

Shared areas should not be changed unilaterally after contract freeze.

If either implementation needs a change:
1. report the mismatch
2. update source-of-truth through ChatGPT
3. bump contract/schema if breaking
4. then modify code

---

# 3. Git strategy

Recommended branches:

```text
main
backend/*
frontend/*
```

Examples:

```text
backend/foundation
backend/auth
backend/progress
backend/test-engine

frontend/app-shell
frontend/schedule
frontend/learn
frontend/test-ui
```

Rules:
- `main` should remain integration-ready
- backend does not modify frontend visual files
- frontend does not modify Supabase migrations/server logic
- shared contract changes are isolated and reviewed before merge

---

# 4. Integration checkpoints

Do not wait until the end to merge everything.

Use checkpoints.

## Checkpoint A — Foundation

Codex:
- Supabase setup
- base DB migration
- auth helpers
- API response helpers

Antigravity:
- Next.js desktop shell
- collapsible Sidebar
- base navigation
- Light theme

Integration proof:
- frontend can call one authenticated test endpoint
- session behavior works

## Checkpoint B — Program + Schedule

Codex:
- program API
- roadmap loader
- Schedule DTO
- task-progress derivation
- Content Pending

Antigravity:
- Login
- Program Setup
- Progress/countdown
- Schedule
- Content Pending UI

Integration proof:
- login → setup → schedule
- Day calculation correct
- missing content renders safely

## Checkpoint C — Learn core

Codex:
- grammar viewed
- task completion
- known items
- learning sets
- replacement logic

Antigravity:
- Grammar cards
- Grammar Test transition
- Vocabulary List/Quiz
- Kanji List/Quiz
- next-task CTA

Integration proof:
- Grammar progress survives reload
- Grammar completion routes to a separate same-day Grammar Test
- Known replacement survives reload
- frozen active sets remain stable

## Checkpoint D — Reading + Listening

Codex:
- Reading/Listening content DTOs
- completion writes

Antigravity:
- Reading compare flow
- embedded YouTube Listening
- completion + next CTA

Integration proof:
- no user draft persistence
- Listening plays inside web
- fallback works

## Checkpoint E — Test Engine

Codex:
- sanitized active-test payload
- Grammar and Daily raw scoring
- JLPT-style scoring
- result upsert
- review payload

Antigravity:
- two-column test UI
- answer navigator
- answered blue
- Submit warning
- result review

Integration proof:
- correct answers are not exposed before Submit
- Grammar Test scores as raw `x / 25`
- backend score matches spec
- retake replaces previous result

## Checkpoint F — Calendar + Desktop QA

Codex:
- month/day Calendar DTOs
- status derivation
- migration support

Antigravity:
- Calendar month
- green/yellow/red statuses
- day detail

Integration proof:
- Finished
- Not Finished
- Late Finished
- future neutral

---

# 5. Codex task order

## B1 — Backend foundation

Deliver:
- Supabase client/server setup
- environment variable strategy
- common API envelope
- auth session helper
- content loader foundation

Acceptance:
- authenticated user can be resolved server-side
- API error format matches contract

## B2 — SQL schema

Deliver:
- migration for 6 tables
- indexes
- RLS
- Known replacement RPC

Acceptance:
- migration runs cleanly on fresh Supabase DB
- user isolation verified

## B3 — Authentication

Deliver:
- Login ID normalization
- internal auth email conversion
- login API
- logout API
- admin bootstrap helper/documentation

Acceptance:
- frontend never needs internal email
- invalid login does not leak account existence

## B4 — Program

Deliver:
- GET/POST program API
- projected Day 100
- current Study Day
- days remaining
- progress helper

## B5 — Roadmap + Schedule

Deliver:
- roadmap loader
- schedule day API
- task state calculation
- Content Pending detection
- next-task helper

## B6 — Learn progress

Deliver:
- grammar viewed API
- complete-task API
- reading/listening completion
- idempotency

## B7 — Vocabulary/Kanji state

Deliver:
- ensure learning set
- Known replacement
- reserve selection
- pool-exhaustion behavior

## B8 — Test engine backend

Deliver:
- test content loader
- strip answers before active test response
- submit validation
- Grammar Test raw scoring
- Daily raw scoring
- JLPT-style linear scoring
- review response
- latest-result upsert

## B9 — Calendar

Deliver:
- month status API
- day detail API
- Finished/Late/Not Finished logic
- historical migration utilities

## B10 — Content validation

Deliver:
- schema/content validation
- Grammar Test 5 lessons × 5 questions check
- Daily Test 15/15/15 check
- stable reference validation where possible
- YouTube metadata validation
- usable CLI/script

---

# 6. Antigravity task order

## F1 — Desktop AppShell

Deliver:
- desktop layout
- collapsible Sidebar
- Learn/Test accordions
- top progress area
- light visual system

No mobile work.

## F2 — Login + Setup

Deliver:
- Login ID/password form
- password show/hide
- Setup form
- projected Day 100 display
- warning state

## F3 — Schedule

Deliver:
- Study Day header
- Previous/Next/Today
- Task cards
- Pending/In Progress/Finished
- Content Pending state
- clickable whole card

## F4 — Grammar

Deliver:
- one-structure-per-card UI
- Previous/Next
- viewed progress
- final completion
- roadmap-derived Grammar Test CTA

## F5 — Vocabulary

Deliver:
- List table
- List/Quiz tabs
- Known confirmation
- flashcard
- ordered mode
- Shuffle
- completion
- next CTA

No Search.

## F6 — Kanji

Deliver:
- List table
- Known confirmation
- Quiz front = Kanji only
- back details
- Shuffle
- completion
- next CTA

## F7 — Reading

Deliver:
- passage
- Questions section
- textarea
- Compare
- reference translation/answers
- completion
- next CTA

Do not persist textarea.

## F8 — Listening

Deliver:
- responsive embedded YouTube
- video + playlist support
- fallback button
- manual completion
- Previous/Next
- next CTA

## F9 — Test list pages

Deliver:
- Grammar
- Daily
- Weekly
- Monthly
- End
- Mock/Test lists

## F10 — Test-taking desktop

Deliver:
- left question content
- right sticky navigator
- answered = blue
- question jump
- unanswered warning
- Submit
- review correct/incorrect
- explanations

## F11 — Calendar

Deliver:
- month grid
- green/yellow/red
- future neutral
- day detail
- Open Study Day

## F12 — Desktop polish

Deliver:
- consistent spacing
- Japanese typography
- loading states
- errors
- empty/pending states
- accessibility basics
- desktop Chrome QA

---

# 7. ChatGPT task order

## C1 — Maintain source-of-truth

Keep synchronized:
- Context
- Architecture
- UI/UX
- Implementation Plan
- FE/BE Contract
- JSON Schema
- SQL Schema
- Auth convention
- Test scoring
- Agent handoff

## C2 — Resolve implementation questions

When Codex or Antigravity finds ambiguity:
- check existing spec
- decide whether it is implementation freedom or contract ambiguity
- update source-of-truth only when necessary

## C3 — Content context

As learning content is prepared daily:
- preserve canonical JSON schema
- help convert source material directly into valid JSON without committed per-day Study Context duplication
- keep IDs stable
- ensure same-day Grammar Test content matches that Study Day's Grammar
- ensure next-day test content matches previous-day knowledge

## C4 — Integration review

At each checkpoint:
- compare implementation behavior to spec
- identify contract mismatch
- distinguish frontend bug vs backend bug vs spec issue

## C5 — Change control

Any breaking change should be documented as:

```text
Decision
Reason
Affected contract/schema
Frontend impact
Backend impact
Migration impact
```

---

# 8. Agent handoff packet

## Packet for Codex

Give Codex:

1. `N3_Study_Web_Context_v2.md`
2. `N3_Study_Web_Database_Architecture_v2.md`
3. `N3_Study_Web_Implementation_Plan.md`
4. `N3_Study_Web_FE_BE_Contract_v1.md`
5. `N3_Study_Web_JSON_Schema_v1.md`
6. `N3_Study_Web_SQL_Schema_v1.sql`
7. `N3_Study_Web_Auth_LoginID_v1.md`
8. `N3_Study_Web_Test_Scoring_v1.md`
9. this Agent Handoff file

Primary instruction:

```text
Implement backend strictly to the frozen contract.
Do not modify frontend ownership areas.
If contract is insufficient, report the exact ambiguity instead of inventing a breaking shape.
```

## Packet for Antigravity

Give Antigravity:

1. `N3_Study_Web_Context_v2.md`
2. `N3_Study_Web_UI_UX_v2.md`
3. `N3_Study_Web_Implementation_Plan.md`
4. `N3_Study_Web_FE_BE_Contract_v1.md`
5. `N3_Study_Web_JSON_Schema_v1.md`
6. this Agent Handoff file

Primary instruction:

```text
Implement desktop frontend strictly against the frozen API contract.
Do not access Supabase progress tables directly.
Do not invent backend business logic in the UI.
Mobile is out of scope until desktop is approved.
```

---

# 9. Recommended start sequence

Do not start every feature simultaneously.

Start with:

```text
Codex:
B1 Foundation
B2 SQL
B3 Auth

Antigravity:
F1 AppShell
F2 Login + Setup shell
```

Then integrate.

Next:

```text
Codex:
B4 Program
B5 Schedule

Antigravity:
F3 Schedule
```

Only after Schedule integration succeeds:

```text
Learn modules
→ Test engine
→ Calendar
→ Desktop QA
```

---

# 10. Definition of successful parallel work

Parallel execution is healthy when:

- Antigravity can build UI using stable mock DTOs matching the contract
- Codex can build APIs without needing frontend implementation details
- integration requires wiring, not redesign
- neither agent changes shared enums/routes silently
- Content Pending works naturally
- backend remains authoritative for state/business rules
- frontend remains authoritative for presentation/interactions

---

# 11. Current scope boundary

Current target:

```text
Desktop MVP
```

Not yet:
- mobile implementation
- final N3 full content corpus
- November final mock cadence
- AI runtime
- CMS
- advanced account management

Rolling study content will be added continuously while the product is being used.
