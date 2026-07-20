import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { correctReactionTime } from '../../core/measurement';
import { REACTION } from '../../core/scientific/constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';

type Phase = 'waiting' | 'visible' | 'hit' | 'miss';

const TOTAL_ROUNDS = 20;
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 5000;
const LAMP_SIZE = 72;

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

const KEYFRAMES_CSS = `
@keyframes lampGlowIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes lampBreak{0%{transform:scale(1);opacity:1;filter:brightness(1)}30%{transform:scale(1.4);opacity:1;filter:brightness(2)}100%{transform:scale(0);opacity:0;filter:brightness(0.5)}}
@keyframes rtPop{0%{transform:scale(0.5);opacity:0}50%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes missFlash{0%{opacity:0}20%{opacity:.15}100%{opacity:0}}
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
  const prevLampIndexRef = useRef(-1);

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
      let next: number;
      do { next = Math.floor(Math.random() * POSITIONS.length); } while (next === prevLampIndexRef.current);
      prevLampIndexRef.current = next;
      lampPosRef.current = POSITIONS[next]!;
      stimulusTimeRef.current = performance.now();
      setPhase('visible');
    }, delay);
  }, []);

  useEffect(() => {
    if (round >= TOTAL_ROUNDS) {
      const rts = rawRtsRef.current;
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
    }, 800);
  }, []);

  const handleBackgroundTap = useCallback(() => {
    if (phaseRef.current !== 'visible') return;
    setPhase('miss');
    setHudTick((t) => t + 1);
    roundTimerRef.current = setTimeout(() => {
      setRound((r) => r + 1);
    }, 600);
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
        onClick={handleBackgroundTap}
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
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            contain: 'layout style',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              {t('game.bestTime')}
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: colors.accent, fontVariantNumeric: 'tabular-nums' }}>
              {bestTime !== null ? `${Math.round(bestTime)}ms` : '---'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              {t('game.round')} {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
            </span>
            <div style={{ width: '80px', height: '4px', background: colors.progressBg, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {lastRt !== null && (
          <div
            key={`rt-${hudTick}`}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20, pointerEvents: 'none',
              animation: 'rtPop 0.3s ease-out',
            }}
          >
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: colors.success, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(lastRt)}ms
            </span>
          </div>
        )}

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
              animation: 'lampGlowIn 0.25s ease-out forwards',
              background: `radial-gradient(circle,${colors.warning} 0%,${colors.warning}dd 50%,${colors.warning}88 100%)`,
              boxShadow: `0 0 20px ${colors.warning}88,0 0 40px ${colors.warning}44,0 0 60px ${colors.warning}22`,
            }}
          />
        )}

        {phase === 'hit' && (
          <div
            key={`break-${hudTick}`}
            style={{
              position: 'absolute',
              left: `${lp.x}%`, top: `${lp.y}%`,
              transform: 'translate(-50%, -50%)',
              width: LAMP_SIZE, height: LAMP_SIZE,
              borderRadius: '50%', zIndex: 5, pointerEvents: 'none',
              animation: 'lampBreak 0.5s ease-out forwards',
              background: `radial-gradient(circle,${colors.success} 0%,${colors.success}88 60%,transparent 100%)`,
              boxShadow: `0 0 30px ${colors.success}66`,
            }}
          />
        )}

        <div
          style={{
            position: 'absolute', bottom: '2rem', left: 0, right: 0,
            textAlign: 'center', zIndex: 10,
          }}
        >
          {phase === 'waiting' && (
            <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>{t('game.ready')}</p>
          )}
          {phase === 'visible' && (
            <p style={{ color: colors.warning, fontSize: '0.9rem', fontWeight: 600 }}>{t('game.stimulus')}</p>
          )}
          {phase === 'miss' && (
            <p style={{ color: colors.danger, fontSize: '0.9rem', fontWeight: 600 }}>{t('game.missed')}</p>
          )}
        </div>
      </nav>
    </>
  );
}


