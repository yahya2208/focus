import { useState, useEffect } from 'react';
import { createResearchAPI, type OverviewStats } from '../../../core/research/api-supabase';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { BarChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';

export function OverviewDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('overview');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());

  useEffect(() => {
    const api = createResearchAPI();
    api.getOverview(filters).then(setStats);
  }, [filters]);

  if (dashboard !== 'overview') return null;

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader title="Executive Overview" subtitle="System health at a glance" />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />
      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Sessions" value={stats.totalSessions} />
            <StatCard label="Games Played" value={stats.gamesPlayed} />
            <StatCard label="Games Today" value={stats.gamesToday} color="#22c55e" />
            <StatCard label="This Week" value={stats.gamesThisWeek} />
            <StatCard label="This Month" value={stats.gamesThisMonth} />
            <StatCard label="Avg Focus Score" value={stats.avgFocusScore.toFixed(1)} color="#6366f1" />
            <StatCard label="Devices" value={stats.devices} />
            <StatCard label="Campaigns" value={stats.campaigns} />
            <StatCard label="Countries" value={stats.countries} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={[
                  { label: 'Today', value: stats.gamesToday, color: '#22c55e' },
                  { label: 'Week', value: stats.gamesThisWeek, color: '#6366f1' },
                  { label: 'Month', value: stats.gamesThisMonth, color: '#f59e0b' },
                ]}
                title="Games by Period"
              />
            </div>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={[
                  { label: 'Avg RT', value: stats.avgReactionTime, color: '#ef4444' },
                  { label: 'Avg Score', value: stats.avgFocusScore, color: '#6366f1' },
                  { label: 'Consistency', value: stats.avgConsistency * 100, color: '#22c55e' },
                  { label: 'Fatigue', value: stats.avgFatigue * 100, color: '#f59e0b' },
                ]}
                title="Key Metrics"
              />
            </div>
          </div>
        </>
      )}
    </ResearchLayout>
  );
}
