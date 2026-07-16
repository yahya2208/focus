import { useAppDispatch, useAppState } from '../../store/navigation';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

export function IntroScreen() {
  const dispatch = useAppDispatch();
  const { selectedGame } = useAppState();

  return (
    <nav aria-label="Game introduction" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <Card>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '1rem' }}>
          Reaction Light Test
        </h1>
        <div style={{ color: '#aaa', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#f0f0f0' }}>How it works:</strong>
          </p>
          <ol style={{ paddingLeft: '1.25rem' }}>
            <li>First, we calibrate your device display</li>
            <li>A colored light will appear on screen</li>
            <li>Tap anywhere as fast as you can</li>
            <li>We measure your reaction time with scientific accuracy</li>
          </ol>
          <p style={{ marginTop: '0.75rem', color: '#888' }}>
            Game mode: <strong>{selectedGame ?? 'reaction-light'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'calibration' })}>
            Start Calibration
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>
            Back
          </Button>
        </div>
      </Card>
    </nav>
  );
}
