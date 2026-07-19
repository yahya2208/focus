import { useAppDispatch } from '../../store/navigation';
import { useSettingsContext } from '../../hooks/useSettings';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

export function SettingsScreen() {
  const navDispatch = useAppDispatch();
  const { settings, update } = useSettingsContext();
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <nav aria-label="Settings" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.text, marginBottom: '1.5rem' }}>
        {t('settings.title')}
      </h1>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem' }}>{t('settings.theme')}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['system', 'light', 'dark'] as const).map((theme) => (
            <Button
              key={theme}
              variant={settings.theme === theme ? 'primary' : 'secondary'}
              onClick={() => update({ theme })}
            >
              {t(`settings.${theme}`)}
            </Button>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem' }}>{t('settings.language')}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['en', 'tr', 'ar'] as const).map((lang) => (
            <Button
              key={lang}
              variant={settings.language === lang ? 'primary' : 'secondary'}
              onClick={() => update({ language: lang })}
            >
              {lang.toUpperCase()}
            </Button>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem' }}>{t('settings.accessibility')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textSecondary }}>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => update({ reducedMotion: e.target.checked })}
              aria-label={t('settings.reducedMotion')}
            />
            {t('settings.reducedMotion')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textSecondary }}>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => update({ highContrast: e.target.checked })}
              aria-label={t('settings.highContrast')}
            />
            {t('settings.highContrast')}
          </label>
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: colors.text, marginBottom: '0.75rem' }}>{t('settings.researchConsole')}</h2>
        <Button variant="secondary" onClick={() => navDispatch({ type: 'NAVIGATE', screen: 'research' })} style={{ width: '100%' }}>
          {t('settings.researchConsole')}
        </Button>
      </Card>
      <Button variant="secondary" onClick={() => navDispatch({ type: 'NAVIGATE', screen: 'home' })} style={{ marginTop: '1rem' }}>
        {t('settings.back')}
      </Button>
    </nav>
  );
}
