# ADR-007: Engineering Recovery Rule

**Status:** Accepted  
**Date:** 2026-07-16  
**Incident:** Complete source code loss during v1 deployment

## Context

In v1, the entire `focus-app/` source code was destroyed when `git checkout --orphan gh-pages && git rm -rf .` was executed inside the primary working directory. The submodule's `.git` directory was the sole location of source history and was permanently deleted.

## Decision

### ERR-001: Engineering Recovery Rule
- NEVER use `git checkout --orphan` or `git rm -rf .` in the primary working directory
- ALL deployment operations MUST use: GitHub Actions CI/CD, Git Worktree, or a separate clone
- Before any destructive operation, create a Git Tag and local backup
- Every completed phase MUST be pushed to GitHub before starting the next

### RR-002: Four-Copy Recovery Rule
After every significant commit:
1. Git Tag + Commit
2. GitHub Push
3. Compressed Archive (`.tar.gz`)
4. External Storage (Google Drive / OneDrive)

## Consequences

- ✅ Source code loss is structurally impossible
- ✅ Four independent recovery points always exist
- ✅ Deployment is decoupled from development
- ❌ Slightly more overhead per phase completion
