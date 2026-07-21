import { useState, useEffect } from 'react';
import { createResearchAPI, type SystemHealth } from '../../../core/research/api-supabase';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { BarChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';

const STATUS_COLORS: Record<string, string> = {
  healthy: '#22c55e',
  connected: '#22c55e',
  degraded: '#f59e0b',
  reconnecting: '#f59e0b',
  down: '#ef4444',
  disconnected: '#ef4444',
};

export function SystemDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('system');
  const [data, setData] = useState<SystemHealth | null>(null);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());

  useEffect(() => {
    const api = createResearchAPI();
    api.getSystemHealth().then(setData);
  }, []);

  if (dashboard !== 'system') return null;

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader title="System Health" subtitle="Infrastructure and diagnostics" />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Supabase Status" value={data.supabaseStatus} color={STATUS_COLORS[data.supabaseStatus] ?? '#888'} />
            <StatCard label="Realtime Status" value={data.realtimeStatus} color={STATUS_COLORS[data.realtimeStatus] ?? '#888'} />
            <StatCard label="DB Latency" value={`${data.dbLatencyMs.toFixed(1)}ms`} color={data.dbLatencyMs > 100 ? '#ef4444' : '#22c55e'} />
            <StatCard label="API Response Time" value={`${data.apiResponseTimeMs.toFixed(1)}ms`} color={data.apiResponseTimeMs > 200 ? '#ef4444' : '#22c55e'} />
            <StatCard label="Errors 24h" value={data.errors24h} color={data.errors24h > 0 ? '#ef4444' : '#22c55e'} />
            <StatCard label="Warnings 24h" value={data.warnings24h} color={data.warnings24h > 0 ? '#f59e0b' : '#22c55e'} />
            <StatCard label="Build Version" value={data.buildVersion} color="#6366f1" />
            <StatCard label="Git Tag" value={data.gitTag} color="#888" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={[
                  { label: 'DB Latency', value: data.dbLatencyMs, color: '#6366f1' },
                  { label: 'API Time', value: data.apiResponseTimeMs, color: '#22c55e' },
                  { label: 'Errors', value: data.errors24h, color: '#ef4444' },
                  { label: 'Warnings', value: data.warnings24h, color: '#f59e0b' },
                ]}
                title="Performance Metrics"
              />
            </div>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={[
                  { label: 'Offline Q', value: data.offlineQueueLength, color: '#f59e0b' },
                  { label: 'Sync Q', value: data.syncQueueLength, color: '#3b82f6' },
                  { label: 'Storage (MB)', value: data.storageUsedMb, color: '#8b5cf6' },
                ]}
                title="Queue & Storage"
              />
            </div>
          </div>
        </>
      )}
    </ResearchLayout>
  );
}
