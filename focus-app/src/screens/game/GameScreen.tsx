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
const LAMP_SIZE = 80;
const MIN_POSITION_DISTANCE_PCT = 25;

const POSITIONS = [
  { x: 20, y: 25 }, { x: 50, y: 20 }, { x: 80, y: 25 },
  { x: 25, y: 50 }, { x: 75, y: 50 },
  { x: 20, y: 75 }, { x: 50, y: 80 }, { x: 80, y: 75 },
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
@keyframes lampGlowIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes glassCrack{0%{opacity:0;transform:scale(0.5)}20%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}
@keyframes rtPop{0%{transform:scale(0.5);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
`;

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

  const progress = Math.round((round / TOTAL_ROUNDS) * 100);
  const bestTime = bestTimeRef.current;
  const lastRt = (phase === 'hit') ? lastRtRef.current : null;
  const lp = lampPosRef.current;

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
        {/* HUD */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          contain: 'layout style',
        }}>
          <div style={{
            background: colors.glass,
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: '12px',
            padding: '0.5rem 0.75rem',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: '0.6rem', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              {t('game.bestTime')}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.accent, fontVariantNumeric: 'tabular-nums', display: 'block' }}>
              {bestTime !== null ? `${Math.round(bestTime)}ms` : '---'}
            </span>
          </div>

          <div style={{
            background: colors.glass,
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: '12px',
            padding: '0.5rem 0.75rem',
            textAlign: 'right',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: '0.6rem', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              {t('game.round')}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.text, fontVariantNumeric: 'tabular-nums', display: 'block' }}>
              {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
            </span>
            <div style={{ width: '70px', height: '3px', background: colors.progressBg, borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Last RT popup */}
        {lastRt !== null && (
          <div
            key={`rt-${hudTick}`}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20, pointerEvents: 'none',
              animation: 'rtPop 0.3s ease-out',
              background: colors.glass,
              border: `1px solid ${colors.glassBorder}`,
              borderRadius: '16px',
              padding: '0.75rem 1.25rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ fontSize: '2rem', fontWeight: 800, color: colors.success, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(lastRt)}ms
            </span>
          </div>
        )}

        {/* LED Glass Lamp — the ONLY target */}
        {phase === 'visible' && (
          <button
            aria-label="Tap the lamp"
            onClick={handleLampTap}
            onTouchEnd={(e) => { e.preventDefault(); handleLampTap(e); }}
            style={{
              position: 'absolute',
              left: `${lp.x}%`, top: `${lp.y}%`,
              transform: 'translate(-50%, -50%)',
              width: LAMP_SIZE, height: LAMP_SIZE,
              borderRadius: '50%', border: 'none', padding: 0,
              cursor: 'pointer', zIndex: 5, outline: 'none',
              touchAction: 'manipulation',
              animation: 'lampGlowIn 0.2s ease-out forwards',
              background: `radial-gradient(circle, ${colors.warning} 0%, ${colors.warning}cc 40%, ${colors.warning}66 70%, transparent 100%)`,
              boxShadow: `0 0 16px ${colors.warning}88, 0 0 32px ${colors.warning}44, 0 0 56px ${colors.warning}22, inset 0 0 10px ${colors.warning}aa`,
            }}
          />
        )}

        {/* Glass crack effect on hit — AFTER measurement */}
        {phase === 'hit' && (
          <div
            key={`break-${hudTick}`}
            style={{
              position: 'absolute',
              left: `${lp.x}%`, top: `${lp.y}%`,
              transform: 'translate(-50%, -50%)',
              width: LAMP_SIZE * 2, height: LAMP_SIZE * 2,
              zIndex: 5, pointerEvents: 'none',
              animation: 'glassCrack 0.4s ease-out forwards',
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <circle cx="50" cy="50" r="24" fill="none" stroke={colors.success} strokeWidth="1.5" opacity="0.6" />
              <line x1="50" y1="26" x2="50" y2="10" stroke={colors.success} strokeWidth="1" opacity="0.5" />
              <line x1="50" y1="74" x2="50" y2="90" stroke={colors.success} strokeWidth="1" opacity="0.5" />
              <line x1="26" y1="50" x2="10" y2="50" stroke={colors.success} strokeWidth="1" opacity="0.5" />
              <line x1="74" y1="50" x2="90" y2="50" stroke={colors.success} strokeWidth="1" opacity="0.5" />
              <line x1="33" y1="33" x2="20" y2="20" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
              <line x1="67" y1="33" x2="80" y2="20" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
              <line x1="33" y1="67" x2="20" y2="80" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
              <line x1="67" y1="67" x2="80" y2="80" stroke={colors.success} strokeWidth="0.8" opacity="0.4" />
            </svg>
          </div>
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
