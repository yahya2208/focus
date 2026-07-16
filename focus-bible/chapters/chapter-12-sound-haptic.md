# Chapter 12: Sound & Haptic Design

## Overview

Sound and haptic feedback are the invisible layers that make FOCUS feel tangible and responsive. While visual design communicates information and animation provides temporal context, sound and haptics create a multi-sensory experience that reinforces feedback at a subconscious level. A well-timed haptic pulse when a correct answer registers, or a subtle chime when a new high score is achieved, transforms abstract data into felt experience.

This chapter defines every sound effect, haptic pattern, and audio behavior in FOCUS. The sound system is built on the Web Audio API for cross-platform consistency. The haptic system leverages native platform APIs (UIFeedbackGenerator on iOS, HapticFeedbackConstants on Android) with a web fallback. Both systems are fully optional — many users prefer silent operation, and FOCUS respects that preference without degrading the experience.

---

## 12.1 Sound Design Philosophy

### 12.1.1 Core Principles

**Sound should inform, not distract.**
Every sound in FOCUS communicates something. A sound that does not inform is noise, and noise is the enemy of focus. Before adding any sound, the design team must answer: "What does this sound tell the user?" If the answer is "nothing," the sound is not added.

**Every sound has a purpose.**
Sounds in FOCUS serve one of five communication purposes:
1. **Confirmation:** "Your action was received" (button tap, toggle, input)
2. **Result:** "Here is the outcome of your action" (correct, incorrect, score)
3. **Progress:** "You are moving toward your goal" (streak, level progress, session)
4. **Alert:** "Something requires your attention" (notification, reminder, challenge)
5. **Atmosphere:** "This is the emotional context" (ambient sounds, focus mode)

**Sound should be optional.**
A significant portion of users prefer to use applications in silent mode — especially in public spaces, shared environments, or during focused work. FOCUS must be fully functional and equally engaging without any sound. Sound enhances the experience but is never required for usability.

**Audio should work on all platforms.**
The sound system must deliver consistent audio across web browsers, iOS, and Android. Platform-specific audio quirks are handled internally, presenting a uniform experience to the user.

### 12.1.2 Sound Personality

The FOCUS sound identity is:
- **Clean:** Short, precise sounds with minimal reverb or tail
- **Scientific:** Sounds that feel measured and intentional, not cartoonish
- **Warm:** Enough warmth to feel human, not robotic or clinical
- **Unobtrusive:** Sounds that exist in the background, not demanding attention
- **Cohesive:** All sounds feel like they belong to the same family

Sound design avoids:
- Sharp, piercing tones (causes discomfort)
- Long, drawn-out sounds (disrupts focus)
- Cartoon-like effects (undermines premium feel)
- Generic notification sounds (no "ding" or "whoosh" from stock libraries)
- Loud sounds (all sounds are mixed at conservative volumes)

### 12.1.3 Volume Philosophy

All FOCUS sounds are mixed at conservative volumes:
- UI sounds peak at -15dB (quiet, unobtrusive)
- Game sounds peak at -8dB (moderate, clear)
- Notification sounds peak at -12dB (noticeable but not jarring)
- Ambient sounds default to -30dB (barely perceptible background)
- Master volume default is 70% of system maximum

The conservative volume approach means:
- Users in quiet environments are not disturbed
- Users in noisy environments can increase volume without distortion
- Extended listening sessions do not cause fatigue
- Multiple simultaneous sounds do not create harsh combinations

---

## 12.2 Audio Engine (packages/audio)

### 12.2.1 Architecture

The FOCUS audio engine is built on the Web Audio API and encapsulated in `packages/audio`:

```
packages/audio/
  src/
    AudioEngine.ts          -- Core engine with lifecycle management
    SoundLibrary.ts         -- Sound definitions and loading
    AudioPool.ts            -- Concurrent sound management
    VolumeController.ts     -- Per-category volume control
    AmbientPlayer.ts        -- Ambient sound management
    SpatialAudio.ts         -- Future: 3D audio positioning
    types.ts                -- Type definitions
    index.ts                -- Public API
```

### 12.2.2 AudioContext Lifecycle

The Web Audio API requires an `AudioContext` to function. Browser policy dictates that an `AudioContext` cannot be created until a user interaction (click, tap, keypress) has occurred. FOCUS handles this with a deferred initialization strategy:

```typescript
class AudioEngine {
  private context: AudioContext | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // AudioContext must be created after user interaction
    this.context = new AudioContext();

    // On iOS, AudioContext starts in 'suspended' state
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    // Pre-decode all sound buffers
    await this.loadAllSounds();

    this.initialized = true;
  }

  // Called on first user interaction
  onFirstInteraction(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}
```

**iOS Safari Quirks:**
- AudioContext starts in `suspended` state
- Must be resumed within a user gesture event handler
- Multiple rapid resume calls are safe (idempotent)
- AudioContext is suspended again when the app goes to background

**Chrome Quirks:**
- AudioContext is created in `running` state
- Tab may throttle AudioContext when backgrounded
- Autoplay policy may block initial sounds if no user gesture

**Firefox Quirks:**
- AudioContext is created in `running` state
- Tab throttling is more aggressive than Chrome
- `decodeAudioData` may have slightly different behavior

### 12.2.3 Audio Pool

When multiple sounds play simultaneously (e.g., score increment + streak fire + achievement), the audio engine uses a pool of pre-created `AudioBufferSourceNode` instances:

```typescript
class AudioPool {
  private pool: AudioBufferSourceNode[] = [];
  private maxConcurrent = 8;

  getSource(buffer: AudioBuffer): AudioBufferSourceNode {
    // Reuse an existing source node if available
    const available = this.pool.find(
      (source) => source.context.state === 'closed'
    );

    if (available) {
      available.buffer = buffer;
      return available;
    }

    // Create new source if pool is not full
    if (this.pool.length < this.maxConcurrent) {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      this.pool.push(source);
      return source;
    }

    // If pool is full, stop the oldest sound and reuse
    const oldest = this.pool.shift()!;
    oldest.stop();
    oldest.buffer = buffer;
    this.pool.push(oldest);
    return oldest;
  }
}
```

**Pool Size Rationale:**
- 8 concurrent sources is sufficient for all FOCUS scenarios
- Score increment + streak + achievement + UI feedback = 4 concurrent sounds maximum
- Exceeding 8 concurrent sounds would create cacophony, not enhancement
- Pool nodes are reused to prevent memory leaks

### 12.2.4 AudioNode Graph

Each sound plays through a standardized audio processing chain:

```
AudioBufferSourceNode (sound data)
  |
GainNode (per-category volume)
  |
BiquadFilterNode (optional EQ)
  |
GainNode (master volume)
  |
DestinationNode (speakers)
```

For ambient sounds, an additional `ConvolverNode` is optionally inserted for reverb:

```
AudioBufferSourceNode (ambient loop)
  |
GainNode (ambient volume)
  |
BiquadFilterNode (EQ)
  |
ConvolverNode (reverb, optional)
  |
GainNode (master volume)
  |
DestinationNode
```

### 12.2.5 Sound Loading and Decoding

All sounds are preloaded on app start:

```typescript
async loadAllSounds(): Promise<void> {
  const soundFiles = Object.values(SoundLibrary);

  // Load in parallel with concurrency limit
  const results = await Promise.allSettled(
    soundFiles.map(async (sound) => {
      const response = await fetch(sound.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(sound.id, audioBuffer);
    })
  );

  // Log any failed loads (but don't block app startup)
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(
        `Failed to load sound: ${soundFiles[index].id}`,
        result.reason
      );
    }
  });
}
```

**Total Audio Budget:**
- All sound files combined: < 2MB
- Individual sound files: < 50KB each
- Ambient loops: < 500KB each
- Audio sprites: < 200KB each

---

## 12.3 Sound Categories

### 12.3.1 UI Sounds

UI sounds provide feedback for interface interactions. They are the quietest and shortest sounds in FOCUS.

**Tap:**
- Duration: 100ms
- Frequency: 1000Hz sine wave
- Volume: -20dB
- Envelope: 10ms attack, 50ms decay, 40ms sustain
- Purpose: Confirms button press, link click, interactive element activation
- Variation: Slightly randomized pitch (980-1020Hz) to prevent mechanical repetition

**Navigation:**
- Duration: 150ms
- Frequency: White noise filtered through bandpass (2000-4000Hz)
- Volume: -15dB
- Envelope: 5ms attack, 100ms decay, 45ms sustain
- Purpose: Confirms page transition, tab switch, navigation action
- Variation: None (navigation sound should be consistent and recognizable)

**Toggle On:**
- Duration: 200ms
- Frequency: Ascending sweep from 800Hz to 1200Hz (sine wave)
- Volume: -18dB
- Envelope: 10ms attack, 150ms decay, 40ms sustain
- Purpose: Confirms toggle activation (turning on)
- Variation: None

**Toggle Off:**
- Duration: 200ms
- Frequency: Descending sweep from 1200Hz to 800Hz (sine wave)
- Volume: -18dB
- Envelope: 10ms attack, 150ms decay, 40ms sustain
- Purpose: Confirms toggle deactivation (turning off)
- Variation: None

**Error:**
- Duration: 300ms
- Frequency: 200Hz sawtooth wave (low, buzzy)
- Volume: -12dB
- Envelope: 5ms attack, 200ms decay, 95ms sustain
- Purpose: Communicates error state, invalid action, validation failure
- Variation: None (error sound should be immediately recognizable)

**Success:**
- Duration: 400ms
- Frequency: Major triad arpeggio (C5-E5-G5), each note 120ms
- Volume: -15dB
- Envelope: 10ms attack per note, 80ms decay per note
- Purpose: Confirms successful action (form submission, save, profile update)
- Variation: None

### 12.3.2 Game Sounds (Reaction Light Test)

Game sounds are the most complex and carefully designed sounds in FOCUS. They communicate performance quality through pitch, speed, and tonal quality.

**Stimulus Appear ("Ping"):**
- Duration: 150ms total (50ms attack, 100ms decay)
- Frequency: 440Hz sine wave (A4, concert pitch)
- Volume: -12dB
- Envelope: 5ms attack, 45ms decay, 100ms release
- Purpose: Alerts user that a stimulus is present and requires response
- Why 440Hz: A4 is the standard tuning pitch — neutral, clear, not too high or low
- Variation: None (consistency is critical for timing-based games)

**Fast Response (less than 250ms) ("Bright"):**
- Duration: 200ms
- Frequency: Ascending major third (C5 to E5), each note 100ms
- Volume: -10dB
- Envelope: 5ms attack, 90ms decay per note
- Purpose: Rewards fast reaction — ascending intervals feel positive and energizing
- Why ascending major third: Major thirds are universally perceived as positive; ascending motion reinforces "upward" performance
- Variation: None

**Medium Response (250-400ms) ("Acknowledge"):**
- Duration: 150ms
- Frequency: Single tone (C5), 523Hz
- Volume: -14dB
- Envelope: 5ms attack, 100ms decay, 45ms release
- Purpose: Neutral acknowledgment — neither rewarding nor punishing
- Why C5: A neutral, familiar pitch that sits comfortably in the audio spectrum
- Variation: None

**Slow Response (greater than 400ms) ("Notice"):**
- Duration: 200ms
- Frequency: Descending minor second (C5 to B4), each note 100ms
- Volume: -16dB
- Envelope: 5ms attack, 90ms decay per note
- Purpose: Gentle nudge — descending minor seconds feel slightly disappointing without being punishing
- Why descending minor second: Minor seconds create subtle tension; descending motion reinforces "below expectation"
- Variation: None

**Miss ("Attention"):**
- Duration: 300ms
- Frequency: 200Hz sine wave
- Volume: -10dB
- Envelope: 5ms attack, 250ms decay, 45ms release
- Purpose: Clear signal that a stimulus was missed
- Why 200Hz: Low frequencies are attention-grabbing without being harsh
- Variation: None

**False Start ("Warning"):**
- Duration: 250ms
- Frequency: Dissonant chord (C4 + F#4, tritone interval)
- Volume: -12dB
- Envelope: 5ms attack, 200ms decay, 45ms release
- Purpose: Signals premature response — the dissonance creates discomfort that discourages false starts
- Why tritone: The tritone ("devil's interval") is inherently dissonant and creates psychological discomfort
- Variation: None

**Session Complete ("Achievement"):**
- Duration: 500ms
- Frequency: Major chord arpeggio (C4-E4-G4-C5), each note 120ms
- Volume: -8dB
- Envelope: 5ms attack per note, 100ms decay per note, final note has 200ms sustain
- Purpose: Celebrates session completion — the ascending arpeggio creates a sense of accomplishment
- Why major arpeggio: Major chords are universally perceived as positive and complete
- Variation: None

**Level Up ("Celebration"):**
- Duration: 800ms
- Frequency: Orchestral-style sting — low note (C3) followed by ascending major triad (C4-E4-G4) with reverb tail
- Volume: -6dB (louder than other sounds, as this is a significant event)
- Envelope: 5ms attack per note, 200ms sustain, 400ms release with reverb
- Purpose: Maximum celebration for the most significant achievement
- Why orchestral: Orchestral stings are culturally associated with achievement and ceremony
- Variation: None

### 12.3.3 Ambient Sounds

Ambient sounds are optional background audio that creates an atmospheric context for focused work. All ambient sounds can be disabled independently.

**Focus Mode (Binaural Beats):**
- Duration: Continuous loop (seamless)
- Frequency: Two tones at slightly different frequencies (e.g., 200Hz left ear, 210Hz right ear = 10Hz binaural beat)
- Volume: -30dB base (adjustable from -40dB to -20dB)
- Purpose: Binaural beats at alpha wave frequency (8-12Hz) are associated with relaxed alertness
- Implementation: Two separate oscillator nodes, one per channel, with panning
- Scientific basis: Research suggests binaural beats may enhance focus and reduce anxiety, though effects are modest and individual
- Variation: Different frequencies for different modes:
  - Focus: 10Hz (alpha waves, relaxed alertness)
  - Calm: 6Hz (theta waves, meditation)
  - Energy: 14Hz (beta waves, active concentration)

**Calm Mode (Nature Sounds):**
- Duration: Continuous loop (seamless, crossfaded)
- Frequency: Broad-spectrum noise (rain, forest, ocean)
- Volume: -30dB base (adjustable)
- Purpose: Nature sounds create a calming atmosphere that reduces stress and improves concentration
- Implementation: High-quality recordings, processed to remove distracting elements (bird calls, sudden noises), looped with 2-second crossfade
- Available sounds:
  - Rain: Steady rainfall on leaves
  - Forest: Wind through trees with distant birds
  - Ocean: Gentle waves on shore
  - River: Babbling brook
  - White noise: Filtered white noise (for users who prefer non-nature sounds)

**Energy Mode (Rhythmic Pulse):**
- Duration: Continuous loop (seamless)
- Frequency: Low-frequency pulse (60-80Hz) at 60 BPM
- Volume: -30dB base (adjustable)
- Purpose: Rhythmic pulses at resting heart rate (60 BPM) can promote alertness without anxiety
- Implementation: Sine wave oscillator with amplitude modulation at 60 BPM
- Variation: BPM adjustable from 50-80 (user preference)

### 12.3.4 Notification Sounds

Notification sounds alert users to events that require attention but are not part of active gameplay.

**Message:**
- Duration: 500ms
- Frequency: Two-note chime (E5-G5), 200ms per note
- Volume: -18dB
- Purpose: Signals a new direct message
- Variation: None

**Achievement:**
- Duration: 300ms
- Frequency: Bright ascending tone (C5-E5), 150ms per note
- Volume: -15dB
- Purpose: Signals an achievement unlocked or milestone reached
- Variation: None

**Reminder:**
- Duration: 1000ms
- Frequency: Gentle pulse (440Hz), three pulses at 300ms intervals
- Volume: -20dB
- Purpose: Signals a training reminder or scheduled session
- Variation: None

**Challenge:**
- Duration: 400ms
- Frequency: Alert tone (C5-G5 ascending fifth), 200ms per note
- Volume: -12dB
- Purpose: Signals a new challenge from a friend
- Variation: None

---

## 12.4 Sound Implementation Details

### 12.4.1 Audio Sprite System

To reduce HTTP requests and memory usage, FOCUS uses audio sprites — single audio files containing multiple sounds:

```typescript
const audioSprite = {
  url: '/sounds/ui-sprite.mp3',
  sprite: {
    tap: [0, 100],           // [startMs, durationMs]
    navigation: [150, 150],
    toggleOn: [350, 200],
    toggleOff: [600, 200],
    error: [850, 300],
    success: [1200, 400],
  }
};

function playSound(id: string) {
  const sprite = audioSprite.sprite[id];
  const source = audioPool.getSource(buffer);

  source.buffer = audioBuffer;
  source.start(0, sprite[0] / 1000, sprite[1] / 1000);
  source.connect(gainNode);
}
```

**Sprite File Structure:**
- `ui-sprite.mp3`: All UI sounds (tap, navigation, toggle, error, success)
- `game-sprite.mp3`: All game sounds (stimulus, hit, miss, false start, complete, levelup)
- `notification-sprite.mp3`: All notification sounds (message, achievement, reminder, challenge)
- Each sprite file is < 100KB

### 12.4.2 Crossfade for Ambient Sounds

Ambient sounds are crossfaded when switching between tracks:

```typescript
function crossfadeAmbient(
  fromTrack: AudioBufferSourceNode,
  toTrack: AudioBufferSourceNode,
  duration: number = 2000
): void {
  const now = audioContext.currentTime;

  // Fade out current track
  fromTrack.gain.setValueAtTime(1, now);
  fromTrack.gain.linearRampToValueAtTime(0, now + duration / 1000);

  // Fade in new track
  toTrack.gain.setValueAtTime(0, now);
  toTrack.gain.linearRampToValueAtTime(1, now + duration / 1000);

  // Stop old track after fade
  fromTrack.source.stop(now + duration / 1000);
}
```

### 12.4.3 Mobile Audio Context Resume

On mobile browsers, the AudioContext must be resumed after the first user interaction due to browser autoplay policies:

```typescript
// Resume AudioContext on first user interaction
const resumeAudioContext = () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  // Remove listeners after first interaction
  document.removeEventListener('touchstart', resumeAudioContext);
  document.removeEventListener('click', resumeAudioContext);
  document.removeEventListener('keydown', resumeAudioContext);
};

document.addEventListener('touchstart', resumeAudioContext, { once: true });
document.addEventListener('click', resumeAudioContext, { once: true });
document.addEventListener('keydown', resumeAudioContext, { once: true });
```

### 12.4.4 Sound Configuration

Users can configure sound behavior in settings:

```typescript
interface SoundSettings {
  masterVolume: number;        // 0-100, default 70
  uiSoundsEnabled: boolean;    // default true
  gameSoundsEnabled: boolean;  // default true
  ambientSoundsEnabled: boolean; // default false
  notificationsEnabled: boolean; // default true
  ambientTrack: 'focus' | 'calm' | 'energy' | 'none'; // default 'none'
  ambientVolume: number;       // 0-100, default 30
}
```

---

## 12.5 Haptic Design Philosophy

### 12.5.1 Core Principles

**Haptic feedback confirms actions.**
Haptics provide a physical sensation that reinforces visual and audio feedback. A button press that produces a subtle vibration feels more "real" than one that only changes visually.

**Different haptic patterns for different events.**
Just as different sounds communicate different outcomes, different haptic patterns communicate different events. A light tap confirms a button press. A sharp pulse signals an error. A cascading pattern celebrates an achievement.

**Haptic should complement, not replace, visual/audio feedback.**
Haptics are always secondary to visual and audio feedback. If the user turns off haptics, the experience is unchanged. If the user turns off audio, haptics provide additional feedback. If the user turns off both, visual feedback alone is sufficient.

**Respect system haptic settings.**
If the user has disabled haptic feedback at the system level, FOCUS respects that setting and does not vibrate.

**Provide haptic intensity options.**
Users can adjust haptic intensity from Off to Strong, with Light and Medium in between.

### 12.5.2 Haptic Timing

Haptic feedback must be delivered within strict timing requirements:

- **Latency budget:** Less than 50ms from event to haptic output
- **Synchronization:** Haptic and visual feedback must appear simultaneous (within 1 frame at 60fps = 16.67ms)
- **Duration accuracy:** Haptic patterns must match their defined durations exactly
- **No drift:** Repeated haptic patterns must maintain consistent timing

---

## 12.6 Haptic Engine

### 12.6.1 Platform Implementations

**iOS (UIFeedbackGenerator):**
```swift
// Light impact (button taps, navigation)
let lightImpact = UIImpactFeedbackGenerator(style: .light)
lightImpact.impactOccurred()

// Medium impact (game responses, confirmations)
let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
mediumImpact.impactOccurred()

// Heavy impact (level up, achievement)
let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
heavyImpact.impactOccurred()

// Rigid impact (toggle, switch)
let rigidImpact = UIImpactFeedbackGenerator(style: .rigid)
rigidImpact.impactOccurred()

// Soft impact (selection, hover)
let softImpact = UIImpactFeedbackGenerator(style: .soft)
softImpact.impactOccurred()

// Selection changed
let selection = UISelectionFeedbackGenerator()
selection.selectionChanged()

// Notification (success, warning, error)
let notification = UINotificationFeedbackGenerator()
notification.notificationOccurred(.success)
notification.notificationOccurred(.warning)
notification.notificationOccurred(.error)
```

**Android (HapticFeedbackConstants + VibrationEffect):**
```kotlin
// Light tap
view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)

// Medium confirmation
view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)

// Heavy impact
view.performHapticFeedback(HapticFeedbackConstants.REJECT)

// Custom vibration pattern
val pattern = longArrayOf(0, 30, 50, 30) // [delay, vibrate, pause, vibrate]
val effect = VibrationEffect.createWaveform(pattern, -1)
vibrator.vibrate(effect)
```

**Web (navigator.vibrate):**
```typescript
// Basic vibration (limited support)
if ('vibrate' in navigator) {
  navigator.vibrate(30); // 30ms vibration
}

// Pattern vibration
navigator.vibrate([0, 30, 50, 30]); // [delay, vibrate, pause, vibrate]
```

### 12.6.2 Fallback Strategy

If haptic feedback is not supported on the device:
- No error is thrown
- No fallback visual effect is added (haptics supplement, not replace)
- The app functions identically without haptics
- Sound and visual feedback are unaffected

---

## 12.7 Haptic Patterns

### 12.7.1 Impact Haptics

Impact haptics provide a single, discrete vibration that simulates a physical impact.

| Pattern | Platform API | Duration | Use Case |
|---------|-------------|----------|----------|
| Light | UIImpactFeedbackGenerator.light | ~10ms | Button taps, navigation, small interactions |
| Medium | UIImpactFeedbackGenerator.medium | ~15ms | Game responses, confirmations, submissions |
| Heavy | UIImpactFeedbackGenerator.heavy | ~20ms | Level up, achievement, major events |
| Rigid | UIImpactFeedbackGenerator.rigid | ~10ms | Toggle switch, checkbox, binary state change |
| Soft | UIImpactFeedbackGenerator.soft | ~10ms | Selection, hover, subtle feedback |

### 12.7.2 Selection Haptics

Selection haptics provide a light feedback when the user scrolls through or selects items.

| Pattern | Platform API | Duration | Use Case |
|---------|-------------|----------|----------|
| Selection changed | UISelectionFeedbackGenerator.selectionChanged | ~5ms | Scrolling through lists, picker selection, carousel |

### 12.7.3 Notification Haptics

Notification haptics communicate the outcome of an operation.

| Pattern | Platform API | Duration | Use Case |
|---------|-------------|----------|----------|
| Success | UINotificationFeedbackGenerator.success | ~20ms | Achievement, score, positive outcome |
| Warning | UINotificationFeedbackGenerator.warning | ~30ms | Low performance, approaching limit, caution |
| Error | UINotificationFeedbackGenerator.error | ~40ms | Miss, false start, negative outcome |

### 12.7.4 Custom Patterns (Android)

Android allows custom vibration patterns that create unique haptic experiences:

**Double Tap:**
```kotlin
val doubleTap = longArrayOf(0, 30, 50, 30)
// [delay=0ms, vibrate=30ms, pause=50ms, vibrate=30ms]
// Total: 110ms
// Use: Quick confirmation, like button, reaction
```

**Triple Tap:**
```kotlin
val tripleTap = longArrayOf(0, 20, 40, 20, 40, 20)
// [delay=0ms, vibrate=20ms, pause=40ms, vibrate=20ms, pause=40ms, vibrate=20ms]
// Total: 140ms
// Use: Strong confirmation, achievement unlock, important action
```

**Celebration:**
```kotlin
val celebration = longArrayOf(0, 50, 100, 50, 100, 100, 50, 200)
// [delay=0ms, vibrate=50ms, pause=100ms, vibrate=50ms, pause=100ms, vibrate=100ms, pause=50ms, vibrate=200ms]
// Total: 650ms
// Use: Level up, major achievement, session complete
```

**Streak Fire:**
```kotlin
val streakFire = longArrayOf(0, 30, 60, 30, 60, 30, 60, 60, 30, 100)
// Cascading pattern that accelerates
// Total: 460ms
// Use: Streak counter increment, consecutive correct responses
```

**Subtle Pulse:**
```kotlin
val subtlePulse = longArrayOf(0, 10, 90, 10)
// [delay=0ms, vibrate=10ms, pause=90ms, vibrate=10ms]
// Total: 110ms (repeating)
// Use: Timer ticking, ambient focus feedback
```

### 12.7.5 Continuous Haptics (iOS)

iOS supports continuous haptic patterns using `CHHapticEngine`:

**Focus Mode:**
- Subtle continuous haptic at 60 BPM
- Very light intensity (barely perceptible)
- Creates a rhythmic "heartbeat" that promotes focus
- Only active during focus mode sessions

**Timer Ticking:**
- Light tick every second during the last 10 seconds of a timer
- Tick intensity increases as timer approaches zero
- Creates urgency without audio

**Implementation:**
```swift
let engine = try CHHapticEngine()
try engine.start()

let pattern = CHHapticPattern(events: [
  CHHapticEvent(
    eventType: .hapticTransient,
    parameters: [CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3)],
    relativeTime: 0
  )
], parameters: [])

let player = try engine.makePlayer(with: pattern)
try player.start(atTime: CHHapticTimeImmediate)
```

---

## 12.8 Haptic Configuration

### 12.8.1 User Settings

Users can configure haptic behavior in FOCUS settings:

```typescript
interface HapticSettings {
  enabled: boolean;           // default true
  intensity: 'off' | 'light' | 'medium' | 'strong'; // default 'medium'
  gameHaptics: boolean;       // default true
  uiHaptics: boolean;         // default true
  ambientHaptics: boolean;    // default false (continuous haptics)
}
```

**Intensity Mapping:**

| User Setting | iOS Impact Level | Android Amplitude |
|-------------|-----------------|-------------------|
| Off | N/A | N/A |
| Light | UIImpactFeedbackGenerator.light | 30% amplitude |
| Medium | UIImpactFeedbackGenerator.medium | 60% amplitude |
| Strong | UIImpactFeedbackGenerator.heavy | 100% amplitude |

### 12.8.2 System Haptic Respect

FOCUS checks the system haptic setting:

```typescript
// iOS: Check if system haptics are enabled
const systemHapticsEnabled = await UIKit.UIAccessibility.isReduceMotionEnabled;

// Android: Check haptic feedback setting
const hapticEnabled = Settings.System.getInt(
  resolver,
  Settings.System.HAPTIC_FEEDBACK_ENABLED,
  1
) === 1;

// If system haptics are disabled, FOCUS disables haptics too
if (!systemHapticsEnabled) {
  hapticSettings.enabled = false;
}
```

### 12.8.3 Battery-Aware Haptics

Haptic feedback consumes battery (especially on Android with vibration motor). FOCUS reduces haptic usage on low battery:

```typescript
async function getBatteryLevel(): Promise<number> {
  if ('getBattery' in navigator) {
    const battery = await (navigator as any).getBattery();
    return battery.level; // 0-1
  }
  return 1; // Assume full battery if API not available
}

// Adjust haptic behavior based on battery
const batteryLevel = await getBatteryLevel();

if (batteryLevel < 0.15) {
  // Below 15%: Disable all haptics
  hapticSettings.enabled = false;
} else if (batteryLevel < 0.30) {
  // Below 30%: Reduce haptic intensity
  hapticSettings.intensity = 'light';
}
```

---

## 12.9 Sound & Haptic Integration with Game Events

### 12.9.1 Event System

Every game event can trigger optional sound and haptic feedback. The event system is declarative — game developers define which events produce which feedback:

```typescript
interface GameEventConfig {
  eventId: string;
  sound?: {
    soundId: string;
    volume?: number;        // Override default volume
    delay?: number;         // Delay before playing (ms)
  };
  haptic?: {
    pattern: string;        // Haptic pattern name
    intensity?: 'light' | 'medium' | 'strong';
  };
  visual?: {
    animation: string;      // Animation to play
    duration?: number;
  };
}
```

### 12.9.2 Event Configuration Examples

```typescript
const reactionLightTestEvents: GameEventConfig[] = [
  {
    eventId: 'stimulus_appear',
    sound: { soundId: 'game.stimulus_appear', volume: -12 },
    haptic: { pattern: 'light_impact', intensity: 'light' },
    visual: { animation: 'stimulus_scale_in' },
  },
  {
    eventId: 'correct_response',
    sound: { soundId: 'game.fast_response', volume: -10 },
    haptic: { pattern: 'medium_impact', intensity: 'medium' },
    visual: { animation: 'stimulus_hit_pulse' },
  },
  {
    eventId: 'miss',
    sound: { soundId: 'game.miss', volume: -10 },
    haptic: { pattern: 'error_notification', intensity: 'strong' },
    visual: { animation: 'stimulus_miss_shake' },
  },
  {
    eventId: 'false_start',
    sound: { soundId: 'game.false_start', volume: -12 },
    haptic: { pattern: 'warning_notification', intensity: 'medium' },
    visual: { animation: 'stimulus_false_start_shake' },
  },
  {
    eventId: 'session_complete',
    sound: { soundId: 'game.session_complete', volume: -8 },
    haptic: { pattern: 'celebration', intensity: 'strong' },
    visual: { animation: 'session_complete_overlay' },
  },
  {
    eventId: 'level_up',
    sound: { soundId: 'game.level_up', volume: -6 },
    haptic: { pattern: 'celebration', intensity: 'strong' },
    visual: { animation: 'level_up_celebration' },
  },
  {
    eventId: 'streak_increment',
    sound: { soundId: 'game.streak_fire', volume: -14 },
    haptic: { pattern: 'double_tap', intensity: 'light' },
    visual: { animation: 'streak_fire_particles' },
  },
];
```

### 12.9.3 Event Dispatch

When a game event fires, the audio and haptic systems are triggered simultaneously:

```typescript
function dispatchGameEvent(eventConfig: GameEventConfig): void {
  const timestamp = performance.now();

  // Fire sound
  if (eventConfig.sound) {
    audioEngine.play(
      eventConfig.sound.soundId,
      eventConfig.sound.volume,
      eventConfig.sound.delay || 0
    );
  }

  // Fire haptic
  if (eventConfig.haptic) {
    hapticEngine.trigger(
      eventConfig.haptic.pattern,
      eventConfig.haptic.intensity
    );
  }

  // Fire visual
  if (eventConfig.visual) {
    animationEngine.play(
      eventConfig.visual.animation,
      eventConfig.visual.duration
    );
  }

  // Log timing for performance monitoring
  const latency = performance.now() - timestamp;
  if (latency > 50) {
    console.warn(
      `Event ${eventConfig.eventId} dispatch took ${latency}ms (target: <50ms)`
    );
  }
}
```

### 12.9.4 Simultaneous Sound and Haptic

Sound and haptic fire simultaneously, but they are independent systems:
- Disabling sound does not disable haptics
- Disabling haptics does not disable sound
- Both can be configured independently
- Both are delivered within the 50ms latency budget

### 12.9.5 Audio-Haptic Synchronization

To ensure audio and haptic feedback feel synchronized:

1. Both are triggered from the same event handler
2. Both use the same timestamp for their start time
3. Haptic feedback is delivered first (on iOS, haptic latency is typically 5-10ms; audio latency is 10-30ms)
4. The slight audio delay is imperceptible (within 1 frame at 60fps)
5. For timing-critical events (game stimulus), haptic is pre-loaded 10ms before the expected event time

---

## 12.10 Sound & Haptic Accessibility

### 12.10.1 Accessibility Considerations

**Deaf and Hard of Hearing Users:**
- All sound events have visual equivalents (icons, color changes, animations)
- Sound is never the only indicator of an event
- Subtitles/captions are available for any spoken content (future)
- Visual haptic indicators show when haptic feedback fires

**Deafblind Users:**
- Haptic feedback provides tactile confirmation of events
- High contrast mode ensures visual feedback is perceivable
- Screen reader support describes all events in text

**Sound Sensitivity:**
- Users can disable all sounds
- Users can disable specific sound categories
- Volume control allows fine-tuning
- No sudden loud sounds (all sounds have gentle attack envelopes)

**Motor Disabilities:**
- Haptic feedback confirms button presses without requiring visual confirmation
- Reduced motion settings disable continuous haptics
- All haptic patterns have visual equivalents

### 12.10.2 Testing Protocol

Sound and haptic design is tested with:
1. **A/B testing:** Users test with sound on vs. off, haptics on vs. off
2. **Accessibility audit:** Screen reader testing, high contrast testing
3. **Device testing:** Multiple devices for haptic quality (iOS and Android)
4. **Volume testing:** Test at various system volume levels
5. **Battery testing:** Measure battery impact of haptic usage
6. **Performance testing:** Measure latency from event to sound/haptic output

---

## 12.11 Sound & Haptic Analytics

### 12.11.1 Key Metrics

| Metric | Target |
|--------|--------|
| Sound latency (event to audio output) | < 30ms |
| Haptic latency (event to vibration) | < 20ms |
| Combined latency (event to feedback) | < 50ms |
| Sound load time (all sounds preloaded) | < 2s on 3G |
| Total audio memory usage | < 20MB |
| Users with sound enabled | Track percentage |
| Users with haptics enabled | Track percentage |
| Users who disable sound after first session | Track churn |

### 12.11.2 A/B Testing

Sound and haptic features are A/B tested for:
- Sound volume levels (does louder = better engagement?)
- Haptic intensity options (does stronger = better retention?)
- Ambient sound defaults (should ambient be on by default?)
- Game sound variations (which sounds feel most rewarding?)
- Notification sound effectiveness (which sounds drive re-engagement?)

---

## 12.12 Summary

The sound and haptic systems in FOCUS create a multi-sensory experience that reinforces visual feedback with audio and tactile confirmation. Every sound is purposeful, every haptic pattern is intentional, and every user can customize their experience to their preference.

Key design decisions and their rationale:
1. **Conservative volume levels:** Prevents fatigue and disturbance while maintaining clarity
2. **Purpose-driven sounds:** Every sound communicates something — no decorative audio
3. **Platform-native haptics:** Leverages each platform's best haptic capabilities
4. **Fully optional:** Both systems can be disabled without degrading the experience
5. **Performance budget:** Strict latency requirements ensure audio and haptic feel instantaneous
6. **Battery awareness:** Reduces haptic usage on low battery to preserve device longevity
7. **Accessibility first:** All audio and haptic events have visual equivalents
8. **Audio sprites:** Efficient loading and memory usage through sprite-based audio

---

*End of Part II: Core Platform Systems*
