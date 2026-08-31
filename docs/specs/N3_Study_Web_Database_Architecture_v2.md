# N3 Study Web — Database & System Architecture

**Status:** Canonical architecture aligned with content specification v1.3
**Updated:** 2026-08-31

Specification v1.3 changes authoring and Kanji learning semantics while runtime
`schema_version` remains `1`. Legacy JSON and persisted legacy Kanji learning-set rows are
retained for compatibility; they are not the source of truth for new Kanji reads.

## Architecture principle

Static Study Content = JSON in Git  
User State / Progress = Supabase PostgreSQL

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router

Hosting:
- GitHub
- Vercel

Auth / DB:
- Supabase Auth
- Supabase PostgreSQL

Raw learning source:
- Google Drive

Production web does not fetch lesson content from Drive at runtime.

## Delivery strategy

Implementation is desktop-first.

Do not spend implementation effort on mobile until:
- desktop routes work
- Schedule works
- Learn works
- Test works
- Calendar works
- desktop end-to-end QA is stable

## Repository concept

n3-study/
- src/app/
- src/components/
- content/
  - roadmap/
  - grammar/
  - vocabulary/
  - kanji/
  - reading/
  - listening/
  - tests/
- src/lib/
- scripts/content-pipeline/
- supabase/
- tests/

## Rolling content pipeline

Google Drive/manual source
→ Extract
→ Clean
→ Normalize
→ Assign stable IDs
→ Generate JSON
→ Validate
→ Manual review
→ Commit Git
→ Vercel deploy

Content is produced progressively, not all 100 days upfront.

Content preparation generates runtime JSON directly. Per-day Study Context Markdown is not committed or treated as source-of-truth.

Missing future content is a normal supported state.

## Missing-content behavior

A roadmap task may exist before its content JSON exists.

The app must distinguish:
- roadmap task exists
- content exists
- user completion exists

If content is missing:
- no crash
- no blank page
- show `Content Pending`
- allow navigation back to Schedule

## JSON owns

- 100-day roadmap
- Grammar
- Grammar Tests
- Vocabulary
- Kanji
- Reading
- Listening YouTube metadata
- Daily Tests
- Weekly Tests
- Monthly Tests
- End Tests
- Mock Tests
- answers/explanations/scoring configuration

DB never duplicates study text.

## Content IDs

Study-Day namespace may be used:
- Day 1: 101–200
- Day 2: 201–300
- ...
- Day 100: 10001–10100

Same numeric ID may exist across item types.

Identity = `(item_type, item_id)`.

Published IDs are immutable.
Deprecated IDs must not be reused for unrelated content.

## Application tables

1. `user_programs`
2. `task_progress`
3. `grammar_viewed`
4. `known_items`
5. `learning_sets`
6. `test_results`

Supabase Auth manages user identity.

## user_programs

Fields:
- id
- user_id
- program_id
- progress_start_date
- exam_date
- created_at

Derived, not stored:
- current_day
- progress_percent
- days_remaining
- projected Day 100 date

MVP supports one active program run.

## task_progress

Fields:
- id
- user_id
- program_id
- study_day
- task_type
- task_id
- completed_at
- completion_source

task_type:
- grammar
- grammar_test
- vocabulary
- kanji
- reading
- listening
- daily_test
- weekly_test
- monthly_test
- end_test
- mock_test

completion_source:
- web
- migration

Unique logical completion:
`(user_id, program_id, study_day, task_type, task_id)`

## grammar_viewed

Required to show Grammar progress like `8 / 12`.

Fields:
- id
- user_id
- program_id
- study_day
- grammar_id
- viewed_at

`Next` writes viewed state.
`Previous` does not undo it.

Final Grammar completion stays in `task_progress`.

## known_items

Fields:
- id
- user_id
- program_id
- item_type
- item_id
- marked_at

item_type:
- vocabulary
- kanji

IDs only; no duplicated content.

## learning_sets

Fields:
- id
- user_id
- program_id
- study_day
- item_type
- item_ids
- created_at
- updated_at

Vocabulary:
- pool up to 100
- active target 50
- JSON order is priority order
- Known removes the active item and promotes the next eligible same-day Reserve item

Kanji:
- source-exhaustive: current source IDs are the complete assigned Kanji set
- no fixed target and no Reserve
- Known removes only the Known ID from the derived active set

First access:
Vocabulary pool
→ remove Known
→ rank in JSON order
→ take first 50 Active and next 50 Reserve
→ freeze the Vocabulary active IDs

Vocabulary Known during session:
insert Known
→ remove active ID
→ append next reserve ID
→ update frozen set

Kanji ensure/read:
current source IDs
→ subtract Known IDs
→ return the derived active IDs

Kanji Known writes only `known_items`; it does not read, update, or regenerate
`learning_sets`, and it does not call the replacement RPC. Never borrow from another Study
Day or future lesson.

Legacy Kanji `learning_sets` rows are not migrated or deleted. The historical SQL table may
still constrain persisted Kanji arrays to 30 items, but that physical constraint is not part
of canonical Kanji learning semantics because the new runtime ignores those rows.

## test_results

Fields:
- id
- user_id
- program_id
- study_day
- test_id
- test_type
- completed_at
- score
- max_score
- language_score
- reading_score
- listening_score
- total_score

test_type:
- grammar
- daily
- weekly
- monthly
- end
- mock

Only latest result is retained per logical test.

Raw-score tests:
- Grammar Test uses `score` and `max_score` with `test_type = grammar`;
- Daily Test uses `score` and `max_score` with `test_type = daily`;
- JLPT-style section score fields are null.

Scaled tests (`weekly`, `monthly`, `end`, `mock`) use section scores and `total_score`; `score` and `max_score` are null.

Submit:
- upsert `test_results`
- write/update corresponding `task_progress`

Partial test state is never persisted.

## Reading state

Persist:
- completion only

Do not persist:
- translation draft
- written answers
- comparison state

## Listening architecture

Listening JSON stores:
- listening ID
- title
- YouTube `video_id` or `playlist_id`
- optional fallback URL

Frontend embeds YouTube responsively.

DB stores completion only.

Playback percentage/end event does not determine completion.

## Calendar derivation

planned_date(day) =
`progress_start_date + (day - 1)`

Finished:
- all required tasks complete
- latest required completion <= end of planned date

Late Finished:
- all required tasks complete
- latest required completion > planned date

Not Finished:
- planned date passed
- required work incomplete

Future:
- neutral/no historical color

No Calendar status table.

## Historical migration

Historical ChatGPT progress may be inserted with:
- actual historical `completed_at`
- `completion_source = migration`

Migration timestamp must not falsely create Late Finished.

## Next-task navigation

Roadmap task order is authoritative.

For a normal N5/N4 Study Day, the roadmap order is Grammar → Grammar Test → Vocabulary. The application derives this sequence rather than hardcoding it.

Concept:
`getNextRequiredTask(studyDay, currentTask)`

Do not hardcode next-task destinations inside individual pages.

## Content folders

Examples:
- `content/grammar/day-015.json`
- `content/vocabulary/day-015.json`
- `content/kanji/day-015.json`
- `content/reading/day-015.json`
- `content/listening/day-015.json`

Tests:
- `content/tests/grammar/`
- `content/tests/daily/`
- `content/tests/weekly/`
- `content/tests/monthly/`
- `content/tests/end/`
- `content/tests/mock/`

All schemas should include `schema_version`.

## Validation

Validate:
- Study Day range
- duplicate IDs
- published ID stability
- Vocabulary pool <= 100 and target = 50
- Kanji required fields and optional-field structure
- Kanji source-exhaustive coverage; no target or pool quota
- Grammar Test = 25 Grammar questions
- Grammar Test = 5 lessons × 5 questions
- Grammar Test section max score = 25
- Daily Test = 45 questions
- Daily Test = 15 Grammar / 15 Vocabulary / 15 Kanji
- answer indices
- roadmap references
- YouTube metadata
- schema versions

Validation failure should block content publication.

## Allowed content edits

Allowed:
- typo fixes
- translation/wording fixes
- example fixes
- additional explanations

Avoid:
- reassigning an existing ID
- deleting referenced IDs
- changing old frozen sets due to pool reorder

## Local UI state

Use React/browser state for:
- sidebar collapsed
- flashcard flip
- shuffle order
- Reading draft
- active test answers
- dialogs

Sidebar collapse may persist in localStorage.

No Redux required for MVP.

## Security

Use Supabase RLS.

General rule:
`auth.uid() = user_id`

Passwords stay inside auth provider.

## Agent ownership

Current intended ownership:
- ChatGPT: specification/context/source-of-truth
- Codex: backend
- Antigravity: frontend

Before parallel implementation, frontend/backend contracts should be frozen.
