# Chapter 09: Social & Leaderboard Systems

## Overview

The social and leaderboard systems transform individual cognitive training into a connected, motivating experience. This chapter defines every aspect of how users interact with each other, compete, compare progress, and form communities within the FOCUS platform. Every design decision in this chapter prioritizes motivation through healthy competition while preventing the toxic dynamics that plague competitive gaming platforms. FOCUS is a cognitive performance platform — the social layer must reinforce that identity, not degrade it into a social media clone or a gaming lobby.

The social system operates on three tiers: **passive social** (profiles, leaderboards, activity feeds), **async social** (challenges, reactions, messages), and **groups** (study groups, group challenges, group leaderboards). Real-time chat is deliberately excluded from the core experience — FOCUS is about focused training, not distraction. The only real-time element is direct messaging between friends, and even that is text-only with moderation.

---

## 9.1 Friend System

### 9.1.1 Sending Friend Requests

Users can send friend requests through two mechanisms: **username search** and **invite links**.

**Username Search:**
- Users type a username into the search field on the Friends page
- Search is case-insensitive and supports partial matching
- Results return up to 20 users sorted by relevance (exact match first, then prefix match, then contains match)
- Each result shows: avatar, username, level, country flag, mutual friends count
- The "Add Friend" button appears next to each result
- Rate limit: 10 search requests per minute to prevent scraping

**Invite Links:**
- Each user can generate a unique invite link: `https://focus.app/invite/{invite_code}`
- Invite codes are 8-character alphanumeric strings (base62 encoded, case-sensitive)
- Invite links can be shared via any platform (social media, messaging apps, email)
- Invite links expire after 30 days
- Each user can have a maximum of 5 active invite links at any time
- When a user joins via invite link, the inviter receives a notification
- Invite links can be revoked at any time

**Request Flow:**
1. User A sends friend request to User B
2. User B receives a notification (in-app + push notification if enabled)
3. User B can Accept, Decline, or Ignore the request
4. Declining removes the request silently (User A is not notified of decline)
5. Ignoring hides the request for 7 days, after which it reappears
6. If User B does not respond within 30 days, the request auto-expires
7. User A cannot send another request to the same user for 7 days after decline or expiry

### 9.1.2 Friend Request States

Each friend request exists in exactly one state at any time:

| State | Description |
|-------|-------------|
| `PENDING` | Request sent, awaiting response from recipient |
| `ACCEPTED` | Recipient accepted, both users are now friends |
| `BLOCKED` | Recipient blocked the sender (sender's request is auto-declined and hidden) |

Additional state `DECLINED` exists in the database for analytics purposes but is not user-facing. Declined requests are deleted from the active request table after 30 days and moved to an archive table for analytics only.

### 9.1.3 Friend Limits

The platform enforces a soft limit on friends:

- **Standard users:** 500 friends maximum
- **Premium users:** 1,000 friends maximum

When a user approaches the limit (within 10 friends), a subtle notification appears on the Friends page: "You're approaching your friend limit." When the limit is reached, the "Add Friend" button becomes disabled and shows "Friend limit reached." The user must remove existing friends before adding new ones.

The limit exists for several reasons:
1. **Database performance:** Friend relationships are queried frequently for leaderboard calculations, activity feeds, and challenge systems. Unbounded friend lists would degrade query performance.
2. **Notification overload:** More friends means more notifications. The limit keeps the experience manageable.
3. **Social quality:** Research on social network size (Dunbar's number) suggests that maintaining meaningful connections is limited. 500 is generous while still encouraging intentional friendships.

### 9.1.4 Friend Activity Feed

The activity feed shows recent activities from a user's friends. This is the primary passive social feature — users see what their friends are doing without having to actively check profiles.

**Feed Items:**
- Session completed (game played, score achieved)
- Achievement unlocked
- Level up
- Personal best (any game)
- Season rank change (moved up/down on leaderboard)
- Challenge sent/received
- Profile update (new avatar, new achievement showcase)
- Group joined

**Feed Behavior:**
- Items are sorted by timestamp (most recent first)
- Items older than 7 days are not shown
- Maximum 100 items loaded initially, with pagination for older items
- Feed is cached per user and invalidated when a friend performs an action
- Real-time updates appear at the top of the feed with a subtle animation
- Users can filter by: All, Achievements, Sessions, Challenges

**Privacy Control:**
- Activity feed visibility is controlled by the user's privacy setting
- Users can hide specific activity types from the feed (e.g., hide session completions but show achievements)
- Blocked users' activities are completely excluded from the feed

### 9.1.5 Friend Comparison

Users can compare their stats side-by-side with any friend. This feature is accessible from the friend's profile page or from the friends list.

**Comparison Data:**
- Overall level and XP
- Total sessions played
- Average score per game
- Best score per game
- Current streak
- Total time trained
- Achievement count
- Cognitive profile (averages for each cognitive dimension)
- Recent trend (improving/declining over last 30 days)

**Comparison Display:**
- Two-column layout with each user's stats on their side
- The "better" stat is highlighted with a subtle glow effect
- A summary at the bottom shows: "You lead in 6/10 categories"
- Stats are compared in real-time (no caching for comparison view)

### 9.1.6 Friend Challenges

Friends can challenge each other to game sessions. This is the primary async competitive social feature.

**Challenge Flow:**
1. User A selects a friend to challenge
2. User A chooses a game and optional parameters (difficulty, duration, specific rules)
3. User A writes an optional message (max 200 characters)
4. Challenge is sent — User B receives a notification
5. User B accepts the challenge
6. Both users play the same game with the same parameters (within a 24-hour window)
7. When both have completed the session, results are compared
8. Winner is declared (or tie if scores are within 1% of each other)
9. Both users receive a summary notification

**Challenge Rules:**
- Both users must play the same game with identical parameters
- Each user has 24 hours to complete their session after accepting
- If either user does not complete in time, the other wins by default
- If neither completes in time, the challenge is voided
- Maximum 3 active challenges per user at any time (prevents challenge spam)
- Challenges are archived after resolution and accessible in the challenge history

**Challenge Results:**
- Winner gets bragging rights (shown on profile as "X challenges won")
- Both scores are recorded with a `challenge_id` link
- A public "Challenge Record" shows on both profiles: wins, losses, ties
- The winner can send a reaction (emoji) to the loser's profile
- Both users receive XP for completing a challenge (winner gets bonus XP)

### 9.1.7 Friend Notifications

Friends receive notifications for specific events related to their friends' activities:

**Notification Types:**
| Event | Notification | Default |
|-------|-------------|---------|
| Friend achieved a milestone (level 10, 25, 50, etc.) | In-app + push | On |
| Friend beat your score on any game | In-app + push | On |
| Friend unlocked an achievement | In-app | On |
| Friend sent a challenge | In-app + push | Always on (cannot disable) |
| Friend completed a challenge against you | In-app + push | Always on |
| Friend's season rank changed significantly (top 100, top 10) | In-app | On |

**Notification Behavior:**
- Notifications are grouped: "3 friends achieved milestones today"
- Users can mute notifications from specific friends
- Users can disable specific notification types globally
- Push notifications are sent only for high-importance events
- In-app notifications persist until viewed or dismissed
- Notification badge on the bell icon shows unread count

### 9.1.8 Blocking

Blocking is a critical safety feature. When User A blocks User B:

**Immediate Effects:**
- User B is removed from User A's friend list (if they were friends)
- All pending friend requests between them are cancelled
- User B cannot send friend requests to User A
- User B cannot send direct messages to User A
- User B cannot see User A's profile (returns "User not found")
- User A is hidden from User B's friend suggestions
- User A's activities are removed from User B's activity feed
- User A is removed from User B's challenge history (scores remain, names hidden)

**Notification to Blocked User:**
- User B receives NO notification that they have been blocked
- If User B attempts to view User A's profile, they see a generic "User not found" page
- If User B attempts to send a friend request, the request silently fails

**Unblocking:**
- User A can unblock User B at any time from Settings > Blocked Users
- Unblocking does not automatically restore the friendship — a new friend request must be sent
- Unblocking is effective immediately

### 9.1.9 Privacy Levels

Each user controls their profile visibility with three privacy levels:

| Level | Profile | Stats | Activity | Leaderboard |
|-------|---------|-------|----------|-------------|
| `PUBLIC` | Visible to everyone | Visible to everyone | Visible to friends | Visible on all leaderboards |
| `FRIENDS_ONLY` | Visible to friends only | Visible to friends only | Visible to friends only | Visible only on friends leaderboard |
| `PRIVATE` | Not visible to anyone | Not visible to anyone | Not visible to anyone | Opted out of all leaderboards |

**Privacy Granularity:**
Users can also control individual settings:
- Show/hide country flag on profile
- Show/hide level on profile
- Show/hide achievement showcase
- Show/hide from search results
- Show/hide last online timestamp
- Enable/disable direct messages from non-friends
- Enable/disable friend suggestions

---

## 9.2 Leaderboard Architecture

### 9.2.1 Leaderboard Types

FOCUS supports nine distinct leaderboard types, each serving a different competitive context:

**1. Global All-Time:**
- All-time best scores across all users
- Permanent record — never resets
- Primary metric for platform prestige
- Displayed on the main leaderboard page as the default view

**2. Global Weekly:**
- Best scores achieved within the current week (Monday 00:00 UTC to Sunday 23:59 UTC)
- Resets every Monday
- Encourages consistent weekly engagement
- Top performers earn weekly badges

**3. Global Monthly:**
- Best scores achieved within the current month
- Resets on the 1st of each month at 00:00 UTC
- Monthly rewards: Exclusive badges and XP bonuses
- Monthly leaderboard determines "Player of the Month" recognition

**4. Regional:**
- Leaderboards filtered by country/region
- Determined by user's self-declared country (set once, change requires support request)
- Encourages regional competition and national pride
- Top performers per region are highlighted on the regional leaderboard page

**5. Friends:**
- Leaderboard among a user's friends only
- Only shows if the user has at least 3 friends who have played the game
- Encourages friendly competition
- Always visible — even if the user is not on any global leaderboard

**6. Group:**
- Leaderboard within a study group
- Only visible to group members
- Encourages group engagement and accountability
- Group admins can pin a specific leaderboard as the group's primary metric

**7. Seasonal:**
- Leaderboard for the current competitive season
- Resets at the start of each new season
- Season-specific rewards and recognition
- Cumulative season score determines season rank

**8. Game-Specific:**
- Separate leaderboard for each game module
- Filtered by game_id
- Shows game-specific metadata (e.g., average reaction time, accuracy percentage)
- Each game can have its own leaderboard rules (e.g., "lowest time wins" vs "highest score wins")

**9. Skill-Based (ELO-like):**
- Matched by cognitive skill rating
- Users are grouped into skill tiers based on their FOCUS Skill Rating (FSR)
- FSR is calculated using a modified ELO algorithm that considers:
  - Win/loss ratio against other players
  - Score relative to expected performance
  - Consistency of performance
  - Difficulty of games played
- Tiers: Bronze (0-999), Silver (1000-1499), Gold (1500-1999), Platinum (2000-2499), Diamond (2500+)
- Skill-based leaderboards prevent new users from being overwhelmed by veterans
- FSR is separate from level — level measures time invested, FSR measures actual skill

### 9.2.2 Leaderboard Entry Structure

Every leaderboard entry is stored as a database record with the following structure:

```
LeaderboardEntry {
  id: UUID (primary key)
  user_id: UUID (foreign key to users table)
  game_id: VARCHAR (foreign key to games table)
  score: DECIMAL(10,2) (the primary score metric)
  metadata: JSONB (additional score data)
  timestamp: TIMESTAMP (when the score was achieved)
  leaderboard_type: ENUM (GLOBAL_ALLTIME, GLOBAL_WEEKLY, GLOBAL_MONTHLY, REGIONAL, FRIENDS, GROUP, SEASONAL, GAME_SPECIFIC, SKILL_BASED)
  season_id: UUID (foreign key to seasons table, nullable)
  group_id: UUID (foreign key to groups table, nullable)
  region: VARCHAR(2) (ISO 3166-1 alpha-2 country code)
  validated: BOOLEAN (whether the score passed anti-abuse checks)
  flagged: BOOLEAN (whether the score was flagged for review)
  fsr_before: DECIMAL(6,2) (FSR before this score)
  fsr_after: DECIMAL(6,2) (FSR after this score)
}
```

**Metadata JSONB Structure:**
```json
{
  "reaction_time_avg": 245.3,
  "reaction_time_sd": 32.1,
  "accuracy": 94.5,
  "consistency": 87.2,
  "streak_max": 12,
  "total_trials": 30,
  "correct_trials": 28,
  "false_starts": 1,
  "misses": 1,
  "session_duration": 180,
  "difficulty": "hard",
  "version": "2.1.0"
}
```

### 9.2.3 Ranking Algorithm

Leaderboards rank entries using a three-tier sorting system:

**Primary Sort: Score (descending for most games)**
- Higher scores rank higher
- Some games invert this (e.g., reaction time: lower is better)
- The game configuration specifies the sort direction

**Tiebreaker 1: Timestamp (ascending)**
- Earlier scores rank higher among tied scores
- This rewards users who achieved a score first
- Prevents leaderboard churn when multiple users have the same score

**Tiebreaker 2: Consistency (ascending standard deviation)**
- Lower standard deviation (more consistent performance) ranks higher
- This breaks ties where timestamps are identical (rare but possible in batch submissions)
- Encourages consistent performance over lucky one-offs

**SQL Implementation:**
```sql
SELECT * FROM leaderboard_entries
WHERE game_id = $1 AND leaderboard_type = $2
ORDER BY
  score DESC,
  timestamp ASC,
  (metadata->>'reaction_time_sd')::DECIMAL ASC
LIMIT 100;
```

### 9.2.4 Anti-Abuse Measures

Leaderboard integrity is critical for maintaining user trust. The platform implements five anti-abuse measures:

**1. Minimum Sessions Required:**
- A user must complete at least 5 sessions of a game before appearing on that game's leaderboard
- This prevents new accounts from immediately appearing on leaderboards with a single lucky score
- The requirement is per-game — completing 5 sessions of Game A does not qualify you for Game B's leaderboard
- Session count is tracked per user per game in the `user_game_sessions` table

**2. Statistical Validation:**
- Every score is checked against the game's score distribution
- The system calculates the z-score of the score relative to the game's mean and standard deviation
- Scores with a z-score greater than 4.0 are flagged for manual review
- Scores with a z-score greater than 5.0 are automatically rejected
- The score distribution is recalculated weekly using the last 90 days of data

**3. Suspicious Score Flagging:**
- A score is flagged if:
  - The user improved by more than 3 standard deviations in a single session compared to their previous best
  - The user's score is more than 3 standard deviations above their rolling 30-day average
  - The user achieved a perfect score on a game they have never played before
- Flagged scores appear on a review queue for moderators
- Flagged scores are still visible on leaderboards but marked with a subtle "under review" indicator
- If a flagged score is found to be legitimate, it is unflagged and the indicator is removed

**4. Account Age Requirement:**
- Accounts must be at least 7 days old to appear on any leaderboard
- This prevents users from creating new accounts to bypass leaderboard bans or to farm "new player" recognition
- The 7-day window starts from account creation, not first login

**5. Report System:**
- Users can report suspicious scores directly from the leaderboard
- The report button appears on each leaderboard entry (next to the score)
- When reporting, the user selects a reason:
  - "Impossible score" — score exceeds known human capability
  - "Suspicious improvement" — score improvement is unrealistic
  - "Cheating/bot" — suspected use of automation
  - "Other" — free-text description (max 500 characters)
- Reports are queued for moderator review
- A user can file a maximum of 5 reports per day to prevent report spam
- Reporters are notified when their report is resolved
- False reporting (filing reports against legitimate scores) is tracked and can result in report privileges being revoked

### 9.2.5 Leaderboard Refresh Strategy

Leaderboards are refreshed at different intervals based on rank to balance real-time accuracy with database performance:

**Real-time (Top 100):**
- The top 100 entries on each leaderboard are updated in real-time
- A database trigger fires on every validated score insertion
- The trigger updates a materialized view of the top 100
- Latency: <500ms from score submission to leaderboard update
- This ensures top performers see their rank changes immediately

**Hourly (101-1000):**
- Entries ranked 101-1000 are refreshed hourly
- A pg_cron job runs every hour to recalculate these positions
- The refresh updates a materialized view that is swapped atomically (no downtime)
- Users in this range see their position updated at most 1 hour after score submission

**Daily (1001+):**
- Entries ranked 1001+ are refreshed daily
- A pg_cron job runs at 02:00 UTC to recalculate all positions
- This is sufficient for the vast majority of users who are not in competitive range
- Users see their daily position change each morning

**Materialized View Strategy:**
```sql
-- Create materialized view for each leaderboard type + game combination
CREATE MATERIALIZED VIEW leaderboard_weekly_game_1 AS
SELECT
  le.user_id,
  le.score,
  le.metadata,
  le.timestamp,
  RANK() OVER (ORDER BY le.score DESC, le.timestamp ASC) as rank
FROM leaderboard_entries le
WHERE le.leaderboard_type = 'GLOBAL_WEEKLY'
  AND le.game_id = 'game_1'
  AND le.validated = true
  AND le.flagged = false;

-- Refresh via pg_cron
SELECT cron.schedule('refresh_weekly_top100', '*/15 * * * *', -- every 15 min for top 100
  'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly_game_1_top100');
```

### 9.2.6 Leaderboard Display

The leaderboard UI is designed for clarity, engagement, and fairness:

**Standard Entry Display:**
- Rank number (left-aligned, monospace font)
- Avatar (32px circular)
- Username (with verified badge if applicable)
- Country flag (2-letter ISO code, emoji flag)
- Score (monospace, right-aligned, animated count-up on load)
- Rank change indicator (green up arrow + number, red down arrow + number, grey dash for no change)

**Top 3 Special Treatment:**
- Rank 1: Gold background glow, crown icon, score in gold text
- Rank 2: Silver background glow, medal icon, score in silver text
- Rank 3: Bronze background glow, medal icon, score in bronze text
- Top 3 entries are displayed in a separate section above the rest of the leaderboard
- Top 3 have a larger entry card (80px height vs 56px for standard entries)

**Your Position:**
- Regardless of actual rank, the user's own position is always visible
- If the user is ranked outside the top 100, a special "Your Position" card appears at the bottom of the visible list
- The card shows: rank, avatar, username, score, rank change
- A separator line with "..." indicates there are entries between the visible range and your position

**Animated Rank Changes:**
- When the leaderboard refreshes, rank changes animate:
  - Entries moving up slide up with a spring animation
  - Entries moving down slide down with a spring animation
  - New entries fade in with a scale spring
  - Removed entries fade out
- Animation duration: 300ms
- Animation only plays on desktop — mobile shows static updates to save battery

**Filters and Sorting:**
- Filter by: Game, Time Period (weekly/monthly/all-time), Region, Friends
- Sort by: Score (default), Rank Change, Consistency
- Search: Find a specific user on the leaderboard
- Each filter is a pill toggle that applies instantly

---

## 9.3 Seasonal System

### 9.3.1 Season Structure

Each season lasts exactly 3 months (90 days):

- **Start:** 1st of January, April, July, October at 00:00 UTC
- **End:** Last day of March, June, September, December at 23:59 UTC
- **Grace Period:** 7 days after season end (no new season starts for 7 days)
- **Pre-Season:** 3 days before season start (countdown displayed, no scoring)

**Season Identifiers:**
```
Season {
  id: UUID
  name: VARCHAR (e.g., "Season 7: Neural Surge")
  number: INTEGER (sequential, starting from 1)
  start_date: TIMESTAMP
  end_date: TIMESTAMP
  grace_period_end: TIMESTAMP
  theme_id: UUID (references visual theme for the season)
  is_active: BOOLEAN
}
```

### 9.3.2 Season Rewards

Each season offers exclusive rewards that can only be earned during that season:

**Badge Rewards:**
- Season Participant: Played at least 10 sessions during the season
- Season Warrior: Completed 50+ sessions during the season
- Season Champion: Reached top 1000 on the seasonal leaderboard
- Season Elite: Reached top 100 on the seasonal leaderboard
- Season Legend: Reached top 10 on the seasonal leaderboard
- Season Victor: Finished #1 on the seasonal leaderboard

**Theme Rewards:**
- Exclusive profile frame (based on season number)
- Exclusive avatar border (based on season rank)
- Exclusive score display style (based on season performance)
- These are cosmetic-only and do not affect gameplay

**XP Rewards:**
- Season Participant: 500 bonus XP
- Season Warrior: 1,500 bonus XP
- Season Champion: 5,000 bonus XP
- Season Elite: 15,000 bonus XP
- Season Legend: 50,000 bonus XP
- Season Victor: 100,000 bonus XP

### 9.3.3 Season Rank

Season rank is determined by **cumulative season score** — the sum of all scores achieved during the season across all games:

- Each game contributes equally to the season score
- The season score is normalized per game (so a 90% in Game A counts the same as a 90% in Game B)
- This encourages playing all games rather than specializing in one
- The season score is the primary metric for the seasonal leaderboard

### 9.3.4 Season Transitions

When a season ends:

1. **Final Scoring (0-24 hours):** All scores achieved in the final hour are validated. Late submissions (due to network issues) are accepted up to 24 hours after season end.
2. **Results Compilation (24-48 hours):** Final rankings are calculated. All rewards are determined.
3. **Reward Distribution (48-72 hours):** Rewards are distributed to user profiles. Notification sent to all participants.
4. **Grace Period (3-7 days):** No active season. Users can view final season results. Leaderboard shows "Season Ended" state.
5. **New Season Launch (Day 7):** New season begins with new theme, new rewards, reset seasonal leaderboard.

### 9.3.5 Season Themes

Each season has a unique visual theme that affects the platform's appearance:

- **Season 1: Neural Genesis** — Deep blue + white, electric particle effects
- **Season 2: Synaptic Storm** — Purple + orange, lightning effects
- **Season 3: Cortex Core** — Green + gold, organic flowing effects
- **Season 4: Quantum Leap** — Cyan + magenta, quantum particle effects
- **Season 5: Cerebral Summit** — Red + silver, mountain/peak effects
- **Season 6: Neural Surge** — Teal + amber, wave effects

Themes are selected by the design team 3 months before the season starts. Themes affect:
- App background gradient
- Card borders and accents
- Loading animations
- Achievement badge styles
- Leaderboard visual treatment
- Seasonal notification styles

---

## 9.4 Social Features

### 9.4.1 Profile Page

Each user has a public (or semi-public, based on privacy settings) profile page:

**Profile Elements:**
- **Avatar:** 128px circular image (uploaded or generated from initials)
- **Username:** Displayed prominently, with verified badge if applicable
- **Level:** Current level with XP progress bar
- **Bio:** Optional text bio (max 300 characters)
- **Country:** Country flag (self-declared)
- **Member Since:** Date of account creation
- **Achievement Showcase:** Up to 6 selected achievements displayed prominently
- **Stats Overview:** Total sessions, total time trained, current streak
- **Recent Activity:** Last 5 activities (sessions, achievements, level-ups)
- **Friends Count:** Number of friends (if profile is public)
- **Leaderboard Positions:** Current rank on active leaderboards

**Profile Customization:**
- Avatar: Upload custom image or choose from generated options
- Profile frame: Earned through seasons and achievements
- Background: Earned through achievements (locked by default)
- Theme: Applied based on season participation

### 9.4.2 Activity Feed

The activity feed (detailed in section 9.1.4) is the primary passive social feature. It appears on the home screen as a scrollable list of recent activities from friends.

**Feed Algorithm:**
- Items are not purely chronological — the algorithm considers:
  - Recency (more recent = higher priority)
  - Importance (achievements > level-ups > sessions)
  - Relationship closeness (close friends' activities are prioritized)
  - Engagement potential (activities the user is likely to care about)
- The algorithm does NOT prioritize controversial or divisive content (unlike social media feeds)

### 9.4.3 Sharing

Users can share their scores and achievements to external platforms:

**Shareable Content:**
- Session score (with game name, score, and stats)
- Achievement unlocked (with achievement name and description)
- Level reached (with level number)
- Leaderboard position (with rank and game)

**Share Destinations:**
- Copy to clipboard (always available)
- Twitter/X (via share URL)
- Instagram (via story image generation)
- Facebook (via share URL)
- WhatsApp (via share URL)
- Telegram (via share URL)
- Email (via mailto: link)

**Share Card Generation:**
When sharing, the platform generates a visually appealing share card:
- Background: Season theme gradient
- Score/achievement prominently displayed
- FOCUS branding (subtle, bottom corner)
- Game icon and name
- User's username (no personal info)
- Share card is generated as a 1200x630px PNG for optimal social media preview

### 9.4.4 Groups (Study Groups)

Groups are the primary community feature in FOCUS. They function as study groups — focused on cognitive training, not general socializing.

**Group Creation:**
- Any user can create a group
- Group name: 3-50 characters (alphanumeric, spaces, hyphens)
- Group description: Max 500 characters
- Group type: Public (anyone can join) or Private (invite-only)
- Maximum members per group: 100

**Group Roles:**
| Role | Permissions |
|------|------------|
| Owner | Full control — edit group, manage members, delete group, assign admins |
| Admin | Manage members (kick, mute), edit group settings, create challenges |
| Member | Participate in group activities, post in group chat, view group leaderboard |

**Group Features:**

*Group Chat:*
- Text-only chat within the group
- Messages are moderated (automated profanity filter + manual moderation for flagged content)
- Maximum message length: 500 characters
- No images, no links (links are stripped automatically)
- Chat history is retained for 90 days
- Admins can delete messages and mute members
- Real-time chat (WebSocket-based) — but only text, no voice, no video

*Group Challenges:*
- Admins or owners can create group challenges
- Challenge format: "Play Game X with parameters Y, highest score wins"
- Challenge duration: 24 hours, 48 hours, or 7 days
- All group members are notified when a challenge is created
- Results are displayed on the group's challenge board
- Challenge history is preserved

*Group Leaderboard:*
- Shows all group members' scores for a selected game
- Default: Last 7 days
- Can be filtered by: Game, Time Period (this week, this month, all time)
- Group admins can pin a specific game/time period as the default view

### 9.4.5 Direct Messaging

Direct messaging is available between friends:

**Message Rules:**
- Text-only (no images, no links, no voice messages)
- Maximum message length: 500 characters
- Messages are stored for 1 year
- Messages are moderated (automated profanity filter)
- Users can delete their own messages
- Users can report messages
- Block applies to messaging — blocked users cannot send messages

**Message UI:**
- Simple chat interface (similar to iMessage/WhatsApp but text-only)
- Unread message indicator on the friends list
- Push notification for new messages (if enabled)
- Message history is scrollable

### 9.4.6 Reactions

Users can react to friend achievements with emojis:

**Reaction Types:**
- 🎉 (celebrate)
- 🔥 (fire)
- 💪 (strong)
- 🧠 (smart)
- ⭐ (star)
- 👏 (clap)

**Reaction Rules:**
- Maximum 1 reaction per achievement per user
- Reactions can be changed or removed
- Total reaction count is shown on the achievement
- Users receive a notification when their achievement receives a reaction
- Reactions are anonymous (the achievement owner sees the count, not who reacted — unless the reactor is a friend)

### 9.4.7 Motivation System

The motivation system allows friends to encourage each other:

**Encouragement Messages:**
- Pre-written messages that can be sent to friends:
  - "Keep pushing! You're doing great! 💪"
  - "Your consistency is inspiring! 🧠"
  - "Can't wait to see your next score! ⭐"
  - "You're on fire! Keep it up! 🔥"
- Custom messages are NOT available (prevents misuse)
- Maximum 5 encouragements sent per day
- Recipients receive a notification with the encouragement

---

## 9.5 Privacy & Safety

### 9.5.1 Profile Visibility

Users control who can see their profile through the three privacy levels defined in section 9.1.9. Additional controls:

- **Search visibility:** Users can opt out of appearing in username search results
- **Profile link visibility:** Users can disable their profile being accessible via direct URL
- **Stats visibility:** Users can hide specific stats while keeping their profile public

### 9.5.2 Activity Feed Visibility

- Users can completely hide their activity feed from all users
- Users can hide specific activity types (e.g., hide session completions but show achievements)
- Users can exclude specific friends from seeing their activities
- Activity feed items automatically expire after 30 days

### 9.5.3 Leaderboard Opt-Out

Users can opt out of leaderboards entirely:
- Opting out removes the user from all leaderboard types
- The user's scores are still tracked for personal statistics
- The user can opt back in at any time
- Opting out does not affect friend comparisons or group leaderboards (the user chooses separately)

### 9.5.4 Data Sharing Consent

The platform requires explicit consent for data sharing:

- **Analytics data:** Anonymized usage data for platform improvement (opt-in during onboarding)
- **Leaderboard data:** Score and username on leaderboards (opt-in, can be revoked)
- **Social data:** Activity feed, profile, achievements (controlled by privacy settings)
- **Third-party sharing:** Never occurs without explicit, informed consent

### 9.5.5 Content Moderation

All user-generated content is moderated:

- **Automated moderation:** Profanity filter on messages, group chat, bios, and usernames
- **Manual moderation:** Reports are reviewed by human moderators within 48 hours
- **Escalation:** Severe violations (harassment, threats, illegal content) are escalated to law enforcement
- **Moderation log:** All moderation actions are logged for accountability

### 9.5.6 Report and Block System

Detailed in sections 9.1.8 (blocking) and 9.2.4 (report system for leaderboards). Additional reporting:

- Users can report profiles, messages, group content, and leaderboard entries
- Reports are anonymous (the reported user does not know who reported them)
- False reporting is tracked and can result in reporting restrictions

### 9.5.7 Age-Appropriate Social Features (COPPA)

The platform complies with COPPA (Children's Online Privacy Protection Act):

- **Users under 13:** No direct messaging, no group chat, limited friend list (max 50 friends), no challenge system
- **Users 13-17:** Full social features with parental consent
- **Users 18+:** Full social features
- Age verification occurs during account creation (date of birth required)
- Accounts flagged for age misrepresentation are suspended pending verification

### 9.5.8 No Real-Time Chat for Users Under 13

For COPPA compliance:
- Users under 13 cannot access real-time chat features
- This includes group chat and direct messaging
- They can still view their activity feed and leaderboards
- Friend requests are limited to users under 13 only (no cross-age friendships)

---

## 9.6 Technical Implementation

### 9.6.1 Database Schema

**Core Tables:**
```sql
-- Friend relationships
CREATE TABLE friend_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a UUID REFERENCES users(id),
  user_id_b UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id_a, user_id_b)
);

-- Friend requests
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  message VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(sender_id, receiver_id)
);

-- Leaderboard entries
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  game_id VARCHAR(50) NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL,
  leaderboard_type VARCHAR(30) NOT NULL,
  season_id UUID REFERENCES seasons(id),
  group_id UUID REFERENCES groups(id),
  region VARCHAR(2),
  validated BOOLEAN DEFAULT false,
  flagged BOOLEAN DEFAULT false,
  fsr_before DECIMAL(6,2),
  fsr_after DECIMAL(6,2)
);

-- Seasons
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  number INTEGER NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  grace_period_end TIMESTAMP NOT NULL,
  theme_id UUID REFERENCES themes(id),
  is_active BOOLEAN DEFAULT false
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  type VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  owner_id UUID REFERENCES users(id),
  max_members INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group messages
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  content VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Direct messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  target_type VARCHAR(30) NOT NULL,
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  status VARCHAR(20) DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
```

### 9.6.2 Indexes

```sql
-- Friend lookup indexes
CREATE INDEX idx_friendships_user_a ON friend_relationships(user_id_a);
CREATE INDEX idx_friendships_user_b ON friend_relationships(user_id_b);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id, status);

-- Leaderboard indexes
CREATE INDEX idx_leaderboard_game_type ON leaderboard_entries(game_id, leaderboard_type);
CREATE INDEX idx_leaderboard_score ON leaderboard_entries(game_id, leaderboard_type, score DESC, timestamp ASC);
CREATE INDEX idx_leaderboard_season ON leaderboard_entries(season_id, score DESC);
CREATE INDEX idx_leaderboard_user ON leaderboard_entries(user_id);

-- Group indexes
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_messages_group ON group_messages(group_id, created_at DESC);

-- Message indexes
CREATE INDEX idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX idx_dm_receiver ON direct_messages(receiver_id, read_at);

-- Report indexes
CREATE INDEX idx_reports_status ON reports(status, created_at);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
```

### 9.6.3 API Endpoints

**Friend System:**
- `POST /api/friends/request` — Send friend request
- `PUT /api/friends/request/:id/accept` — Accept friend request
- `PUT /api/friends/request/:id/decline` — Decline friend request
- `DELETE /api/friends/:id` — Remove friend
- `POST /api/friends/block/:id` — Block user
- `DELETE /api/friends/block/:id` — Unblock user
- `GET /api/friends` — List friends
- `GET /api/friends/requests` — List pending requests
- `GET /api/friends/suggestions` — Friend suggestions
- `GET /api/friends/:id/compare` — Compare stats with friend

**Leaderboard System:**
- `GET /api/leaderboards/:type/:gameId` — Get leaderboard (with pagination)
- `GET /api/leaderboards/:type/:gameId/me` — Get user's position
- `GET /api/leaderboards/:type/:gameId/rank/:userId` — Get specific user's rank
- `POST /api/leaderboards/report` — Report a score

**Season System:**
- `GET /api/seasons/current` — Get current season info
- `GET /api/seasons/:id/leaderboard` — Get season leaderboard
- `GET /api/seasons/history` — Past seasons

**Group System:**
- `POST /api/groups` — Create group
- `GET /api/groups/:id` — Get group details
- `PUT /api/groups/:id` — Update group settings
- `DELETE /api/groups/:id` — Delete group
- `POST /api/groups/:id/join` — Join group
- `DELETE /api/groups/:id/leave` — Leave group
- `GET /api/groups/:id/members` — List members
- `PUT /api/groups/:id/members/:userId/role` — Change member role
- `DELETE /api/groups/:id/members/:userId` — Remove member
- `GET /api/groups/:id/chat` — Get chat history (paginated)
- `POST /api/groups/:id/chat` — Send message
- `GET /api/groups/:id/leaderboard` — Group leaderboard
- `POST /api/groups/:id/challenges` — Create group challenge

**Messaging System:**
- `GET /api/messages/conversations` — List conversations
- `GET /api/messages/:userId` — Get message history with user
- `POST /api/messages/:userId` — Send message
- `PUT /api/messages/:id/read` — Mark message as read

### 9.6.4 Real-Time Updates

WebSocket connections are used for real-time updates:

**WebSocket Events:**
- `friend_request_received` — New friend request
- `friend_request_accepted` — Friend accepted your request
- `friend_activity` — Friend completed a session or achieved something
- `leaderboard_update` — Your leaderboard position changed
- `challenge_received` — New challenge from a friend
- `challenge_completed` — Challenge opponent completed their session
- `message_received` — New direct message
- `group_message` — New message in group chat
- `group_challenge` — New group challenge created
- `notification` — New notification

**Connection Management:**
- One WebSocket connection per user (multiple tabs share the connection via BroadcastChannel)
- Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Heartbeat every 30 seconds to detect stale connections
- Graceful degradation: If WebSocket fails, fall back to polling (every 60 seconds)

### 9.6.5 Caching Strategy

**Redis Cache Layers:**

| Data | Cache Key | TTL | Invalidation |
|------|-----------|-----|-------------|
| Friend list | `friends:{userId}` | 5 min | On friend add/remove |
| Leaderboard top 100 | `lb:{type}:{gameId}:top100` | 15 sec | On score submission |
| Leaderboard 101-1000 | `lb:{type}:{gameId}:101-1000` | 1 hour | On hourly refresh |
| User leaderboard position | `lb:{type}:{gameId}:pos:{userId}` | 1 min | On score submission |
| Group members | `group:{groupId}:members` | 10 min | On member join/leave |
| Activity feed | `feed:{userId}` | 30 sec | On new activity |
| Unread message count | `unread:{userId}` | 30 sec | On new message |

---

## 9.7 Metrics and Analytics

### 9.7.1 Key Metrics

The social and leaderboard systems are measured by:

- **Daily Active Social Users (DASU):** Users who interact with social features daily
- **Friend request acceptance rate:** Target >70%
- **Challenge completion rate:** Target >60%
- **Group retention (30-day):** Target >40% of members active after 30 days
- **Leaderboard engagement:** % of users who view leaderboards weekly
- **Report resolution time:** Target <48 hours
- **False positive rate for anti-abuse:** Target <2% of flagged scores are legitimate
- **Message delivery rate:** Target >99.9%

### 9.7.2 A/B Testing

Social features are A/B tested for:
- Leaderboard display formats
- Challenge reward amounts
- Notification frequency and timing
- Friend suggestion algorithms
- Group feature discoverability
- Privacy default settings

---

## 9.8 Summary

The social and leaderboard systems in FOCUS are designed to motivate through healthy competition while maintaining a safe, inclusive environment. The system balances engagement with privacy, competition with collaboration, and social interaction with focused training. Every feature is designed with the understanding that FOCUS is a cognitive performance platform — the social layer exists to enhance training, not replace it.

Key design principles enforced throughout:
1. **Safety first:** Blocking, reporting, moderation, and age-appropriate features protect all users
2. **Healthy competition:** Anti-abuse measures, skill-based matching, and fair ranking algorithms maintain leaderboard integrity
3. **Motivation through connection:** Friend challenges, activity feeds, and group features create accountability and motivation
4. **Privacy by design:** Granular privacy controls give users control over their data and visibility
5. **Performance at scale:** Caching, materialized views, and efficient indexes ensure the social system performs well as the user base grows

---

*Next: Chapter 10 — UI/UX Design System*
