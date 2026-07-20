import { useAppDispatch } from '../../store/navigation';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';

export function HomeScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <nav aria-label="Main navigation" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '0.5rem' }}>
        {t('app.title')}
      </h1>
      <p style={{ color: colors.textMuted, textAlign: 'center', marginBottom: '2rem' }}>
        {t('app.subtitle')}
      </p>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>
            {t('home.startMeasurement')}
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'history' })}>
            {t('home.sessionHistory')}
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'settings' })}>
            {t('home.settings')}
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'about' })}>
            {t('home.about')}
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'coach' })}>
            {t('home.aiCoach')}
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'phone-services' })}>
            {t('home.phoneServices')}
          </Button>
        </div>
      </Card>
    </nav>
  );
}
