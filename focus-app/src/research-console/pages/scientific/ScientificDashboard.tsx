import { useState, useEffect } from 'react';
import { createResearchAPI, type ScientificMetrics } from '../../../core/research/api-supabase';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { Histogram, BarChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';

export function ScientificDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('scientific');
  const [metrics, setMetrics] = useState<ScientificMetrics | null>(null);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());

  useEffect(() => {
    const api = createResearchAPI();
    api.getScientific(filters).then(setMetrics);
  }, [filters]);

  if (dashboard !== 'scientific') return null;

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader title="Scientific Analytics" subtitle="Core cognitive measurements" />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />
      {metrics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Median RT" value={`${metrics.reactionTime.median.toFixed(0)}ms`} color="#6366f1" />
            <StatCard label="Mean RT" value={`${metrics.reactionTime.mean.toFixed(0)}ms`} />
            <StatCard label="Std Dev" value={`${metrics.reactionTime.stdDev.toFixed(1)}ms`} color="#f59e0b" />
            <StatCard label="P50" value={`${metrics.percentiles.p50.toFixed(0)}ms`} />
            <StatCard label="P90" value={`${metrics.percentiles.p90.toFixed(0)}ms`} />
            <StatCard label="P95" value={`${metrics.percentiles.p95.toFixed(0)}ms`} />
            <StatCard label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} color="#22c55e" />
            <StatCard label="Consistency" value={`${metrics.consistency.score.toFixed(1)}%`} color="#6366f1" />
            <StatCard label="Fatigue" value={`${metrics.fatigue.score.toFixed(1)}%`} color="#ef4444" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={[
                  { label: 'P50', value: metrics.percentiles.p50 },
                  { label: 'P75', value: metrics.percentiles.p75 },
                  { label: 'P90', value: metrics.percentiles.p90 },
                  { label: 'P95', value: metrics.percentiles.p95 },
                  { label: 'P99', value: metrics.percentiles.p99 },
                ]}
                title="RT Percentiles"
              />
            </div>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <Histogram values={[]} title="Reaction Time Distribution" />
            </div>
          </div>
          {Object.keys(metrics.byDimension).length > 0 && (
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={Object.entries(metrics.byDimension).map(([key, val]) => ({
                  label: key, value: val.mean,
                }))}
                title="RT by Dimension"
              />
            </div>
          )}
        </>
      )}
    </ResearchLayout>
  );
}
