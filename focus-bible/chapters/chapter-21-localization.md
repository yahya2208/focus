# Chapter 21: Localization

## 21.1 Localization Philosophy

Localization is not a feature to be added after launch. It is a foundational architectural decision that must be embedded into every layer of the FOCUS Platform from the first line of code. A platform that serves users across cultures, languages, and regions must respect their linguistic identity. Every string, every label, every notification, every error message, every piece of instructional text must be externalized, translatable, and adaptable to the target locale.

The core principles guiding localization on FOCUS are:

**Text is never hardcoded.** No user-facing string exists as a literal in component source code. Every string is referenced by a translation key, resolved at runtime by the internationalization library. This applies to JavaScript, JSX, TypeScript, CSS (via content properties where applicable), server-side templates, email templates, push notification payloads, and even internal analytics event names that appear in user-facing dashboards.

**Layout adapts to text length.** German translations are typically 30 percent longer than English. Japanese and Chinese translations can be 50 percent shorter. Arabic reads right-to-left. Hindi uses complex script shaping. The UI must accommodate all of these variations without breaking, overflowing, truncating important content, or requiring locale-specific CSS overrides. Flexible containers, CSS logical properties, and responsive typography ensure that every layout works for every language.

**Cultural sensitivity is mandatory.** Icons, colors, imagery, metaphors, and idioms carry different meanings across cultures. A thumbs-up icon is positive in Western cultures but offensive in parts of the Middle East. The color red signals danger in the West but luck and prosperity in China. Hand gestures, animal symbols, religious references, and cultural norms must all be reviewed by native cultural consultants before deployment in each region.

**RTL support is first-class.** Arabic and Hebrew are not afterthoughts. The entire layout system is built with CSS logical properties from day one. `margin-left` is `margin-inline-start`. `padding-right` is `padding-inline-end`. `text-align: left` is `text-align: start`. This ensures that flipping the document direction for RTL locales requires only setting `dir="rtl"` on the root element and loading the appropriate locale bundle. No component-level RTL overrides are needed.

**Number and date formatting follows locale conventions.** The number 1,234.56 in English becomes 1.234,56 in German, 1 234,56 in French, and ١٬٢٣٤٫٥٦ in Arabic. January 15, 2026 in English becomes 15 January 2026 in British English, 15 janvier 2026 in French, and 2026年1月15日 in Japanese. All numeric and temporal formatting uses the `Intl` API to respect locale conventions.

## 21.2 Supported Languages

### Phase 1 (Launch)

| Language | Locale Code | Script | Direction |
|----------|------------|--------|-----------|
| English | en | Latin | LTR |
| Spanish (Latin America) | es | Latin | LTR |
| Portuguese (Brazil) | pt-BR | Latin | LTR |
| French | fr | Latin | LTR |
| German | de | Latin | LTR |
| Japanese | ja | Japanese | LTR |
| Korean | ko | Korean (Hangul) | LTR |
| Chinese Simplified | zh-Hans | Chinese (Simplified) | LTR |
| Chinese Traditional | zh-Hant | Chinese (Traditional) | LTR |
| Arabic | ar | Arabic | RTL |
| Hindi | hi | Devanagari | LTR |
| Russian | ru | Cyrillic | LTR |

### Phase 2 (Post-Launch Expansion)

| Language | Locale Code | Script | Direction |
|----------|------------|--------|-----------|
| Italian | it | Latin | LTR |
| Dutch | nl | Latin | LTR |
| Polish | pl | Latin | LTR |
| Turkish | tr | Latin | LTR |
| Thai | th | Thai | LTR |
| Vietnamese | vi | Latin (with diacritics) | LTR |
| Indonesian | id | Latin | LTR |
| Hebrew | he | Hebrew | RTL |

The rationale for Phase 1 selection is based on three factors: total addressable user population, internet penetration in target markets, and existing demand signals from beta signups. English is included as the base language and fallback. Spanish, Portuguese, French, and German cover the major Western markets. Japanese, Korean, Chinese Simplified, and Chinese Traditional cover the major East Asian markets. Arabic covers the Middle East and North Africa. Hindi covers the Indian subcontinent with one of the largest internet user populations globally. Russian covers Eastern Europe and Central Asia.

Phase 2 languages are prioritized by market growth potential and community request volume. Hebrew is included in Phase 2 despite being RTL because it shares RTL infrastructure with Arabic, which will already be battle-tested by Phase 2 launch.

## 21.3 Architecture

### Library Selection: i18next + react-i18next

The FOCUS Platform uses `i18next` as its core internationalization library and `react-i18next` as the React binding layer. This decision was made after evaluating the following alternatives:

**react-intl (FormatJS):** Powerful and standards-based, using ICU message format. However, it requires constructing message descriptors for every string, lacks built-in namespace-based lazy loading, and has a more verbose API for simple string lookups. Its strength is complex message formatting, but FOCUS's messaging needs are predominantly simple key-value lookups with occasional pluralization.

**lingui:** Excellent compile-time optimization and macro system. However, its React integration is less mature than react-i18next, its ecosystem of plugins is smaller, and its extraction workflow requires additional build tooling that adds complexity to the CI pipeline.

**next-intl:** Designed specifically for Next.js, which FOCUS does not use (FOCUS uses a custom React setup with Vite). Its tight coupling to Next.js routing makes it unsuitable for FOCUS's architecture.

**i18next:** Mature, battle-tested, framework-agnostic. Supports namespace-based code splitting, lazy loading, pluralization for all language families, interpolation, nesting, formatting, and has a plugin ecosystem covering virtually every use case. The `react-i18next` binding provides hooks (`useTranslation`) and components (`Trans`) that integrate cleanly with React's component model. Its lazy loading via `i18next-http-backend` and `i18next-resources-to-backend` enables splitting locale bundles by namespace, reducing initial load time.

### Configuration

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'games', 'achievements', 'settings', 'errors', 'notifications'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'focus-preferred-locale',
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
```

### Detection Priority

The locale detection order is:

1. **localStorage** (`focus-preferred-locale`): The user's explicitly selected language preference. This is set when the user manually changes the language in Settings and persists across sessions.
2. **Navigator** (`navigator.language` / `navigator.languages`): The browser's language setting, which typically reflects the operating system language. This provides automatic detection for first-time users.
3. **HTML tag** (`<html lang="...">`): The `lang` attribute on the root HTML element, which may be set by server-side rendering or A/B testing infrastructure.

The fallback chain ensures that if a translation is missing in the detected locale, the system falls back to English. If a namespace is not yet loaded, it is fetched on demand.

### Namespace Organization

| Namespace | Purpose | Example Keys |
|-----------|---------|--------------|
| `common` | Shared UI labels, buttons, general terms | `common.save`, `common.cancel`, `common.loading` |
| `navigation` | Menu items, breadcrumbs, page titles | `nav.home`, `nav.leaderboard`, `nav.settings` |
| `games` | Game-specific instructions, labels, messages | `games.reaction.name`, `games.reaction.start`, `games.reaction.timeout` |
| `achievements` | Achievement names, descriptions, unlock messages | `achievements.firstWin.name`, `achievements.firstWin.description` |
| `settings` | Settings panel labels, toggles, descriptions | `settings.language.label`, `settings.theme.dark` |
| `errors` | Error messages, validation messages, retry prompts | `errors.network`, `errors.auth.expired`, `errors.validation.required` |
| `notifications` | Toast messages, push notification content | `notifications.achievementUnlocked`, `notifications.newChallenge` |

### Lazy Loading

Locale bundles are not loaded in a single request. Each namespace is loaded independently, on demand. When the user navigates to the Games section, the `games` namespace is fetched. When an achievement unlocks, the `achievements` namespace is fetched. This reduces the initial JavaScript payload and ensures that language resources are loaded only when needed.

```typescript
// Dynamic namespace loading
const loadNamespace = async (lng: string, ns: string) => {
  const response = await import(`/locales/${lng}/${ns}.json`);
  i18n.addResourceBundle(lng, ns, response.default);
};

// Preload critical namespaces
await Promise.all([
  loadNamespace(currentLocale, 'common'),
  loadNamespace(currentLocale, 'navigation'),
  loadNamespace(currentLocale, 'errors'),
]);
```

## 21.4 Translation File Structure

### Directory Layout

```
/public/locales/
├── en/
│   ├── common.json
│   ├── navigation.json
│   ├── games.json
│   ├── achievements.json
│   ├── settings.json
│   ├── errors.json
│   └── notifications.json
├── es/
│   ├── common.json
│   ├── navigation.json
│   ├── games.json
│   ├── achievements.json
│   ├── settings.json
│   ├── errors.json
│   └── notifications.json
├── pt-BR/
│   ├── common.json
│   └── ...
├── fr/
│   ├── common.json
│   └── ...
├── de/
│   ├── common.json
│   └── ...
├── ja/
│   ├── common.json
│   └── ...
├── ko/
│   ├── common.json
│   └── ...
├── zh-Hans/
│   ├── common.json
│   └── ...
├── zh-Hant/
│   ├── common.json
│   └── ...
├── ar/
│   ├── common.json
│   └── ...
├── hi/
│   ├── common.json
│   └── ...
└── ru/
    ├── common.json
    └── ...
```

### common.json (English Source)

```json
{
  "app": {
    "name": "FOCUS",
    "tagline": "Train Your Mind. Measure Your Progress."
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "retry": "Try Again",
    "start": "Start",
    "pause": "Pause",
    "resume": "Resume",
    "quit": "Quit",
    "skip": "Skip",
    "learnMore": "Learn More",
    "signIn": "Sign In",
    "signOut": "Sign Out",
    "createAccount": "Create Account",
    "forgotPassword": "Forgot Password?"
  },
  "status": {
    "loading": "Loading...",
    "saving": "Saving...",
    "connecting": "Connecting...",
    "offline": "You are offline",
    "syncing": "Syncing data...",
    "complete": "Complete",
    "error": "Something went wrong"
  },
  "time": {
    "seconds": "{{count}} second",
    "seconds_plural": "{{count}} seconds",
    "minutes": "{{count}} minute",
    "minutes_plural": "{{count}} minutes",
    "hours": "{{count}} hour",
    "hours_plural": "{{count}} hours",
    "days": "{{count}} day",
    "days_plural": "{{count}} days",
    "now": "just now",
    "ago": "{{time}} ago",
    "in": "in {{time}}"
  },
  "units": {
    "score": "pts",
    "level": "Lv.",
    "streak": "day streak",
    "accuracy": "accuracy",
    "reactionTime": "reaction time",
    "xp": "XP"
  },
  "accessibility": {
    "skipToContent": "Skip to main content",
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "expandSection": "Expand section",
    "collapseSection": "Collapse section",
    "playAudio": "Play audio",
    "pauseAudio": "Pause audio",
    "mute": "Mute",
    "unmute": "Unmute"
  }
}
```

### navigation.json (English Source)

```json
{
  "nav": {
    "home": "Home",
    "dashboard": "Dashboard",
    "games": "Games",
    "leaderboard": "Leaderboard",
    "profile": "Profile",
    "settings": "Settings",
    "friends": "Friends",
    "achievements": "Achievements",
    "challenges": "Challenges",
    "stats": "Statistics",
    "help": "Help",
    "about": "About"
  },
  "breadcrumb": {
    "home": "Home",
    "games": "Games",
    "gameDetail": "{{gameName}}",
    "leaderboard": "Leaderboard",
    "leaderboardDetail": "{{leaderboardName}}",
    "settings": "Settings",
    "settingsSection": "{{sectionName}}"
  },
  "menu": {
    "label": "Main Navigation",
    "closeOnSelect": "Close menu after selection",
    "mobileToggle": "Toggle navigation menu"
  }
}
```

### games.json (English Source)

```json
{
  "games": {
    "catalog": {
      "title": "Training Games",
      "subtitle": "Choose a game to train your cognitive skills",
      "filter": {
        "all": "All Games",
        "reaction": "Reaction",
        "memory": "Memory",
        "attention": "Attention",
        "flexibility": "Flexibility",
        "speed": "Speed"
      },
      "sort": {
        "popular": "Most Popular",
        "recent": "Recently Played",
        "rating": "Highest Rated"
      }
    },
    "reaction": {
      "name": "Reaction Light Test",
      "shortName": "Reaction",
      "description": "Test your reaction speed by responding to light stimuli as quickly as possible.",
      "instructions": {
        "step1": "Wait for the light to turn green.",
        "step2": "Tap or press the spacebar as fast as you can.",
        "step3": "If you tap before the light turns green, it's a false start.",
        "tip": "Try to relax and stay focused. Tension slows your reactions."
      },
      "modes": {
        "classic": "Classic Mode",
        "endurance": "Endurance Mode",
        "sprint": "Sprint Mode"
      },
      "results": {
        "title": "Results",
        "reactionTime": "Reaction Time",
        "averageTime": "Average",
        "bestTime": "Best",
        "falseStarts": "False Starts",
        "totalRounds": "Rounds",
        "rating": {
          "elite": "Elite",
          "excellent": "Excellent",
          "good": "Good",
          "average": "Average",
          "needsWork": "Needs Practice"
        }
      },
      "states": {
        "waiting": "Wait for green...",
        "ready": "TAP NOW!",
        "falseStart": "Too early! Wait for green.",
        "processing": "Calculating...",
        "roundComplete": "Round {{current}} of {{total}}"
      }
    },
    "memory": {
      "name": "Memory Matrix",
      "shortName": "Memory",
      "description": "Remember the pattern and recreate it from memory."
    },
    "attention": {
      "name": "Sustained Attention",
      "shortName": "Attention",
      "description": "Maintain focus on a specific target while ignoring distractions."
    },
    "flexibility": {
      "name": "Task Switcher",
      "shortName": "Flexibility",
      "description": "Switch between tasks quickly and accurately."
    },
    "speed": {
      "name": "Processing Speed",
      "shortName": "Speed",
      "description": "Process visual information as quickly as possible."
    }
  }
}
```

### achievements.json (English Source)

```json
{
  "achievements": {
    "title": "Achievements",
    "subtitle": "Track your milestones and accomplishments",
    "locked": "Locked",
    "unlocked": "Unlocked",
    "progress": "{{current}} of {{target}}",
    "unlockDate": "Unlocked {{date}}",
    "share": "Share Achievement",
    "categories": {
      "reaction": "Reaction Achievements",
      "memory": "Memory Achievements",
      "attention": "Attention Achievements",
      "social": "Social Achievements",
      "streak": "Streak Achievements",
      "milestone": "Milestone Achievements"
    },
    "items": {
      "firstReaction": {
        "name": "First Spark",
        "description": "Complete your first Reaction Light Test",
        "icon": "spark"
      },
      "speedDemon": {
        "name": "Speed Demon",
        "description": "Achieve a reaction time under 200ms",
        "icon": "lightning"
      },
      "weekStreak": {
        "name": "Seven Day Warrior",
        "description": "Maintain a 7-day training streak",
        "icon": "flame"
      },
      "monthStreak": {
        "name": "Monthly Champion",
        "description": "Maintain a 30-day training streak",
        "icon": "trophy"
      },
      "perfectRound": {
        "name": "Perfectionist",
        "description": "Complete a round with zero false starts",
        "icon": "star"
      },
      "speedster": {
        "name": "Lightning Fast",
        "description": "Achieve 10 consecutive sub-200ms reactions",
        "icon": "bolt"
      },
      "socialButterfly": {
        "name": "Social Butterfly",
        "description": "Add 10 friends to your network",
        "icon": "people"
      },
      "leaderboardTop10": {
        "name": "Top Ten",
        "description": "Reach the top 10 on any leaderboard",
        "icon": "medal"
      }
    },
    "notifications": {
      "unlocked": "Achievement Unlocked: {{name}}!",
      "progressUpdate": "Achievement Progress: {{name}} — {{progress}}"
    }
  }
}
```

### settings.json (English Source)

```json
{
  "settings": {
    "title": "Settings",
    "sections": {
      "profile": {
        "title": "Profile",
        "name": "Display Name",
        "email": "Email",
        "avatar": "Profile Picture",
        "changeAvatar": "Change Picture",
        "removeAvatar": "Remove Picture"
      },
      "language": {
        "title": "Language & Region",
        "label": "Language",
        "description": "Choose your preferred language for the interface",
        "current": "Current: {{language}}",
        "change": "Change Language",
        "restart": "Some changes may require a page refresh to take effect."
      },
      "appearance": {
        "title": "Appearance",
        "theme": {
          "label": "Theme",
          "light": "Light",
          "dark": "Dark",
          "system": "System Default"
        },
        "fontSize": {
          "label": "Text Size",
          "small": "Small",
          "medium": "Medium",
          "large": "Large",
          "extraLarge": "Extra Large"
        },
        "reducedMotion": {
          "label": "Reduce Motion",
          "description": "Minimize animations and transitions"
        }
      },
      "notifications": {
        "title": "Notifications",
        "push": {
          "label": "Push Notifications",
          "description": "Receive notifications about achievements and challenges"
        },
        "email": {
          "label": "Email Notifications",
          "description": "Receive weekly progress reports via email"
        },
        "sound": {
          "label": "Notification Sounds",
          "description": "Play sounds for notifications"
        }
      },
      "privacy": {
        "title": "Privacy & Security",
        "showProfile": {
          "label": "Public Profile",
          "description": "Allow others to see your profile and stats"
        },
        "showOnLeaderboard": {
          "label": "Leaderboard Visibility",
          "description": "Show your name on public leaderboards"
        },
        "dataCollection": {
          "label": "Analytics",
          "description": "Help improve FOCUS by sharing anonymous usage data"
        }
      },
      "accessibility": {
        "title": "Accessibility",
        "highContrast": {
          "label": "High Contrast Mode",
          "description": "Increase contrast for better visibility"
        },
        "screenReader": {
          "label": "Screen Reader Optimizations",
          "description": "Enable enhanced screen reader support"
        },
        "keyboardNavigation": {
          "label": "Keyboard Navigation",
          "description": "Navigate the entire app using only your keyboard"
        }
      },
      "audio": {
        "title": "Audio",
        "masterVolume": "Master Volume",
        "musicVolume": "Music Volume",
        "sfxVolume": "Sound Effects",
        "hapticFeedback": {
          "label": "Haptic Feedback",
          "description": "Vibrate on interactions"
        }
      }
    }
  }
}
```

### errors.json (English Source)

```json
{
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": {
      "offline": "You are offline. Please check your internet connection.",
      "timeout": "The request timed out. Please try again.",
      "server": "Server error. Our team has been notified.",
      "notFound": "The page you're looking for doesn't exist.",
      "forbidden": "You don't have permission to access this.",
      "rateLimit": "Too many requests. Please wait a moment and try again."
    },
    "auth": {
      "required": "Please sign in to continue.",
      "expired": "Your session has expired. Please sign in again.",
      "invalid": "Invalid email or password.",
      "emailTaken": "An account with this email already exists.",
      "weakPassword": "Password must be at least 8 characters with a number and symbol.",
      "passwordMismatch": "Passwords do not match.",
      "tooManyAttempts": "Too many sign-in attempts. Please wait {{minutes}} minutes.",
      "oauthFailed": "Sign-in with {{provider}} failed. Please try again."
    },
    "validation": {
      "required": "{{field}} is required.",
      "email": "Please enter a valid email address.",
      "minLength": "{{field}} must be at least {{min}} characters.",
      "maxLength": "{{field}} must be no more than {{max}} characters.",
      "pattern": "{{field}} format is invalid.",
      "number": "{{field}} must be a number.",
      "range": "{{field}} must be between {{min}} and {{max}}."
    },
    "games": {
      "loadFailed": "Failed to load the game. Please try again.",
      "saveFailed": "Failed to save your progress.",
      "alreadyPlaying": "You already have a game in progress.",
      "timeExpired": "Time's up! Your results have been saved.",
      "connectionLost": "Connection lost. Your progress has been saved locally."
    },
    "profile": {
      "updateFailed": "Failed to update your profile.",
      "avatarTooLarge": "Image must be smaller than 5MB.",
      "avatarInvalid": "Please upload a PNG, JPG, or WebP image.",
      "nameTaken": "This display name is already taken."
    },
    "actions": {
      "retry": "Try Again",
      "goHome": "Go to Home",
      "signIn": "Sign In",
      "contactSupport": "Contact Support",
      "reportIssue": "Report Issue"
    }
  }
}
```

### notifications.json (English Source)

```json
{
  "notifications": {
    "toast": {
      "success": {
        "saved": "Changes saved successfully.",
        "profileUpdated": "Profile updated.",
        "settingsUpdated": "Settings updated.",
        "achievementUnlocked": "Achievement unlocked: {{name}}!",
        "friendAdded": "{{name}} is now your friend.",
        "challengeAccepted": "Challenge accepted!",
        "scoreSubmitted": "Score submitted successfully."
      },
      "info": {
        "newAchievement": "You have a new achievement to check out!",
        "weeklyReport": "Your weekly progress report is ready.",
        "friendRequest": "{{name}} sent you a friend request.",
        "challengeReceived": "You received a new challenge from {{name}}.",
        "maintenanceScheduled": "Scheduled maintenance in {{time}}."
      },
      "warning": {
        "storageLow": "Device storage is low. Some features may be limited.",
        "sessionExpiring": "Your session will expire in {{minutes}} minutes.",
        "offlineMode": "You are in offline mode. Some features are unavailable."
      },
      "error": {
        "connectionLost": "Connection lost. Working offline.",
        "syncFailed": "Sync failed. Will retry automatically.",
        "saveFailed": "Failed to save. Please try again."
      }
    },
    "push": {
      "achievementUnlocked": "You unlocked {{name}}! Tap to view.",
      "challengeReceived": "{{name}} challenged you! Tap to play.",
      "friendRequest": "{{name}} wants to be your friend.",
      "weeklyReminder": "Keep your streak alive! Train today.",
      "leaderboardUpdate": "You moved up to #{{rank}} on the {{leaderboard}} leaderboard!"
    },
    "email": {
      "weeklyReport": {
        "subject": "Your Weekly FOCUS Report",
        "greeting": "Hi {{name}},",
        "body": "Here's your training summary for the week of {{startDate}} to {{endDate}}.",
        "statsTitle": "This Week's Stats",
        "gamesPlayed": "Games Played",
        "averageScore": "Average Score",
        "bestReactionTime": "Best Reaction Time",
        "streakDays": "Streak Days",
        "cta": "Keep up the great work! Open FOCUS to continue training."
      }
    }
  }
}
```

## 21.5 Translation Key Convention

### Naming Rules

Translation keys follow a hierarchical dot-notation convention. The structure is always:

```
<namespace>.<category>.<subcategory>.<specific>
```

Rules:
- All keys are in camelCase for the first segment, then lowerCamelCase throughout.
- Keys are descriptive and self-documenting. A developer reading `games.reaction.states.waiting` should understand exactly what string this references without looking up the value.
- Pluralization uses the `_plural` suffix convention (i18next default) for simple plurals, and `{{count}}` interpolation for complex cases.
- Interpolation variables use `{{variableName}}` syntax with camelCase names.
- No abbreviations in key names. Use `leaderboard` not `lb`. Use `achievement` not `ach`.

### Nesting Structure

Keys are nested to provide logical grouping. Deep nesting (more than 4 levels) is avoided to keep key paths manageable. When a section grows beyond 15 keys, it is split into sub-namespaces or reorganized.

```json
{
  "games": {
    "reaction": {
      "name": "Reaction Light Test",
      "instructions": {
        "step1": "...",
        "step2": "...",
        "step3": "..."
      },
      "states": {
        "waiting": "...",
        "ready": "...",
        "falseStart": "..."
      }
    }
  }
}
```

### Usage in React Components

```tsx
import { useTranslation } from 'react-i18next';

function ReactionGame() {
  const { t } = useTranslation('games');
  
  return (
    <div>
      <h1>{t('reaction.name')}</h1>
      <p>{t('reaction.description')}</p>
      <div className="instructions">
        <p>{t('reaction.instructions.step1')}</p>
        <p>{t('reaction.instructions.step2')}</p>
        <p>{t('reaction.instructions.step3')}</p>
      </div>
    </div>
  );
}
```

### Pluralization

i18next supports pluralization through key suffixes and the `count` interpolation variable:

```json
{
  "items": {
    "one": "{{count}} item",
    "other": "{{count}} items"
  }
}
```

```tsx
t('items', { count: 1 })  // "1 item"
t('items', { count: 5 })  // "5 items"
```

For languages with complex plural rules (Russian has three forms, Arabic has six), i18next uses numeric suffixes:

```json
{
  "items": {
    "one": "{{count}} товар",
    "few": "{{count}} товара",
    "many": "{{count}} товаров",
    "other": "{{count}} товара"
  }
}
```

The pluralization categories per language family:

| Family | Languages | Forms | Suffixes |
|--------|-----------|-------|----------|
| English | English | 2 | `one`, `other` |
| Germanic | German, Dutch | 2 | `one`, `other` |
| Romance | French, Spanish, Portuguese, Italian | 2 | `one`, `other` |
| Slavic | Russian, Polish | 3-4 | `one`, `few`, `many`, `other` |
| CJK | Japanese, Korean, Chinese | 1 | `other` (no plural forms) |
| Semitic | Arabic | 6 | `zero`, `one`, `two`, `few`, `many`, `other` |
| Indic | Hindi | 2 | `one`, `other` |
| East Asian | Thai, Vietnamese | 1 | `other` |

## 21.6 Number Formatting

All numeric display uses `Intl.NumberFormat` to respect locale conventions:

```typescript
const formatNumber = (value: number, locale: string): string => {
  return new Intl.NumberFormat(locale).format(value);
};

// English (en-US): 1,234,567.89
// German (de-DE): 1.234.567,89
// French (fr-FR): 1 234 567,89
// Japanese (ja-JP): 1,234,567.89
// Arabic (ar-SA): ١٬٢٣٤٬٥٦٧٫٨٩
// Hindi (hi-IN): 12,34,567.89 (Indian numbering system)
// Russian (ru-RU): 1 234 567,89
```

### Score Formatting

```typescript
const formatScore = (score: number, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(score);
};

// English: 1.2K, 3.4M
// Japanese: 1.2千, 3.4百万 (using Japanese compact notation)
```

### Percentage Formatting

```typescript
const formatPercentage = (value: number, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

// English: 85.5%
// German: 85,5 %
// French: 85,5 %
// Arabic: ٨٥٫٥٪
```

### Currency Formatting (for premium features)

```typescript
const formatCurrency = (amount: number, currency: string, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// English (USD): $4.99
// German (EUR): 4,99 €
// Japanese (JPY): ¥500
// Arabic (SAR): ٤٫٩٩ ر.س.
```

## 21.7 Date Formatting

All temporal display uses `Intl.DateTimeFormat`:

```typescript
const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// English: January 15, 2026
// German: 15. Januar 2026
// French: 15 janvier 2026
// Japanese: 2026年1月15日
// Arabic: ١٥ يناير ٢٠٢٦
// Hindi: 15 जनवरी 2026
// Russian: 15 января 2026 г.
// Korean: 2026년 1월 15일
// Chinese (Simplified): 2026年1月15日
```

### Relative Time Formatting

```typescript
const formatRelativeTime = (date: Date, locale: string): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffInSeconds = Math.floor((date.getTime() - Date.now()) / 1000);
  
  if (Math.abs(diffInSeconds) < 60) return rtf.format(diffInSeconds, 'second');
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
  return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
};

// English: "yesterday", "in 2 hours"
// German: "gestern", "in 2 Stunden"
// Japanese: "昨日", "2時間後"
```

### Duration Formatting

Game durations and reaction times require special formatting:

```typescript
const formatDuration = (ms: number, locale: string): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(ms / 1000) + 's';
  }
  return `${minutes}m ${remainingSeconds}s`;
};

const formatReactionTime = (ms: number, locale: string): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(ms) + 'ms';
};
```

## 21.8 RTL Support

### CSS Logical Properties

Every CSS property that has a physical direction equivalent is expressed using logical properties:

| Physical Property | Logical Property |
|-------------------|------------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `left` (position) | `inset-inline-start` |
| `right` (position) | `inset-inline-end` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `float: left` | `float: inline-start` |
| `float: right` | `float: inline-end` |

### Flexbox and Grid

```css
/* Instead of: */
.nav { display: flex; flex-direction: row; }

/* Use: */
.nav { display: flex; flex-direction: row; } /* row is fine - it's inline */

/* But for reversed layouts, use: */
.rtl-aware-container {
  display: flex;
  flex-direction: row;
}

/* When the document is RTL, the flex layout automatically reverses because
   logical properties handle the direction. However, if you need explicit
   control: */
[dir="rtl"] .nav-items {
  flex-direction: row-reverse;
}
```

### Icon Mirroring

Icons that represent directional concepts (arrows, progress indicators, forward/back) must be mirrored in RTL:

```css
.icon-arrow-right {
  /* LTR: arrow points right */
  /* RTL: arrow points left */
}

[dir="rtl"] .icon-arrow-right {
  transform: scaleX(-1);
}

/* Icons that are non-directional (home, star, heart) are NOT mirrored */
.icon-home {
  /* No mirroring needed */
}
```

### Layout Mirroring

```css
/* The sidebar layout */
.app-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
}

/* RTL: sidebar moves to the right */
[dir="rtl"] .app-layout {
  grid-template-columns: 1fr 280px;
}

/* Or using logical properties */
.app-layout {
  display: grid;
  grid-template-columns: 1fr;
}

.sidebar {
  position: fixed;
  inset-inline-start: 0;
  width: 280px;
  height: 100%;
}

.main-content {
  margin-inline-start: 280px;
}
```

### Testing RTL

RTL testing is mandatory for Arabic and Hebrew locales:

1. **Automated visual regression**: Every component is screenshot-tested in both LTR and RTL modes. Percy or Chromatic captures baseline screenshots for both directions.
2. **Manual QA**: Native Arabic and Hebrew speakers review every screen for proper mirroring, text alignment, icon direction, and reading flow.
3. **Edge cases tested**: Numbers within RTL text (e.g., "Score: 1234"), mixed LTR/RTL content (e.g., brand names within Arabic text), forms with labels and inputs, tables with numeric columns, and modals with navigation buttons.

## 21.9 Text Expansion Handling

### Expansion Factors by Language

| Language | Expansion vs English | Example |
|----------|---------------------|---------|
| English | 1.0x (baseline) | "Save Changes" |
| German | 1.3x | "Änderungen speichern" |
| French | 1.2x | "Enregistrer les modifications" |
| Spanish | 1.1x | "Guardar cambios" |
| Portuguese | 1.15x | "Salvar alterações" |
| Japanese | 0.5x | "変更を保存" |
| Korean | 0.7x | "변경 사항 저장" |
| Chinese Simplified | 0.5x | "保存更改" |
| Arabic | 1.25x | "حفظ التغييرات" |
| Hindi | 1.1x | "परिवर्तन सहेजें" |
| Russian | 1.2x | "Сохранить изменения" |

### Design Accommodations

All text containers are designed to accommodate 50 percent expansion beyond the English baseline:

```css
/* Button: Never fixed width based on text */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
}

/* Tooltip or truncated text: graceful overflow */
.text-overflow {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* Responsive text containers */
.card-title {
  font-size: clamp(14px, 2vw, 18px);
  line-height: 1.3;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

### Truncation Strategy

When text exceeds its container:

1. **Buttons**: Never truncate. Allow wrapping to two lines if necessary, or adjust padding.
2. **Table cells**: Truncate with ellipsis and provide a tooltip with full text.
3. **Card titles**: Allow two lines maximum, then truncate with ellipsis.
4. **Navigation items**: Single line, truncate with ellipsis. Provide tooltip.
5. **Error messages**: Never truncate. Allow full wrapping.
6. **Achievement names**: Two lines maximum with ellipsis.

## 21.10 Translation Workflow

### Step 1: Developer Creates English Strings

When adding new user-facing text, the developer:
1. Adds the English string to the appropriate namespace JSON file.
2. Uses the established key naming convention.
3. Provides a comment in the code referencing the translation key.
4. Includes interpolation variables with descriptive names.
5. Writes the English string with enough context for translators.

```typescript
// GOOD: Clear, descriptive key with context
t('games.reaction.instructions.step1', 'Wait for the light to turn green before tapping.')

// BAD: Ambiguous key with no context
t('step1', 'wait')
```

### Step 2: Translation Tickets

After English strings are committed and before a release, a translation ticket is created:
1. The translation coordinator extracts all new and modified strings from the English source files.
2. Strings are organized by namespace and presented with full context: the string itself, where it appears in the UI (screenshot), the namespace it belongs to, and any interpolation variables with example values.
3. A Jira/Linear ticket is created for each target language.
4. Tickets are assigned to professional translators (not internal team members, not machine translation services).

### Step 3: Professional Translation

Translation is performed by professional human translators:
- Each translator is a native speaker of the target language.
- Translators receive a glossary of established terms (e.g., "Reaction Light Test" should be consistently translated across all strings).
- Translators receive screenshots of the UI showing where each string appears.
- Translators receive a style guide for the FOCUS brand voice (professional but approachable, encouraging but not patronizing).
- Machine translation (Google Translate, DeepL) is explicitly prohibited as a standalone translation method. It may be used as a starting reference but must be reviewed and corrected by a human translator.

### Step 4: Native Speaker Review

Each translation is reviewed by a second native speaker who:
1. Checks for grammatical accuracy.
2. Verifies cultural appropriateness.
3. Ensures consistent terminology with the glossary.
4. Tests that the translated text fits within UI containers (reports any strings that are too long).
5. Suggests alternative translations where the literal translation feels unnatural.

### Step 5: QA in Target Language

QA testers who are native speakers of the target language perform:
1. Full regression testing of the application in the target language.
2. Verification that all strings are present (no missing translations, no fallback to English).
3. Verification that interpolation values render correctly (e.g., "5 days" in Russian should show the correct plural form).
4. Verification that RTL layouts are correct for Arabic.
5. Verification that date, number, and currency formatting is correct.
6. Verification that text does not overflow or get truncated unexpectedly.
7. Screenshot comparison of key screens in the target language.

### Step 6: Merge and Staging Verification

After QA approval:
1. Translated JSON files are merged into the main branch.
2. The staging environment is deployed with the new translations.
3. The translation coordinator performs a final spot check on staging.
4. The release is approved for production deployment.

## 21.11 Translation Quality

### Glossary

A centralized glossary ensures consistent terminology across all translations:

| English | Definition | Spanish | Japanese | Notes |
|---------|-----------|---------|----------|-------|
| FOCUS | The platform name | FOCUS | フォーカス | Never translate the brand name |
| Reaction Light Test | The name of the reaction game | Test de Reacción de Luz | 反応ライトテスト | Always capitalized as a proper noun |
| Score | Points earned in a game | Puntuación | スコア | Not "punteo" (colloquial) |
| Streak | Consecutive days of training | Racha | 連続記録 | Not "serie" (ambiguous) |
| Level | User's progression level | Nivel | レベル | Not "nivel de usuario" (too long) |
| Leaderboard | Ranked list of users | Clasificación | ランキング | Not "tabla de líderes" (too literal) |
| Achievement | An earned milestone | Logro | 実績 | Not "hazaña" (too dramatic) |

### Context Documentation

Every string bundle sent to translators includes:

1. **String key**: The full dot-notation key.
2. **English source text**: The exact English string.
3. **Description**: What this string is and where it appears.
4. **Screenshot**: Annotated screenshot showing the string in context.
5. **Character limit**: Maximum recommended character count for the translation.
6. **Interpolation variables**: List of `{{variables}}` with types and example values.
7. **Pluralization context**: Whether the string is singular, plural, or both.
8. **Notes**: Any special instructions (e.g., "This appears on a button, keep it short").

### String Freeze

Before each release, a string freeze is enforced:
1. **Freeze date**: Announced one week before the release.
2. **No new strings**: After the freeze date, no new user-facing strings may be added.
3. **No modifications**: Existing strings may not be modified after the freeze.
4. **Exception process**: Critical string changes (security messages, legal text) require approval from the translation coordinator and project lead.
5. **Post-freeze changes**: Any strings added or modified after the freeze are deferred to the next release and do not ship in the current release.

### User Feedback Mechanism

Users can report translation issues directly from the UI:
1. A "Report Translation" option is available in the Settings > Language section.
2. Users can select any text on the screen and submit a correction suggestion.
3. Suggestions are reviewed by the translation coordinator and, if valid, submitted to professional translators.
4. Valid suggestions earn the user a "Translator" badge or recognition.

## 21.12 Testing Infrastructure

### Automated Tests

```typescript
// Verify all translation keys exist for all supported locales
describe('Translation Completeness', () => {
  const locales = ['en', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'zh-Hans', 'zh-Hant', 'ar', 'hi', 'ru'];
  const namespaces = ['common', 'navigation', 'games', 'achievements', 'settings', 'errors', 'notifications'];

  locales.forEach(locale => {
    namespaces.forEach(ns => {
      it(`should have all keys for ${locale}/${ns}`, () => {
        const enKeys = getFlattenedKeys(require(`../locales/en/${ns}.json`));
        const localeKeys = getFlattenedKeys(require(`../locales/${locale}/${ns}.json`));
        const missingKeys = enKeys.filter(key => !localeKeys.includes(key));
        expect(missingKeys).toEqual([]);
      });
    });
  });
});

// Verify interpolation variables are present
describe('Interpolation Consistency', () => {
  locales.forEach(locale => {
    it(`${locale} should have all interpolation variables`, () => {
      const enStrings = getAllStrings('en');
      const localeStrings = getAllStrings(locale);
      
      enStrings.forEach(({ key, value }) => {
        const enVars = extractInterpolationVars(value);
        const localeVars = extractInterpolationVars(localeStrings[key]);
        expect(localeVars).toEqual(enVars);
      });
    });
  });
});
```

### Visual Regression

Every screen is captured in Percy/Chromatic for:
1. Each supported locale (12 locales in Phase 1).
2. Both LTR and RTL directions.
3. Each supported font size (small, medium, large, extra-large).
4. Each theme (light, dark).

Total: 12 locales × 2 directions × 4 font sizes × 2 themes = 192 screenshot combinations per screen.

### RTL-Specific Tests

```typescript
describe('RTL Layout', () => {
  it('should mirror navigation sidebar to the right', () => {
    render(<App locale="ar" />);
    const sidebar = screen.getByRole('navigation');
    const styles = getComputedStyle(sidebar);
    expect(styles.insetInlineStart).toBe('0');
  });

  it('should mirror arrow icons', () => {
    render(<ArrowIcon locale="ar" />);
    const icon = screen.getByRole('img');
    expect(icon).toHaveStyle({ transform: 'scaleX(-1)' });
  });

  it('should align text to the right', () => {
    render(<TextContent locale="ar" />);
    const text = screen.getByRole('paragraph');
    expect(text).toHaveStyle({ textAlign: 'end' });
  });
});
```

## 21.13 Performance Considerations

### Bundle Size

Locale bundles are split by namespace and loaded on demand. Initial load includes only:
- `common.json` (~3KB gzipped per locale)
- `navigation.json` (~1KB gzipped per locale)
- `errors.json` (~2KB gzipped per locale)

Total initial locale payload: ~6KB gzipped for the active locale.

### Caching

Locale files are served with immutable cache headers (`Cache-Control: public, max-age=31536000, immutable`) because they are versioned by build hash. The i18next localStorage cache prevents re-parsing of JSON on subsequent visits.

### Fallback Strategy

When a translation key is missing in the active locale:
1. i18next checks the fallback locale (English).
2. If the key exists in English, it is used.
3. A console warning is logged in development mode.
4. In production, missing keys silently fall back to English.
5. A monitoring alert is triggered if the missing key rate exceeds 1 percent for any locale.

## 21.14 Summary

Localization on FOCUS is not an afterthought. It is an architectural constraint that shapes every decision from component design to deployment. The i18next ecosystem provides the technical foundation, but the real work is in the human processes: professional translation, cultural review, QA testing by native speakers, and continuous improvement through user feedback. The result is a platform that feels native in every language it supports, respecting the user's linguistic identity while delivering a consistent, high-quality cognitive training experience.

The next chapter addresses accessibility, the other pillar of inclusive design that ensures every user, regardless of ability, can fully participate in the FOCUS experience.