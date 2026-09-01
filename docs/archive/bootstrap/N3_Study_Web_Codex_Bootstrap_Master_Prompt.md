# MASTER PROMPT — CODEX BOOTSTRAP N3 STUDY WEB

> Historical bootstrap record. It is not a current source-of-truth document. The active
> FE/BE contract remains v1.1 and the canonical content specification is now v1.3; always
> follow the current `docs/specs/` documents instead of the enum/folder examples retained
> here. v1.3 keeps runtime `schema_version: 1`, makes Vocabulary source-bounded with
> same-day replacement, and makes Kanji source-exhaustive with Known remove-only.

Bạn là **Codex**, phụ trách bootstrap repository và nền tảng backend cho dự án cá nhân **N3 Study Web**.

## Mục tiêu lần chạy này

Tạo một repository hoàn chỉnh, sạch, đúng cấu trúc, có Git, Next.js + Supabase foundation, content folders, validation foundation, source-of-truth docs và sẵn sàng để bước tiếp theo triển khai backend.

**Không triển khai toàn bộ backend business logic.**  
**Không làm frontend UI chi tiết.**  
**Không làm mobile.**  
**Không thay đổi contract/spec đã cung cấp.**

---

## 1. Đọc source of truth trước khi code

Tôi sẽ cung cấp các file:

1. `N3_Study_Web_Context_v2.md`
2. `N3_Study_Web_Database_Architecture_v2.md`
3. `N3_Study_Web_UI_UX_v2.md`
4. `N3_Study_Web_Implementation_Plan.md`
5. `N3_Study_Web_FE_BE_Contract_v1.md`
6. `N3_Study_Web_JSON_Schema_v1.md`
7. `N3_Study_Web_SQL_Schema_v1.sql`
8. `N3_Study_Web_Auth_LoginID_v1.md`
9. `N3_Study_Web_Test_Scoring_v1.md`
10. `N3_Study_Web_Agent_Handoff_v1.md`

Đọc toàn bộ trước khi thay đổi project.

Nếu có mâu thuẫn, ưu tiên:

1. FE/BE Contract v1
2. JSON Schema v1
3. SQL Schema v1
4. Auth Login ID v1
5. Test Scoring v1
6. Agent Handoff v1
7. Database Architecture v2
8. UI/UX v2
9. Context v2
10. Implementation Plan

Nếu vẫn chưa rõ, không tự phá contract. Ghi ambiguity trong báo cáo cuối.

---

## 2. Stack

Bootstrap bằng:

- Next.js
- App Router
- React
- TypeScript strict
- Tailwind CSS
- Supabase JS
- PostgreSQL via Supabase
- npm
- Git
- GitHub-ready
- Vercel-ready

MVP hiện tại là **desktop-first** và **Light Mode only**.

Repository mặc định:

```text
n3-study-web
```

Nếu đang ở đúng repository rồi thì không tạo nested repo.

---

## 3. Cấu trúc project bắt buộc

```text
n3-study-web/
├── app/
│   ├── api/
│   ├── login/
│   ├── setup/
│   ├── schedule/
│   ├── calendar/
│   ├── learn/
│   │   ├── grammar/
│   │   ├── vocabulary/
│   │   ├── kanji/
│   │   ├── reading/
│   │   └── listening/
│   └── test/
│       ├── daily/
│       ├── weekly/
│       ├── monthly/
│       ├── end/
│       └── mock/
├── components/
├── content/
│   ├── roadmap/
│   ├── grammar/
│   ├── vocabulary/
│   ├── kanji/
│   ├── reading/
│   ├── listening/
│   └── tests/
│       ├── daily/
│       ├── weekly/
│       ├── monthly/
│       ├── end/
│       └── mock/
├── contracts/
├── docs/specs/
├── lib/
│   ├── auth/
│   ├── server/
│   ├── data/
│   ├── roadmap/
│   ├── progress/
│   ├── scoring/
│   └── utils/
├── scripts/content-validation/
├── supabase/
│   ├── migrations/
│   └── seed/
├── tests/
│   ├── backend/
│   └── frontend/
├── types/
├── public/
└── ...
```

Có thể chỉnh chi tiết nhỏ theo Next.js hiện tại nhưng không được phá ownership boundary.

---

## 4. Đưa spec vào repo

Copy 10 source-of-truth files vào:

```text
docs/specs/
```

Không sửa nội dung authoritative của spec ở bước bootstrap.

Tạo `docs/README.md` ngắn giải thích thứ tự đọc spec.

---

## 5. Next.js foundation

Tạo project Next.js TypeScript + Tailwind với:

- App Router
- strict TypeScript
- alias `@/*`
- ESLint
- Tailwind
- không Redux
- không UI framework lớn nếu chưa cần

Chỉ tạo page/root placeholder tối thiểu để build pass. Không làm UI hoàn chỉnh.

---

## 6. Environment

Tạo `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_LOGIN_DOMAIN=n3study.local
```

Nếu cần thêm env hợp lý, thêm và document.

Đảm bảo `.env` và `.env.local` bị ignore. Không commit secret.

---

## 7. Supabase foundation

Cài dependency Supabase cần thiết và chuẩn bị server/session foundation.

Contract quan trọng:

> Frontend không truy cập trực tiếp các progress table.

User-state business logic sẽ đi qua `app/api/**`.

Trong lần bootstrap chỉ dựng foundation, chưa implement full endpoints.

---

## 8. SQL migration foundation

Dùng canonical SQL:

```text
N3_Study_Web_SQL_Schema_v1.sql
```

để tạo migration đầu tiên, ví dụ:

```text
supabase/migrations/0001_initial_schema.sql
```

Không tự đổi table/field/constraint/RLS semantics.

Nếu cần sửa tối thiểu vì syntax/runtime Supabase, ghi rõ deviation trong báo cáo cuối.

---

## 9. Content foundation

Tạo toàn bộ content folders.

Không generate 100 ngày content giả.

Rolling content là requirement chính thức:

```text
roadmap có task
nhưng resource JSON tương ứng có thể chưa tồn tại
```

Trạng thái đó phải được hệ thống hỗ trợ sau này dưới dạng `Content Pending`.

Ở bootstrap chỉ cần loader/interface foundation nếu cần.

---

## 10. Content validation foundation

Tạo command:

```text
npm run validate-content
```

Ít nhất command chạy được và có foundation để kiểm tra:

- JSON parse
- `schema_version`
- Study Day range
- duplicate IDs trong file
- basic Daily Test 45 câu / 15-15-15 khi file tồn tại

Không cần overbuild validator trong lần này.

---

## 11. Shared types foundation

Tạo `types/` với các type/enums tối thiểu khớp contract, ví dụ:

- `TaskType`
- `TestType`
- `ContentState`
- `TaskState`
- `CalendarStatus`
- `ApiSuccess`
- `ApiError`

Không invent payload mới ngoài contract.

---

## 12. API health endpoint

Tạo:

```text
GET /api/health
```

Response:

```json
{
  "ok": true,
  "data": {
    "status": "ok"
  }
}
```

Chỉ để chứng minh Route Handler hoạt động.

---

## 13. Test foundation

Thiết lập test tooling tối thiểu phù hợp stack.

Không cần nhiều test. Ít nhất có foundation cho:

- utility đơn giản hoặc health route
- content validation không crash

---

## 14. Git

Nếu chưa có Git repo:

```text
git init
```

Tạo `.gitignore` đúng cho Next.js, Node, env và build outputs.

Trước initial commit, chạy:

```text
npm install
npm run lint
npm run typecheck
npm run build
npm run validate-content
```

Nếu project chưa có script `typecheck`, tạo:

```text
tsc --noEmit
```

Commit message:

```text
chore: bootstrap n3 study web
```

Branch mặc định:

```text
main
```

---

## 15. GitHub

Nếu môi trường đã authenticated và có quyền GitHub:

- tạo **private** repo `n3-study-web`
- add `origin`
- push `main`

Nếu không có credentials/tool:

- không giả vờ đã push
- hoàn thiện local Git repo
- báo chính xác lý do
- đưa exact commands để tôi tạo/push remote sau

Không public repo nếu chưa được yêu cầu.

---

## 16. Vercel readiness

Project phải Vercel-ready:

- build pass
- env được document
- không dùng local-only absolute paths
- không commit secrets

Không tự deploy production nếu chưa được yêu cầu rõ.

---

## 17. README và ownership

Tạo root `README.md` gồm:

- project purpose
- stack
- setup
- env
- commands
- folder ownership
- source-of-truth location
- rolling content model
- desktop-first rule

Commands:

```text
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run validate-content
```

Ghi rõ ownership:

### Codex owns

```text
app/api/**
lib/server/**
lib/data/**
lib/auth/**
lib/progress/**
lib/scoring/**
supabase/**
scripts/content-validation/**
tests/backend/**
```

### Antigravity owns later

```text
frontend pages
components/**
frontend presentation/styles
tests/frontend/**
```

### Shared/frozen

```text
content/**
types/**
contracts/**
docs/specs/**
```

---

## 18. Không làm trong lần chạy này

Không triển khai:

- full Auth flow
- full Program API
- Schedule backend hoàn chỉnh
- Grammar viewed business logic đầy đủ
- Known replacement đầy đủ
- Test Engine đầy đủ
- Calendar derivation đầy đủ
- frontend screens hoàn chỉnh
- mobile
- 100 ngày content
- AI features
- CMS
- dashboard
- dark mode

Không tự bắt đầu phase backend tiếp theo sau khi bootstrap xong.

---

## 19. Validation bắt buộc trước khi kết thúc

Chạy:

```text
npm run lint
npm run typecheck
npm run build
npm run validate-content
```

Kiểm tra:

```text
git status
git log --oneline -n 3
git remote -v
```

Nếu command nào fail do external environment, ghi đúng lý do. Không báo PASS giả.

---

## 20. Báo cáo cuối bắt buộc

Trả về đúng cấu trúc:

### Bootstrap status

```text
PASS / PARTIAL / BLOCKED
```

### Created

Liệt kê project/folder/config/migration/script/docs/test đã tạo.

### Validation

```text
npm run lint             PASS/FAIL
npm run typecheck        PASS/FAIL
npm run build            PASS/FAIL
npm run validate-content PASS/FAIL
```

### Git

```text
Initialized:
Branch:
Latest commit:
Remote:
Pushed:
```

### GitHub

Nếu đã tạo: repo name, visibility, remote, push status.

Nếu chưa: exact reason + exact commands để tôi làm tiếp.

### Contract deviations

Nếu không có:

```text
None.
```

Nếu có, ghi exact deviation + reason + risk.

### Blockers

Nếu không có:

```text
None.
```

### Recommended next Codex task

Chỉ đề xuất:

```text
Backend Phase 1 — Auth + Program foundation
```

Không tự bắt đầu.

---

## 21. Success condition

Bootstrap chỉ được coi là thành công khi:

- Next.js project tồn tại và build được
- structure đúng
- specs nằm trong repo
- Supabase foundation có mặt
- SQL migration foundation có mặt
- `.env.example` đúng
- content folders có mặt
- validation command có mặt
- Git local hoàn chỉnh
- GitHub được push nếu credentials sẵn có, hoặc có exact push instructions nếu không
- không vượt scope sang full backend/frontend
- repo sẵn sàng cho Backend Phase 1
