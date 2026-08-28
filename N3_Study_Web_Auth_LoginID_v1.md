# N3 Study Web — Login ID / Supabase Auth Convention v1

**Status:** Frozen for MVP  
**Date:** 2026-08-28

## 1. User-facing login

UI exposes only:

```text
Login ID
Password
```

No email field, self-signup, or social login is required for MVP.

## 2. Internal Supabase identity

Supabase Auth remains the password/session provider.

Backend converts `login_id` into an internal email-like identity:

```text
normalize(login_id)
→ lowercase
→ trim
→ validate
→ append server-only AUTH_LOGIN_DOMAIN
```

Example:

```text
User enters: bang
Internal identity: bang@n3study.local
```

The domain is configured server-side:

```text
AUTH_LOGIN_DOMAIN
```

Recommended development value:

```text
n3study.local
```

If the deployed auth configuration rejects that suffix, change only the environment value; the frontend contract remains Login ID + Password.

## 3. Login ID validation

Canonical regex:

```regex
^[a-z0-9][a-z0-9._-]{2,31}$
```

Rules:
- 3–32 characters
- lowercase letters, digits, `.`, `_`, `-`
- first character must be letter/digit
- backend lowercases before auth

Examples:

```text
Bang      → bang
bang_01   → bang_01
user-name → user-name
```

Invalid:

```text
ba
bang@
bang space
```

Frontend may validate for UX; backend validation is authoritative.

## 4. Account creation

MVP has no public signup.

Accounts are created via an admin/server-only bootstrap flow:
- normalize Login ID;
- generate internal email;
- create Supabase Auth user;
- set initial password;
- mark email identity confirmed in the admin creation flow;
- never expose service-role credentials to frontend.

This avoids requiring a real inbox or email-confirmation UX.

## 5. Login flow

Frontend:

```text
POST /api/auth/login
{ login_id, password }
```

Backend:

```text
1. normalize Login ID
2. validate Login ID
3. build internal email
4. call Supabase password sign-in
5. establish session cookie
6. check user_programs
7. return /setup or /schedule
```

Frontend never sees the internal email.

## 6. Security

Never:
- store plaintext passwords in application tables;
- expose service-role keys to frontend;
- use frontend-supplied `user_id` for authorization.

Use one generic invalid-login message:

```text
Login ID hoặc mật khẩu không đúng.
```

Do not reveal whether the Login ID exists.

## 7. Password reset

Self-service password reset is out of scope for MVP because the user-facing identity has no real email inbox.

During MVP, password reset is an admin/server-only maintenance action.

## 8. Login ID changes

Changing Login ID is out of scope for MVP.

If needed later, perform an explicit account migration rather than casual editing.

## 9. Identity layers

```text
User-facing identity  → login_id
Auth provider identity → generated internal email
Application identity   → auth.users.id UUID
```

All application tables reference the Supabase Auth UUID.
