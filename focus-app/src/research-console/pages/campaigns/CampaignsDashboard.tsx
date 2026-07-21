import { useState, useEffect } from 'react';
import { createResearchAPI, type CampaignAnalytics } from '../../../core/research/api-supabase';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { BarChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';

export function CampaignsDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('campaigns');
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());

  useEffect(() => {
    const api = createResearchAPI();
    api.getCampaignAnalytics(filters).then(setData);
  }, [filters]);

  if (dashboard !== 'campaigns') return null;

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader title="Campaign Analytics" subtitle="Campaign performance and referrals" />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Campaigns" value={data.campaigns.length} color="#6366f1" />
            <StatCard label="Landing Conversion" value={`${(data.landingConversion * 100).toFixed(1)}%`} color="#22c55e" />
            <StatCard label="Registration Conversion" value={`${(data.registrationConversion * 100).toFixed(1)}%`} color="#3b82f6" />
            <StatCard label="Active Referrals" value={data.referralPerformance.length} color="#f59e0b" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {data.sessionCompletionByCampaign.length > 0 && (
              <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
                <BarChart
                  data={data.sessionCompletionByCampaign.map((d) => ({
                    label: d.campaign, value: d.rate * 100, color: '#22c55e',
                  }))}
                  title="Completion by Campaign"
                />
              </div>
            )}
            {data.avgRtByCampaign.length > 0 && (
              <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
                <BarChart
                  data={data.avgRtByCampaign.map((d) => ({
                    label: d.campaign, value: d.avgRt, color: '#6366f1',
                  }))}
                  title="Avg Reaction Time by Campaign"
                />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {data.avgFocusByCampaign.length > 0 && (
              <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
                <BarChart
                  data={data.avgFocusByCampaign.map((d) => ({
                    label: d.campaign, value: d.avgFocus, color: '#f59e0b',
                  }))}
                  title="Avg Focus by Campaign"
                />
              </div>
            )}
            {data.campaignRanking.length > 0 && (
              <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
                <BarChart
                  data={data.campaignRanking.map((d) => ({
                    label: d.campaign, value: d.score, color: '#ec4899',
                  }))}
                  title="Campaign Ranking"
                />
              </div>
            )}
          </div>
        </>
      )}
    </ResearchLayout>
  );
}
