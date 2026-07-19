import { useState, useCallback } from 'react';
import { useAppDispatch } from '../../store/navigation';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { getGlobalTelemetry } from '../../core/telemetry';

export function RegisterScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinueGuest = useCallback(() => {
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  }, [dispatch]);

  const handleRegister = useCallback(async () => {
    if (!email.trim()) {
      setError(t('register.emailRequired'));
      return;
    }
    setIsLoading(true);
    setError(null);
    getGlobalTelemetry().track('registration_completed', { method: 'email' });
    setTimeout(() => {
      setIsLoading(false);
      dispatch({ type: 'NAVIGATE', screen: 'home' });
    }, 1000);
  }, [email, dispatch, t]);

  const handleGoogle = useCallback(() => {
    getGlobalTelemetry().track('registration_completed', { method: 'google' });
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  }, [dispatch]);

  const handleMagicLink = useCallback(() => {
    if (!email.trim()) {
      setError(t('register.emailRequiredMagic'));
      return;
    }
    getGlobalTelemetry().track('registration_completed', { method: 'magic_link' });
    dispatch({ type: 'NAVIGATE', screen: 'home' });
  }, [email, dispatch, t]);

  return (
    <nav aria-label="Registration" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '0.5rem' }}>
        {t('register.title')}
      </h1>
      <p style={{ color: colors.textMuted, textAlign: 'center', marginBottom: '2rem' }}>
        {t('register.subtitle')}
      </p>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="reg-email" style={{ display: 'block', color: colors.textSecondary, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              {t('register.email')}
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('register.emailPlaceholder')}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: `1px solid ${colors.borderLight}`, background: colors.bgInput, color: colors.text,
                fontSize: '1rem', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label htmlFor="reg-name" style={{ display: 'block', color: colors.textSecondary, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              {t('register.displayName')}
            </label>
            <input
              id="reg-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('register.namePlaceholder')}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                border: `1px solid ${colors.borderLight}`, background: colors.bgInput, color: colors.text,
                fontSize: '1rem', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: colors.danger, fontSize: '0.85rem' }}>{error}</p>
          )}

          <Button onClick={handleRegister} loading={isLoading}>
            {t('register.createAccount')}
          </Button>

          <Button variant="secondary" onClick={handleMagicLink}>
            {t('register.magicLink')}
          </Button>

          <Button variant="secondary" onClick={handleGoogle}>
            {t('register.continueGoogle')}
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: '1.5rem' }}>
        <Button variant="secondary" onClick={handleContinueGuest}>
          {t('register.continueGuest')}
        </Button>
      </div>
    </nav>
  );
}
