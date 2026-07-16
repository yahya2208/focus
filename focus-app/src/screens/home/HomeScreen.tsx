import { useAppDispatch } from '../../store/navigation';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';

export function HomeScreen() {
  const dispatch = useAppDispatch();

  return (
    <nav aria-label="Main navigation" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f0f0f0', textAlign: 'center', marginBottom: '0.5rem' }}>
        FOCUS
      </h1>
      <p style={{ color: '#888', textAlign: 'center', marginBottom: '2rem' }}>
        Cognitive Measurement Platform
      </p>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>
            Start Measurement
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'history' })}>
            Session History
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'settings' })}>
            Settings
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'about' })}>
            About
          </Button>
        </div>
      </Card>
    </nav>
  );
}
