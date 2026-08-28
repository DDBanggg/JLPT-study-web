# N3 Study Web — Product Context & Learning Logic

**Status:** Locked baseline before implementation  
**Updated:** 2026-08-29

## Product goal

Build a personal JLPT N3 study web app around a fixed **100 Study Day** roadmap.

Roadmap:
- Rapid N5/N4 review
- Learn N3 during September and October
- Mock/practice sprint in November
- Take JLPT N3 in December
- Target stable mock score: **110+**

## Program model

- 1 Study Day = 1 calendar day after `progress_start_date`.
- Day X = `start_date + (X - 1)`.
- Missing a day does not shift later Study Days.
- Old unfinished days remain available later.
- Progress = completed Study Days / 100.
- Countdown = exam date - current date.

## Calendar

Statuses:
- **Finished** — all required tasks completed on/before planned date
- **Not Finished** — planned date passed and required work remains
- **Late Finished** — incomplete on planned date, then completed later

Colors:
- Finished = green
- Late Finished = yellow
- Not Finished = red

Statuses are derived from task completion timestamps, not manually stored.

## N5/N4 review schedule

- 27/08: N5 Lesson 1–5
- 28/08: N5 Lesson 6–10
- 29/08: N5 Lesson 11–15
- 30/08: N5 Lesson 16–20
- 31/08: N5 Lesson 21–25
- 01/09: N4 Lesson 26–30
- 02/09: N4 Lesson 31–35
- 03/09: N4 Lesson 36–40
- 04/09: N4 Lesson 41–45
- 05/09: N4 Lesson 46–50
- 06/09: N4 End Test + correction

Each learning day covers:
- Grammar
- Grammar Test
- Vocabulary
- Kanji
- Reading
- Listening

Targets:
- Vocabulary: 50 active items
- Kanji: 30 active items

Known Vocabulary/Kanji do not count toward target and are replaced only from the same day's reserve pool.

## N3 learning rhythm

September + October:
- 6 learning days + 1 Weekly Test day
- Weekly Test day includes Daily Test + Weekly Test
- No new learning content on Weekly Test day
- End September: Monthly Test
- End October: Monthly Test
- First Monday of November: full N3 test, then enter mock/practice sprint

Exact N3 sources, detailed topic mapping, reading allocation, listening playlist mapping, and November mock cadence are deferred.

## Daily Test

- 45 questions
- 15 Grammar
- 15 Vocabulary
- 15 Kanji
- 100% based on previous Study Day's new knowledge
- representative sampling allowed
- no Weak Items system

## Grammar Test

- separate same-day test resource after Grammar;
- 25 Grammar questions total;
- 5 lessons per Study Day in the current N5/N4 phase;
- 5 questions per lesson;
- covers only Grammar learned in the same Study Day;
- uses raw score `x / 25`;
- does not replace or alter the next day's Daily Test.

## Normal learning flow

Daily Test
→ Grammar
→ Grammar Test
→ Vocabulary
→ Kanji
→ Reading
→ Listening
→ next required roadmap task / Schedule

After completing any part, the user can click directly to the next required part.

The next task comes from roadmap JSON, not hardcoded page logic.

## Grammar

- Organized by Study Day.
- One grammar structure = one card.
- `Next` marks current card viewed.
- `Previous` does not remove viewed state.
- Final explicit `Hoàn thành Grammar`.
- Next required roadmap task is normally the same-day Grammar Test during the N5/N4 phase.

## Vocabulary

Two subpages:
- List
- Quiz

List:
- desktop table
- `Known` only on List
- Known item replaced with next eligible reserve item from same pool

Quiz:
- front = Kanji + Hiragana
- back = remaining content
- ordered by default
- Shuffle available
- no Known action

## Kanji

Two subpages:
- List
- Quiz

List:
- desktop table
- `Known` only on List

Quiz:
- front = Kanji only
- back = Hán Việt, meaning, On/Kun, compounds, examples
- ordered by default
- Shuffle available

## Reading

- Japanese passage
- Questions section always displayed
- if no questions, show `...`; JSON may use null
- temporary user translation textarea
- compare with Vietnamese reference translation
- no AI grading
- user draft/answers not persisted
- DB stores completion only

## Listening

Listening is played **inside the web** through embedded YouTube.

- responsive 16:9 player
- support video or playlist metadata
- manual completion remains authoritative
- fallback action opens YouTube only when embed is unavailable

## Tests

Test categories:
- Grammar Test
- Daily Test
- Weekly Test
- Monthly Test
- End Test
- Test / Mock practice

Desktop test layout:
- left = full test content
- right = question navigator
- answered question = blue
- click number to jump to question
- submit allowed with unanswered questions after warning
- after submit: correct = green, incorrect = red
- explanations shown
- only latest submitted result retained

## Authentication and setup

Login:
- Login ID
- Password

Program Setup:
- Progress Start Date
- Exam Date
- projected Day 100 shown
- if Day 100 is after exam date, warn but allow continuation

No full-program reset is required for MVP.

## Content ownership

Static study content = JSON in Git.

Database = user state only.

Google Drive = raw/source material during preparation, not runtime content.

## Rolling content model

Content is prepared **progressively / just-in-time**.

Example:
- tomorrow the user studies the next lesson range
- tonight, content for that upcoming Study Day is prepared, validated, committed, and deployed

Each content preparation cycle includes both:
- learning content
- required test content

Grammar Test Day X is prepared from same-day Grammar and contains 5 questions for each of the 5 lessons in the current N5/N4 phase.

Daily Test Day X is prepared from Day X-1 knowledge.

If required content is not yet published:
- web must not crash
- show `Content Pending`
- show “Nội dung ngày này chưa được chuẩn bị”
- allow return to Schedule

## Content publication rules

After publication:
- content IDs are immutable
- IDs must never be reassigned to different knowledge
- typo/translation/example fixes are allowed
- explanations may be expanded
- avoid deleting referenced IDs; deprecate instead
- pool reorder must not alter frozen historical learning sets

Publishing workflow:

Prepare JSON
→ Validate
→ Commit GitHub
→ Vercel auto-deploy
→ Content becomes available

No CMS/admin panel required.

## Delivery priority

**Desktop-first.**

Order:
1. Complete desktop implementation
2. Stabilize all desktop flows
3. Desktop QA
4. Only then adapt/implement mobile

Mobile is intentionally deferred until desktop runs smoothly.

## Out of scope for MVP

- AI chatbot inside app
- AI grading
- Weak Items
- adaptive recommendations
- offline-first/PWA complexity
- native app
- realtime WebSocket sync
- gamification
- separate KPI dashboard
- dark mode
- CMS
- multi-run program reset

## Current agent operating model

- **ChatGPT** — context, specifications, source-of-truth documents, cross-agent consistency
- **Codex** — backend implementation
- **Antigravity** — frontend implementation

Detailed task allocation and handoff rules will be decided separately.
