# Chapter 08: Progression & Reward Systems

## Table of Contents

1. [Overview](#overview)
2. [XP System](#xp-system)
3. [Level System](#level-system)
4. [Prestige System](#prestige-system)
5. [Achievement System](#achievement-system)
6. [Streak System](#streak-system)
7. [Daily Missions](#daily-missions)
8. [Weekly Challenges](#weekly-challenges)
9. [Unlockable Content](#unlockable-content)
10. [Leaderboards](#leaderboards)
11. [Social Progression](#social-progression)
12. [Notification Strategy](#notification-strategy)
13. [Data Schema](#data-schema)
14. [Anti-Abuse Measures](#anti-abuse-measures)

---

## Overview

The Progression and Reward Systems are the motivational backbone of the FOCUS platform. They transform a set of cognitive training games into a compelling daily habit. Every system in this chapter is designed around a single principle: **intrinsic motivation through visible progress**.

The design philosophy is informed by self-determination theory (Deci & Ryan, 1985), which identifies three pillars of intrinsic motivation:

1. **Autonomy**: Users choose what to play and how to engage
2. **Competence**: Users see clear evidence of their improvement
3. **Relatedness**: Users connect with others through social features

Every reward system feeds into at least one of these pillars. Progression is always visible, always meaningful, and never punitive. Missing a day does not erase progress — it merely pauses one axis of advancement. The platform never makes users feel bad for taking a break.

---

## XP System

### XP Sources

XP (Experience Points) is the universal currency of the FOCUS platform. It is earned through gameplay, daily activities, social interactions, and consistent engagement.

| Source | XP Amount | Frequency | Pillar |
|---|---|---|---|
| Game session completion | 5-50 XP | Per session | Competence |
| Daily mission completion | 10-30 XP | Per mission (3/day) | Competence |
| Weekly challenge completion | 50-200 XP | Per challenge (1/week) | Competence |
| Achievement unlock | 25-1000 XP | Per achievement | Competence |
| Daily login | 5 XP (base) | Once per day | Consistency |
| Streak bonus | 2-20 XP | Daily | Consistency |
| Social action (share) | 5 XP | Per share | Relatedness |
| Social action (friend challenge) | 10 XP | Per challenge | Relatedness |
| Social action (accept challenge) | 5 XP | Per acceptance | Relatedness |

### XP from Game Sessions

The XP earned from a game session is computed as:

```typescript
function computeSessionXP(
  sessionScore: number,
  streakDays: number,
  prestigeMultiplier: number,
  isDailyBonus: boolean
): { baseXP: number; streakBonus: number; dailyBonus: number; totalXP: number } {
  const baseXP = Math.floor(sessionScore / 10);

  const streakBonus = Math.min(streakDays * 2, 20);

  const dailyBonus = isDailyBonus ? 5 : 0;

  const subtotal = baseXP + streakBonus + dailyBonus;
  const totalXP = Math.round(subtotal * prestigeMultiplier);

  return { baseXP, streakBonus, dailyBonus, totalXP };
}
```

**Score-to-XP conversion:** The formula `floor(sessionScore / 10)` means:
- Score of 100 → 10 XP
- Score of 300 → 30 XP
- Score of 500 → 50 XP
- Score of 750 → 75 XP
- Score of 1000 → 100 XP

This conversion is deliberately generous. The goal is to make users feel rewarded, not to gate progression behind elite performance. A user who scores 300 (average) earns the same XP per session as a user who scores 500 (above average). The difference manifests in the level system, where higher-level content requires more XP to unlock.

### XP from Daily Missions

Each daily mission awards 10-30 XP based on difficulty:

| Mission Difficulty | XP | Example |
|---|---|---|
| Easy | 10 XP | "Complete 1 session" |
| Medium | 20 XP | "Achieve average RT under 350ms" |
| Hard | 30 XP | "Complete 3 sessions with zero lapses" |

### XP from Weekly Challenges

| Challenge Difficulty | XP |
|---|---|
| Standard | 50 XP |
| Advanced | 100 XP |
| Expert | 200 XP |

### XP from Achievements

Achievement XP varies by rarity (detailed in the Achievement System section).

### XP Ledger

All XP transactions are recorded in an immutable ledger:

```sql
CREATE TABLE xp_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Immutable: no UPDATE or DELETE
CREATE RULE xp_ledger_no_update AS ON UPDATE TO xp_ledger DO INSTEAD NOTHING;
CREATE RULE xp_ledger_no_delete AS ON DELETE TO xp_ledger DO INSTEAD NOTHING;
```

The XP ledger prevents double-crediting and provides a complete audit trail of all XP transactions. Each transaction references its source (session ID, mission ID, achievement ID) for traceability.

---

## Level System

### Level Formula

The XP required to reach each level follows a power curve:

```typescript
function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}
```

**Level requirements:**

| Level | XP Required | Cumulative XP | Sessions (approx.) |
|---|---|---|---|
| 1 | 100 | 100 | 5-10 |
| 2 | 283 | 383 | 15-20 |
| 5 | 1,118 | 2,476 | 50-70 |
| 10 | 3,162 | 14,339 | 150-200 |
| 15 | 5,809 | 40,556 | 300-400 |
| 20 | 8,944 | 85,793 | 500-700 |
| 25 | 12,500 | 152,518 | 750-1000 |
| 50 | 35,355 | 737,567 | 2,500-3,500 |
| 100 | 100,000 | 4,641,589 | 15,000-20,000 |

**Power curve rationale:** The 1.5 exponent creates a curve that is:
- Quick to level up initially (user sees progress immediately)
- Gradually slows down (creates a sense of progression without feeling stagnant)
- Never plateaus completely (every session contributes meaningful progress)
- Reaches level 100 in approximately 15,000-20,000 sessions (about 40-55 sessions per day for a year, or 4-6 sessions per day for 10 years)

The 1.5 exponent is specifically chosen because:
- Linear (exponent 1.0): Too fast. Users would reach level 100 in a few hundred sessions.
- Quadratic (exponent 2.0): Too slow. Early levels feel too grindy.
- 1.5: The sweet spot where level-ups feel frequent enough to maintain engagement but rare enough to feel meaningful.

### Level Rewards

Each level unlocks content. The unlock schedule is designed to introduce features gradually:

| Level | Unlock | Category |
|---|---|---|
| 1 | Reaction Light Test (basic mode) | Game |
| 2 | Profile customization (avatar, bio) | Social |
| 3 | Streak system activates | Progression |
| 4 | Daily missions unlock | Progression |
| 5 | N-Back Test unlocks | Game |
| 6 | Leaderboards unlock | Social |
| 7 | Advanced themes unlock | Cosmetics |
| 8 | Challenge a friend feature | Social |
| 9 | Sound pack: "Synth" | Cosmetics |
| 10 | Stroop Test unlocks | Game |
| 12 | Weekly challenges unlock | Progression |
| 15 | Profile badges unlock | Social |
| 18 | Sound pack: "Nature" | Cosmetics |
| 20 | Advanced statistics dashboard | Analytics |
| 25 | Profile frame: "Silver" | Cosmetics |
| 30 | Hard mode for all games | Game Mode |
| 40 | Profile frame: "Gold" | Cosmetics |
| 50 | Prestige system unlocks | Progression |
| 75 | Profile frame: "Platinum" | Cosmetics |
| 100 | Prestige badge: "Centurion" | Social |

### Level-Up Animation

When a user levels up:
1. Full-screen celebration overlay (1.5 seconds)
2. Particle system: 50 colorful particles rising from the bottom
3. New level number appears with spring animation (scale 0 → 1.5 → 1.0)
4. "Level Up!" text fades in below
5. Unlocked content is previewed (if any)
6. Haptic: Success pattern (tap-tap-tap)
7. Sound: Orchestral sting (C major chord swell, 800ms)
8. Confetti particles rain down for 2 seconds

---

## Prestige System

### How Prestige Works

At level 100, the user can choose to "prestige." Prestige resets the user's level back to 1 but grants:

1. A prestige badge (displayed on profile)
2. A permanent +10% XP multiplier per prestige level
3. A prestige-specific profile frame
4. Reset of all level-gated content (re-unlocked through gameplay)
5. Retention of all achievements, stats, and social connections

### Prestige Multiplier

```typescript
function getPrestigeMultiplier(prestigeLevel: number): number {
  return 1 + (prestigeLevel * 0.1);
}
```

| Prestige Level | XP Multiplier | Badge | Frame |
|---|---|---|---|
| 0 | 1.0x | None | None |
| 1 | 1.1x | Bronze | Bronze Frame |
| 2 | 1.2x | Silver | Silver Frame |
| 3 | 1.3x | Gold | Gold Frame |
| 4 | 1.4x | Platinum | Platinum Frame |
| 5+ | 1.5x (cap) | Diamond | Diamond Frame |

### Prestige Cap

The maximum prestige level is 5 (5.0x XP multiplier cap). This prevents an infinite grind and keeps the playing field reasonable. At prestige 5, a user earns 5x XP per session, making level-ups 5x faster.

### Prestige Confirmation

Prestige is a significant decision. The confirmation flow requires:

1. User clicks "Prestige" in profile
2. A confirmation screen shows:
   - "You will reset from level 100 to level 1"
   - "Your XP multiplier will become {newMultiplier}"
   - "You will keep: achievements, stats, friends, {X} game sessions"
   - "You will lose: level-gated content (must re-unlock)"
3. User types "PRESTIGE" to confirm
4. A cinematic prestige animation plays (5 seconds)
5. User is returned to the home screen at level 1 with the new multiplier

---

## Achievement System

### Achievement Categories

| Category | Description | Count |
|---|---|---|
| Mastery | High-performance achievements | 15 |
| Consistency | Streak and regularity achievements | 10 |
| Social | Friend and community achievements | 10 |
| Exploration | Trying different games and modes | 8 |
| Dedication | Long-term engagement achievements | 10 |
| Milestone | Total count milestones | 12 |

### Rarity Tiers

| Tier | Color | XP Reward | Difficulty |
|---|---|---|---|
| Common | Gray (#9B9B9B) | 50 XP | Easy |
| Uncommon | Green (#7ED321) | 100 XP | Moderate |
| Rare | Blue (#4A90D9) | 250 XP | Challenging |
| Epic | Purple (#9013FE) | 500 XP | Hard |
| Legendary | Gold (#F5A623) | 1,000 XP | Extreme |

### Achievement Definitions

**Mastery Achievements:**

| ID | Name | Description | Tier | Condition |
|---|---|---|---|---|
| `first_light` | First Light | Complete your first Reaction Light session | Common | sessions >= 1 |
| `lightning_fast` | Lightning Fast | Achieve average RT under 200ms | Rare | avg_rt < 200 |
| `perfect_30` | Perfect 30 | Complete 30 trials with zero lapses | Epic | session with 0 lapses, 30 trials |
| `consistency_king` | Consistency King | Maintain standard deviation under 30ms for 5 sessions | Rare | sd < 30 for 5 consecutive sessions |
| `sub_200` | Sub-200 Club | Achieve median RT under 200ms | Epic | median_rt < 200 |
| `iron_focus` | Iron Focus | Maintain 10-day streak | Uncommon | streak >= 10 |
| `speed_demon` | Speed Demon | Achieve fastest 10% under 180ms | Legendary | fastest_10pct < 180 |
| `marathon` | Marathon | Complete 100 total sessions | Rare | total_sessions >= 100 |
| `centurion` | Centurion | Reach level 100 | Legendary | level >= 100 |
| `night_owl` | Night Owl | Complete 10 sessions between 10PM-4AM | Uncommon | night_sessions >= 10 |
| `early_bird` | Early Bird | Complete 10 sessions between 5AM-7AM | Uncommon | early_sessions >= 10 |
| `century_club` | Century Club | Score 1000 on any game | Legendary | score >= 1000 |
| `all_rounder` | All-Rounder | Play all available games | Uncommon | all_games_played |
| `social_butterfly` | Social Butterfly | Add 10 friends | Uncommon | friends >= 10 |
| `triple Threat` | Triple Threat | Earn 3 achievements in one day | Rare | 3_achievements_same_day |

### Achievement Data Model

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'mastery' | 'consistency' | 'social' | 'exploration' | 'dedication' | 'milestone';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  icon: string;
  hidden: boolean; // If true, achievement is not shown until unlocked
  progressMax: number; // For progress-tracked achievements
}

interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: number;
  progress: number;
  completed: boolean;
}
```

### Achievement Progress Tracking

Many achievements track progress toward completion:

```typescript
function updateAchievementProgress(
  userAchievement: UserAchievement,
  achievement: Achievement,
  event: GameEvent
): UserAchievement {
  let newProgress = userAchievement.progress;

  switch (achievement.id) {
    case 'marathon':
      if (event.type === 'session_completed') {
        newProgress = userAchievement.progress + 1;
      }
      break;
    case 'perfect_30':
      if (event.type === 'trial_completed' && !event.data.isLapse) {
        newProgress = userAchievement.progress + 1;
      }
      break;
    // ... other achievements
  }

  const completed = newProgress >= achievement.progressMax;

  return {
    ...userAchievement,
    progress: Math.min(newProgress, achievement.progressMax),
    completed
  };
}
```

### Achievement Notification

When an achievement is unlocked:
1. A toast notification appears (slides in from top, 3 seconds)
2. The toast shows: Achievement icon + name + rarity color border
3. A subtle "ding" sound plays
4. A haptic feedback pulse is triggered
5. The achievement appears in the notifications feed
6. If the achievement is rare or above, a full-screen modal is shown

### Achievement Showcase

Users can select up to 5 achievements to display on their profile. The showcase is the primary social display of achievement. It is accessible from the profile page and visible to friends.

---

## Streak System

### How Streaks Work

A daily streak is maintained by completing at least one game session per day. The streak counter increments each day the user completes at least one session.

### Streak Rules

```typescript
interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string; // ISO date (YYYY-MM-DD)
  freezesAvailable: number;
  freezesUsed: number;
  lastFreezeDate: string | null;
}
```

**Streak maintenance rules:**

1. A session must be completed (not just started) to count for the streak
2. The session must be completed between midnight and 11:59 PM in the user's local timezone
3. Timezone changes are handled by comparing against the user's stored timezone
4. Sessions completed at 11:59:59 PM count for that day; sessions completed at 12:00:00 AM count for the next day

### Streak Freeze

Streak freezes protect a streak when a user misses a day.

**Freeze mechanics:**
- Maximum freezes per streak: 2
- Cost: `streakDays * 10 XP` (e.g., day 30 streak costs 300 XP to freeze)
- A freeze is automatically applied if the user has freezes available and misses a day
- The user is notified at the end of the day if a freeze was used
- Freezes can be manually toggled in settings (auto-freeze on/off)

**Freeze cost calculation:**

```typescript
function computeFreezeCost(streakDays: number): number {
  return streakDays * 10;
}
```

**Why the cost scales with streak length:** A 30-day streak is more valuable than a 3-day streak. The increasing cost prevents users from hoarding freezes for long streaks and adds meaningful choice to using them.

### Streak Recovery

If a user misses a day without a freeze:
1. The streak resets to 0
2. The user receives a "Streak Recovery" offer within 24 hours
3. Recovery cost: 50 XP (flat rate, regardless of streak length)
4. Recovery is available for 24 hours after the missed day
5. After 24 hours, the opportunity expires
6. Recovery can only be used once per 30-day period

### Streak Milestones

| Milestone | Reward | Badge |
|---|---|---|
| 7 days | 50 XP bonus + badge | "Week Warrior" |
| 14 days | 100 XP bonus + badge | "Two Week Titan" |
| 30 days | 200 XP bonus + badge | "Monthly Master" |
| 60 days | 300 XP bonus + badge | "Dedicated Disciplinarian" |
| 90 days | 500 XP bonus + badge | "Quarterly Champion" |
| 180 days | 750 XP bonus + badge | "Half-Year Hero" |
| 365 days | 1,000 XP bonus + badge | "Year-Long Legend" |

### Streak Display

The streak is prominently displayed in multiple locations:
- Home screen: Flame icon with day count (top-left area)
- Profile: Streak badge and current count
- Game results: "Streak maintained! {X} days" message
- Notifications: Daily reminder at user's preferred time (default: 8 PM)

---

## Daily Missions

### Mission Generation

3 missions are assigned daily at midnight (local time). The mission pool is curated to provide variety across game types and difficulty levels.

### Mission Types

| Type | Description | Example | Difficulty Range |
|---|---|---|---|
| Play | Complete a certain number of sessions | "Complete 3 Reaction Light sessions" | Easy |
| Perform | Achieve a specific performance metric | "Achieve average RT under 300ms" | Medium |
| Explore | Try a new game or mode | "Try Hard Mode for the first time" | Easy |
| Social | Engage with social features | "Challenge a friend" | Easy |
| Focus | Complete a session with perfect focus | "Complete a session with zero lapses" | Hard |
| Consistency | Perform similarly across sessions | "Complete 2 sessions with similar scores" | Medium |

### Mission Difficulty Scaling

Mission difficulty scales with the user's level:

| User Level | Mission Difficulty | Example Perform Mission |
|---|---|---|
| 1-10 | Easy | "Average RT under 400ms" |
| 11-20 | Medium | "Average RT under 350ms" |
| 21-40 | Hard | "Average RT under 300ms" |
| 41+ | Expert | "Average RT under 250ms" |

### Mission Rewards

```typescript
function getMissionXP(missionDifficulty: 'easy' | 'medium' | 'hard'): number {
  switch (missionDifficulty) {
    case 'easy': return 10;
    case 'medium': return 20;
    case 'hard': return 30;
  }
}
```

### Mission Streak

Completing all 3 daily missions in a single day grants a bonus:
- All 3 missions complete: +20 XP bonus
- 3-day all-missions streak: +10 XP additional bonus
- 7-day all-missions streak: +20 XP additional bonus
- 30-day all-missions streak: +50 XP additional bonus

### Missed Missions

- Missed missions from the previous day can be completed the next day for 50% XP
- Missed missions older than 1 day cannot be completed
- The "yesterday's missions" section appears on the missions screen until midnight

### Mission Data Model

```typescript
interface DailyMission {
  id: string;
  userId: string;
  date: string; // ISO date
  type: 'play' | 'perform' | 'explore' | 'social' | 'focus' | 'consistency';
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  target: number;
  current: number;
  completed: boolean;
  completedAt: number | null;
  xpAwarded: number;
}

interface MissionConfig {
  type: string;
  difficulty: string;
  description: string;
  target: number;
  xpReward: number;
  gameId?: string;
  metric?: string;
  threshold?: number;
}
```

### Mission Generation Algorithm

```typescript
function generateDailyMissions(userLevel: number, recentGames: string[]): DailyMission[] {
  const pool = getMissionPool(userLevel);
  const selected: DailyMission[] = [];

  // Ensure variety: no more than 1 of the same type
  const usedTypes = new Set<string>();

  while (selected.length < 3 && pool.length > 0) {
    // Random selection weighted by recent game usage
    const candidates = pool.filter(m => !usedTypes.has(m.type));
    if (candidates.length === 0) break;

    const weighted = candidates.map(c => ({
      ...c,
      weight: recentGames.includes(c.gameId) ? 2 : 1
    }));

    const chosen = weightedRandomSelect(weighted);
    selected.push(chosen);
    usedTypes.add(chosen.type);
  }

  return selected;
}
```

---

## Weekly Challenges

### Challenge Types

| Type | Description | Example | Difficulty |
|---|---|---|---|
| Endurance | Complete many sessions | "Complete 20 sessions this week" | Standard |
| Mastery | Achieve high scores | "Achieve top 10% score in Reaction Light" | Advanced |
| Social | Engage with friends | "Win 5 friend challenges" | Standard |
| Variety | Play different games | "Play 3 different games this week" | Standard |
| Improvement | Show measurable improvement | "Improve your average score by 10%" | Advanced |

### Challenge Lifecycle

1. Monday 00:00: New challenge announced
2. Monday-Sunday: Challenge period
3. Sunday 23:59: Challenge ends
4. Monday 00:01: Results computed, XP awarded
5. Tuesday: Weekly challenge leaderboard updated

### Challenge Rewards

| Difficulty | XP | Badge |
|---|---|---|
| Standard | 50 XP | "Weekly Warrior" |
| Advanced | 100 XP | "Weekly Champion" |
| Expert | 200 XP | "Weekly Master" |

### Challenge Data Model

```typescript
interface WeeklyChallenge {
  id: string;
  weekStart: string; // ISO date (Monday)
  weekEnd: string;   // ISO date (Sunday)
  type: 'endurance' | 'mastery' | 'social' | 'variety' | 'improvement';
  difficulty: 'standard' | 'advanced' | 'expert';
  description: string;
  target: number;
  gameId?: string;
  metric?: string;
}

interface UserChallengeProgress {
  userId: string;
  challengeId: string;
  current: number;
  completed: boolean;
  completedAt: number | null;
  rank: number | null;
  xpAwarded: number;
}
```

---

## Unlockable Content

### Games

| Level | Game | Description |
|---|---|---|
| 1 | Reaction Light Test | Reaction time measurement |
| 5 | N-Back Test | Working memory training |
| 10 | Stroop Test | Inhibitory control measurement |
| 15 | Trail Making Test | Cognitive flexibility |
| 20 | Symbol Digit Test | Processing speed |
| 30 | Dual N-Back | Advanced working memory |
| 40 | Stroop Advanced | Complex inhibitory control |
| 50 | PVT Extended | Extended sustained attention |

### Game Modes

| Level | Mode | Available For |
|---|---|---|
| 1 | Basic Mode | All games |
| 10 | Quick Mode (50% trials) | All games |
| 20 | Marathon Mode (2x trials) | All games |
| 30 | Hard Mode | All games |
| 40 | Zen Mode (no score, no pressure) | All games |
| 50 | Competitive Mode (ranked) | All games |

### Visual Themes

| Unlock | Theme | Availability |
|---|---|---|
| Default | "Midnight" | Always available |
| Level 7 | "Aurora" | Achievement: "Reach level 7" |
| Level 15 | "Ember" | Achievement: "Reach level 15" |
| Achievement | "Synthwave" | Achievement: "Complete 50 sessions" |
| Achievement | "Monochrome" | Achievement: "Score 900+ on any game" |
| Achievement | "Cyberpunk" | Achievement: "Reach level 50" |
| Achievement | "Nature" | Achievement: "30-day streak" |

### Profile Customizations

| Type | Items | Unlock Method |
|---|---|---|
| Avatars | 20+ options | Levels and achievements |
| Frames | Bronze, Silver, Gold, Platinum, Diamond | Prestige levels |
| Badges | 50+ achievement badges | Achievement unlocks |
| Bio | Custom text (200 chars) | Level 2 |
| Banner | 10+ profile banners | Various achievements |

### Sound Packs

| Pack | Description | Unlock |
|---|---|---|
| Default | Clean, minimal tones | Always available |
| Synth | Retro synthwave sounds | Level 9 |
| Nature | Organic nature-inspired sounds | Level 18 |
| Electronic | Electronic dance music-inspired | Level 30 |

### Statistics Access

| Level | Statistics Available |
|---|---|
| 1 | Basic: Last 5 sessions |
| 5 | Session history (all sessions) |
| 10 | Trend analysis (weekly/monthly) |
| 20 | Advanced analytics (distribution, percentiles) |
| 30 | Research-grade data export |
| 40 | Custom metric creation |

### Accessibility Unlock Policy

**All accessibility features are available from level 1 and are never locked behind progression.** This includes:
- Color blind modes
- Reduced motion
- Screen reader support
- High contrast mode
- Font scaling
- Keyboard navigation
- Haptic alternatives

Accessibility is a right, not a reward.

---

## Leaderboards

### Leaderboard Types

| Type | Scope | Reset | Metric |
|---|---|---|---|
| Global | All users | Weekly | Session score |
| Friends | User's friends | Weekly | Session score |
| Country | Users in same country | Monthly | Average score |
| Game-Specific | Users of a specific game | Weekly | Game score |
| Streak | All users | Never (cumulative) | Current streak days |
| Level | All users | Never (cumulative) | Level |

### Leaderboard Ranking

```typescript
interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string;
  rank: number;
  score: number;
  change: number; // Rank change from previous period
  badge: string | null; // Achievement badge if applicable
}

interface Leaderboard {
  id: string;
  type: string;
  scope: string;
  period: string;
  entries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  totalParticipants: number;
  updatedAt: number;
}
```

### Leaderboard Display

The leaderboard is displayed with:
- Top 10 entries always visible
- User's own rank highlighted (even if outside top 10)
- Animated rank changes (arrows for up/down)
- Clicking an entry shows the user's profile (with privacy settings respected)
- "Challenge" button next to each friend entry

### Anti-Gaming Measures

To prevent leaderboard manipulation:
- Only sessions with valid anti-cheat verification are eligible
- Maximum 10 leaderboard-eligible sessions per day per user
- Ties are broken by: fewer total sessions (quality over quantity), then earlier completion time
- Suspicious scores are flagged and held for review before appearing on the leaderboard

---

## Social Progression

### Friend System

- Maximum friends: 100
- Friend requests: Sent and accepted via profile search
- Mutual friends required for: challenges, shared leaderboards, profile viewing
- Block: Prevents all interaction, invisible on leaderboards

### Challenges

Users can challenge friends to head-to-head game sessions:

```typescript
interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  gameId: string;
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  challengerScore: number | null;
  challengedScore: number | null;
  winner: string | null;
  createdAt: number;
  expiresAt: number; // 7 days from creation
  xpAwarded: { challenger: number; challenged: number };
}
```

Challenge rules:
- Both users play the same game with the same configuration
- Scores are compared after both complete
- Winner earns 15 XP, loser earns 5 XP (participation)
- If both users have not completed within 7 days, the challenge expires
- A user can have a maximum of 5 active challenges

### Shared Leaderboards

The friends leaderboard shows all friends' weekly scores in a single view. It resets every Monday at midnight UTC. The top friend each week earns a "Weekly Champion" badge on their profile.

---

## Notification Strategy

### Notification Types

| Trigger | Channel | Timing | Frequency Cap |
|---|---|---|---|
| Streak reminder | Push | User's preferred time | 1/day |
| Daily missions available | Push | Midnight local | 1/day |
| Weekly challenge reminder | Push | Wednesday midday | 1/week |
| Achievement unlocked | In-app | Immediate | No cap |
| Friend challenge received | Push + In-app | Immediate | No cap |
| Streak at risk | Push | 8 PM local | 1/day |
| Level up | In-app | Immediate | No cap |
| Weekly summary | Email | Sunday evening | 1/week |

### Notification Preferences

Users can configure notifications in settings:
- Streak reminders: On/Off
- Daily missions: On/Off
- Weekly challenges: On/Off
- Social notifications: On/Off
- Push notification time: Customizable (default: 8 PM)
- Quiet hours: Start/end time (no notifications during quiet hours)
- Email notifications: Weekly summary On/Off

### Smart Notification Timing

The platform learns when users are most active and schedules notifications accordingly:

```typescript
function getOptimalNotificationTime(userSessions: SessionRecord[]): number {
  if (userSessions.length < 7) return 20 * 60; // Default: 8 PM

  // Find the most common session hour
  const hourCounts = new Array(24).fill(0);
  for (const session of userSessions) {
    const hour = new Date(session.startedAt).getHours();
    hourCounts[hour]++;
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  // Notify 2 hours before the peak hour
  return ((peakHour - 2 + 24) % 24) * 60;
}
```

---

## Data Schema

### Progression Tables

```sql
-- User progression state
CREATE TABLE user_progression (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  level INTEGER NOT NULL DEFAULT 1,
  xp_total BIGINT NOT NULL DEFAULT 0,
  xp_current_level BIGINT NOT NULL DEFAULT 0,
  prestige_level INTEGER NOT NULL DEFAULT 0,
  prestige_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- XP ledger (immutable)
CREATE TABLE xp_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE RULE xp_ledger_no_update AS ON UPDATE TO xp_ledger DO INSTEAD NOTHING;
CREATE RULE xp_ledger_no_delete AS ON DELETE TO xp_ledger DO INSTEAD NOTHING;

-- Achievements
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  icon TEXT NOT NULL,
  hidden BOOLEAN DEFAULT false,
  progress_max INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User achievements
CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, achievement_id)
);

-- Streak state
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_session_date DATE,
  freezes_available INTEGER DEFAULT 0,
  freezes_used INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily missions
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  description TEXT NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date, type)
);

-- Weekly challenges
CREATE TABLE weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  description TEXT NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  rank INTEGER,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, week_start)
);

-- Unlocked content
CREATE TABLE user_unlocks (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  unlock_type TEXT NOT NULL,
  unlock_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, unlock_type, unlock_id)
);

-- Leaderboards
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id TEXT NOT NULL,
  leaderboard_type TEXT NOT NULL,
  period TEXT NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, game_id, leaderboard_type, period)
);

CREATE INDEX idx_leaderboard_score ON leaderboard_entries(leaderboard_type, period, score DESC);
```

### Indexes

```sql
CREATE INDEX idx_user_progression_level ON user_progression(level);
CREATE INDEX idx_xp_ledger_user ON xp_ledger(user_id, created_at DESC);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, completed);
CREATE INDEX idx_user_streaks_streak ON user_streaks(current_streak DESC);
CREATE INDEX idx_daily_missions_user_date ON daily_missions(user_id, date);
CREATE INDEX idx_weekly_challenges_user ON weekly_challenges(user_id, week_start);
CREATE INDEX idx_leaderboard_entries_period ON leaderboard_entries(leaderboard_type, period, score DESC);
```

---

## Anti-Abuse Measures

### XP Farming Prevention

| Measure | Implementation |
|---|---|
| Minimum session duration | Sessions under 10 seconds earn 0 XP |
| Maximum daily XP cap | 2,000 XP per day (approximately 40 sessions) |
| Score verification | Anti-cheat must pass for XP to be awarded |
| Duplicate session detection | Same score submitted twice from same device within 5 minutes is rejected |
| Cooldown between sessions | 10-second minimum between session completions |

### Achievement Fraud Prevention

| Measure | Implementation |
|---|---|
| Server-side verification | Achievement conditions verified server-side |
| Rate limiting | Maximum 10 achievements unlocked per day |
| Audit trail | All achievement unlocks logged with session data |
| Manual review | Legendary achievements flagged for review |

### Leaderboard Integrity

| Measure | Implementation |
|---|---|
| Anti-cheat verification | Required for leaderboard eligibility |
| Maximum sessions per day | 10 leaderboard-eligible sessions |
| Statistical validation | Outlier scores held for 24 hours |
| Report system | Users can report suspicious scores |
| Appeal process | Flagged users can submit evidence of legitimacy |

### Account Abuse Prevention

| Measure | Implementation |
|---|---|
| Multi-account detection | IP, device fingerprint, and behavioral analysis |
| Boosting detection | Mutual win/loss patterns between friends |
| Session manipulation | Event integrity verification |
| Network analysis | Bot network detection patterns |

### Rate Limiting for Progression Actions

| Action | Limit | Window |
|---|---|---|
| Claim streak | 1 | 24 hours |
| Use freeze | 1 | 24 hours |
| Recover streak | 1 | 30 days |
| Prestige | 1 | Lifetime |
| Accept challenge | 10 | 1 hour |
| Send challenge | 10 | 1 hour |
| Claim daily mission | 3 | 24 hours |
| Share achievement | 10 | 1 hour |
