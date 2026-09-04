# N3 Study Web — Content Creation Guide

**Status:** Operational guide
**Purpose:** Hướng dẫn chuẩn bị nội dung học theo từng Study Day và chuyển thành JSON dùng cho website.
**Applies to:** Grammar, Grammar Test, Vocabulary, Kanji, Reading, Listening, Daily/Weekly/Monthly/End/Mock Tests.
**Updated:** 2026-09-01

The canonical content specification is v1.4. It adds structured visual Reading stimuli
and text/image question options while preserving the v1.3 authoring and Kanji learning
semantics. Runtime `schema_version` remains `1`; legacy JSON compatibility remains
supported where the schema documents it.

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
extract canonical lesson material
↓
apply type-specific selection policy
↓
JSON production trực tiếp
↓
validate
↓
review
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

docs/specs/N4_SOURCE_MANIFEST.md
→ source responsibility và lesson mapping của phase N4
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
= 45 câu

Nếu ngày được kiểm tra có đủ Grammar + Vocabulary + Kanji:
= 15 Grammar + 15 Vocabulary + 15 Kanji

Nếu ngày được kiểm tra không có Kanji:
= 20 Grammar + 25 Vocabulary, bỏ hẳn Kanji section
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

Không dùng Grammar Test để thay thế Daily Test. Daily Test ngày kế tiếp kiểm tra Grammar, Vocabulary và, khi source day có, Kanji của ngày trước.

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

Website giữ `learning_sets` đã đóng băng làm nguồn Active và tự lấy Reserve item cùng
pool khi một Active item được đánh dấu Known.

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
- thứ tự JSON là thứ tự ưu tiên;
- Known replacement chỉ lấy trong cùng Study Day và cùng pool;
- không kéo từ Day khác, lesson tương lai hoặc nguồn bên ngoài chỉ để đủ quota;
- nếu số item eligible < 50 thì publish toàn bộ eligible items và active count có thể thấp hơn 50;
- nếu số item eligible > 100 thì publish top 100 theo thứ tự ưu tiên, gồm 50 Active và 50 Reserve.
- `surface` là dạng hiển thị canonical/dạng viết chuẩn cần học;
- `hiragana` là pronunciation/reading bằng hiragana;
- `kanji` chỉ chứa dạng Kanji khi có, không chứa Katakana;
- content mới nên có `surface`; content cũ thiếu field này dùng fallback `kanji ?? hiragana`;
- luôn ưu tiên `surface` để hiển thị và giữ resolution rule `surface ?? kanji ?? hiragana` cho legacy content;
- chỉ hiển thị `hiragana` riêng khi `hiragana !== surface`, tránh dạng lặp như `あげます / あげます`;
- không xóa `hiragana` hoặc `kanji` để giữ backward compatibility;
- `source_ref` là optional.

### Canonical Active Selection Policy

1. Trích xuất toàn bộ Vocabulary eligible từ các lesson được assign; assigned source là hard boundary.
2. Xếp hạng theo mức độ quan trọng. Thứ tự trong JSON chính là priority order; không xuất bản `priority_score`.
3. Ưu tiên theo thứ tự: core lesson vocabulary; mức lặp lại trong pattern sentences, examples, dialogues, readings/text và exercises; daily usefulness; current-level relevance; context reusability.
4. Proper names, narrow place names, specialized objects, rare cultural terms và one-off notes/exercise-only words có thể thấp priority hơn, nhưng không được tự ý loại khỏi source; nếu còn capacity thì giữ trong Reserve.
5. Tie-break: core source item, recurrence cao hơn, daily usefulness, reusability, rồi original source order.
6. Mọi assigned lesson có canonical core vocabulary phải có representation hợp lý trong published pool; không ép equal quota cho từng lesson.

Không dùng external frequency list để override assigned source, không lấy Vocabulary của
lesson tương lai, không invent item, không đổi canonical spelling theo độ phổ biến và không
tự ý loại canonical source item.

Có thể dùng heuristic authoring-only (`source_core 0–4`, `lesson_recurrence 0–3`,
`daily_utility 0–3`, `level_relevance 0–2`, `context_reusability 0–2`,
`specialized_penalty 0–2`), nhưng `priority_score` không bao giờ được xuất hiện trong
production JSON.

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

Kanji is source-exhaustive for each Study Day:

```text
assigned lessons → inspect canonical Kanji source → publish every canonical Kanji taught
```

Examples:

```text
source has 27 → publish 27
source has 33 → publish 33
source has 36 → publish 36
```

Không có fixed target, reserve hoặc supplementation để đưa số lượng về 30. Không kéo
Kanji của lesson tương lai. Known chỉ remove khỏi active list.

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

- `items` là non-empty array chứa toàn bộ canonical Kanji của assigned lessons;
- mỗi item bắt buộc có `id` là positive integer, `kanji`, `han_viet`, `meaning_vi` là non-empty strings;
- `onyomi`, `kunyomi`, `notes_vi` nếu có phải là arrays của non-empty strings; empty arrays được phép;
- `compounds` nếu có phải gồm `word`, `reading`, `meaning_vi`; `examples` nếu có phải gồm `jp`, `reading`, `vi`;
- `source_ref` nếu có phải là non-empty string;
- item order giữ theo canonical source order;
- item selection phải bám source của Study Day và publish tất cả canonical Kanji được dạy;
- Onyomi/Kunyomi ưu tiên readings được source N5/N4 dạy hoặc xuất hiện trong Vocabulary/compound của phase hiện tại;
- không tự mở rộng toàn bộ dictionary readings nếu source hiện tại không dạy;
- N3 phase sau này có thể bổ sung readings trong context mới, nhưng không được mutate published item theo cách phá stable-content invariants;
- `source_ref` là optional.

Legacy JSON có thể còn `target: 30` hoặc `pool_size`; validator/runtime mới tolerate các
field metadata này nhưng không gán cho chúng Kanji runtime semantics. Tuyệt đối không
tạo Kanji reserve trong content mới.

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
Stimulus: Japanese passage OR visual media
Vietnamese reference translation when a passage exists
Questions
Correct answers
Explanation
Source reference (optional)
```

Nguyên tắc canonical:

```text
Text stays text.
Visual stays visual.
Questions stay structured.
Translation only translates passage text.
```

Reading hợp lệ ở cả ba mode:

```text
text-only   = passage_jp
visual-only = media[]
mixed       = passage_jp + media[]
```

Visual-only không được bịa `passage_jp`. Với content mới, nếu có `passage_jp` thì phải
author `translation_vi` không rỗng. Runtime vẫn chấp nhận passage legacy thiếu
`translation_vi`. `translation_vi` chỉ dịch passage; không dùng field này để mô tả ảnh,
tóm tắt bài, giải thích đáp án hoặc chứa notes.

### Quyết định text hay visual

Chuyển source thành structured text khi nội dung là:

- câu, đoạn văn hoặc hội thoại;
- notice thông thường chủ yếu là chữ;
- câu hỏi;
- textual answer option.

Giữ dưới dạng visual khi ý nghĩa phụ thuộc vào bố cục/hình ảnh:

- map, graph/chart, complex table hoặc timetable;
- floor plan, form hoặc diagram;
- illustration;
- picture option;
- visual advertisement.

Không dùng image chỉ vì OCR khó. Nếu source về bản chất là text, author lại thành text
chính xác và review với source. Không đưa description của image vào `translation_vi`.

### Reading media

Reading image được đặt dưới `public/reading/assets/` và tham chiếu bằng URL bắt đầu với
`/reading/assets/`:

```json
{
  "id": "station-map",
  "type": "image",
  "src": "/reading/assets/day-015/station-map.webp",
  "alt": "Sơ đồ nhà ga"
}
```

- media ID không rỗng và unique trong item;
- `type` luôn là `image`;
- extension chỉ `.png`, `.jpg`, `.jpeg`, `.webp`;
- không dùng remote URL, data URL, `..`, backslash, path ngoài `/reading/assets/`,
  width/height hoặc media subtype;
- `alt` optional nhưng không rỗng khi có;
- runtime kiểm tra path format; CLI kiểm tra path format và file tồn tại dưới
  `publicRoot` (mặc định là repo `public/`).

Alt của Reading media mô tả trung tính. Alt của image answer option tuyệt đối không được
làm lộ đáp án đúng.

### Questions

Nếu bài mới không có câu hỏi, dùng canonical empty array:

```json
{"questions":[]}
```

Legacy JSON có thể giữ:

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

Content mới phải khai báo `question_type`; câu hỏi cũ thiếu field này được hiểu là `mcq`. Field đáp án theo từng type được định nghĩa trong JSON Schema v1.4.

Reading runtime, validator và UI hỗ trợ đầy đủ `mcq`, `true_false`, `short_answer`
và `matching`. Câu hỏi legacy thiếu `question_type` vẫn được hiểu là `mcq`. Giữ
nguyên question type của source; không tự chuyển source question thành MCQ.

MCQ `options` và Matching `left_items` / `right_items` dùng cùng model:

```json
{
  "id": "A",
  "text": "7時",
  "image_src": "/reading/assets/day-015/options/a.png"
}
```

`id` là required. Phải có ít nhất `text` hoặc `image_src`; có thể có cả hai. `text` nếu
có phải non-empty. `image_src` theo cùng Reading asset rules và file phải tồn tại khi
chạy CLI validator.

Matching giữ structured `left_id` / `right_id` trong `correct_pairs`. Không biến image
Matching thành text giả hoặc MCQ. Mỗi left item được map đúng một lần và một right item
không được dùng cho hai left item.

Frontend kiểm tra đáp án độc lập với việc reveal bản dịch. Visual-only vẫn làm và kiểm
tra câu hỏi bình thường dù không có translation textarea/reference UI.

Không bắt buộc author các field không thuộc schema Reading v1.4:

```text
question_vi
option_vi
answer_vi
summary_vi
grammar_notes
vocabulary_notes
```

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

Format N5/N4 luôn có 45 câu. Phân bổ phụ thuộc vào source của Study Day X-1:

```text
Covered day có Kanji:
15 Grammar + 15 Vocabulary + 15 Kanji = 45 câu

Covered day không có Kanji:
20 Grammar + 25 Vocabulary = 45 câu
Kanji section omitted
```

Tất cả câu hỏi phải dựa trên kiến thức mới của ngày trước.

Không cần hỏi toàn bộ item.

Ưu tiên:
- Grammar quan trọng;
- Vocabulary quan trọng;
- Kanji quan trọng.

Không dùng Weak Items.

Với content mới, mỗi Test Question phải có `source_item_refs` trỏ tới item đúng category của Day X-1 theo format canonical trong JSON Schema v1.4. Validator kiểm tra cả cú pháp, khả năng resolve và covered Study Day.

Daily Test question có thể không có `explanation_vi`; không thêm placeholder `explanation_vi`, `translation_vi`, `hint` hoặc `notes` vào production Daily Test.

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
- regenerate a frozen Vocabulary learning set;
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
6. Chọn Source Manifest theo phase:
   n5_review → docs/specs/N5_SOURCE_MANIFEST.md
   n4_review → docs/specs/N4_SOURCE_MANIFEST.md
7. Tạo trực tiếp Grammar JSON
8. Tạo Grammar Test JSON cùng ngày
9. Tạo Vocabulary JSON
10. Tạo Kanji JSON theo chính sách source-exhaustive (không tạo reserve)
11. Tạo Reading JSON
12. Tạo Listening JSON
13. Tạo Daily Test ngày kế tiếp
14. Validate
15. Manual spot-check / Optional Human Review nếu cần
16. Commit
17. Push GitHub
18. Vercel deploy
```

## 15.1 Batch Content Production Mode

Canonical per-day workflow vẫn hợp lệ. Ngoài ra, Phase N5/N4 có thể được sản xuất theo batch của từng content type xuyên suốt Lesson 1–50:

```text
Grammar
→ Lesson 1–5
→ Lesson 6–10
→ ...
→ Lesson 46–50

Vocabulary
→ Lesson 1–5
→ ...
→ Lesson 46–50

Kanji
→ Lesson 1–5
→ ...
→ Lesson 46–50

Reading
→ Lesson 1–5
→ ...
→ Lesson 46–50

Listening
→ Lesson 1–5
→ ...
→ Lesson 46–50
```

Batch production chỉ thay đổi thứ tự chuẩn bị content, không thay đổi runtime file organization. Output vẫn phải tách theo Study Day:

```text
Lesson 1–5   → day-001.json
Lesson 6–10  → day-002.json
Lesson 11–15 → day-003.json
Lesson 16–20 → day-004.json
Lesson 21–25 → day-005.json
Lesson 26–30 → day-006.json
Lesson 31–35 → day-007.json
Lesson 36–40 → day-008.json
Lesson 41–45 → day-009.json
Lesson 46–50 → day-010.json
```

Không tạo một JSON duy nhất cho toàn bộ N5/N4. Mỗi file vẫn tuân theo roadmap resource ID, Study Day namespace, type-specific selection policy và publication invariants hiện tại.

### Grammar Test dependency

Grammar Test phụ thuộc trực tiếp vào Grammar cùng Study Day. Vì vậy Grammar batch có thể tạo hai resource cùng lúc:

```text
Grammar Day X
→ Grammar Test Day X

content/grammar/day-xxx.json
+
content/tests/grammar/day-xxx.json
```

Mỗi N5/N4 Study Day vẫn bắt buộc:

```text
5 lessons
× 5 questions
= 25 Grammar Test questions
```

### Daily Test dependency

Không tạo Daily Test chỉ từ Grammar batch. Daily Test Day X+1 chỉ được tạo sau khi mọi nguồn có trong coverage Day X đã hoàn thành và được review:

```text
Grammar Day X
+ Vocabulary Day X
+ Kanji Day X
↓
Daily Test Day X+1
```

Nếu Day X không có Kanji (hiện tại là Study Day 1), không bổ sung Kanji từ ngày khác; tạo Daily Test với 20 Grammar + 25 Vocabulary và bỏ Kanji section.

Ví dụ:

```text
Day 2 Grammar + Vocabulary + Kanji complete and reviewed
↓
create Daily Test Day 3
```

Reading và Listening không phải source của Daily Test hiện tại. Daily Test vẫn giữ 45 questions với phân bổ canonical theo việc covered day có Kanji hay không.

### Batch checkpoints

Không đợi đến cuối 50 lessons mới kiểm tra. Sau mỗi block 5 lessons:

```text
extract
→ generate Study Day JSON
→ schema validation
→ content lint / manual spot-check
→ continue to next block
```

Ví dụ Grammar batch:

```text
Lesson 1–5
→ validate Day 1

Lesson 6–10
→ validate Day 2

...

Lesson 46–50
→ validate Day 10
```

Sau checkpoint cuối, chạy validation tổng cho toàn batch. A batch is complete only when every per-day checkpoint and the final aggregate validation pass.

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
Vocabulary target/pool rules và Kanji required/optional field structure
Vocabulary surface/hiragana/kanji compatibility
Reading stimulus/translation/media/text-image option rules
Reading asset path format và referenced-file existence dưới publicRoot
Reading mcq/true_false/short_answer/matching structure và answer references
Grammar Test section/count/category/coverage/lesson_groups
Daily Test canonical section/category/max-score counts (20/25 khi covered day không có Kanji; 15/15/15 khi có Kanji) và 45 total
```

Validator hiện tại **chưa** kiểm tra toàn bộ required fields/types ngoài phạm vi đã
liệt kê, YouTube metadata, `source_ref`, `source_item_refs`, language quality hoặc
semantic coverage. Không xem một lần `validate-content PASS` là đủ để khẳng định
content quality.

## Specification requirements / future validator requirements

Schema validation cần được mở rộng sau này để kiểm tra:

- required fields và types cho các resource chưa được validator chuyên biệt hóa;
- roadmap/resource/source references;
- YouTube metadata;
- Katakana authoring semantics và `source_item_refs` format/resolution.

## Content Lint / Semantic Validation

Content Lint là lớp riêng với Schema Validation. Đây là **specification requirement / future validator requirement**; hiện cần manual review:

### Language-field consistency

- Các field hậu tố `_vi` như `explanation_vi`, `meaning_vi`, `usage_vi`, `notes_vi`, `translation_vi`, `description_vi` phải có phần giải thích chính bằng tiếng Việt.
- Japanese được phép trong ví dụ/quote, nhưng explanation chính không được vô tình hoàn toàn bằng tiếng Nhật.
- Reading `translation_vi` chỉ dịch passage text, không mô tả media.
- Image answer alt phải trung tính và không làm lộ answer semantics.

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
✓ Kanji source-exhaustive coverage complete
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

Canonical manifest selection:

```text
phase n5_review → docs/specs/N5_SOURCE_MANIFEST.md
phase n4_review → docs/specs/N4_SOURCE_MANIFEST.md
```

This guide defines the **workflow**.

The JSON Schema defines the **technical data format**.

The guide defines the creation process. JSON Schema specification v1.4 is authoritative for field names and type-specific learning semantics; runtime `schema_version` remains `1`.

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
