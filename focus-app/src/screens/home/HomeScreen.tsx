import { useAppDispatch } from '../../store/navigation';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { useAuth } from '../../core/auth/AuthProvider';

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting.morning' as const;
  if (h < 17) return 'home.greeting.afternoon' as const;
  return 'home.greeting.evening' as const;
}

export function HomeScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { state } = useAuth();
  const userName = state.user?.displayName || state.user?.email?.split('@')[0] || '';

  return (
    <nav aria-label="Main navigation" style={{
      padding: '2rem 1.5rem',
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: colors.textMuted, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
          {t(getGreetingKey())}
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: colors.text }}>
          {userName || t('app.title')}
        </h1>
      </div>

      <Card style={{
        marginBottom: '1.25rem',
        background: colors.gradient,
        border: `1px solid ${colors.glassBorder}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '5rem', opacity: 0.06 }}>💡</div>
        <p style={{ color: colors.textMuted, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          {t('home.todayFocus')}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: 'bold', color: colors.accent, lineHeight: 1 }}>87</span>
          <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>/100</span>
        </div>
        <p style={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
          {t('home.focusDescription')}
        </p>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>
          {t('home.startMeasurement')}
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'phone-services' })} style={{ width: '100%' }}>
          {t('home.phoneServices')}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'history' })} style={{ width: '100%' }}>
            {t('home.sessionHistory')}
          </Button>
        </div>
        <div style={{ flex: 1 }}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'coach' })} style={{ width: '100%' }}>
            {t('home.aiCoach')}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'settings' })} style={{ width: '100%' }}>
            {t('home.settings')}
          </Button>
        </div>
        <div style={{ flex: 1 }}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'about' })} style={{ width: '100%' }}>
            {t('home.about')}
          </Button>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        borderRadius: '12px',
        background: colors.glass,
        border: `1px solid ${colors.glassBorder}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
      }}
        onClick={() => dispatch({ type: 'NAVIGATE', screen: 'coach' })}
        role="button"
        tabIndex={0}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: colors.accentGlow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
        }}>
          💬
        </div>
        <div>
          <p style={{ color: colors.text, fontSize: '0.85rem', fontWeight: 500 }}>{t('home.aiAdviceTitle')}</p>
          <p style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{t('home.aiAdviceSubtitle')}</p>
        </div>
      </div>
    </nav>
  );
}
