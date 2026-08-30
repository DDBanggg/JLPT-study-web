# N3 Study Web — Content Creation Guide

**Status:** Operational guide
**Purpose:** Hướng dẫn chuẩn bị nội dung học theo từng Study Day và chuyển thành JSON dùng cho website.
**Applies to:** Grammar, Grammar Test, Vocabulary, Kanji, Reading, Listening, Daily/Weekly/Monthly/End/Mock Tests.
**Updated:** 2026-08-30

---

# 1. Nguyên tắc chung

Nội dung học của N3 Study Web được chuẩn bị theo mô hình **rolling content / just-in-time**.

Không cần tạo đủ 100 ngày ngay từ đầu.

Ví dụ:

```text
Tối nay:
chuẩn bị nội dung cho ngày mai
↓
validate
↓
commit GitHub
↓
Vercel deploy
↓
ngày mai mở web và học
```

Mỗi Study Day phải được chuẩn bị dựa trên roadmap đã chốt.

---

# 2. Canonical content creation flow

Không tạo một lớp Markdown trung gian cho từng Study Day. Tài liệu nguồn được chuyển trực tiếp thành JSON production:

```text
Tài liệu nguồn
↓
ChatGPT / content preparation
↓
JSON production trực tiếp
↓
validate
↓
commit
↓
deploy
```

Khi tạo content, phải đọc trực tiếp hai canonical docs:

```text
1. docs/guides/CONTENT_CREATION_GUIDE.md
2. docs/specs/N3_Study_Web_JSON_Schema_v1.md
```

Khi phase có Source Manifest riêng, phải đọc thêm manifest đó. Source Manifest bổ sung source responsibility/mapping theo phase; nó không thay thế hai canonical docs trên.

Vai trò:

```text
CONTENT_CREATION_GUIDE.md
→ quy trình tạo content

N3_Study_Web_JSON_Schema_v1.md
→ format kỹ thuật của JSON

docs/specs/N5_SOURCE_MANIFEST.md
→ source responsibility và lesson mapping của phase N5
```

Không tạo hoặc commit `docs/content-context/day-xxx.md`. Không lưu cùng một lesson content dưới cả `.md` và `.json`.

Scratch note tạm thời được phép khi thực sự cần, nhưng:

- không phải source-of-truth;
- không được commit;
- phải xóa sau khi JSON hoàn thành.

## 2.1 Optional Human Review Mode

Canonical workflow vẫn là:

```text
Source
→ JSON production
→ validate
→ review
→ commit
```

Không quay lại bắt buộc Study Context Markdown. Có thể dùng review artifact tạm thời khi:

- ngày đầu của phase mới;
- lần đầu dùng source mới;
- specification/schema vừa thay đổi;
- scan/PDF khó đọc;
- source có diagram/table phức tạp;
- confidence của content extraction thấp;
- user yêu cầu review trước khi tạo JSON.

Flow tùy chọn:

```text
Source
↓
temporary review artifact
↓
human review / approve
↓
production JSON
↓
delete temporary artifact
```

Rules:

- temporary `.md` không phải source-of-truth;
- không commit artifact này trừ khi user quyết định rõ khác đi;
- xóa scratch/review artifact sau khi production JSON được approve;
- production JSON vẫn là committed per-day representation duy nhất.

---

# 3. JSON runtime

Tạo trực tiếp các JSON chính thức từ tài liệu nguồn theo hai canonical docs ở trên và phase-specific Source Manifest khi applicable.

Ví dụ Day 2:

```text
content/
├── grammar/
│   └── day-002.json
├── vocabulary/
│   └── day-002.json
├── kanji/
│   └── day-002.json
├── reading/
│   └── day-002.json
├── listening/
│   └── day-002.json
└── tests/
    ├── grammar/
    │   └── day-002.json
    └── daily/
        └── day-003.json
```

Lưu ý:

```text
Nội dung học Day 2
→ dùng để tạo Daily Test Day 3
```

---

# 4. Checklist mỗi Study Day

Trước khi publish một Study Day, kiểm tra:

```text
[ ] Roadmap task đúng
[ ] Grammar
[ ] Grammar Test — 25 câu, cùng Study Day
[ ] Vocabulary
[ ] Kanji
[ ] Reading
[ ] Listening
[ ] Daily Test ngày kế tiếp
[ ] JSON valid
[ ] ID ổn định
[ ] Nội dung đã review
[ ] validate-content PASS
```

Với một normal Study Day trong Phase N5/N4:

```text
5 lessons / Study Day

Grammar Test cùng ngày
= 5 lessons × 5 câu
= 25 câu

Reading
= 5 items / Study Day
= 1 Reading tương ứng mỗi Lesson

Listening
= 5 items / Study Day
= 1 video tương ứng mỗi Lesson

Daily Test ngày kế tiếp
= 15 Grammar + 15 Vocabulary + 15 Kanji
= 45 câu
```

Ví dụ package chuẩn bị cho Day 2:

```text
content/grammar/day-002.json
content/tests/grammar/day-002.json
content/vocabulary/day-002.json
content/kanji/day-002.json
content/reading/day-002.json
content/listening/day-002.json
content/tests/daily/day-003.json
```

Nếu ngày đó là test-only day thì chỉ cần chuẩn bị đúng các task có trong roadmap.

---

# 5. Grammar

## Mục tiêu

Tất cả Grammar thuộc phạm vi Study Day phải được đưa vào.

Không cần quan tâm nhiều đến lesson trong UI.

Website xem:

```text
Grammar thuộc Day X
```

là chính.

## Format nội dung

Mỗi Grammar structure là một item/card.

Nên có:

```text
Structure
Formation
Meaning VI
Usage VI
Examples
Notes
Source reference (optional)
```

Ví dụ:

```json
{
  "id": 201,
  "structure": "～と思います",
  "formation": [
    "普通形 + と思います"
  ],
  "meaning_vi": "Tôi nghĩ rằng...",
  "usage_vi": "Dùng để diễn đạt suy nghĩ hoặc ý kiến.",
  "examples": [
    {
      "jp": "明日は雨が降ると思います。",
      "reading": "あしたはあめがふるとおもいます。",
      "vi": "Tôi nghĩ ngày mai trời sẽ mưa."
    }
  ],
  "notes_vi": [],
  "source_ref": "Minna no Nihongo I — Lesson 6"
}
```

## Rule

- không bỏ Grammar vì user đã biết;
- một Grammar structure = một card;
- Grammar ID không được đổi sau khi publish.
- `source_ref` là optional nhưng nên có để audit/debug nguồn.

## 5.1 Grammar Test

Grammar Test là resource test riêng, không nằm trong Grammar JSON và không phải Daily Test.

Canonical location và ID:

```text
content/tests/grammar/day-002.json
resource_id = grammar-test-002
type = grammar
```

Trong Phase N5/N4, mỗi Study Day có 5 lessons và Grammar Test phải có:

```text
5 questions / lesson
5 lessons
25 questions total
same-day Grammar only
raw score x / 25
```

JSON sử dụng shared Test Question schema và một section `grammar` với `max_score: 25`. `lesson_groups` phải liên kết đủ 25 question IDs, mỗi question đúng một lần.

Với content mới, mỗi Grammar Test question nên có `source_item_refs` trỏ tới Grammar item của cùng Study Day để chứng minh coverage thực tế.

Không dùng Grammar Test để thay thế Daily Test. Daily Test ngày kế tiếp vẫn kiểm tra Grammar, Vocabulary và Kanji của ngày trước.

---

# 6. Vocabulary

## Mục tiêu

Active target:

```text
50 từ / Study Day
```

Pool tối đa:

```text
100 từ
```

Known item không tính vào 50.

Website sẽ tự lấy reserve item từ cùng pool.

## Thứ tự pool

Thứ tự trong JSON chính là priority.

Ví dụ:

```text
items[0] → quan trọng nhất
items[1]
items[2]
...
```

Không cần field `priority`.

## Mỗi item nên có

```text
ID
Surface
Hiragana
Kanji
Meaning VI
Examples
Notes
Source reference (optional)
```

Ví dụ:

```json
{
  "id": 201,
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
  "source_ref": "Minna no Nihongo I — Lesson 6"
}
```

## Rule

- target = 50;
- pool <= 100;
- ưu tiên từ quan trọng trước;
- không kéo từ Day khác chỉ để đủ quota;
- Known replacement chỉ lấy trong cùng pool.
- `surface` là dạng hiển thị canonical/dạng viết chuẩn cần học;
- `hiragana` là pronunciation/reading bằng hiragana;
- `kanji` chỉ chứa dạng Kanji khi có, không chứa Katakana;
- content mới nên có `surface`; content cũ thiếu field này dùng fallback `kanji ?? hiragana`;
- luôn ưu tiên `surface` để hiển thị và giữ resolution rule `surface ?? kanji ?? hiragana` cho legacy content;
- chỉ hiển thị `hiragana` riêng khi `hiragana !== surface`, tránh dạng lặp như `あげます / あげます`;
- không xóa `hiragana` hoặc `kanji` để giữ backward compatibility;
- `source_ref` là optional.

Ví dụ spelling:

```json
[
  {"surface":"学校","hiragana":"がっこう","kanji":"学校"},
  {"surface":"あげます","hiragana":"あげます","kanji":null},
  {"surface":"スプーン","hiragana":"すぷーん","kanji":null}
]
```

---

# 7. Kanji

## Mục tiêu

Active target:

```text
30 Kanji / Study Day
```

Pool tối đa:

```text
100 Kanji
```

## Mỗi item nên có

```text
ID
Kanji
Hán Việt
Meaning VI
Onyomi
Kunyomi
Compounds
Examples
Notes
Source reference (optional)
```

Ví dụ:

```json
{
  "id": 201,
  "kanji": "学",
  "han_viet": "HỌC",
  "meaning_vi": "học",
  "onyomi": ["ガク"],
  "kunyomi": ["まなぶ"],
  "compounds": [
    {
      "word": "学校",
      "reading": "がっこう",
      "meaning_vi": "trường học"
    }
  ],
  "examples": [],
  "notes_vi": [],
  "source_ref": "Sách Kanji bài học — Tập 1, Lesson 6"
}
```

## Rule

- target = 30;
- pool <= 100;
- thứ tự JSON = priority;
- Known replacement chỉ từ cùng Day.
- item selection phải bám source của Study Day;
- Onyomi/Kunyomi ưu tiên readings được source N5/N4 dạy hoặc xuất hiện trong Vocabulary/compound của phase hiện tại;
- không tự mở rộng toàn bộ dictionary readings nếu source hiện tại không dạy;
- N3 phase sau này có thể bổ sung readings trong context mới, nhưng không được mutate published item theo cách phá stable-content invariants;
- `source_ref` là optional.

---

# 8. Reading

Normal Study Day trong Phase N5/N4 có 5 lessons, vì vậy Reading có:

```text
5 items / Study Day
1 Reading tương ứng mỗi Lesson

Day 2 — Lesson 6–10
→ Reading 6, 7, 8, 9, 10
```

Mỗi Reading item nên có:

```text
ID
Title
Japanese passage
Vietnamese reference translation
Questions
Correct answers
Explanation
Source reference (optional)
```

Nếu bài không có câu hỏi:

```json
{"questions":null}
```

UI vẫn sẽ hiển thị:

```text
Câu hỏi
...
```

Không cần tạo câu hỏi giả chỉ để lấp phần này.

Reading questions hỗ trợ các dạng:

```text
mcq
true_false
short_answer
matching
```

Content mới phải khai báo `question_type`; câu hỏi cũ thiếu field này được hiểu là `mcq`. Field đáp án theo từng type được định nghĩa trong JSON Schema v1.2.

Schema v1.2 đã định nghĩa data shape, nhưng Reading UI hiện chỉ hỗ trợ MCQ legacy. Không publish `true_false`, `short_answer` hoặc `matching` vào runtime đang hoạt động trước khi validator, loader và UI tương ứng được implement và verify.

Không tự chuyển dạng câu hỏi nguồn sang MCQ chỉ để vừa schema. Nếu source có question type chưa được schema hỗ trợ:

```text
stop publication
→ record schema gap
→ update specification first
```

`source_ref` là optional trên từng Reading item.

---

# 9. Listening

Listening sử dụng YouTube embed.

Normal Study Day trong Phase N5/N4 có 5 Listening items, mỗi video tương ứng một Lesson:

```text
Day 2 — Lesson 6–10
→ Listening 6, 7, 8, 9, 10
```

Playlist chỉ là source collection. Không dùng cả playlist làm một Listening item nếu roadmap yêu cầu 5 bài riêng.

Mỗi item nên có:

```text
ID
Title
Description
YouTube video ID hoặc playlist ID
Fallback URL
Source reference (optional)
```

Ví dụ:

```json
{
  "id": 201,
  "title": "Listening 1",
  "description_vi": "Nghe và nắm ý chính.",
  "youtube": {
    "type": "video",
    "video_id": "abc123xyz",
    "playlist_id": null
  },
  "fallback_url": "https://www.youtube.com/watch?v=abc123xyz"
}
```

Ưu tiên video có thể embed trực tiếp.

Nếu video không embed được:
- đổi nguồn nếu có lựa chọn tốt hơn;
- hoặc giữ fallback URL.

`source_ref` là optional trên từng Listening item.

---

# 10. Daily Test

Daily Test Day X lấy kiến thức từ:

```text
Study Day X-1
```

Ví dụ:

```text
Day 2 học Lesson 6–10
↓
Daily Test Day 3
```

Format cố định:

```text
15 Grammar
15 Vocabulary
15 Kanji
= 45 câu
```

Tất cả câu hỏi phải dựa trên kiến thức mới của ngày trước.

Không cần hỏi toàn bộ item.

Ưu tiên:
- Grammar quan trọng;
- Vocabulary quan trọng;
- Kanji quan trọng.

Không dùng Weak Items.

Với content mới, mỗi Test Question nên có `source_item_refs` trỏ tới item Day X-1 theo format canonical trong JSON Schema v1.2. Field này giúp validator tương lai kiểm tra coverage thực tế thay vì chỉ đọc `coverage.from_day/to_day`.

---

# 11. Weekly / Monthly / End / Mock Test

Các bài này dùng shared Test schema.

Sections:

```text
Language Knowledge
Reading
Listening
```

Điểm:

```text
Language  /60
Reading   /60
Listening /60

Total     /180
```

Scoring là linear scoring nội bộ của project, không phải scaled-score chính thức của JLPT.

---

# 12. ID rules

ID là phần cực kỳ quan trọng.

Ví dụ namespace:

```text
Day 1   → 101–200
Day 2   → 201–300
Day 3   → 301–400
...
```

Có thể dùng cùng numeric ID ở type khác nhau:

```text
vocabulary 201
kanji 201
grammar 201
```

Identity thực tế là:

```text
(type, id)
```

## Không được

Sau khi publish:

```text
Vocabulary 201 = 学校
```

không được đổi thành:

```text
Vocabulary 201 = 病院
```

## Được phép

- sửa typo;
- sửa nghĩa;
- sửa example;
- bổ sung explanation;
- bổ sung note.

## 12.1 Source traceability

Mỗi Grammar, Vocabulary, Kanji, Reading và Listening item có thể có:

```json
{"source_ref":"Minna no Nihongo I — Lesson 8"}
```

Đây là chuỗi human-readable để audit/debug; UI không bắt buộc hiển thị.

Shared Test Question có thể có:

```json
{"source_item_refs":["grammar:213"]}
```

Format chính xác:

```text
<content_type>:<positive_integer_item_id>
```

Allowed content types: `grammar`, `vocabulary`, `kanji`, `reading`, `listening`. Nhiều refs được phép và không được trùng. Field optional cho historical content nhưng expected cho Grammar Test/Daily Test mới.

## Nếu bỏ item

Ưu tiên:

```text
deprecated
```

thay vì tái sử dụng ID.

---

# 13. Stable published content

Sau khi content đã được user học:

Không tự ý:

- renumber ID;
- đổi ID hàng loạt;
- thay item thành kiến thức khác;
- regenerate frozen Vocabulary/Kanji learning set;
- xóa item đang được DB tham chiếu.

---

# 14. Content Pending

Rolling content có nghĩa là future content có thể chưa tồn tại.

Đây là trạng thái hợp lệ.

Ví dụ:

```text
Roadmap có Day 20 Grammar
nhưng chưa có:
content/grammar/day-020.json
```

Web phải hiển thị:

```text
Content Pending
Nội dung ngày này chưa được chuẩn bị.
```

Không cần tạo file placeholder với nội dung giả.

---

# 15. Workflow tạo content hằng ngày

Quy trình đề xuất:

```text
1. Xác định Study Day tiếp theo
2. Xác định phạm vi Lesson/topic
3. Đọc tài liệu nguồn
4. Đọc CONTENT_CREATION_GUIDE.md
5. Đọc N3_Study_Web_JSON_Schema_v1.md
6. Với phase N5, đọc docs/specs/N5_SOURCE_MANIFEST.md
7. Tạo trực tiếp Grammar JSON
8. Tạo Grammar Test JSON cùng ngày
9. Tạo Vocabulary JSON
10. Tạo Kanji JSON
11. Tạo Reading JSON
12. Tạo Listening JSON
13. Tạo Daily Test ngày kế tiếp
14. Validate
15. Manual spot-check / Optional Human Review nếu cần
16. Commit
17. Push GitHub
18. Vercel deploy
```

---

# 16. Temporary scratch notes

Không tạo Study Context Markdown trong repository.

Nếu content preparation cần scratch note để xử lý tài liệu nguồn, note đó phải nằm ngoài source-of-truth, không commit và được xóa sau khi JSON đã review.

Khi Optional Human Review Mode được kích hoạt, scratch/review artifact vẫn tuân theo cùng rule: temporary, uncommitted, và phải xóa sau khi production JSON được approve.

---

# 17. File naming

Use three-digit Study Day filenames.

Correct:

```text
day-001.json
day-002.json
day-015.json
day-100.json
```

Avoid:

```text
day1.json
day_1.json
day-1-final.json
new-day1.json
```

# 18. Recommended repository locations

## Actual runtime content

```text
content/
```

Example:

```text
content/grammar/day-002.json
content/tests/grammar/day-002.json
content/vocabulary/day-002.json
content/kanji/day-002.json
content/reading/day-002.json
content/listening/day-002.json
content/tests/daily/day-003.json
```

Do not create `docs/content-context/`. Runtime JSON is the only committed per-day content representation.

## This guide

Recommended:

```text
docs/guides/CONTENT_CREATION_GUIDE.md
```

This file is process documentation, so it should not live inside `content/`.

---

# 19. Validation before publish

Always run:

```bash
npm run validate-content
```

## Schema Validation hiện được implement

`npm run validate-content` hiện kiểm tra:

```text
JSON parse
schema_version = 1
Study Day range khi field tồn tại
roadmap Day/task uniqueness và allowed task type
duplicate item/question ID trong scope validator
Vocabulary/Kanji target, pool_size và pool limit
Grammar Test section/count/category/coverage/lesson_groups
Daily Test 15/15/15 section counts và 45 total
```

Validator hiện tại **chưa** kiểm tra toàn bộ required fields/types, `surface`, `question_type`, type-specific Reading answers, `correct_option_id`, YouTube metadata, `source_ref`, `source_item_refs`, language quality hoặc semantic coverage. Không xem một lần `validate-content PASS` là đủ để khẳng định content quality.

## Specification requirements / future validator requirements

Schema validation cần được mở rộng sau này để kiểm tra:

- required fields và types cho từng resource/question type;
- option uniqueness và `correct_option_id` tồn tại;
- deterministic fields/pairs cho true/false, short answer và matching;
- roadmap/resource/source references;
- YouTube metadata;
- `surface`/Katakana rules và `source_item_refs` format/resolution.

## Content Lint / Semantic Validation

Content Lint là lớp riêng với Schema Validation. Đây là **specification requirement / future validator requirement**; hiện cần manual review:

### Language-field consistency

- Các field hậu tố `_vi` như `explanation_vi`, `meaning_vi`, `usage_vi`, `notes_vi`, `translation_vi`, `description_vi` phải có phần giải thích chính bằng tiếng Việt.
- Japanese được phép trong ví dụ/quote, nhưng explanation chính không được vô tình hoàn toàn bằng tiếng Nhật.

### Answer distribution

- Generated MCQ không được có một answer position hoàn toàn vắng mặt hoặc tạo pattern rõ ràng.
- Soft guideline cho 25 câu: mỗi A/B/C/D khoảng 5–8 lần.
- Soft guideline cho 45 câu: mỗi A/B/C/D khoảng 9–13 lần.
- Source-faithful test được phép lệch khi có lý do; generated test phải chủ động cân bằng.

### Option quality

Review duplicate/empty options, near-identical distractors vô nghĩa, correct answer bị lặp, format làm lộ đáp án, và distractor sai loại ngữ pháp/từ loại.

### Duplicate questions

Không có câu hỏi trùng hoặc gần như trùng trong cùng test trừ khi source có lý do được ghi nhận.

### Coverage

- Grammar Test: đủ 5 questions/lesson và chỉ dùng Grammar của cùng Study Day.
- Daily Test: chỉ dùng knowledge Day X-1, ưu tiên important/new items, không dùng Weak Items.
- Với content mới, dùng `source_item_refs` để audit coverage thực tế.

Do not publish when validation fails.

---

# 20. Git workflow

Typical content commit:

```bash
git add content
git commit -m "content: add study day 2"
git push
```

Daily Test may be included in same commit.

Example:

```text
content: add day 2 lessons and day 3 daily test
```

---

# 21. Definition of Done for one Study Day

A Study Day content package is ready when:

```text
✓ Grammar complete
✓ Grammar Test complete — 25 same-day questions
✓ Vocabulary pool complete
✓ Kanji pool complete
✓ Reading complete
✓ Listening complete
✓ next Daily Test complete
✓ IDs stable
✓ JSON valid
✓ validate-content PASS
✓ manual review complete
✓ committed and pushed
```

---

# 22. Source-of-truth

When creating content, always follow the two canonical docs:

```text
1. docs/guides/CONTENT_CREATION_GUIDE.md
2. docs/specs/N3_Study_Web_JSON_Schema_v1.md
```

for exact runtime JSON structure.

When a phase-specific Source Manifest exists, read it additionally for that phase's source responsibility and mapping. It supplements but does not replace the two canonical docs.

This guide defines the **workflow**.

The JSON Schema defines the **technical data format**.

The guide defines the creation process. JSON Schema specification v1.2 is authoritative for field names and runtime structure; runtime `schema_version` remains `1`.

Canonical flow:

```text
Tài liệu nguồn
↓
đọc CONTENT_CREATION_GUIDE.md
+
đọc N3_Study_Web_JSON_Schema_v1.md
+
đọc phase-specific Source Manifest khi applicable
↓
tạo JSON trực tiếp
```
