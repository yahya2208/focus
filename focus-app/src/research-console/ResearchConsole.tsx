import { useState } from 'react';
import { useAppDispatch } from '../store/navigation';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeColors } from '../hooks/useThemeColors';
import { OverviewDashboard } from './pages/overview/OverviewDashboard';
import { ScientificDashboard } from './pages/scientific/ScientificDashboard';
import { UsersDashboard } from './pages/users/UsersDashboard';
import { SessionsDashboard } from './pages/sessions/SessionsDashboard';
import { DevicesDashboard } from './pages/devices/DevicesDashboard';
import { SurveysDashboard } from './pages/surveys/SurveysDashboard';
import { CampaignsDashboard } from './pages/campaigns/CampaignsDashboard';
import { LiveDashboard } from './pages/live/LiveDashboard';
import { SystemDashboard } from './pages/system/SystemDashboard';
import type { DashboardId } from './layout/ResearchLayout';

const dashboards: { id: DashboardId; translationKey: string }[] = [
  { id: 'overview', translationKey: 'research.overview' },
  { id: 'sessions', translationKey: 'research.sessions' },
  { id: 'users', translationKey: 'research.users' },
  { id: 'devices', translationKey: '' },
  { id: 'surveys', translationKey: 'research.surveys' },
  { id: 'campaigns', translationKey: 'research.campaigns' },
  { id: 'live', translationKey: '' },
  { id: 'system', translationKey: '' },
];

const dashboardComponents: Record<DashboardId, React.FC> = {
  overview: OverviewDashboard,
  scientific: ScientificDashboard,
  users: UsersDashboard,
  sessions: SessionsDashboard,
  devices: DevicesDashboard,
  surveys: SurveysDashboard,
  campaigns: CampaignsDashboard,
  live: LiveDashboard,
  system: SystemDashboard,
};

export function ResearchConsole() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [active, setActive] = useState<DashboardId>('overview');

  const Component = dashboardComponents[active];

  return (
    <nav aria-label="Research Console" style={{ minHeight: '100vh', background: colors.bg }}>
      <div style={{ display: 'flex', padding: '0.5rem', gap: '0.25rem', overflowX: 'auto', borderBottom: `1px solid ${colors.border}` }}>
        {dashboards.map((d) => (
          <button
            key={d.id}
            onClick={() => setActive(d.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: active === d.id ? colors.accent : 'transparent',
              color: active === d.id ? '#fff' : colors.textMuted,
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: active === d.id ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {d.translationKey ? t(d.translationKey as 'research.title') : d.id}
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: `1px solid ${colors.borderLight}`,
            background: 'transparent',
            color: colors.textMuted,
            cursor: 'pointer',
            fontSize: '0.8125rem',
            whiteSpace: 'nowrap',
          }}
        >
          {t('research.back')}
        </button>
      </div>
      <div style={{ padding: '1rem' }}>
        <Component />
      </div>
    </nav>
  );
}
