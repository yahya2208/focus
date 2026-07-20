import { useMemo } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { calculateFocusScore } from '../../core/engine/scoring';
import { analyzeConsistency } from '../../core/engine/consistency';
import { detectFatigue } from '../../core/engine/fatigue';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { ProgressRing } from '../../components/shared/ProgressRing';

export function ResultsScreen() {
  const dispatch = useAppDispatch();
  const { results } = useAppState();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const analysis = useMemo(() => {
    if (!results) return null;
    const consistency = analyzeConsistency(results.correctedRts);
    const fatigue = detectFatigue(results.correctedRts);
    const meanMs = consistency.meanMs;
    const score = calculateFocusScore({
      meanCorrectedMs: meanMs,
      consistencyScore: consistency.score,
      fatigueScore: fatigue.score,
      totalRounds: results.totalRounds,
    });
    return { consistency, fatigue, score };
  }, [results]);

  if (!results || !analysis) {
    return (
      <nav aria-label="Results" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
        <Card><p style={{ color: colors.textMuted }}>{t('results.noResults')}</p></Card>
        <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>{t('home.startMeasurement')}</Button>
      </nav>
    );
  }

  const bestRt = Math.min(...results.correctedRts);
  const avgRt = results.correctedRts.reduce((a, b) => a + b, 0) / results.correctedRts.length;

  const saveAndExit = () => {
    dispatch({ type: 'SAVE_SESSION' });
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  };

  return (
    <nav aria-label="Measurement results" style={{ padding: '2rem 1.5rem', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.text, marginBottom: '0.25rem' }}>
          {t('results.title')}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
          {results.validRounds}/{results.totalRounds} {t('game.of')} {results.totalRounds}
        </p>
      </div>

      {/* Score ring */}
      <Card style={{ marginBottom: '1.25rem', textAlign: 'center', background: colors.gradient, border: `1px solid ${colors.glassBorder}` }}>
        <ProgressRing
          value={analysis.score.focusScore}
          max={100}
          label={t('results.focusScore')}
          size={140}
        />
        <p style={{ color: colors.textMuted, marginTop: '0.5rem' }}>
          {t('results.grade')}: <strong style={{ color: colors.text }}>{analysis.score.grade}</strong>
        </p>
      </Card>

      {/* Best / Average / Consistency cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <Card padding="0.75rem" style={{ textAlign: 'center', background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
          <p style={{ color: colors.textMuted, fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>
            {t('results.best')}
          </p>
          <p style={{ color: colors.accent, fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', margin: 0 }}>
            {Math.round(bestRt)}ms
          </p>
        </Card>
        <Card padding="0.75rem" style={{ textAlign: 'center', background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
          <p style={{ color: colors.textMuted, fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>
            {t('results.average')}
          </p>
          <p style={{ color: colors.text, fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', margin: 0 }}>
            {Math.round(avgRt)}ms
          </p>
        </Card>
        <Card padding="0.75rem" style={{ textAlign: 'center', background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
          <p style={{ color: colors.textMuted, fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>
            {t('results.consistency')}
          </p>
          <p style={{ color: colors.success, fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            {analysis.consistency.rating}
          </p>
        </Card>
      </div>

      {/* Detailed stats */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem', fontSize: '0.9rem' }}>{t('results.reactionTimes')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: colors.textSecondary }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('results.mean')}: <strong style={{ color: colors.text }}>{analysis.consistency.meanMs.toFixed(0)}ms</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('results.sd')}: <strong style={{ color: colors.text }}>{analysis.consistency.sdMs.toFixed(1)}ms</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('results.cv')}: <strong style={{ color: colors.text }}>{(analysis.consistency.cv * 100).toFixed(1)}%</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('results.iqr')}: <strong style={{ color: colors.text }}>{analysis.consistency.iqrMs.toFixed(1)}ms</strong></p>
        </div>
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem', fontSize: '0.9rem' }}>{t('results.fatigue')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: colors.textSecondary }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('results.slope')}: <strong style={{ color: colors.text }}>{analysis.fatigue.slope.toFixed(4)}</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('results.detected')}: <strong style={{ color: analysis.fatigue.hasFatigue ? colors.danger : colors.success }}>
            {analysis.fatigue.hasFatigue ? t('results.yes') : t('results.no')}
          </strong></p>
        </div>
      </Card>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Button onClick={saveAndExit}>{t('results.saveAndExit')}</Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'share' })}>
          {t('results.challengeFriend')}
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'coach' })}>
          {t('results.aiCoach')}
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>
          {t('results.discard')}
        </Button>
      </div>
    </nav>
  );
}
