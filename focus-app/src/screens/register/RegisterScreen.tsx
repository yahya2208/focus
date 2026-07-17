import { useState, useCallback } from 'react';
import { useAppDispatch } from '../../store/navigation';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { getGlobalTelemetry } from '../../core/telemetry';

export function RegisterScreen() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinueGuest = useCallback(() => {
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  }, [dispatch]);

  const handleRegister = useCallback(async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setIsLoading(true);
    setError(null);
    getGlobalTelemetry().track('registration_completed', { method: 'email' });
    setTimeout(() => {
      setIsLoading(false);
      dispatch({ type: 'NAVIGATE', screen: 'home' });
    }, 1000);
  }, [email, dispatch]);

  const handleGoogle = useCallback(() => {
    getGlobalTelemetry().track('registration_completed', { method: 'google' });
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  }, [dispatch]);

  const handleMagicLink = useCallback(() => {
    if (!email.trim()) {
      setError('Email is required for Magic Link');
      return;
    }
    getGlobalTelemetry().track('registration_completed', { method: 'magic_link' });
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  }, [email, dispatch]);

  return (
    <nav aria-label="Registration" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', textAlign: 'center', marginBottom: '0.5rem' }}>
        احفظ نتائجك
      </h1>
      <p style={{ color: '#888', textAlign: 'center', marginBottom: '2rem' }}>
        وتابع تطور تركيزك
      </p>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="reg-email" style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid #333', background: '#1e1e2e', color: '#f0f0f0',
                fontSize: '1rem', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label htmlFor="reg-name" style={{ display: 'block', color: '#aaa', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              Display Name (optional)
            </label>
            <input
              id="reg-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: '1px solid #333', background: '#1e1e2e', color: '#f0f0f0',
                fontSize: '1rem', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>
          )}

          <Button onClick={handleRegister} loading={isLoading}>
            Create Account
          </Button>

          <Button variant="secondary" onClick={handleMagicLink}>
            Magic Link
          </Button>

          <Button variant="secondary" onClick={handleGoogle}>
            Continue with Google
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: '1.5rem' }}>
        <Button variant="secondary" onClick={handleContinueGuest}>
          Continue as Guest
        </Button>
      </div>
    </nav>
  );
}
