# N3 Study Web — Test Scoring Rules v1.1

**Status:** Frozen for MVP  
**Scoring specification version:** 1.1
**Date:** 2026-08-29

## 1. Scoring systems

The project uses three scoring categories:

1. Grammar Test raw score;
2. Daily Test raw score;
3. JLPT-style linear section score for Weekly, Monthly, End, and Mock tests.

The web does **not** claim to reproduce the official JLPT scaled-score algorithm.

## 2. Grammar Test

Structure for the current N5/N4 phase:

```text
5 lessons
5 questions per lesson
25 questions total
```

Grammar Test checks Grammar learned in the same Study Day. Every question uses the `grammar` category.

Scoring:

```text
correct     = 1
incorrect   = 0
unanswered  = 0
```

No negative marking and no scaling to `/60`.

Example:

```text
21 correct / 25
Displayed score = 21 / 25
```

Persist:

```text
test_type       = grammar
score           = 21
max_score       = 25
language_score  = null
reading_score   = null
listening_score = null
total_score     = null
```

If a future phase does not use exactly 5 lessons per Study Day, update the specification before changing the grouping rule.

## 3. Daily Test

Structure:

```text
Grammar     15
Vocabulary  15
Kanji       15
Total       45
```

Daily Test Day X covers new knowledge from Study Day X-1.

Scoring:

```text
correct     = 1
incorrect   = 0
unanswered  = 0
```

No negative marking.

Example:

```text
Grammar     13 / 15
Vocabulary  12 / 15
Kanji       14 / 15
Total       39 / 45
```

Persist:

```text
test_type       = daily
score           = 39
max_score       = 45
language_score  = null
reading_score   = null
listening_score = null
total_score     = null
```

## 4. Weekly / Monthly / End / Mock

Sections:

```text
Language Knowledge  0–60
Reading             0–60
Listening           0–60
Total               0–180
```

## 5. Linear section formula

For each section:

```text
raw_correct = number of correct answers
raw_total   = number of questions
section_score = round((raw_correct / raw_total) * 60)
```

Clamp result to `0..60`.

Example:

```text
18 correct / 25
18 / 25 * 60 = 43.2
Displayed score = 43 / 60
```

## 6. Total score

```text
total_score = language_score + reading_score + listening_score
```

Example:

```text
Language   42 / 60
Reading    38 / 60
Listening  44 / 60
Total     124 / 180
```

## 7. Why this method

It preserves a familiar 180-point JLPT-style presentation while remaining deterministic and simple.

It is an internal study metric, not an official JLPT score prediction.

## 8. Unanswered questions

Unanswered = incorrect for every test type.

```text
option_id = null → 0 raw points
```

## 9. Invalid content

- Grammar Test must contain 5 lesson groups, 5 questions per lesson, and 25 questions total.
- Daily Test must contain 15 Grammar, 15 Vocabulary, and 15 Kanji questions.
- A JLPT-style section must contain at least one question; `raw_total = 0` is invalid.

Invalid test content must fail validation.

## 10. Retake

Only the latest submitted result is retained for every logical test.

Question-level attempt history is not persisted.

## 11. Review

After Submit, backend returns:

- selected answer;
- correct answer;
- correct/incorrect;
- explanation.

Review is displayed but does not require a separate attempt-history table.

## 12. Project target

The project target `stable mock score 110+` means:

```text
110+ / 180 using this project's linear JLPT-style score
```

It must not be presented as a guaranteed official JLPT score.

## 13. Database field groups

Raw-score Grammar and Daily tests:

```text
score           integer
max_score       integer
language_score  null
reading_score   null
listening_score null
total_score     null
```

Weekly/Monthly/End/Mock tests:

```text
score           null
max_score       null
language_score  integer
reading_score   integer
listening_score integer
total_score     integer
```

## 14. Scoring authority

Backend scoring is authoritative.

On Submit:

```text
load authoritative JSON
→ validate answers
→ calculate score
→ persist latest result
→ return review/result
```
