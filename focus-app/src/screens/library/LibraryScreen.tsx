import { useAppDispatch } from '../../store/navigation';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

const GAMES = [
  { id: 'reaction-light', name: 'Reaction Light Test', description: 'Tap when the light appears. Measures reaction time and consistency.' },
];

export function LibraryScreen() {
  const dispatch = useAppDispatch();

  return (
    <nav aria-label="Game library" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '1.5rem' }}>
        Game Library
      </h1>
      {GAMES.map((game) => (
        <Card key={game.id} style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#f0f0f0', marginBottom: '0.5rem' }}>{game.name}</h2>
          <p style={{ color: '#888', marginBottom: '1rem' }}>{game.description}</p>
          <Button onClick={() => {
            dispatch({ type: 'SELECT_GAME', gameMode: game.id });
            dispatch({ type: 'NAVIGATE', screen: 'intro' });
          }}>
            Select
          </Button>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>
        Back
      </Button>
    </nav>
  );
}
