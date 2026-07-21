import { useState, useEffect } from 'react';
import { createResearchAPI, type LiveEvent } from '../../../core/research/api-supabase';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { PieChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';

export function LiveDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('live');
  const [events, setEvents] = useState<readonly LiveEvent[]>([]);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());

  useEffect(() => {
    const api = createResearchAPI();
    const interval = setInterval(() => {
      setEvents(api.getLiveEvents());
    }, 5000);
    setEvents(api.getLiveEvents());
    return () => clearInterval(interval);
  }, []);

  if (dashboard !== 'live') return null;

  const eventTypeCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(eventTypeCounts).map(([type, count]) => ({
    label: type, value: count,
  }));

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader title="Live Events" subtitle="Real-time event stream" />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Events" value={events.length} color="#6366f1" />
        <StatCard label="Event Types" value={Object.keys(eventTypeCounts).length} color="#22c55e" />
        <StatCard label="Latest" value={events.length > 0 ? new Date(events[events.length - 1]!.timestamp).toLocaleTimeString() : 'N/A'} />
        <StatCard label="Auto-refresh" value="5s" color="#f59e0b" subtitle="Polling interval" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
          <PieChart data={pieData} title="Event Type Breakdown" />
        </div>
        <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
          <h3 style={{ color: '#f0f0f0', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Live Event Feed</h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {events.length === 0 && <p style={{ color: '#888' }}>No events yet</p>}
            {events.slice().reverse().map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #1e1e2e', fontSize: '0.8rem' }}>
                <span style={{ color: '#6366f1' }}>{e.type}</span>
                <span style={{ color: '#888' }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResearchLayout>
  );
}
