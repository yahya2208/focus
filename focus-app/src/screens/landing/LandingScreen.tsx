import { useEffect } from 'react';
import { useAppDispatch } from '../../store/navigation';
import { parseDeepLinkFromCurrentUrl } from '../../core/qr/deeplink';
import { createLandingSession } from '../../core/qr/deeplink';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { getGlobalTelemetry } from '../../core/telemetry';

export function LandingScreen() {
  const dispatch = useAppDispatch();

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
          fontSize: '2.5rem', fontWeight: 'bold', color: '#f0f0f0',
          marginBottom: '0.5rem', lineHeight: 1.3,
        }}>
          اختبر تركيزك في أقل من دقيقة
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '2rem' }}>
          اكتشف سرعة انتباهك بدقة علمية، مجانًا.
        </p>
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button onClick={() => {
            getGlobalTelemetry().track('game_started', { source: 'landing' });
            dispatch({ type: 'NAVIGATE', screen: 'calibration' });
          }}>
            ابدأ الآن
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'about' })}>
            كيف يعمل؟
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: '2rem' }}>
        <Card padding="1rem">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#aaa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#22c55e' }}>✓</span>
              <span>دقة علمية موثوقة</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#22c55e' }}>✓</span>
              <span>خصوصيتك محمية</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#22c55e' }}>✓</span>
              <span>يعمل فوراً بدون تحميل</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#22c55e' }}>✓</span>
              <span>PWA - يمكن تثبيته</span>
            </div>
          </div>
        </Card>
      </div>
    </nav>
  );
}
