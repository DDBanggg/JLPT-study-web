# N3 Study Web — N5 Source Manifest

**Phase:** `n5_review`
**Status:** Source responsibility and confirmed roadmap mapping
**Date:** 2026-08-31

Content selection follows JSON Schema specification v1.3. Runtime `schema_version` remains
`1`; this manifest records source responsibility and lesson boundaries only.

## Purpose

This manifest defines which project-designated N5 sources are responsible for each content type. It supports traceability and prevents content creators from filling quotas with unrelated or future-day material.

The source files are maintained in the project's canonical N5 Drive folder. Exact individual Drive file IDs, editions, and page ranges are not currently recorded in the repository, so this manifest does not invent them.

## Canonical source locations

- N5 Drive folder: [Project N5 source folder](https://drive.google.com/drive/folders/1mXKzTLApB5XjmQ_xvVjS0eDoY2GlVO36?hl=vi)
- Shared N5/N4 Listening playlist: [Lessons 1–50 Listening playlist](https://youtube.com/playlist?list=PL41HYkh5h2BaZSWmaXnyZuE_ge-7OmmpP)

The playlist contains all 50 Listening lessons and is the canonical source collection for both N5 and N4. N5 uses Listening 1–25 for Lesson 1–25; N4 uses Listening 26–50 for Lesson 26–50. Do not list individual lesson video URLs in either phase manifest.

## Source responsibilities

### Grammar

Primary:

- Minna no Nihongo — Tập 1

Supporting:

- Sách bài tập ngữ pháp — Tập 1

Grammar items follow the assigned lesson range. The supporting source may supply exercises or clarification but must not silently expand the Study Day beyond that range.

### Vocabulary

- Select vocabulary and expressions belonging to the assigned lesson range from the designated N5 sources.
- Rank eligible items by the canonical Vocabulary Active Selection Policy: core lesson vocabulary, assigned-lesson recurrence, daily usefulness, current-level relevance, and context reusability.
- JSON order is the priority order. Publish up to 100 items: first 50 Active, next 50 same-day Reserve when available.
- If fewer than 50 eligible items exist, publish all eligible items; never supplement from another Study Day or future lesson.
- Do not pull Vocabulary from a future Study Day merely to reach target or pool quota.
- Preserve original spelling through `surface`, including Katakana; keep `hiragana` as reading and `kanji` only for a Kanji spelling.

### Kanji

Primary:

- Sách Kanji bài học — Tập 1

Supporting:

- Bài tập chữ Hán — Tập 1

Publish every canonical Kanji taught by the assigned lesson range; Kanji is source-exhaustive and has no fixed target or Reserve. Onyomi/Kunyomi prioritize what the N5 source teaches or what appears in current-phase Vocabulary/compounds; do not expand to all dictionary readings.

### Reading

- Source: 25 Bài đọc hiểu sơ cấp — Tập 1.
- During the confirmed N5 review mapping, Reading number maps directly to Lesson number.
- Preserve the source question type. Do not convert it to MCQ solely to fit existing runtime behavior.

### Listening

- Source: the shared canonical Listening 1–50 playlist linked above.
- Video number maps directly to Lesson number during the confirmed N5 review mapping.
- N5 uses only Listening videos 1–25 for Lesson 1–25.
- N4 uses the same playlist's Listening videos 26–50 for Lesson 26–50, as defined in `N4_SOURCE_MANIFEST.md`.
- The playlist is a source collection. A normal Study Day uses five separate lesson videos, not one playlist item.

## Confirmed Study Day mapping

The current repository roadmap confirms only the following `n5_review` allocation:

| Study Day | Lesson range | Reading mapping | Listening mapping |
| --- | --- | --- | --- |
| Day 1 | Lesson 1–5 | Reading 1–5 | Listening videos 1–5 |
| Day 2 | Lesson 6–10 | Reading 6–10 | Listening videos 6–10 |
| Day 3 | Lesson 11–15 | Reading 11–15 | Listening videos 11–15 |
| Day 4 | Lesson 16–20 | Reading 16–20 | Listening videos 16–20 |
| Day 5 | Lesson 21–25 | Reading 21–25 | Listening videos 21–25 |

Do not extend this table beyond Day 5 unless the repository roadmap or an approved source decision establishes the exact mapping.

## Traceability conventions

Content items may record a human-readable `source_ref`, for example:

```json
{"source_ref":"Minna no Nihongo I — Lesson 8"}
```

```json
{"source_ref":"25 Bài đọc hiểu sơ cấp — Reading 8"}
```

New Grammar Test and Daily Test questions should also use canonical `source_item_refs` from JSON Schema v1.3 so test coverage can be audited against the actual same-day or previous-day items.

## Publication boundaries

- JSON remains the only committed per-day content representation.
- This manifest records source responsibility, not extracted lesson content.
- Published IDs remain immutable.
- Vocabulary target/pool semantics remain `target = 50`, pool `<= 100`; Kanji publishes all canonical source items without target/pool semantics.
- If a source question type is unsupported, stop publication and update the specification before producing altered JSON.
