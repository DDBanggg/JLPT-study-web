# N3 Study Web — N5 Source Manifest

**Phase:** `n5_review`
**Status:** Source responsibility and confirmed roadmap mapping
**Date:** 2026-08-30

## Purpose

This manifest defines which project-designated N5 sources are responsible for each content type. It supports traceability and prevents content creators from filling quotas with unrelated or future-day material.

The source files are currently maintained in the project's N5 Drive folder. Exact Drive URLs, file IDs, editions, and page ranges are not recorded in the repository, so this manifest does not invent them.

## Source responsibilities

### Grammar

Primary:

- Minna no Nihongo — Tập 1

Supporting:

- Sách bài tập ngữ pháp — Tập 1

Grammar items follow the assigned lesson range. The supporting source may supply exercises or clarification but must not silently expand the Study Day beyond that range.

### Vocabulary

- Select vocabulary and expressions belonging to the assigned lesson range from the designated N5 sources.
- Prioritize important/new items in source order or pedagogical importance.
- Do not pull Vocabulary from a future Study Day merely to reach target or pool quota.
- Preserve original spelling through `surface`, including Katakana; keep `hiragana` as reading and `kanji` only for a Kanji spelling.

### Kanji

Primary:

- Sách Kanji bài học — Tập 1

Supporting:

- Bài tập chữ Hán — Tập 1

Kanji selection and readings follow the assigned source range. Onyomi/Kunyomi prioritize what the N5 source teaches or what appears in current-phase Vocabulary/compounds; do not expand to all dictionary readings.

### Reading

- Source: 25 Bài đọc hiểu sơ cấp — Tập 1.
- During the confirmed N5 review mapping, Reading number maps directly to Lesson number.
- Preserve the source question type. Do not convert it to MCQ solely to fit existing runtime behavior.

### Listening

- Source: the project-designated Listening playlist N5.
- Video number maps directly to Lesson number during the confirmed N5 review mapping.
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

New Grammar Test and Daily Test questions should also use canonical `source_item_refs` from JSON Schema v1.2 so test coverage can be audited against the actual same-day or previous-day items.

## Publication boundaries

- JSON remains the only committed per-day content representation.
- This manifest records source responsibility, not extracted lesson content.
- Published IDs remain immutable.
- Vocabulary target/pool, Kanji target/pool, Grammar Test, and Daily Test counts remain unchanged.
- If a source question type is unsupported, stop publication and update the specification before producing altered JSON.
