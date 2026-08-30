# N3 Study Web — N4 Source Manifest

**Phase:** `n4_review`
**Status:** Source responsibility and confirmed roadmap mapping
**Date:** 2026-08-30

## Purpose

This manifest defines the canonical sources and confirmed lesson mapping for the N4 review phase. It supplements, but does not replace, `docs/guides/CONTENT_CREATION_GUIDE.md` and `docs/specs/N3_Study_Web_JSON_Schema_v1.md`.

## Canonical source locations

- N4 Drive folder: [Project N4 source folder](https://drive.google.com/drive/folders/1UhpW2YbONcuUlTzG_Q33ElFlerchwwm2?hl=vi)
- Shared N5/N4 Listening playlist: [Lessons 1–50 Listening playlist](https://youtube.com/playlist?list=PL41HYkh5h2BaZSWmaXnyZuE_ge-7OmmpP)

The playlist contains Listening 1–50 and is the canonical source collection for both N5 and N4. Do not list individual lesson video URLs in this manifest. Runtime content still uses each lesson's corresponding video as a separate Listening item.

## Source responsibilities

### Grammar

Primary:

- `Sách giáo khoa - Minna no Nihongo - Tập 2.pdf`

Supporting:

- `Sách Bài Tập Ngữ Pháp - Tập 2.pdf`
- `Luyện tập mẫu câu - Tập 2.pdf`

Grammar items follow the assigned lesson range. Supporting sources provide exercises and clarification but must not expand a Study Day beyond its roadmap range.

### Vocabulary

- Source: Minna no Nihongo — Tập 2.
- Select only Vocabulary and expressions belonging to the assigned lesson range.
- Do not pull Vocabulary from future lessons merely to reach target or pool quota.

### Kanji

Primary:

- `Sách Kanji bài học - Tập 2.pdf`

Kanji selection and readings follow the assigned lesson range and the phase-scoped reading rules in the canonical Guide/Schema.

### Reading

- Source: `25 Bài đọc hiểu sơ cấp - Tập 2.pdf`.
- Reading number maps directly to Lesson number.
- Preserve the source question type; do not convert it to MCQ solely to fit existing runtime behavior.

### Listening

- Source: the shared canonical Listening 1–50 playlist linked above.
- Listening number maps directly to Lesson number.
- N4 uses Listening 26–50 for Lesson 26–50.
- The playlist is only a source collection; each Study Day uses five separate lesson videos.

## Shared Listening mapping

```text
Listening 1–25  → Lesson 1–25  → N5 review
Listening 26–50 → Lesson 26–50 → N4 review
```

## Confirmed N4 Study Day mapping

| Study Day | Lesson range | Reading mapping | Listening mapping |
| --- | --- | --- | --- |
| Day 6 | Lesson 26–30 | Reading 26–30 | Listening videos 26–30 |
| Day 7 | Lesson 31–35 | Reading 31–35 | Listening videos 31–35 |
| Day 8 | Lesson 36–40 | Reading 36–40 | Listening videos 36–40 |
| Day 9 | Lesson 41–45 | Reading 41–45 | Listening videos 41–45 |
| Day 10 | Lesson 46–50 | Reading 46–50 | Listening videos 46–50 |

Day 11 is the N4 End Test in the current roadmap and is not another five-lesson content block.

## Traceability conventions

Content items may use human-readable `source_ref` values such as:

```json
{"source_ref":"Minna no Nihongo II — Lesson 31"}
```

```json
{"source_ref":"25 Bài đọc hiểu sơ cấp — Tập 2, Reading 31"}
```

New Grammar Test and Daily Test questions should use canonical `source_item_refs` from JSON Schema v1.2 so coverage can be audited against the actual same-day or previous-day items.

## Publication boundaries

- Runtime JSON remains organized and committed per Study Day.
- This manifest records source responsibility and mapping, not extracted lesson content.
- Published IDs remain immutable.
- Vocabulary/Kanji targets and pools, Grammar Test counts, and Daily Test counts remain unchanged.
- If a source question type is unsupported by the active runtime, stop publication and complete the required specification/runtime work before publishing altered JSON.
