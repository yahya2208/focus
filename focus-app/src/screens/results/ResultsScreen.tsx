import { useMemo } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { calculateFocusScore } from '../../core/engine/scoring';
import { analyzeConsistency } from '../../core/engine/consistency';
import { detectFatigue } from '../../core/engine/fatigue';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { ProgressRing } from '../../components/shared/ProgressRing';

export function ResultsScreen() {
  const dispatch = useAppDispatch();
  const { results } = useAppState();

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
        <Card><p style={{ color: '#888' }}>No results available.</p></Card>
        <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>Home</Button>
      </nav>
    );
  }

  const saveAndExit = () => {
    dispatch({ type: 'SAVE_SESSION' });
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  };

  return (
    <nav aria-label="Measurement results" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '1.5rem', textAlign: 'center' }}>
        Results
      </h1>
      <Card style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <ProgressRing
          value={analysis.score.focusScore}
          max={100}
          label="Focus Score"
          size={140}
        />
        <p style={{ color: '#888', marginTop: '0.5rem' }}>
          Grade: <strong style={{ color: '#f0f0f0' }}>{analysis.score.grade}</strong>
        </p>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.75rem' }}>Reaction Times</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#aaa' }}>
          <p>Mean: <strong style={{ color: '#f0f0f0' }}>{analysis.consistency.meanMs.toFixed(0)}ms</strong></p>
          <p>SD: <strong style={{ color: '#f0f0f0' }}>{analysis.consistency.sdMs.toFixed(1)}ms</strong></p>
          <p>CV: <strong style={{ color: '#f0f0f0' }}>{(analysis.consistency.cv * 100).toFixed(1)}%</strong></p>
          <p>IQR: <strong style={{ color: '#f0f0f0' }}>{analysis.consistency.iqrMs.toFixed(1)}ms</strong></p>
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.75rem' }}>Consistency</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#aaa' }}>
          <p>Outliers: <strong style={{ color: '#f0f0f0' }}>{analysis.consistency.outlierCount}</strong></p>
          <p>Rating: <strong style={{ color: '#f0f0f0' }}>{analysis.consistency.rating}</strong></p>
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.75rem' }}>Fatigue</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#aaa' }}>
          <p>Slope: <strong style={{ color: '#f0f0f0' }}>{analysis.fatigue.slope.toFixed(4)}</strong></p>
          <p>Detected: <strong style={{ color: analysis.fatigue.hasFatigue ? '#ef4444' : '#22c55e' }}>
            {analysis.fatigue.hasFatigue ? 'Yes' : 'No'}
          </strong></p>
        </div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Button onClick={saveAndExit}>Save & Exit</Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'share' })}>
          Challenge a Friend
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'register' })}>
          Register
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>
          Discard
        </Button>
      </div>
    </nav>
  );
}
