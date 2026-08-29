# Supabase foundation

Apply migrations in numeric order to a fresh Supabase project. The initial migration is copied verbatim from the canonical SQL Schema v1.1.

Runtime reads use verified user sessions and owner-scoped RLS. Runtime mutations first verify
the user session in a backend Route Handler, then use the server-only admin client with an explicit
`user_id`; authenticated database roles have SELECT-only policies and cannot write directly.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be imported by client code, exposed to
browser builds, or written to logs.
