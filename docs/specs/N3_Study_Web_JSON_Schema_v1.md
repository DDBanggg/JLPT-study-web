# N3 Study Web — Canonical Content JSON Schema v1.4

**Status:** Runtime schema v1 frozen; specification v1.4
**Specification version:** 1.4
**Runtime `schema_version`:** 1
**Date:** 2026-09-01

All published study-content files must contain:

```json
{"schema_version":1}
```

Static content uses UTF-8 JSON. Published IDs are immutable.

Specification v1.4 adds structured visual Reading stimuli and text/image question options while retaining the v1.3 authoring and Kanji learning semantics. Runtime `schema_version` remains `1`. Published legacy JSON remains compatible where fallbacks are documented, including passage-based Reading content without `translation_vi`; no runtime schema-version bump is required.

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

Optional `source_ref` is a human-readable traceability string for a content item, for example `"Minna no Nihongo I — Lesson 8"`. It may be present on Grammar, Vocabulary, Kanji, Reading, and Listening items. It is for audit/debugging and is not required to be displayed by the UI.

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

`source_ref` follows the shared optional traceability rule in section 1.

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
      "surface": "学校",
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
      "notes_vi": [],
      "source_ref": "Minna no Nihongo — assigned lesson"
    }
  ]
}
```

Rules:
- `target = 50`.
- `items.length <= 100`.
- `pool_size = items.length`.
- Item order is priority order.
- `surface` is the canonical display spelling and the standard written form being learned.
- `hiragana` is the pronunciation/reading written in hiragana, including for Katakana words.
- `kanji` contains the Kanji spelling only when one exists; otherwise it is `null`.
- Never store Katakana in `kanji`.
- New content should provide `surface`. A legacy item without `surface` remains valid and consumers derive it as `kanji ?? hiragana`.
- Consumers implementing this specification always prefer `surface` and use `surface ?? kanji ?? hiragana` as the legacy-compatible display resolution rule.
- Display `hiragana` separately only when `hiragana !== surface`; do not render duplicate labels such as `あげます / あげます`.
- Runtime/UI support must be updated before relying on `surface` to preserve a Katakana spelling.
- Existing `hiragana` and `kanji` fields remain part of the schema; do not remove them during migration.
- `source_ref` is optional.

Canonical forms:

```json
[
  {"surface":"学校","hiragana":"がっこう","kanji":"学校"},
  {"surface":"あげます","hiragana":"あげます","kanji":null},
  {"surface":"スプーン","hiragana":"すぷーん","kanji":null}
]
```

### Canonical Vocabulary active-selection policy

Vocabulary is source-bounded, priority-ranked, and quota-based:

1. Extract every eligible vocabulary item from the assigned lessons; the assigned source is the hard boundary.
2. Rank eligible items. JSON order is the priority order, and no `priority_score` field is published.
3. Publish up to 100 ranked items. The first 50 are Active and the next 50 are same-day Reserve.
4. If fewer than 50 eligible items exist, publish all eligible items and allow the active count to remain below 50; never supplement externally.
5. When a Known Active item is removed, promote the next eligible same-day Reserve item when one exists. Never borrow from another Study Day, a future lesson, or an invented source.

Rank in this order: core lesson vocabulary; recurrence in assigned-lesson patterns, examples, dialogues, readings/text, and exercises; daily usefulness; current-level relevance; and context reusability. Lower priority may be assigned to proper names, narrow place names, specialized objects, rare cultural terms, and one-off notes/exercise-only words, but lower priority does not remove a canonical source item.

Tie-break in this order: core source item, higher recurrence, daily usefulness, reusability, then original source order. An optional authoring-only heuristic may use `source_core (0–4)`, `lesson_recurrence (0–3)`, `daily_utility (0–3)`, `level_relevance (0–2)`, `context_reusability (0–2)`, and `specialized_penalty (0–2)`. This heuristic is never emitted as `priority_score` in production JSON.

Every assigned lesson containing canonical core vocabulary should have reasonable representation in the published pool; equal per-lesson quotas are not required.

Do not let an external frequency list override the assigned source, import future-lesson or
invented vocabulary, change canonical spelling based on popularity, or arbitrarily drop a
canonical source item.

## 5. Kanji

File: `content/kanji/day-015.json`

```json
{
  "schema_version": 1,
  "id": "kanji-day-015",
  "study_day": 15,
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
      "notes_vi": [],
      "source_ref": "Sách Kanji bài học — assigned lesson"
    }
  ]
}
```

Rules:
- Every Study Day publishes all canonical Kanji taught by its assigned lessons; there is no fixed quota, reserve, or supplementation from another lesson/day.
- `items` is a non-empty array. Item order follows the canonical source order.
- Each item requires `id` (positive integer), `kanji`, `han_viet`, and `meaning_vi` as non-empty strings.
- Optional `onyomi`, `kunyomi`, and `notes_vi` fields are arrays of non-empty strings; empty arrays are allowed.
- Optional `compounds` entries require `word`, `reading`, and `meaning_vi`.
- Optional `examples` entries require `jp`, `reading`, and `vi`.
- Optional `source_ref` is a non-empty traceability string.
- `onyomi` and `kunyomi` prioritize readings taught by the assigned/current N5/N4 source or used by Vocabulary/compounds in the current phase.
- Do not expand an item with all dictionary readings when the assigned source does not teach them.
- A later N3 phase may publish additional readings in its own content context, but must not mutate an already-published item in a way that changes its learned identity or breaks stable-content invariants.

For the learning runtime, Kanji is source-exhaustive: active IDs are the current source IDs minus the user's Known IDs. A Known Kanji is removed only; it is never replaced and no target is restored.

Legacy `target: 30` and `pool_size` fields may remain in historical JSON as tolerated metadata, but have no Kanji runtime semantics and are not required in new JSON.

## 6. Reading

File: `content/reading/day-015.json`

Canonical principles:

- Text stays text.
- Visual stays visual.
- Questions stay structured.
- Translation only translates passage text.

A Reading item has at least one stimulus: a non-empty `passage_jp` or a non-empty
`media` array. Text-only, visual-only, and mixed Reading items are all valid. Do not
invent `passage_jp` for a visual-only source.

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
      "media": [
        {
          "id": "station-map",
          "type": "image",
          "src": "/reading/assets/day-015/station-map.webp",
          "alt": "Sơ đồ nhà ga"
        }
      ],
      "source_ref": "25 Bài đọc hiểu sơ cấp — Reading 15",
      "questions": [
        {
          "id": "q1",
          "question_type": "mcq",
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

Reading item fields:

```text
id
title
passage_jp?: string | null
translation_vi?: string | null
media?: ReadingMedia[]
questions?: ReadingQuestion[] | null
```

`passage_jp`, when non-null, is non-empty structured Japanese text. For newly authored
content, a passage requires an authored non-empty `translation_vi`. Runtime remains
compatible with a legacy passage that lacks `translation_vi`. A non-null
`translation_vi` must be non-empty, requires a non-empty passage, and translates only
that passage; it must not describe images or supply answer/summary notes. Visual-only
Reading uses `translation_vi: null` or omits the field.

### Reading media

`ReadingMedia` is intentionally minimal:

```json
{
  "id": "station-map",
  "type": "image",
  "src": "/reading/assets/day-015/station-map.webp",
  "alt": "Sơ đồ nhà ga"
}
```

- `id` is non-empty and unique within the Reading item.
- `type` is exactly `image`.
- `src` starts with `/reading/assets/` and ends in `.png`, `.jpg`, `.jpeg`, or `.webp`.
- Remote URLs, data URLs, `..`, backslashes, paths outside `/reading/assets/`, and
  width/height/media-subtype fields are invalid.
- `alt` is optional but non-empty when present.
- Files live under `public/reading/assets/`. Runtime validates path format; the CLI
  validator validates path format and verifies the referenced file exists under the
  configured `publicRoot` (repository `public/` by default).

Use explicit `alt` for Reading media when available; otherwise the UI uses the neutral
fallback `Hình minh họa của bài đọc`.

### Reading questions

For newly authored content with no questions, use the canonical empty array:

```json
{"questions":[]}
```

Legacy content may retain:

```json
{"questions":null}
```

UI still renders the Questions section as `...`.

`source_ref` is optional on each Reading item. Question IDs are unique within their Reading item.

Allowed `question_type` values:

```text
mcq
true_false
short_answer
matching
```

New Reading questions must declare `question_type`. For backward compatibility, a legacy question without `question_type` is interpreted as `mcq`.

The Reading runtime, validator, and UI support `mcq`, `true_false`, `short_answer`,
and `matching`. Legacy questions without `question_type` remain MCQ. Preserve the
source question type; do not convert a source question into MCQ for UI convenience.

`ReadingQuestionOption` is shared by MCQ `options` and Matching `left_items` /
`right_items`:

```json
{
  "id": "A",
  "text": "7時",
  "image_src": "/reading/assets/day-015/options/a.png"
}
```

`id` is required. At least one of `text` or `image_src` is required; both are allowed.
When present, `text` is non-empty and `image_src` follows the Reading asset path and
CLI existence rules. Image answer options use neutral alt text that must not reveal
which option is correct.

### MCQ

```json
{
  "id": "q1",
  "question_type": "mcq",
  "question_jp": "質問...",
  "options": [
    {"id":"A","text":"..."},
    {"id":"B","text":"..."}
  ],
  "correct_option_id": "A",
  "explanation_vi": "..."
}
```

`options` is non-empty, option IDs are unique within the question, and
`correct_option_id` matches exactly one option. Options may be text-only, image-only,
or contain both.

### True/False

```json
{
  "id": "q1",
  "question_type": "true_false",
  "question_jp": "田中さんは電車で行きました。",
  "correct_answer": true,
  "explanation_vi": "..."
}
```

`correct_answer` is a JSON boolean. `options` and `correct_option_id` are not used.

### Short answer

```json
{
  "id": "q1",
  "question_type": "short_answer",
  "question_jp": "田中さんは何時に来ましたか。",
  "accepted_answers": ["7時", "七時"],
  "explanation_vi": "..."
}
```

`accepted_answers` is a non-empty array of unique, non-empty strings. Future runtime comparison must normalize Unicode to NFC and trim surrounding whitespace, then match one listed answer exactly; content authors list any accepted spelling variants explicitly.

### Matching

```json
{
  "id": "q1",
  "question_type": "matching",
  "question_jp": "人物と持ち物を組み合わせてください。",
  "left_items": [
    {"id":"L1","image_src":"/reading/assets/day-015/people/tanaka.png"},
    {"id":"L2","text":"山田さん"}
  ],
  "right_items": [
    {"id":"R1","text":"本"},
    {"id":"R2","text":"かばん","image_src":"/reading/assets/day-015/objects/bag.webp"},
    {"id":"R3","text":"傘"}
  ],
  "correct_pairs": [
    {"left_id":"L1","right_id":"R2"},
    {"left_id":"L2","right_id":"R1"}
  ],
  "explanation_vi": "..."
}
```

`left_items` and `right_items` use the same text/image/both option model. They are
non-empty and have unique IDs within their own arrays. Their lengths do not need to be
equal, and unused `right_items` are allowed. `correct_pairs` preserves structured
`left_id`/`right_id` semantics: every `left_item` maps exactly once to a known
`right_item`, and a `right_id` appears in at most one correct pair. Duplicate pairs,
duplicate `left_id` mappings, reused `right_id` mappings, and unknown IDs are invalid.

The Reading UI grades questions through answer state that is independent from
translation reveal state. Revealing a passage translation must not reveal answers, and
visual-only questions remain fully usable without translation controls.

Do not transform a source question into MCQ merely to fit the schema. If a source question type is unsupported, stop publication, record the schema gap, and update this specification before producing JSON.

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
      "fallback_url": "https://www.youtube.com/watch?v=abc123xyz",
      "source_ref": "Listening playlist N5 — Video 15"
    }
  ]
}
```

Playlist uses `type: "playlist"`, `video_id: null`, and a non-null `playlist_id`.

Completion remains manual.

`source_ref` is optional on each Listening item. A playlist may be a source collection, but when the roadmap requires separate lesson items, each item uses its corresponding video rather than treating the whole playlist as one item.

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
  "explanation_vi": "...",
  "source_item_refs": ["grammar:1501"]
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

`source_item_refs` is an optional array of unique canonical content references with exact format:

```text
<content_type>:<item_id>
```

Allowed `content_type` values are `grammar`, `vocabulary`, `kanji`, `reading`, and `listening`. `item_id` is a positive integer. The complete pattern is:

```regex
^(grammar|vocabulary|kanji|reading|listening):[1-9][0-9]*$
```

Examples:

```json
[
  {"source_item_refs":["grammar:213"]},
  {"source_item_refs":["vocabulary:218","kanji:205"]}
]
```

The field is optional for historical content but expected for newly authored Grammar and Daily Test questions. Multiple references are allowed when one question tests multiple source items.

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

For new content, every question should include `source_item_refs` linking it to Grammar items in that same Study Day. Future semantic validation should use these references to verify lesson coverage rather than relying only on `coverage` and `lesson_groups`.

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

For new content, every Daily Test question should include `source_item_refs` that resolve only to Grammar, Vocabulary, or Kanji items from Study Day X-1. Weak Items are not a content source for Daily Test generation.

## 13. JLPT-style specialization

Weekly / Monthly / End / Mock use:

```text
language  → max_score 60
reading   → max_score 60
listening → max_score 60
Total     → 180
```

This is project-defined JLPT-style linear scoring, not official JLPT scaled scoring.

## 14. Validation layers

### Schema validation

Schema validation checks machine-readable structure and referential integrity. The complete specification requirement includes:

- JSON parsing and `schema_version = 1`;
- required fields and field types for each resource/question variant;
- Study Day range, IDs, uniqueness, and references;
- Vocabulary target/pool rules and Kanji structural fields/exhaustive source coverage;
- Grammar/Daily Test question totals and lesson/category grouping;
- option IDs and existence of `correct_option_id` for MCQ;
- Reading passage-or-media stimulus, translation compatibility, media/path rules,
  text/image options, type-specific answer fields, and deterministic Matching pairs;
- roadmap/task metadata and YouTube metadata;
- `source_item_refs` syntax and resolvability when provided.

The current `npm run validate-content` implementation covers JSON parsing, runtime
schema version, Study Day range when present, roadmap day/task uniqueness and task
types, item-ID uniqueness, Vocabulary `surface`/`hiragana`/`kanji` compatibility,
Vocabulary target/pool counts, Kanji required/optional field structure, Reading
stimulus/translation/media/text-image-option rules, all four Reading question variants
and their answer references, Reading asset path format plus file existence under
`publicRoot`, test/question-ID uniqueness, Grammar Test structure/count/grouping/coverage,
and Daily Test section/total counts. Runtime Reading validation checks asset path format;
`npm run validate-content` additionally checks referenced file existence. Other bullets
above remain **specification requirements / future validator requirements** until
implemented in validator code.

### Content lint / semantic validation

Structurally valid JSON may still be poor learning content. Content lint is a separate review layer and is currently a **specification requirement / future validator requirement**:

- Fields ending in `_vi` (`explanation_vi`, `meaning_vi`, `usage_vi`, `notes_vi`, `translation_vi`, `description_vi`) contain primarily Vietnamese explanation. Japanese may appear in examples or quotations, but the main explanation must not accidentally be entirely Japanese.
- Reading `translation_vi` translates passage text only and never describes media.
- Image answer-option alt text is neutral and does not disclose answer semantics.
- Generated MCQ answer positions avoid obvious patterns. As a soft guideline, each A/B/C/D appears about 5–8 times in a 25-question test and about 9–13 times in a 45-question test. Source-faithful tests may deviate when justified.
- Options are non-empty and non-duplicate; the correct answer is not duplicated; distractors are meaningful, format-compatible, and use an appropriate grammatical/lexical class.
- A test contains no duplicate or near-duplicate questions unless the source provides a documented reason.
- Grammar Test contains 5 questions per lesson and tests only same-day Grammar.
- Daily Test uses only Day X-1 knowledge, prioritizes important/new items, and does not use Weak Items.
- New Grammar/Daily questions use valid `source_item_refs` so coverage can be audited against actual source items.

## 15. Rolling publication rule

A roadmap may reference future resources that do not yet exist. This is valid.

Validation must distinguish:
- roadmap structural correctness;
- current publication completeness.

## 16. Publication invariants

After publication:
- resource IDs stay stable;
- item IDs stay stable;
- question IDs should stay stable when only wording changes;
- do not repurpose IDs;
- typo/example/explanation corrections are allowed;
- avoid deleting IDs already referenced by user state.
