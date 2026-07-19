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

  const saveAndExit = () => {
    dispatch({ type: 'SAVE_SESSION' });
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  };

  return (
    <nav aria-label="Measurement results" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.text, marginBottom: '1.5rem', textAlign: 'center' }}>
        {t('results.title')}
      </h1>
      <Card style={{ marginBottom: '1rem', textAlign: 'center' }}>
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
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem' }}>{t('results.reactionTimes')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: colors.textSecondary }}>
          <p>{t('results.mean')}: <strong style={{ color: colors.text }}>{analysis.consistency.meanMs.toFixed(0)}ms</strong></p>
          <p>{t('results.sd')}: <strong style={{ color: colors.text }}>{analysis.consistency.sdMs.toFixed(1)}ms</strong></p>
          <p>{t('results.cv')}: <strong style={{ color: colors.text }}>{(analysis.consistency.cv * 100).toFixed(1)}%</strong></p>
          <p>{t('results.iqr')}: <strong style={{ color: colors.text }}>{analysis.consistency.iqrMs.toFixed(1)}ms</strong></p>
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem' }}>{t('results.consistency')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: colors.textSecondary }}>
          <p>{t('results.outliers')}: <strong style={{ color: colors.text }}>{analysis.consistency.outlierCount}</strong></p>
          <p>{t('results.rating')}: <strong style={{ color: colors.text }}>{analysis.consistency.rating}</strong></p>
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem' }}>{t('results.fatigue')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: colors.textSecondary }}>
          <p>{t('results.slope')}: <strong style={{ color: colors.text }}>{analysis.fatigue.slope.toFixed(4)}</strong></p>
          <p>{t('results.detected')}: <strong style={{ color: analysis.fatigue.hasFatigue ? colors.danger : colors.success }}>
            {analysis.fatigue.hasFatigue ? t('results.yes') : t('results.no')}
          </strong></p>
        </div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
