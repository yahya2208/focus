import { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store/navigation';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Card } from '../../components/shared/Card';

export function CountdownScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      dispatch({ type: 'NAVIGATE', screen: 'calibration' });
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, dispatch]);

  return (
    <nav aria-label="Countdown" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ textAlign: 'center', width: '100%' }}>
        <div
          role="timer"
          aria-live="assertive"
          aria-atomic="true"
          style={{ fontSize: '6rem', fontWeight: 'bold', color: colors.accent }}
        >
          {count > 0 ? count : 'GO'}
        </div>
        <p style={{ color: colors.textMuted, marginTop: '0.5rem' }}>{t('countdown.getReady')}</p>
      </Card>
    </nav>
  );
}
