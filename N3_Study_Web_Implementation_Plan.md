# N3 Study Web — Implementation Plan

**Status:** Ready for agent handoff planning  
**Updated:** 2026-08-27

## Delivery strategy

Build **desktop first**.

Order:
1. Desktop implementation
2. Desktop end-to-end stabilization
3. Desktop QA
4. Mobile adaptation only after desktop is smooth

Content is prepared progressively rather than all at once.

## Current agent operating model

### ChatGPT
Owns:
- product context
- source-of-truth documents
- architecture/context alignment
- JSON/content schema definitions
- implementation context
- handoff documentation
- cross-agent consistency

### Codex
Owns:
- backend implementation
- Supabase schema/migrations
- authentication/backend behavior
- progress logic
- server/data access
- content validation/backend utilities
- backend tests

### Antigravity
Owns:
- frontend implementation
- desktop AppShell
- Sidebar/navigation
- Schedule
- Learn interfaces
- Test UI
- Calendar UI
- visual/interaction implementation

Detailed ticket allocation and sequencing will be decided separately.

## Critical precondition for parallel work

Before Codex and Antigravity work independently, freeze the shared contract for:
- routes
- JSON schemas
- SQL schema
- TypeScript/shared data shapes
- mutations/server actions
- response shapes
- loading/error states
- Content Pending state
- completion payloads
- Known/replacement behavior
- test submit/result payload

This prevents frontend/backend drift.

## Phase 1 — Foundation

Goal: desktop project shell runs.

Tasks:
- Next.js + TypeScript + Tailwind
- GitHub
- Vercel
- Supabase config
- base folder structure
- AppShell
- collapsible desktop sidebar
- desktop routes
- light theme
- loading/error boundaries

No mobile work yet.

## Phase 2 — Auth + Program Setup

Backend:
- Supabase Auth
- `user_programs`
- auth guards
- start/exam date persistence
- Study Day calculation
- countdown helpers

Frontend:
- Login
- Program Setup
- projected Day 100
- warning if Day 100 > exam
- logout

Exit:
User can log in, configure program, reach Schedule.

## Phase 3 — Roadmap + Schedule + Calendar

Content:
- initial roadmap JSON
- enough sample data for vertical slice

Backend:
- `task_progress`
- Study Day completion derivation
- Calendar status derivation
- historical migration support

Frontend:
- Schedule
- Study Day navigation
- task cards
- progress/countdown
- Content Pending
- Calendar month
- Calendar detail
- next-task CTA framework

Exit:
Roadmap days render safely whether content exists or not.

## Phase 4 — Learn

### Grammar
Backend:
- `grammar_viewed`
- viewed writes
- final completion write

Frontend:
- grammar card
- Previous/Next
- viewed progress
- final completion
- next CTA

### Vocabulary
Backend:
- `known_items`
- `learning_sets`
- active-set generation
- Known replacement transaction

Frontend:
- desktop List table
- Known confirmation
- Quiz flashcard
- Shuffle
- completion
- next CTA

No Search.

### Kanji
Reuse relevant data logic.

Frontend:
- List
- Known
- Quiz
- Shuffle
- completion
- next CTA

### Reading
Frontend:
- passage
- Questions
- temporary translation
- reference comparison
- completion
- next CTA

Backend:
- completion only

### Listening
Content:
- YouTube video/playlist metadata

Frontend:
- embedded responsive YouTube
- fallback to YouTube
- navigation
- manual completion
- next CTA

Backend:
- completion only

Exit:
Desktop Learn flow works end-to-end.

## Phase 5 — Shared Test Engine

Backend:
- `test_results`
- latest-result upsert
- completion on Submit
- scoring helpers

Frontend:
- question rendering
- answer selection
- right-side navigator
- answered = blue
- unanswered warning
- submit
- results
- correct/incorrect review
- explanations

Build types in order:
1. Daily Test
2. Weekly Test
3. Monthly Test
4. End Test
5. Mock/Test

Exit:
All desktop test types use one shared engine.

## Phase 6 — Desktop stabilization

Before mobile:
- desktop Chrome QA
- route/error QA
- sidebar collapse QA
- Content Pending QA
- Known replacement QA
- pool exhaustion QA
- Grammar viewed QA
- Reading state QA
- YouTube embed/fallback QA
- test unanswered QA
- test retake QA
- Calendar status QA
- historical migration QA
- next-task CTA QA

Desktop must be smooth before mobile begins.

## Phase 7 — Mobile adaptation

Only after Phase 6.

Adapt:
- navigation
- layouts
- Vocabulary/Kanji tables → cards
- test navigator → sheet/modal
- touch targets
- spacing/typography
- YouTube responsiveness

## Rolling content workflow

Content is an ongoing daily process.

Example:
Tonight:
- prepare tomorrow's learning content
- prepare required test content
- validate
- commit
- deploy

Tomorrow:
- website loads newly published JSON

Repeat.

## Content preparation checklist

For each upcoming Study Day, prepare all roadmap-required items:
- Grammar
- Vocabulary
- Kanji
- Reading
- Listening
- required Daily/Weekly/Monthly/End/Mock test

Daily Test Day X is sourced from Day X-1 knowledge.

## Publish workflow

Prepare JSON
→ Validate
→ Manual spot-check
→ Git commit
→ GitHub push
→ Vercel auto-deploy

No CMS required.

## Content Pending

Missing JSON is expected under the rolling-content model.

Behavior:
- Schedule still knows the roadmap task
- task shows Content Pending
- opening shows a friendly pending page
- no app error
- no false completion

## Content stability

After publication:
- item IDs are immutable
- IDs are never reassigned
- typo/translation/example fixes are allowed
- explanations may be expanded
- avoid deleting referenced IDs
- deprecate instead
- frozen learning sets remain stable despite pool reorder

## Vertical slice

Do not build all 100 days first.

First prove:

Login
→ Setup
→ Schedule Day 1
→ Grammar
→ Vocabulary List/Quiz
→ Kanji List/Quiz
→ Reading
→ Embedded Listening
→ Day 1 complete
→ Calendar Finished
→ Day 2
→ Daily Test based on Day 1

Use realistic Day 1/Day 2 sample content.

## Desktop MVP definition

Desktop MVP is ready when:
- Login works
- Setup works
- Schedule works
- Content Pending works
- Sidebar collapses on every page
- Progress/countdown works
- Grammar works
- Vocabulary works
- Kanji works
- Reading works
- embedded Listening works
- all Test categories are supported
- Calendar works
- next-part CTA works
- historical progress can be migrated
- rolling content can be published safely

Only then begin mobile.

## Next planning artifact

Before assigning tasks to Codex and Antigravity, create:

**Frontend–Backend Contract / Handoff Spec**

It should freeze:
- route map
- exact JSON schemas
- exact SQL schema
- shared TypeScript data shapes
- server actions/mutations
- expected responses
- error/loading/Content Pending states
- ownership boundaries
