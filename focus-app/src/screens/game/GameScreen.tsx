import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { correctReactionTime } from '../../core/measurement';
import { REACTION } from '../../core/scientific/constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';

type Phase = 'waiting' | 'ready' | 'stimulus' | 'responded' | 'tooEarly';

const TOTAL_ROUNDS = 20;
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 4000;

export function GameScreen() {
  const dispatch = useAppDispatch();
  const { calibrationProfile } = useAppState();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [phase, setPhase] = useState<Phase>('waiting');
  const [round, setRound] = useState(0);
  const [rawRts, setRawRts] = useState<number[]>([]);
  const stimulusTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const calibration = useMemo(() => calibrationProfile ?? {
    refreshRate: 60,
    displayLagMs: 16.667,
    inputLagMs: 8,
    confidence: 0.5,
    platform: 'unknown',
    timestamp: Date.now(),
  }, [calibrationProfile]);

  const startRound = useCallback(() => {
    setPhase('ready');
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timerRef.current = setTimeout(() => {
      stimulusTimeRef.current = performance.now();
      setPhase('stimulus');
    }, delay);
  }, []);

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
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [round, rawRts, calibration, dispatch, startRound]);

  const handleInput = () => {
    if (phase === 'stimulus') {
      const rt = performance.now() - stimulusTimeRef.current;
      setRawRts((prev) => [...prev, rt]);
      setPhase('responded');
      setTimeout(() => {
        setRound((r) => r + 1);
        setPhase('waiting');
      }, 500);
    } else if (phase === 'ready') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('tooEarly');
      setTimeout(() => {
        setPhase('waiting');
        startRound();
      }, 1000);
    }
  };

  const bg = phase === 'stimulus' ? colors.success : colors.bg;

  return (
    <nav
      aria-label={`Game round ${round + 1} of ${TOTAL_ROUNDS}`}
      onClick={handleInput}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleInput(); }}
      role="application"
      tabIndex={0}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        cursor: 'pointer',
        transition: 'background 0.1s',
        outline: 'none',
      }}
    >
      <div style={{ textAlign: 'center', color: colors.text }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {phase === 'waiting' && t('game.waiting')}
          {phase === 'ready' && t('game.ready')}
          {phase === 'stimulus' && t('game.stimulus')}
          {phase === 'responded' && t('game.responded')}
          {phase === 'tooEarly' && t('game.tooEarly')}
        </div>
        <p style={{ color: colors.textMuted, marginTop: '1rem' }}>
          {t('game.round')} {Math.min(round + 1, TOTAL_ROUNDS)} {t('game.of')} {TOTAL_ROUNDS}
        </p>
      </div>
    </nav>
  );
}
