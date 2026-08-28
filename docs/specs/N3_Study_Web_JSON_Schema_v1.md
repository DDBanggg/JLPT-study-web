# N3 Study Web — Canonical Content JSON Schema v1.1

**Status:** Frozen for first desktop implementation  
**Specification version:** 1.1
**Runtime `schema_version`:** 1
**Date:** 2026-08-29

All published study-content files must contain:

```json
"schema_version": 1
```

Static content uses UTF-8 JSON. Published IDs are immutable.

## 1. Shared ID rules

Study content item IDs are integers. Suggested Day namespaces:

```text
Day 1   → 101–200
Day 2   → 201–300
...
Day 100 → 10001–10100
```

The same integer may exist across content types. Identity is `(item_type, item_id)`.

Shared example object:

```json
{"jp":"学校へ行きます。","reading":"がっこうへいきます。","vi":"Tôi đi đến trường."}
```

## 2. Roadmap

File: `content/roadmap/program.json`

```json
{
  "schema_version": 1,
  "program_id": "jlpt_n3_100_days_v1",
  "title": "100 ngày học để đỗ JLPT N3",
  "total_days": 100,
  "days": [
    {
      "day": 1,
      "phase": "n5_review",
      "title": "N5 Review — Lesson 1–5",
      "tasks": [
        {
          "task_id": "grammar_day_1",
          "type": "grammar",
          "label": "Grammar",
          "required": true,
          "order": 1,
          "resource_id": "grammar-day-001"
        },
        {
          "task_id": "grammar-test-001",
          "type": "grammar_test",
          "label": "Grammar Test",
          "required": true,
          "order": 2,
          "resource_id": "grammar-test-001"
        }
      ]
    }
  ]
}
```

Allowed `phase`:

```text
n5_review
n4_review
n3_learning
n3_mock
```

Allowed task `type`:

```text
grammar
grammar_test
vocabulary
kanji
reading
listening
daily_test
weekly_test
monthly_test
end_test
mock_test
```

Rules:
- Days 1–100 exist exactly once.
- `order` is unique within a day.
- Task order is authoritative for Next Task.
- A referenced `resource_id` may be unpublished yet; that is valid Content Pending.

## 3. Grammar

File: `content/grammar/day-015.json`

```json
{
  "schema_version": 1,
  "id": "grammar-day-015",
  "study_day": 15,
  "items": [
    {
      "id": 1501,
      "structure": "～ようと思います",
      "formation": ["V意向形 + と思います"],
      "meaning_vi": "Dự định / nghĩ rằng sẽ...",
      "usage_vi": "Dùng khi nói về ý định của người nói.",
      "examples": [
        {
          "jp": "日本へ行こうと思います。",
          "reading": "にほんへいこうとおもいます。",
          "vi": "Tôi định đi Nhật."
        }
      ],
      "notes_vi": ["..."],
      "source_ref": "optional source reference"
    }
  ]
}
```

`source_ref` is optional and not required by UI.

## 4. Vocabulary

File: `content/vocabulary/day-015.json`

```json
{
  "schema_version": 1,
  "id": "vocabulary-day-015",
  "study_day": 15,
  "target": 50,
  "pool_size": 100,
  "items": [
    {
      "id": 1501,
      "hiragana": "がっこう",
      "kanji": "学校",
      "meaning_vi": "trường học",
      "examples": [
        {
          "jp": "学校へ行きます。",
          "reading": "がっこうへいきます。",
          "vi": "Tôi đi đến trường."
        }
      ],
      "notes_vi": []
    }
  ]
}
```

Rules:
- `target = 50`.
- `items.length <= 100`.
- `pool_size = items.length`.
- Item order is priority order.
- `kanji` may be null for kana-only words.

## 5. Kanji

File: `content/kanji/day-015.json`

```json
{
  "schema_version": 1,
  "id": "kanji-day-015",
  "study_day": 15,
  "target": 30,
  "pool_size": 100,
  "items": [
    {
      "id": 1501,
      "kanji": "学",
      "han_viet": "HỌC",
      "meaning_vi": "học",
      "onyomi": ["ガク"],
      "kunyomi": ["まなぶ"],
      "compounds": [
        {"word":"学校","reading":"がっこう","meaning_vi":"trường học"}
      ],
      "examples": [
        {
          "jp": "学校で日本語を勉強します。",
          "reading": "がっこうでにほんごをべんきょうします。",
          "vi": "Tôi học tiếng Nhật ở trường."
        }
      ],
      "notes_vi": []
    }
  ]
}
```

Rules:
- `target = 30`.
- `items.length <= 100`.
- `pool_size = items.length`.
- Item order is priority order.

## 6. Reading

File: `content/reading/day-015.json`

```json
{
  "schema_version": 1,
  "id": "reading-day-015",
  "study_day": 15,
  "items": [
    {
      "id": 1501,
      "title": "Reading 1",
      "passage_jp": "日本語の文章...",
      "translation_vi": "Bản dịch tham khảo...",
      "questions": [
        {
          "id": "q1",
          "question_jp": "質問...",
          "options": [
            {"id":"A","text":"..."},
            {"id":"B","text":"..."}
          ],
          "correct_option_id": "A",
          "explanation_vi": "..."
        }
      ]
    }
  ]
}
```

If no questions:

```json
"questions": null
```

UI still renders the Questions section as `...`.

## 7. Listening

File: `content/listening/day-015.json`

Video:

```json
{
  "schema_version": 1,
  "id": "listening-day-015",
  "study_day": 15,
  "items": [
    {
      "id": 1501,
      "title": "Listening 1",
      "description_vi": "Nghe và nắm ý chính.",
      "youtube": {
        "type": "video",
        "video_id": "abc123xyz",
        "playlist_id": null
      },
      "fallback_url": "https://www.youtube.com/watch?v=abc123xyz"
    }
  ]
}
```

Playlist uses `type: "playlist"`, `video_id: null`, and a non-null `playlist_id`.

Completion remains manual.

## 8. Shared Test structure

Directories:

```text
content/tests/grammar/
content/tests/daily/
content/tests/weekly/
content/tests/monthly/
content/tests/end/
content/tests/mock/
```

Canonical JLPT-style test:

```json
{
  "schema_version": 1,
  "id": "weekly-01",
  "type": "weekly",
  "title": "Weekly Test 1",
  "study_day": 7,
  "coverage": {"from_day":1,"to_day":6},
  "stimuli": [],
  "sections": [
    {"id":"language","title":"Language Knowledge","max_score":60,"questions":[]},
    {"id":"reading","title":"Reading","max_score":60,"questions":[]},
    {"id":"listening","title":"Listening","max_score":60,"questions":[]}
  ]
}
```

Allowed test types:

```text
grammar
daily
weekly
monthly
end
mock
```

## 9. Test stimuli

Reading stimulus:

```json
{"id":"reading-01","type":"reading","title":"Passage 1","content_jp":"..."}
```

Listening stimulus:

```json
{
  "id":"listening-01",
  "type":"youtube",
  "title":"Listening 1",
  "youtube":{"type":"video","video_id":"abc123","playlist_id":null},
  "fallback_url":"https://www.youtube.com/watch?v=abc123"
}
```

## 10. Test question

```json
{
  "id": "q001",
  "category": "grammar",
  "prompt": "学校へ＿＿＿。",
  "stimulus_id": null,
  "options": [
    {"id":"A","text":"行きます"},
    {"id":"B","text":"行く"},
    {"id":"C","text":"行った"},
    {"id":"D","text":"行き"}
  ],
  "correct_option_id": "A",
  "explanation_vi": "..."
}
```

Allowed category:

```text
grammar
vocabulary
kanji
reading
listening
```

Question IDs are unique within the whole test. `correct_option_id` must match an option.

## 11. Grammar Test specialization

File: `content/tests/grammar/day-002.json`

Grammar Test is a separate same-day resource. It uses the shared Test Engine and checks only Grammar learned in that Study Day.

```json
{
  "schema_version": 1,
  "id": "grammar-test-002",
  "type": "grammar",
  "title": "Grammar Test — Day 2",
  "study_day": 2,
  "coverage": {"from_day":2,"to_day":2},
  "lesson_groups": [
    {"lesson":6,"question_ids":["q001","q002","q003","q004","q005"]},
    {"lesson":7,"question_ids":["q006","q007","q008","q009","q010"]},
    {"lesson":8,"question_ids":["q011","q012","q013","q014","q015"]},
    {"lesson":9,"question_ids":["q016","q017","q018","q019","q020"]},
    {"lesson":10,"question_ids":["q021","q022","q023","q024","q025"]}
  ],
  "stimuli": [],
  "sections": [
    {"id":"grammar","title":"Grammar","max_score":25,"questions":[]}
  ]
}
```

Validation must enforce exactly:
- 5 lesson groups for the current N5/N4 phase;
- 5 questions per lesson group;
- 25 unique questions total;
- every question uses `category: "grammar"`;
- every question is referenced exactly once by `lesson_groups`;
- the Grammar section uses `max_score: 25`;
- `coverage.from_day`, `coverage.to_day`, and `study_day` identify the same Study Day.

Do not infer a replacement grouping rule if a later phase does not use exactly 5 lessons per Study Day. Update the specification first.

Grammar Test uses raw scoring `x / 25`; it is not scaled to `/60`.

In a published Grammar Test file, the `grammar` section's `questions` array contains all 25 shared Test Question objects; the empty array above abbreviates the structural example only.

## 12. Daily Test specialization

```json
{
  "schema_version": 1,
  "id": "daily-015",
  "type": "daily",
  "title": "Daily Test — Day 15",
  "study_day": 15,
  "coverage": {"from_day":14,"to_day":14},
  "stimuli": [],
  "sections": [
    {"id":"grammar","title":"Grammar","max_score":15,"questions":[]},
    {"id":"vocabulary","title":"Vocabulary","max_score":15,"questions":[]},
    {"id":"kanji","title":"Kanji","max_score":15,"questions":[]}
  ]
}
```

Validation must enforce exactly:
- 15 Grammar
- 15 Vocabulary
- 15 Kanji
- 45 total

Daily Test Day X covers Day X-1.

## 13. JLPT-style specialization

Weekly / Monthly / End / Mock use:

```text
language  → max_score 60
reading   → max_score 60
listening → max_score 60
Total     → 180
```

This is project-defined JLPT-style linear scoring, not official JLPT scaled scoring.

## 14. Rolling publication rule

A roadmap may reference future resources that do not yet exist. This is valid.

Validation must distinguish:
- roadmap structural correctness;
- current publication completeness.

## 15. Publication invariants

After publication:
- resource IDs stay stable;
- item IDs stay stable;
- question IDs should stay stable when only wording changes;
- do not repurpose IDs;
- typo/example/explanation corrections are allowed;
- avoid deleting IDs already referenced by user state.
