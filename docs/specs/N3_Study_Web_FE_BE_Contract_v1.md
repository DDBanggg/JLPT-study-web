# N3 Study Web — Frontend ↔ Backend Contract v1.1

**Status:** Frozen for first desktop implementation  
**Contract version:** 1.1
**Date:** 2026-08-29

This contract is shared by Codex (backend), Antigravity (frontend), and ChatGPT (spec/context). Breaking changes must update this document first.

## 1. General conventions

- Next.js App Router API Route Handlers live under `src/app/api/**`.
- Frontend does not write directly to Supabase user-state tables.
- Authenticated APIs derive `user_id` from the Supabase session; frontend never submits `user_id`.
- API JSON uses `snake_case`.

Success envelope:

```json
{"ok":true,"data":{}}
```

Error envelope:

```json
{"ok":false,"error":{"code":"INVALID_INPUT","message":"Readable message","field":null}}
```

Standard error codes:

```text
AUTH_INVALID_CREDENTIALS
AUTH_REQUIRED
INVALID_INPUT
INVALID_STUDY_DAY
PROGRAM_NOT_CONFIGURED
PROGRAM_ALREADY_CONFIGURED
CONTENT_PENDING
CONTENT_INVALID
TASK_NOT_FOUND
LEARNING_SET_INVALID
ITEM_NOT_FOUND
ITEM_ALREADY_KNOWN
TEST_NOT_FOUND
TEST_INVALID
INTERNAL_ERROR
```

Expected rolling-content or roadmap absence is a successful response, never an error response:

```json
{"ok":true,"data":{"content_state":"pending"}}
```

```json
{"ok":true,"data":{"roadmap_state":"pending","tasks":[],"next_task":null}}
```

Normal rolling `pending` from read endpoints must use HTTP 200 with `ok: true`; it
must not use HTTP 404, 409, or 503. A state-changing request that cannot execute
because its resource is pending may still be rejected with HTTP 409. `CONTENT_INVALID`,
authentication failures, and database failures remain error responses with their
existing status codes.

## 2. Frontend page routes

```text
/login
/setup
/schedule
/schedule/day/[day]
/calendar
/learn/grammar/day/[day]
/learn/vocabulary/day/[day]/list
/learn/vocabulary/day/[day]/quiz
/learn/kanji/day/[day]/list
/learn/kanji/day/[day]/quiz
/learn/reading/day/[day]
/learn/listening/day/[day]
/test/grammar
/test/grammar/[test_id]
/test/daily
/test/daily/[test_id]
/test/weekly
/test/weekly/[test_id]
/test/monthly
/test/monthly/[test_id]
/test/end
/test/end/[test_id]
/test/mock
/test/mock/[test_id]
```

`/schedule` resolves the currently scheduled Study Day.

## 3. Auth API

### POST `/api/auth/login`

Request:

```json
{"login_id":"bang","password":"..."}
```

Success:

```json
{"ok":true,"data":{"needs_setup":false,"redirect_to":"/schedule"}}
```

If no program exists, return `needs_setup: true` and `/setup`.

### POST `/api/auth/logout`

Returns `redirect_to: "/login"`.

## 4. Program API

### GET `/api/program`

Returns configured program plus derived values:

```json
{
  "configured": true,
  "program": {
    "program_id": "jlpt_n3_100_days_v1",
    "progress_start_date": "2026-08-27",
    "exam_date": "2026-12-06",
    "projected_day_100_date": "2026-12-04",
    "current_study_day": 2,
    "completed_study_days": 1,
    "progress_percent": 1,
    "days_until_exam": 100
  }
}
```

If the program is configured but its roadmap has not been published, the endpoint
still returns HTTP 200 with `ok: true` and `roadmap_state: "pending"`.

### POST `/api/program`

Request:

```json
{"progress_start_date":"2026-08-27","exam_date":"2026-12-06"}
```

If Day 100 is after exam date, creation still succeeds with warning code `DAY_100_AFTER_EXAM`.

## 5. Schedule API

### GET `/api/schedule/day/[day]`

Canonical task DTO:

```json
{
  "task_id": "grammar_day_15",
  "task_type": "grammar",
  "label": "Grammar",
  "order": 2,
  "required": true,
  "content_state": "available",
  "task_state": "in_progress",
  "progress": {"current":8,"total":12},
  "href": "/learn/grammar/day/15"
}
```

Enums:

```text
content_state: available | pending
task_state: pending | in_progress | finished
calendar_status: finished | late_finished | not_finished | null
```

Allowed `task_type` values include:

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

Missing future content must return `content_state: "pending"` without crashing.

If the Study Day roadmap itself is not prepared, the endpoint returns HTTP 200:

```json
{
  "ok": true,
  "data": {
    "study_day": 20,
    "roadmap_state": "pending",
    "tasks": [],
    "next_task": null
  }
}
```

## 6. Calendar API

### GET `/api/calendar?month=YYYY-MM`

Returns date, Study Day, roadmap state, and derived status.

```json
{"date":"2026-09-03","study_day":8,"roadmap_state":"planned","status":"not_finished"}
```

An unprepared roadmap does not fail the entire month. Pending/future days use
`roadmap_state: "pending"` and `status: null`; they are never derived as
`not_finished`.

### GET `/api/calendar/day/[day]`

Returns overall status and per-task progress. A roadmap-pending day returns HTTP
200 with `status: null`, `tasks: []`, and `next_task: null`. Calendar is read-only.

## 7. Learn API

### GET `/api/learn/[type]/[day]`

Valid types:

```text
grammar
vocabulary
kanji
reading
listening
```

Pending state:

```json
{"content_state":"pending","study_day":20,"type":"grammar","content":null,"user_state":null}
```

Grammar user state:

```json
{"viewed_ids":[1501,1502],"viewed_count":2,"total_count":12,"completed":false}
```

Vocabulary/Kanji user state:

```json
{"learning_set_ids":[1501,1502],"known_ids_in_pool":[1510],"completed":false}
```

Reading/Listening user state:

```json
{"completed_item_ids":[1501,1502]}
```

## 8. Learning set

### POST `/api/learning-sets/ensure`

Request:

```json
{"study_day":15,"item_type":"vocabulary"}
```

Returns the frozen active set. The operation is idempotent. Existing sets must not be regenerated.

## 9. Grammar viewed

### POST `/api/grammar/viewed`

Request:

```json
{"study_day":15,"grammar_id":1504}
```

Response includes `viewed_count`, `total_count`, and `all_viewed`. Duplicate calls must not duplicate state.

## 10. Completion

### POST `/api/progress/complete`

Request:

```json
{"study_day":15,"task_type":"grammar","task_id":"grammar_day_15"}
```

Reading/listening item IDs may use `reading_1501`, `listening_1501`.

Response includes:

```json
{
  "completed": true,
  "completed_at": "2026-09-10T19:30:00+07:00",
  "study_day_completed": false,
  "next_task": {
    "task_type": "grammar_test",
    "href": "/test/grammar/grammar-test-015",
    "label": "Làm Grammar Test"
  }
}
```

Backend derives `next_task` from roadmap order. Frontend must not hardcode sequencing.

## 11. Known + replacement

### POST `/api/known-items/mark`

Request:

```json
{"study_day":15,"item_type":"vocabulary","item_id":1512}
```

Response:

```json
{
  "marked_known":1512,
  "replacement_item_id":1563,
  "learning_set_ids":[],
  "active_count":50,
  "target":50,
  "pool_exhausted":false
}
```

If reserve is exhausted, `replacement_item_id` is null and `active_count` may fall below target.

Backend is authoritative for replacement selection. Frontend must not invent replacement IDs.

## 12. Test list

### GET `/api/tests?type=grammar|daily|weekly|monthly|end|mock`

Returns test metadata, content state, latest result, and frontend href.

Allowed `type` values are `grammar`, `daily`, `weekly`, `monthly`, `end`, and `mock`.

## 13. Active test payload

### GET `/api/tests/[test_id]`

Backend must strip hidden grading fields before returning an active test:

- `correct_option_id`
- `explanation_vi`

If unpublished, return `content_state: "pending"`.

Both unpublished test content and an unprepared test roadmap return HTTP 200 with
`ok: true` and `content_state: "pending"`. An unprepared roadmap also includes
`roadmap_state: "pending"`.

## 14. Test submit

### POST `/api/tests/[test_id]/submit`

Request:

```json
{
  "answers":[
    {"question_id":"q001","option_id":"B"},
    {"question_id":"q002","option_id":null}
  ]
}
```

Unanswered = `option_id: null` = incorrect.

Backend must:
1. load authoritative test JSON;
2. validate question and option IDs;
3. score;
4. upsert latest `test_results`;
5. complete the matching `task_progress`;
6. return result + review + next task.

Review item:

```json
{
  "question_id":"q001",
  "selected_option_id":"B",
  "correct_option_id":"C",
  "correct":false,
  "explanation_vi":"..."
}
```

Grammar Test uses the same submit endpoint. Its result uses raw scoring:

```json
{
  "result": {
    "test_id": "grammar-test-002",
    "test_type": "grammar",
    "score": 21,
    "max_score": 25,
    "language_score": null,
    "reading_score": null,
    "listening_score": null,
    "total_score": null
  },
  "next_task": {
    "task_type": "vocabulary",
    "href": "/learn/vocabulary/day/2/list",
    "label": "Học Vocabulary tiếp"
  }
}
```

The backend derives the task after Grammar Test from roadmap order. Vocabulary is the normal N5/N4 flow, not a hardcoded sequence.

## 15. Content Pending UX contract

Every Learn/Test page supports four states:

```text
loading
available
pending
error
```

`pending` is expected, not an error. Every expected pending response uses HTTP 200
and the success envelope (`ok: true`). Recommended text:

```text
Nội dung ngày này chưa được chuẩn bị.
```

## 16. Ownership boundary

Antigravity owns:

```text
app/(frontend pages)/**
components/**
frontend styles
local UI state/interactions
```

Codex owns:

```text
app/api/**
lib/server/**
lib/data/**
supabase/**
scripts/content-validation/**
backend tests
```

Shared/frozen areas requiring coordination:

```text
route names
API payload shapes
content schemas
task_type values
test_type values
ID conventions
SQL schema
scoring rules
```
