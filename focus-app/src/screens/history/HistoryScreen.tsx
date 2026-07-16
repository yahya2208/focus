import { useAppDispatch, useAppState } from '../../store/navigation';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

export function HistoryScreen() {
  const dispatch = useAppDispatch();
  const { sessions } = useAppState();

  return (
    <nav aria-label="Session history" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '1.5rem' }}>
        Session History
      </h1>
      {sessions.length === 0 ? (
        <Card>
          <p style={{ color: '#888', textAlign: 'center' }}>No sessions yet. Complete a measurement to see results here.</p>
        </Card>
      ) : (
        sessions.map((session) => (
          <Card key={session.id} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#f0f0f0', fontWeight: 'bold' }}>
                  {session.gameMode}
                </p>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>
                  {new Date(session.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#6366f1', fontWeight: 'bold' }}>
                  {session.score?.focusScore ?? '--'}
                </p>
                <p style={{ color: '#888', fontSize: '0.75rem' }}>
                  {session.score?.grade ?? 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        ))
      )}
      <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })} style={{ marginTop: '1rem' }}>
        Back
      </Button>
    </nav>
  );
}
