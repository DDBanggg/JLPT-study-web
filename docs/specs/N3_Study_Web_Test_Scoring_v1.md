# N3 Study Web — Test Scoring Rules v1

**Status:** Frozen for MVP  
**Date:** 2026-08-28

## 1. Scoring systems

The project uses:

1. Daily Test raw score
2. JLPT-style linear section score

The web does **not** claim to reproduce the official JLPT scaled-score algorithm.

## 2. Daily Test

Structure:

```text
Grammar     15
Vocabulary  15
Kanji       15
Total       45
```

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
score = 39
max_score = 45
```

JLPT section fields remain null.

## 3. Weekly / Monthly / End / Mock

Sections:

```text
Language Knowledge  0–60
Reading             0–60
Listening           0–60
Total               0–180
```

## 4. Linear section formula

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

## 5. Total score

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

## 6. Why this method

It preserves a familiar 180-point JLPT-style presentation while remaining deterministic and simple.

It is an internal study metric, not an official JLPT score prediction.

## 7. Unanswered questions

Unanswered = incorrect.

```text
option_id = null → 0 raw points
```

## 8. Invalid section

A JLPT-style section must contain at least one question.

`raw_total = 0` is invalid content and validation must fail.

## 9. Retake

Only latest submitted result is retained.

Example:

```text
Attempt 1: 101 / 180
Attempt 2: 118 / 180
Stored:    118 / 180
```

Question-level attempt history is not persisted.

## 10. Review

After Submit, backend returns:
- selected answer;
- correct answer;
- correct/incorrect;
- explanation.

Review is displayed but does not require a separate attempt-history table.

## 11. Project target

The project target `stable mock score 110+` means:

```text
110+ / 180 using this project's linear JLPT-style score
```

It must not be presented as a guaranteed official JLPT score.

## 12. Database fields

Daily:

```text
score           integer
max_score       integer
language_score  null
reading_score   null
listening_score null
total_score     null
```

Weekly/Monthly/End/Mock:

```text
score           null
max_score       null
language_score  integer
reading_score   integer
listening_score integer
total_score     integer
```

## 13. Scoring authority

Backend scoring is authoritative.

On Submit:

```text
load authoritative JSON
→ validate answers
→ calculate score
→ persist latest result
→ return review/result
```
