# Local vs Supabase Data Storage

FOCUS v2.0 uses a hybrid storage strategy: local storage for UX preferences, Supabase for scientific data.

## Local Storage (localStorage / IndexedDB)

### What's Stored Locally

| Data | Storage Key | Purpose |
|------|-------------|---------|
| Theme preference | `focus_theme` | UI theme (dark/light/system) |
| Language preference | `focus_language` | UI language (en/tr/ar) |
| Accessibility settings | `focus_settings` | Reduced motion, high contrast |
| Calibration cache | `focus_calibration` | Last calibration result (avoids recalibration) |
| Session history | `focus_sessions` | Local copy of recent sessions (offline-first) |

### Why Local?

- **No latency**: Settings apply instantly without network round-trips
- **Offline-first**: The app works fully offline; data syncs when online
- **Privacy**: User preferences never leave the device
- **No auth required**: Guest users can use the full app

## Supabase (Cloud Database)

### What's Stored in Supabase

| Table | Data | Why Cloud? |
|-------|------|-----------|
| `users` | Account, role, display name | Cross-device auth, role management |
| `devices` | Hardware/software fingerprint | Research needs device diversity analysis |
| `calibrations` | Calibration results with timestamps | Reproducibility, device-specific correction |
| `sessions` | Reaction times, scientific results | Research aggregation, longitudinal analysis |
| `surveys` | Demographic questionnaire | Cohort analysis, demographic correlations |

### Why Supabase?

- **Scientific integrity**: Data must persist across sessions and devices for research validity
- **Cross-device sync**: Users can access their results from any device
- **Research aggregation**: The Research Console needs to query across all users' data
- **Backup**: Cloud storage prevents data loss
- **RLS security**: Row Level Security ensures users can only access their own data
- **Admin access**: Researchers need read access to anonymized/aggregated data

## Data Flow

```
User takes measurement
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│  Local Storage   │────>│  Supabase       │
│                  │     │                 │
│ • Theme          │     │ • Session data  │
│ • Language       │     │ • Device info   │
│ • Calibration    │     │ • Calibration   │
│ • Settings       │     │ • Survey        │
│ • Session cache  │     │ • User role     │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   Instant UX             Research Analysis
   Offline-ready          Cross-device sync
   No auth needed         Admin access
```

## Sync Strategy

1. **Measurement completes** → Results saved to `localStorage` immediately (instant feedback)
2. **If online** → Results also sent to Supabase (async, non-blocking)
3. **If offline** → Results queued in localStorage, synced when connection restores
4. **Settings** → Always local only (no cloud sync needed)
5. **Auth state** → Managed by Supabase auth, cached in memory (not localStorage for security)

## Migration from Local to Cloud

When a guest user registers:
1. Their local session history is uploaded to Supabase
2. Local data is tagged with the user's ID
3. Future sessions sync automatically

This ensures zero data loss during the guest→registered transition.
