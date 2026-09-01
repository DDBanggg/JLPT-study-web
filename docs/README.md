# N3 Study Web specifications

The canonical content specification is **v1.4**. It adds text/visual/mixed Reading and
text/image question options while preserving the v1.3 authoring and Kanji learning
semantics. Runtime `schema_version` remains `1`; legacy JSON compatibility is documented
in the schema.

Authoritative project specifications live in [`docs/specs`](./specs). Read them in this precedence order before implementation:

1. `N3_Study_Web_FE_BE_Contract_v1.md`
2. `N3_Study_Web_JSON_Schema_v1.md`
3. `N3_Study_Web_SQL_Schema_v1.sql`
4. `N3_Study_Web_Auth_LoginID_v1.md`
5. `N3_Study_Web_Test_Scoring_v1.md`
6. `N3_Study_Web_Agent_Handoff_v1.md`
7. `N3_Study_Web_Database_Architecture_v2.md`
8. `N3_Study_Web_UI_UX_v2.md`
9. `N3_Study_Web_Context_v2.md`
10. `N3_Study_Web_Implementation_Plan.md`

For content creation, follow both:

1. [`guides/CONTENT_CREATION_GUIDE.md`](./guides/CONTENT_CREATION_GUIDE.md) for the preparation workflow;
2. [`specs/N3_Study_Web_JSON_Schema_v1.md`](./specs/N3_Study_Web_JSON_Schema_v1.md) for the canonical JSON format.

Create production JSON directly from source material. Do not commit per-day Study Context Markdown duplicates.
