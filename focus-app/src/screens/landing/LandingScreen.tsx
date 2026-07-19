import { useEffect } from 'react';
import { useAppDispatch } from '../../store/navigation';
import { parseDeepLinkFromCurrentUrl, createLandingSession } from '../../core/qr/deeplink';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { getGlobalTelemetry } from '../../core/telemetry';

export function LandingScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();

  useEffect(() => {
    const deepLink = parseDeepLinkFromCurrentUrl();
    const session = createLandingSession(deepLink);
    const telemetry = getGlobalTelemetry();

    if (session.campaignDetected) {
      telemetry.track('campaign_detected', { campaign: session.source });
    }
    telemetry.track('landing_loaded', {
      source: session.source,
      referral: session.referralDetected,
      campaign: session.campaignDetected,
    });
  }, []);

  return (
    <nav aria-label="Landing page" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '2.5rem', fontWeight: 'bold', color: colors.text,
          marginBottom: '0.5rem', lineHeight: 1.3,
        }}>
          {t('landing.title')}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '1.1rem', marginBottom: '2rem' }}>
          {t('landing.subtitle')}
        </p>
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button onClick={() => {
            getGlobalTelemetry().track('game_started', { source: 'landing' });
            dispatch({ type: 'NAVIGATE', screen: 'consent' });
          }}>
            {t('landing.startNow')}
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'about' })}>
            {t('landing.howItWorks')}
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: '2rem' }}>
        <Card padding="1rem">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: colors.textSecondary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: colors.success }}>✓</span>
              <span>{t('landing.scientificAccuracy')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: colors.success }}>✓</span>
              <span>{t('landing.privacyProtected')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: colors.success }}>✓</span>
              <span>{t('landing.noDownload')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: colors.success }}>✓</span>
              <span>{t('landing.pwa')}</span>
            </div>
          </div>
        </Card>
      </div>
    </nav>
  );
}
