import { useAppDispatch } from '../../store/navigation';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

export function AboutScreen() {
  const dispatch = useAppDispatch();

  return (
    <nav aria-label="About FOCUS" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '1.5rem' }}>
        About FOCUS
      </h1>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.5rem' }}>Cognitive Measurement Platform</h2>
        <p style={{ color: '#888', lineHeight: 1.6 }}>
          FOCUS uses scientifically validated measurement techniques to assess cognitive
          performance. All measurements are calibrated for your specific device to ensure
          accuracy.
        </p>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.5rem' }}>Scientific Foundation</h2>
        <ul style={{ color: '#888', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
          <li>Display calibration with ±2ms precision</li>
          <li>Device-specific input lag compensation</li>
          <li>Statistical outlier removal (IQR method)</li>
          <li>Fatigue detection via linear regression</li>
          <li>Composite scoring: Consistency 40% + Fatigue 30% + Completion 30%</li>
        </ul>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.5rem' }}>Privacy</h2>
        <p style={{ color: '#888', lineHeight: 1.6 }}>
          All data is stored locally on your device. No data is transmitted to external servers.
        </p>
      </Card>
      <p style={{ color: '#555', textAlign: 'center', fontSize: '0.875rem', marginTop: '1rem' }}>
        FOCUS v0.1.0-alpha
      </p>
      <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })} style={{ marginTop: '1rem' }}>
        Back
      </Button>
    </nav>
  );
}
