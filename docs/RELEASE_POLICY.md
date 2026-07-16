# Release Policy — FOCUS v2.0

## Phase Completion Release Process

```
Phase Implementation
    ↓
5 Quality Gates Pass
    ↓
Engineering Report Approved
    ↓
Git Commit (conventional)
    ↓
Git Tag (v2.0-phase-X)
    ↓
Compressed Archive (.tar.gz)
    ↓
External Backup (manual)
    ↓
Proceed to Next Phase
```

## Versioning Scheme

| Version | Meaning |
|---|---|
| `v0.1.0-alpha` | Phase -1: Engineering Governance |
| `v0.2.0-alpha` | Phase -0.5: Architecture Bible Lock |
| `v0.3.0-alpha` | Phase 0: Architecture Foundation |
| `v0.4.0-alpha` | Phase 1: Design System |
| `v0.5.0-alpha` | Phase 2: Scientific Core |
| `v0.6.0-alpha` | Phase 3: Plugin Architecture + Game01 |
| `v0.7.0-alpha` | Phase 3.5: Alpha Review (M1) |
| `v0.8.0-alpha` | Phase 4: Anti-Cheat |
| `v0.9.0-alpha` | Phase 5: Supabase |
| `v0.10.0-alpha` | Phase 6: QR Experience |
| `v0.11.0-alpha` | Phase 7: Research Console (M2) |
| `v0.12.0-alpha` | Phase 7.5: Scientific Validation |
| `v0.13.0-alpha` | Phase 8: AI Coach |
| `v0.14.0-alpha` | Phase 9: Achievements |
| `v0.15.0-alpha` | Phase 10: Android (M3) |
| `v0.16.0-alpha` | Phase 11: PWA |
| `v1.0.0-rc.1` | Phase 12: Release Candidate (M4) |
| `v1.0.0` | Production Release (M5) |

## Tag Naming Convention

```
v2.0-phase-{X}           — Phase completion
v2.0-phase-{X}-rc.1      — Release candidate
v1.0.0                    — Production release
```

## Archive Naming Convention

```
focus-v2-phase-{X}-snapshot-{YYYY-MM-DD}.tar.gz
```

## GitHub Release Process

For major milestones (M1–M5):
1. Create GitHub Release from tag
2. Attach compressed archive
3. Write release notes (user-facing summary)
4. Mark as pre-release (until v1.0)

## External Backup Locations

- Google Drive: `/FOCUS v2/Backups/`
- OneDrive: `/FOCUS v2/Backups/`
- Local: `~/Downloads/` (automatic via tar.gz)
