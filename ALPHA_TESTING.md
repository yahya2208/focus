# Internal Alpha Testing Checklist

**Duration:** 3–7 days
**Testers:** Developer + 5 friends
**Goal:** 100 sessions total, catch critical bugs

---

## Before Testing

- [ ] Run `npm install` to get Capacitor dependencies
- [ ] Run `npm run build` to verify clean build
- [ ] Install on Android device: `bash setup-android.sh`
- [ ] OR test on web: `npm run dev` → http://localhost:5173

## Per Tester

Each tester should complete **20 sessions** (minimum 5 if time-limited).

### Session Checklist

For each session, tester should:

1. [ ] Open app
2. [ ] Verify dark/light theme toggle works
3. [ ] Start Assessment → Library
4. [ ] Select Reaction Light Test
5. [ ] Read introduction (or skip if "don't show again" checked)
6. [ ] Wait for calibration (should show detected refresh rate)
7. [ ] Complete countdown (3-2-1-GO)
8. [ ] Play 20 trials (tap/press Space when stimulus appears)
9. [ ] View results (should show grade, metrics, disclaimer)
10. [ ] Go to History (session should appear)
11. [ ] Close and reopen app
12. [ ] Verify session persists in History

## Bugs to Report

### Critical (blocks release)
- [ ] App crashes
- [ ] Game doesn't complete 20 trials
- [ ] Results show NaN or undefined values
- [ ] Session not saved to History
- [ ] Session lost after page refresh

### Major (should fix before public alpha)
- [ ] Calibration shows wrong refresh rate (e.g., 0 Hz)
- [ ] Theme toggle doesn't work
- [ ] Settings not persisted after reload
- [ ] Unresponsive during game (input lag)
- [ ] UI overflow on mobile

### Minor (can fix later)
- [ ] Slow animation
- [ ] Minor visual glitch
- [ ] Unclear text or label

## Performance to Record

For each tester, record:

| Metric | Value |
|--------|-------|
| Device | |
| Browser | |
| Refresh Rate detected | |
| Display Lag | |
| Input Lag | |
| Average RT (session 1) | |
| Average RT (session 20) | |
| App crashes? | |
| Pages lost? | |

## After Testing

1. Compile all bug reports
2. Fix critical bugs first
3. Fix major bugs
4. Update CHANGELOG.md
5. Tag v0.4.0-alpha-tested
6. Announce: "Architecture Freeze v1.0"
7. Begin Phase 4
