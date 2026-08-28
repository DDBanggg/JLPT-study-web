# N3 Study Web — Content Creation Guide

**Status:** Operational guide
**Purpose:** Hướng dẫn chuẩn bị nội dung học theo từng Study Day và chuyển thành JSON dùng cho website.
**Applies to:** Grammar, Grammar Test, Vocabulary, Kanji, Reading, Listening, Daily/Weekly/Monthly/End/Mock Tests.
**Updated:** 2026-08-29

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

Khi tạo content, phải đọc trực tiếp hai source-of-truth:

```text
1. docs/guides/CONTENT_CREATION_GUIDE.md
2. docs/specs/N3_Study_Web_JSON_Schema_v1.md
```

Vai trò:

```text
CONTENT_CREATION_GUIDE.md
→ quy trình tạo content

N3_Study_Web_JSON_Schema_v1.md
→ format kỹ thuật của JSON
```

Không tạo hoặc commit `docs/content-context/day-xxx.md`. Không lưu cùng một lesson content dưới cả `.md` và `.json`.

Scratch note tạm thời được phép khi thực sự cần, nhưng:

- không phải source-of-truth;
- không được commit;
- phải xóa sau khi JSON hoàn thành.

---

# 3. JSON runtime

Tạo trực tiếp các JSON chính thức từ tài liệu nguồn theo hai source-of-truth ở trên.

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
Grammar Test cùng ngày
= 5 lessons × 5 câu
= 25 câu

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
  "notes_vi": []
}
```

## Rule

- không bỏ Grammar vì user đã biết;
- một Grammar structure = một card;
- Grammar ID không được đổi sau khi publish.

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
Hiragana
Kanji
Meaning VI
Examples
Notes
```

Ví dụ:

```json
{
  "id": 201,
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
```

## Rule

- target = 50;
- pool <= 100;
- ưu tiên từ quan trọng trước;
- không kéo từ Day khác chỉ để đủ quota;
- Known replacement chỉ lấy trong cùng pool.

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
  "notes_vi": []
}
```

## Rule

- target = 30;
- pool <= 100;
- thứ tự JSON = priority;
- Known replacement chỉ từ cùng Day.

---

# 8. Reading

Mỗi Reading item nên có:

```text
ID
Title
Japanese passage
Vietnamese reference translation
Questions
Correct answers
Explanation
```

Nếu bài không có câu hỏi:

```json
"questions": null
```

UI vẫn sẽ hiển thị:

```text
Câu hỏi
...
```

Không cần tạo câu hỏi giả chỉ để lấp phần này.

---

# 9. Listening

Listening sử dụng YouTube embed.

Mỗi item nên có:

```text
ID
Title
Description
YouTube video ID hoặc playlist ID
Fallback URL
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
6. Tạo trực tiếp Grammar JSON
7. Tạo Grammar Test JSON cùng ngày
8. Tạo Vocabulary JSON
9. Tạo Kanji JSON
10. Tạo Reading JSON
11. Tạo Listening JSON
12. Tạo Daily Test ngày kế tiếp
13. Validate
14. Manual spot-check
15. Commit
16. Push GitHub
17. Vercel deploy
```

---

# 16. Temporary scratch notes

Không tạo Study Context Markdown trong repository.

Nếu content preparation cần scratch note để xử lý tài liệu nguồn, note đó phải nằm ngoài source-of-truth, không commit và được xóa sau khi JSON đã review.

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

Expected checks:

```text
schema_version
Study Day
duplicate ID
pool size
Vocabulary target
Kanji target
Grammar Test 25 questions
Grammar Test 5 lessons × 5 questions
Daily Test 45 questions
15/15/15 categories
correct option IDs
roadmap references
YouTube metadata
JSON parse
```

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

When creating content, always follow:

```text
1. docs/guides/CONTENT_CREATION_GUIDE.md
2. docs/specs/N3_Study_Web_JSON_Schema_v1.md
```

for exact runtime JSON structure.

This guide defines the **workflow**.

The JSON Schema defines the **technical data format**.

The guide defines the creation process. JSON Schema v1.1 is authoritative for field names and runtime structure.

Canonical flow:

```text
Tài liệu nguồn
↓
đọc CONTENT_CREATION_GUIDE.md
+
đọc N3_Study_Web_JSON_Schema_v1.md
↓
tạo JSON trực tiếp
```
