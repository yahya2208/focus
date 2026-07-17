import { useState, useEffect } from 'react';
import { createResearchAPI, type SessionAnalytics } from '../../../core/research/api';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { BarChart, PieChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';

export function SessionsDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('sessions');
  const [data, setData] = useState<SessionAnalytics | null>(null);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());

  useEffect(() => {
    const api = createResearchAPI();
    api.getSessionAnalytics(filters).then(setData);
  }, [filters]);

  if (dashboard !== 'sessions') return null;

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader title="Session Analytics" subtitle="Session lifecycle and sync status" />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Sessions" value={data.sessionsTimeline?.length ?? 0} color="#6366f1" />
            <StatCard label="Completion Rate" value={`${(data.completionRate * 100).toFixed(1)}%`} color="#22c55e" />
            <StatCard label="Abort Rate" value={`${(data.abortRate * 100).toFixed(1)}%`} color="#ef4444" />
            <StatCard label="Calibration Failures" value={data.calibrationFailures} color="#f59e0b" />
            <StatCard label="Avg Duration" value={`${(data.avgSessionDuration / 1000).toFixed(1)}s`} />
            <StatCard label="Sync Success" value={`${(data.syncSuccessRate * 100).toFixed(1)}%`} color="#22c55e" />
            <StatCard label="Pending Sync" value={data.pendingSync} color="#f59e0b" />
            <StatCard label="Failed Sync" value={data.failedSync} color="#ef4444" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {data.sessionsTimeline.length > 0 && (
              <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
                <BarChart
                  data={data.sessionsTimeline.map((t) => ({
                    label: t.date, value: t.count, color: '#6366f1',
                  }))}
                  title="Sessions Timeline"
                />
              </div>
            )}
            {data.stateDistribution.length > 0 && (
              <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
                <PieChart
                  data={data.stateDistribution.map((s, i) => ({
                    label: s.state, value: s.count,
                    color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                  }))}
                  title="Session State Distribution"
                />
              </div>
            )}
          </div>
        </>
      )}
    </ResearchLayout>
  );
}
