# N3 Study Web — UI/UX Specification

**Status:** Locked desktop-first baseline  
**Updated:** 2026-08-29

## Delivery priority

Build and stabilize **desktop first**.

Mobile begins only after desktop:
- routes work
- Schedule works
- Learn works
- Test works
- Calendar works
- end-to-end behavior is stable

## Global desktop layout

All authenticated pages use:
- top Progress / Exam Countdown
- collapsible left sidebar
- main content

Progress/countdown is not sticky.

Sidebar can be opened/closed on **every page**.

Expanded:
- Schedule
- Calendar
- Learn >
- Test >
- collapse control

Collapsed:
- compact icons
- hover tooltips
- expand control

Collapse preference may persist in localStorage.

## Navigation

Learn:
- Grammar
- Vocabulary
- Kanji
- Reading
- Listening

Test:
- Grammar Test
- Daily Test
- Weekly Test
- Monthly Test
- End Test
- Test / Mock

Learn/Test children appear only when group is expanded.

## Schedule

Schedule is homepage.

Header:
- Previous Day
- Day X / 100
- Next Day
- date
- Today

Task order comes from roadmap.

Schedule is status/navigation, not a free-form checklist.

Task cards:
- fully clickable
- show Pending / In Progress / Finished
- reopenable after completion

Grammar and Grammar Test are separate task cards with separate progress/results. Grammar Test must not be merged into Grammar progress.

Example:

```text
Grammar       12 / 12  Finished
Grammar Test  21 / 25  Finished
```

If content has not been published:
- show `Content Pending`
- safe pending page
- never crash

## Next-part CTA

After completing a module, show a direct CTA to the next required roadmap task.

Examples:
- Grammar → Grammar Test
- Grammar Test → Vocabulary
- Vocabulary → Kanji
- Kanji → Reading
- Reading → Listening
- Listening → next task / Schedule

Destination is roadmap-driven, not hardcoded.

## Grammar

- one grammar structure = one card
- organized by Study Day
- Previous / Next
- Next marks current card viewed
- Previous preserves viewed state
- show `viewed / total`
- final `Hoàn thành Grammar`
- then show `Làm Grammar Test →` when that is the next roadmap task

## Grammar Test

- separate test resource and Schedule task;
- uses the shared Test Engine;
- 25 same-day Grammar questions for the current N5/N4 phase;
- 5 lesson groups with 5 questions per lesson;
- displays raw score `x / 25`;
- after submit/review, show the roadmap-derived CTA, normally `Học Vocabulary tiếp →`.

## Vocabulary

Subpages:
- List
- Quiz

List:
- desktop table
- no Search
- Known only here
- confirmation before Known
- reserve replacement immediately

Quiz:
- front = Kanji + Hiragana
- back = remaining information
- Previous / Next
- ordered by default
- Shuffle available
- no Known action

Completion is inside module.
Then show next-part CTA.

## Kanji

Subpages:
- List
- Quiz

List:
- desktop table
- no Search
- Known only here

Quiz:
- front = Kanji only
- back = Hán Việt, meaning, On/Kun, compounds, examples
- Previous / Next
- ordered by default
- Shuffle
- no Known

Then next-part CTA.

## Reading

Sections:
- Japanese passage
- Questions
- user translation textarea
- Compare
- Vietnamese reference translation
- reference answers

Questions section always appears.
If none, show `...`.

User draft is not persisted.

Completion button inside Reading.
Then next-part CTA.

## Listening

Listening plays **inside the web**.

Layout:
- title/item progress
- responsive embedded YouTube video/playlist
- manual completion
- Previous / Next
- next-part CTA

If embed unavailable:
- fallback `Open on YouTube`

Normal flow should not require leaving the site.

## Test list pages

Test categories:
- Grammar Test
- Daily Test
- Weekly Test
- Monthly Test
- End Test
- Test / Mock

Cards show:
- title
- metadata
- state
- latest result if available
- Start/Open

## Desktop test-taking

Two sections:
- left = test content
- right = question navigator

Navigator:
- unanswered = neutral
- answered = blue
- click number = jump to question
- sticky where practical

Sidebar remains collapsible during tests.

Submit with unanswered questions:
- allowed
- warning shown

After submit:
- correct = green
- incorrect = red
- user's answer
- correct answer
- explanation

Only latest result persists.

## Calendar

Monthly view.

Colors:
- Green = Finished
- Yellow = Late Finished
- Red = Not Finished
- Future = neutral

Day may show:
- calendar date
- Study Day number

Click opens detail:
- Study Day
- task status/progress
- overall status
- Open Study Day

Calendar cannot edit completion.

Controls:
- previous month
- next month
- Today

## Login

Minimal:
- Login ID
- Password
- show/hide password
- Login

No social login required.

## Program Setup

Fields:
- Progress Start Date
- Exam Date

Preview:
- Day 1
- projected Day 100
- exam date

If Day 100 > exam:
- warn
- still allow starting

## Visual style

- Light mode only
- clean
- calm
- readable
- study-focused
- generous white space
- subtle borders/cards
- comfortable Japanese typography
- minimal animation

No:
- dashboard clutter
- anime theme
- excessive gradients
- gamification
- Search in Vocabulary/Kanji lists

## Mobile

Mobile UX is intentionally deferred.

After desktop is stable, adapt:
- sidebar → mobile navigation
- wide tables → cards
- desktop test navigator → sheet/modal
- spacing/touch targets
- embedded YouTube responsiveness

Desktop is authoritative until then.
