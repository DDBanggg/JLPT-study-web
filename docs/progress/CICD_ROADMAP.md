# CI/CD Roadmap

Owner: **Repository/platform maintainer**
Scope: repository governance, automated validation, environments and deployment
Last updated: 2026-08-29

Codex is not assigned to this roadmap.

## Milestones

| ID | Milestone | Status | Exit condition |
| --- | --- | --- | --- |
| CI0 | Repository connection | COMPLETE | `origin` configured and `main` synchronized with GitHub |
| CI1 | Repository governance | IN_PROGRESS | Visibility, access, default branch and protection rules verified |
| CI2 | Pull-request quality gates | NOT_STARTED | CI runs lint, typecheck, tests, build and content validation |
| CI3 | Preview environment | NOT_STARTED | Pull requests receive isolated Vercel previews with safe environment variables |
| CI4 | Production deployment | NOT_STARTED | Protected `main` deployment and production environment are documented |
| CI5 | Database migration promotion | NOT_STARTED | Migration review/apply process separates local, preview and production |
| CI6 | Release and rollback runbook | NOT_STARTED | Deployment ownership, rollback and incident steps are documented and tested |

## CI/CD rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or user credentials to client builds or logs.
- Do not apply migrations to production automatically without an approved promotion policy.
- Do not force-push protected branches.
- CI validates contracts; it does not silently change them.
- Vercel and GitHub secrets are managed by the repository/platform maintainer.
- Content publication must fail when `npm run validate-content` fails.

## Recommended CI1 checklist

- [ ] Confirm repository visibility matches the intended private/public policy.
- [ ] Confirm `main` is the default branch.
- [ ] Require pull requests for protected changes.
- [ ] Require successful CI checks before merge.
- [ ] Restrict force pushes and branch deletion.
- [ ] Document who can approve production deployment and database migration.
