import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { correctReactionTime } from '../../core/measurement';
import { REACTION } from '../../core/scientific/constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';

type Phase = 'waiting' | 'visible' | 'hit' | 'miss' | 'tooEarly';

const TOTAL_ROUNDS = 20;
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 5000;
const LAMP_SIZE = 72;

function randomPosition(prevIndex: number): { x: number; y: number; index: number } {
  const count = 12;
  let next: number;
  do {
    next = Math.floor(Math.random() * count);
  } while (next === prevIndex);
  const positions = [
    { x: 20, y: 25 }, { x: 50, y: 20 }, { x: 80, y: 25 },
    { x: 25, y: 50 }, { x: 75, y: 50 },
    { x: 20, y: 75 }, { x: 50, y: 80 }, { x: 80, y: 75 },
    { x: 35, y: 35 }, { x: 65, y: 35 },
    { x: 35, y: 65 }, { x: 65, y: 65 },
  ];
  return { ...positions[next]!, index: next };
}

function playBreakSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 300);
  } catch { /* silent fail */ }
}

const keyframes = `
@keyframes lampGlowIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes lampBreak {
  0% { transform: scale(1); opacity: 1; filter: brightness(1); }
  30% { transform: scale(1.4); opacity: 1; filter: brightness(2); }
  100% { transform: scale(0); opacity: 0; filter: brightness(0.5); }
}
@keyframes rtPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes missFlash {
  0% { opacity: 0; }
  20% { opacity: 0.15; }
  100% { opacity: 0; }
}
`;

export function GameScreen() {
  const dispatch = useAppDispatch();
  const { calibrationProfile } = useAppState();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [phase, setPhase] = useState<Phase>('waiting');
  const [round, setRound] = useState(0);
  const [rawRts, setRawRts] = useState<number[]>([]);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [lastRt, setLastRt] = useState<number | null>(null);
  const [lampPos, setLampPos] = useState({ x: 50, y: 50, index: -1 });
  const [showMissFlash, setShowMissFlash] = useState(false);

  const stimulusTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const phaseRef = useRef<Phase>('waiting');

  phaseRef.current = phase;

  const calibration = useMemo(() => calibrationProfile ?? {
    refreshRate: 60,
    displayLagMs: 16.667,
    inputLagMs: 8,
    confidence: 0.5,
    platform: 'unknown',
    timestamp: Date.now(),
  }, [calibrationProfile]);

  const startRound = useCallback(() => {
    setPhase('waiting');
    setLastRt(null);
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timerRef.current = setTimeout(() => {
      const pos = randomPosition(lampPos.index);
      setLampPos(pos);
      stimulusTimeRef.current = performance.now();
      setPhase('visible');
    }, delay);
  }, [lampPos.index]);

  useEffect(() => {
    if (round >= TOTAL_ROUNDS) {
      dispatch({
        type: 'SET_RESULTS',
        results: {
          rawRts,
          correctedRts: rawRts.map((rt) => correctReactionTime(rt, calibration).correctedRtMs),
          calibration,
          totalRounds: TOTAL_ROUNDS,
          validRounds: rawRts.filter((rt) => {
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
  }, [round, rawRts, calibration, dispatch, startRound]);

  const handleLampTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (phaseRef.current !== 'visible') return;
    const rt = performance.now() - stimulusTimeRef.current;
    setRawRts((prev) => [...prev, rt]);
    setLastRt(rt);
    setBestTime((prev) => (prev === null || rt < prev ? rt : prev));
    setPhase('hit');
    playBreakSound();
    roundTimerRef.current = setTimeout(() => {
      setRound((r) => r + 1);
    }, 800);
  }, []);

  const handleBackgroundTap = useCallback(() => {
    if (phaseRef.current === 'visible') {
      setShowMissFlash(true);
      setPhase('miss');
      setTimeout(() => setShowMissFlash(false), 400);
      roundTimerRef.current = setTimeout(() => {
        setRound((r) => r + 1);
      }, 600);
    }
  }, []);

  const progress = Math.round((round / TOTAL_ROUNDS) * 100);

  return (
    <>
      <style>{keyframes}</style>
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
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('game.bestTime')}
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: colors.accent, fontVariantNumeric: 'tabular-nums' }}>
              {bestTime !== null ? `${Math.round(bestTime)}ms` : '---'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('game.round')} {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
            </span>
            <div style={{ width: '80px', height: '4px', background: colors.progressBg, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {lastRt !== null && phase === 'hit' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              textAlign: 'center',
              animation: 'rtPop 0.3s ease-out',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: colors.success, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(lastRt)}ms
            </span>
          </div>
        )}

        {phase === 'miss' && showMissFlash && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: colors.danger,
              animation: 'missFlash 0.4s ease-out',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        )}

        {phase === 'visible' && (
          <button
            aria-label="Tap the lamp"
            onClick={handleLampTap}
            onTouchEnd={(e) => { e.preventDefault(); handleLampTap(e); }}
            style={{
              position: 'absolute',
              left: `${lampPos.x}%`,
              top: `${lampPos.y}%`,
              transform: 'translate(-50%, -50%)',
              width: `${LAMP_SIZE}px`,
              height: `${LAMP_SIZE}px`,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              zIndex: 5,
              animation: 'lampGlowIn 0.25s ease-out forwards',
              background: `radial-gradient(circle, ${colors.warning} 0%, ${colors.warning}dd 50%, ${colors.warning}88 100%)`,
              boxShadow: `0 0 20px ${colors.warning}88, 0 0 40px ${colors.warning}44, 0 0 60px ${colors.warning}22`,
              outline: 'none',
              touchAction: 'manipulation',
            }}
          />
        )}

        {phase === 'hit' && (
          <div
            style={{
              position: 'absolute',
              left: `${lampPos.x}%`,
              top: `${lampPos.y}%`,
              transform: 'translate(-50%, -50%)',
              width: `${LAMP_SIZE}px`,
              height: `${LAMP_SIZE}px`,
              borderRadius: '50%',
              zIndex: 5,
              animation: 'lampBreak 0.5s ease-out forwards',
              background: `radial-gradient(circle, ${colors.success} 0%, ${colors.success}88 60%, transparent 100%)`,
              boxShadow: `0 0 30px ${colors.success}66`,
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 10,
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
