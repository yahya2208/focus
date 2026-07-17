import { useState } from 'react';
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

export function ResearchConsole() {
  const [active] = useState<DashboardId>('overview');

  const dashboards: Record<DashboardId, React.FC> = {
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

  const Component = dashboards[active];
  return <Component />;
}
