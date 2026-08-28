# Admin Auth bootstrap

MVP accounts are created by an administrator; there is no public signup.

Set the four values from `.env.example` in the current shell. Put the initial password in the temporary, server-only `N3_INITIAL_PASSWORD` environment variable, then run:

```text
node scripts/admin/create-user.mjs <login_id>
```

The helper normalizes the Login ID, creates the internal email identity, and confirms it through the Supabase Admin API. It does not write plaintext passwords to application tables.

`SUPABASE_SERVICE_ROLE_KEY` is required and must remain server-only. Do not run this command in browser code or commit its value.

Remove `N3_INITIAL_PASSWORD` from the shell after the command finishes. Passing the password as a command-line argument is intentionally unsupported so it does not appear in the command history or process arguments.
