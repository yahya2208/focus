import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { correctReactionTime } from '../../core/measurement';
import { REACTION } from '../../core/scientific/constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getGlobalTelemetry } from '../../core/telemetry';

type Phase = 'waiting' | 'visible' | 'hit' | 'miss';

const TOTAL_ROUNDS = 7;
const MIN_DELAY_MS = 750;
const MAX_DELAY_MS = 2200;
const LAMP_SIZE = 90;
const MIN_POSITION_DISTANCE_PCT = 25;

const POSITIONS = [
  { x: 20, y: 25 }, { x: 50, y: 18 }, { x: 80, y: 25 },
  { x: 25, y: 50 }, { x: 75, y: 50 },
  { x: 20, y: 75 }, { x: 50, y: 82 }, { x: 80, y: 75 },
  { x: 35, y: 35 }, { x: 65, y: 35 },
  { x: 35, y: 65 }, { x: 65, y: 65 },
] as const;

let audioCtx: AudioContext | null = null;
function playBreakSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch { /* silent */ }
}

function pickPosition(prev: { x: number; y: number }): { x: number; y: number } {
  const candidates = POSITIONS.filter((p) => {
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    return Math.sqrt(dx * dx + dy * dy) >= MIN_POSITION_DISTANCE_PCT;
  });
  if (candidates.length === 0) return POSITIONS[Math.floor(Math.random() * POSITIONS.length)]!;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

const KEYFRAMES_CSS = `
@keyframes lampAppear{0%{transform:translate(-50%,-50%) scale(0);opacity:0;filter:blur(4px)}50%{transform:translate(-50%,-50%) scale(1.1);opacity:1;filter:blur(0)}100%{transform:translate(-50%,-50%) scale(1);opacity:1;filter:blur(0)}}
@keyframes lampPulse{0%,100%{box-shadow:0 0 12px #f59e0b66,0 0 24px #f59e0b33,0 0 48px #f59e0b22,inset 0 0 8px #f59e0baa}50%{box-shadow:0 0 16px #f59e0b88,0 0 32px #f59e0b44,0 0 64px #f59e0b33,inset 0 0 12px #f59e0bcc}}
@keyframes lampShatter{0%{transform:translate(-50%,-50%) scale(1);opacity:1;filter:brightness(1)}15%{transform:translate(-50%,-50%) scale(1.3);opacity:1;filter:brightness(2.5)}100%{transform:translate(-50%,-50%) scale(0);opacity:0;filter:brightness(0.3)}}
@keyframes crackSpread{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}15%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
@keyframes shardFly{0%{opacity:1;transform:translate(0,0) rotate(0deg)}100%{opacity:0;transform:translate(var(--sx),var(--sy)) rotate(var(--sr))}}
@keyframes rtPop{0%{transform:scale(0.5);opacity:0}50%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes bestPulse{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
`;

function GlassLamp({ visible, onRef }: { visible: boolean; onRef: (el: HTMLButtonElement | null) => void }) {
  const colors = useThemeColors();
  if (!visible) return null;

  return (
    <button
      ref={onRef}
      aria-label="Tap the lamp"
      style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: LAMP_SIZE, height: LAMP_SIZE,
        borderRadius: '50%', border: 'none', padding: 0,
        cursor: 'pointer', zIndex: 5, outline: 'none',
        touchAction: 'manipulation',
        animation: 'lampAppear 0.2s ease-out forwards, lampPulse 1.5s ease-in-out infinite',
        background: `radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 30%, transparent 60%),
                     radial-gradient(circle at 50% 50%, ${colors.warning} 0%, ${colors.warning}cc 35%, ${colors.warning}66 65%, transparent 100%)`,
        boxShadow: `0 4px 16px ${colors.warning}66, 0 8px 32px ${colors.warning}33, 0 16px 56px ${colors.warning}22, inset 0 -4px 8px ${colors.warning}44, inset 0 2px 6px rgba(255,255,255,0.3)`,
      }}
      onClick={(e) => { e.stopPropagation(); }}
      onTouchEnd={(e) => { e.preventDefault(); }}
    >
      <div style={{
        position: 'absolute', top: '12%', left: '18%',
        width: '25%', height: '15%',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)',
        filter: 'blur(2px)',
        transform: 'rotate(-25deg)',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '20%',
        width: '12%', height: '8%',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        filter: 'blur(1px)',
      }} />
    </button>
  );
}

export function GameScreen() {
  const dispatch = useAppDispatch();
  const { calibrationProfile } = useAppState();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [phase, setPhase] = useState<Phase>('waiting');
  const [round, setRound] = useState(0);
  const [hudTick, setHudTick] = useState(0);

  const rawRtsRef = useRef<number[]>([]);
  const bestTimeRef = useRef<number | null>(null);
  const lastRtRef = useRef<number | null>(null);
  const lampPosRef = useRef({ x: 50, y: 50 });
  const prevLampPosRef = useRef({ x: 50, y: 50 });
  const lampElRef = useRef<HTMLButtonElement | null>(null);

  const stimulusTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const phaseRef = useRef<Phase>('waiting');
  const roundRef = useRef(0);

  phaseRef.current = phase;
  roundRef.current = round;

  const calibration = useMemo(() => calibrationProfile ?? {
    refreshRate: 60, displayLagMs: 16.667, inputLagMs: 8,
    confidence: 0.5, platform: 'unknown' as const, timestamp: Date.now(),
  }, [calibrationProfile]);

  const startRound = useCallback(() => {
    setPhase('waiting');
    lastRtRef.current = null;
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timerRef.current = setTimeout(() => {
      const next = pickPosition(prevLampPosRef.current);
      prevLampPosRef.current = next;
      lampPosRef.current = next;
      stimulusTimeRef.current = performance.now();
      setPhase('visible');
    }, delay);
  }, []);

  useEffect(() => {
    if (round >= TOTAL_ROUNDS) {
      const rts = rawRtsRef.current;
      getGlobalTelemetry().track('game_completed', {
        totalRounds: TOTAL_ROUNDS,
        validRounds: rts.filter((rt) => {
          const corrected = rt - calibration.displayLagMs - calibration.inputLagMs;
          return corrected >= REACTION.MIN_RT_MS;
        }).length,
        isQrFlow: false,
      });
      dispatch({
        type: 'SET_RESULTS',
        results: {
          rawRts: rts,
          correctedRts: rts.map((rt) => correctReactionTime(rt, calibration).correctedRtMs),
          calibration,
          totalRounds: TOTAL_ROUNDS,
          validRounds: rts.filter((rt) => {
            const corrected = rt - calibration.displayLagMs - calibration.inputLagMs;
            return corrected >= REACTION.MIN_RT_MS;
          }).length,
        },
      });
      dispatch({ type: 'NAVIGATE', screen: 'results' });
      return;
    }
    startRound();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, [round, calibration, dispatch, startRound]);

  const handleLampTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (phaseRef.current !== 'visible') return;

    const rt = performance.now() - stimulusTimeRef.current;
    rawRtsRef.current.push(rt);
    lastRtRef.current = rt;
    if (bestTimeRef.current === null || rt < bestTimeRef.current) {
      bestTimeRef.current = rt;
    }

    setPhase('hit');
    playBreakSound();
    setHudTick((t) => t + 1);

    roundTimerRef.current = setTimeout(() => {
      setRound((r) => r + 1);
    }, 700);
  }, []);

  useEffect(() => {
    if (phase === 'visible' && lampElRef.current) {
      const el = lampElRef.current;
      const onClick = () => handleLampTap({ stopPropagation: () => {} } as React.MouseEvent);
      const onTouchEnd = (e: Event) => { e.preventDefault(); handleLampTap({ stopPropagation: () => {} } as React.TouchEvent); };
      el.addEventListener('click', onClick);
      el.addEventListener('touchend', onTouchEnd, { passive: false });
      return () => {
        el.removeEventListener('click', onClick);
        el.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [phase, handleLampTap]);

  const progress = Math.round((round / TOTAL_ROUNDS) * 100);
  const bestTime = bestTimeRef.current;
  const lastRt = (phase === 'hit') ? lastRtRef.current : null;
  const lp = lampPosRef.current;

  const isNewBest = lastRt !== null && bestTime !== null && lastRt <= bestTime;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
      <nav
        aria-label={`Game round ${round + 1} of ${TOTAL_ROUNDS}`}
        role="application"
        tabIndex={0}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          background: colors.bg,
          outline: 'none',
          overflow: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          contain: 'strict',
        }}
      >
        {/* HUD — Best Time prominent at top-left */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          zIndex: 10,
          contain: 'layout style',
        }}>
          {/* Best Time — large and prominent */}
          <div style={{
            background: colors.glass,
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: '14px',
            padding: '0.6rem 1rem',
            backdropFilter: 'blur(10px)',
            minWidth: '100px',
          }}>
            <span style={{ fontSize: '0.55rem', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block' }}>
              {t('game.bestTime')}
            </span>
            <span style={{
              fontSize: '1.5rem', fontWeight: 800,
              color: bestTime !== null ? colors.accent : colors.textFaint,
              fontVariantNumeric: 'tabular-nums', display: 'block',
              lineHeight: 1.1,
              animation: bestTime !== null && isNewBest ? 'bestPulse 0.4s ease-out' : undefined,
            }}>
              {bestTime !== null ? `${Math.round(bestTime)}` : '---'}
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: colors.textMuted, marginLeft: '2px' }}>ms</span>
            </span>
          </div>

          {/* Round counter + progress */}
          <div style={{
            background: colors.glass,
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: '14px',
            padding: '0.6rem 1rem',
            textAlign: 'right',
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{ fontSize: '0.55rem', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block' }}>
              {t('game.round')}
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: colors.text, fontVariantNumeric: 'tabular-nums', display: 'block', lineHeight: 1.1 }}>
              {Math.min(round + 1, TOTAL_ROUNDS)}
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: colors.textMuted }}>/{TOTAL_ROUNDS}</span>
            </span>
            <div style={{ width: '80px', height: '3px', background: colors.progressBg, borderRadius: '2px', overflow: 'hidden', marginTop: '6px', marginLeft: 'auto' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Last RT popup — center */}
        {lastRt !== null && (
          <div
            key={`rt-${hudTick}`}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20, pointerEvents: 'none',
              animation: 'rtPop 0.3s ease-out',
              background: colors.glass,
              border: `1px solid ${isNewBest ? colors.accent : colors.glassBorder}`,
              borderRadius: '18px',
              padding: '0.75rem 1.5rem',
              backdropFilter: 'blur(12px)',
              boxShadow: isNewBest ? `0 0 20px ${colors.accent}33` : undefined,
            }}
          >
            <span style={{
              fontSize: '2.25rem', fontWeight: 800,
              color: isNewBest ? colors.accent : colors.success,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(lastRt)}ms
            </span>
            {isNewBest && (
              <span style={{
                display: 'block', fontSize: '0.6rem', fontWeight: 600,
                color: colors.accent, textTransform: 'uppercase' as const,
                letterSpacing: '0.1em', textAlign: 'center', marginTop: '2px',
              }}>
                NEW BEST
              </span>
            )}
          </div>
        )}

        {/* Glass Lamp positioned at current target */}
        <GlassLamp
          visible={phase === 'visible'}
          onRef={(el) => { lampElRef.current = el; }}
        />
        {phase === 'visible' && (
          <div
            style={{
              position: 'absolute',
              left: `${lp.x}%`, top: `${lp.y}%`,
              transform: 'translate(-50%, -50%)',
              width: LAMP_SIZE, height: LAMP_SIZE,
              pointerEvents: 'none', zIndex: 6,
            }}
          >
            <div style={{
              position: 'absolute', inset: '-10%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.warning}22 0%, transparent 70%)`,
              animation: 'lampPulse 1.5s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* Shatter effect — glass shards + crack lines */}
        {phase === 'hit' && (
          <>
            <div
              key={`crack-${hudTick}`}
              style={{
                position: 'absolute',
                left: `${lp.x}%`, top: `${lp.y}%`,
                transform: 'translate(-50%, -50%)',
                width: LAMP_SIZE * 2.5, height: LAMP_SIZE * 2.5,
                zIndex: 7, pointerEvents: 'none',
                animation: 'crackSpread 0.5s ease-out forwards',
              }}
            >
              <svg viewBox="0 0 120 120" width="100%" height="100%">
                <circle cx="60" cy="60" r="30" fill="none" stroke={colors.success} strokeWidth="1.5" opacity="0.5" />
                <line x1="60" y1="30" x2="60" y2="5" stroke={colors.success} strokeWidth="1.2" opacity="0.6" />
                <line x1="60" y1="90" x2="60" y2="115" stroke={colors.success} strokeWidth="1.2" opacity="0.6" />
                <line x1="30" y1="60" x2="5" y2="60" stroke={colors.success} strokeWidth="1.2" opacity="0.6" />
                <line x1="90" y1="60" x2="115" y2="60" stroke={colors.success} strokeWidth="1.2" opacity="0.6" />
                <line x1="39" y1="39" x2="18" y2="18" stroke={colors.success} strokeWidth="1" opacity="0.5" />
                <line x1="81" y1="39" x2="102" y2="18" stroke={colors.success} strokeWidth="1" opacity="0.5" />
                <line x1="39" y1="81" x2="18" y2="102" stroke={colors.success} strokeWidth="1" opacity="0.5" />
                <line x1="81" y1="81" x2="102" y2="102" stroke={colors.success} strokeWidth="1" opacity="0.5" />
                <line x1="60" y1="30" x2="45" y2="12" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
                <line x1="60" y1="30" x2="78" y2="10" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
                <line x1="60" y1="90" x2="42" y2="108" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
                <line x1="60" y1="90" x2="80" y2="110" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
              </svg>
            </div>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * 60 + Math.random() * 30) * (Math.PI / 180);
              const dist = 30 + Math.random() * 40;
              return (
                <div
                  key={`shard-${hudTick}-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${lp.x}%`, top: `${lp.y}%`,
                    width: 4 + Math.random() * 4,
                    height: 4 + Math.random() * 4,
                    borderRadius: '1px',
                    background: colors.success,
                    opacity: 0.6,
                    zIndex: 8,
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)',
                    ['--sx' as string]: `${Math.cos(angle) * dist}px`,
                    ['--sy' as string]: `${Math.sin(angle) * dist}px`,
                    ['--sr' as string]: `${Math.random() * 360}deg`,
                    animation: `shardFly ${0.3 + Math.random() * 0.2}s ease-out forwards`,
                  }}
                />
              );
            })}
          </>
        )}

        {/* Bottom instruction */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: 0, right: 0,
          textAlign: 'center', zIndex: 10,
        }}>
          {phase === 'waiting' && (
            <div style={{
              display: 'inline-block',
              background: colors.glass,
              border: `1px solid ${colors.glassBorder}`,
              borderRadius: '12px',
              padding: '0.5rem 1.25rem',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{ color: colors.textMuted, fontSize: '0.85rem', margin: 0 }}>{t('game.ready')}</p>
            </div>
          )}
          {phase === 'visible' && (
            <div style={{
              display: 'inline-block',
              background: `${colors.warning}18`,
              border: `1px solid ${colors.warning}44`,
              borderRadius: '12px',
              padding: '0.5rem 1.25rem',
            }}>
              <p style={{ color: colors.warning, fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{t('game.stimulus')}</p>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
