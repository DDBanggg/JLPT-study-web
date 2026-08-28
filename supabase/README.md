# Supabase foundation

Apply migrations in numeric order to a fresh Supabase project. The initial migration is copied verbatim from the canonical SQL Schema v1.

Runtime code must use user sessions and RLS. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to browser code.
