import { useAppDispatch } from '../../store/navigation';
import { useSettingsContext } from '../../hooks/useSettings';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

export function SettingsScreen() {
  const navDispatch = useAppDispatch();
  const { settings, update } = useSettingsContext();

  return (
    <nav aria-label="Settings" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '1.5rem' }}>
        Settings
      </h1>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.75rem' }}>Theme</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['system', 'light', 'dark'] as const).map((theme) => (
            <Button
              key={theme}
              variant={settings.theme === theme ? 'primary' : 'secondary'}
              onClick={() => update({ theme })}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </Button>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.75rem' }}>Language</h2>
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
      <Card>
        <h2 style={{ color: '#f0f0f0', marginBottom: '0.75rem' }}>Accessibility</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#aaa' }}>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => update({ reducedMotion: e.target.checked })}
              aria-label="Reduce animations"
            />
            Reduce animations
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#aaa' }}>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => update({ highContrast: e.target.checked })}
              aria-label="High contrast mode"
            />
            High contrast mode
          </label>
        </div>
      </Card>
      <Button variant="secondary" onClick={() => navDispatch({ type: 'NAVIGATE', screen: 'home' })} style={{ marginTop: '1rem' }}>
        Back
      </Button>
    </nav>
  );
}
