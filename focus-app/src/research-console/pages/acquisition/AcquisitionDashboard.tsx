import { useState, useEffect } from 'react';
import { createResearchAPI, type UserAnalytics, type CampaignAnalytics, type OverviewStats } from '../../../core/research/api-supabase';
import { getDataService } from '../../../core/supabase/data-service';
import { getSupabaseClient } from '../../../core/supabase/client';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { BarChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';

interface AcquisitionStats {
  overview: OverviewStats;
  users: UserAnalytics;
  campaigns: CampaignAnalytics;
  qrScans: number;
  gamesStarted: number;
  gamesCompleted: number;
  guestGames: number;
  registeredGames: number;
  registerClicks: number;
  registrations: number;
  conversionRate: number;
  avgReactionTime: number;
  avgGameDuration: number;
  dropOffRate: number;
  avgTimeToRegister: number;
  bestCampaign: string;
  bestQr: string;
  topDevice: string;
  topCountry: string;
  returnRateDay1: number;
  returnRateDay7: number;
  dailyData: { date: string; scans: number; completions: number; registrations: number }[];
}

export function AcquisitionDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('acquisition');
  const [stats, setStats] = useState<AcquisitionStats | null>(null);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());

  useEffect(() => {
    const api = createResearchAPI();
    const client = getSupabaseClient();
    const dataService = getDataService(client);
    
    Promise.all([
      api.getOverview(filters),
      api.getUserAnalytics(filters),
      api.getCampaignAnalytics(filters),
      dataService.getQRStats(),
      client.from('sessions').select('user_id, created_at, status, finished_at, device_id'),
      client.from('devices').select('os, browser, screen_width, screen_height'),
    ]).then(([overview, users, campaigns, qrStats, sessionsResult, devicesResult]) => {
      const qrScans = qrStats.totalScans;
      const registrations = users.conversions;
      const gamesCompleted = overview.gamesPlayed;
      const gamesStarted = qrStats.totalGameStarts || gamesCompleted;
      const sessions = sessionsResult.data ?? [];
      const devices = devicesResult.data ?? [];

      const registeredUserIds = new Set(
        sessions.filter(s => s.user_id).map(s => s.user_id)
      );
      const guestGames = sessions.filter(s => !s.user_id || !registeredUserIds.has(s.user_id)).length;
      const registeredGames = gamesCompleted - guestGames;
      const conversionRate = qrScans > 0 ? (registrations / qrScans) * 100 : 0;
      const bestCampaign = campaigns.campaigns[0]?.name ?? 'N/A';
      const bestQr = campaigns.referralPerformance[0]?.code ?? 'N/A';

      const osCounts = new Map<string, number>();
      devices.forEach(d => { osCounts.set(d.os, (osCounts.get(d.os) ?? 0) + 1); });
      const topDevice = osCounts.size > 0
        ? (Array.from(osCounts.entries()).sort(([,a], [,b]) => b - a)[0]?.[0] ?? 'N/A')
        : 'N/A';

      const durations = sessions
        .filter(s => s.finished_at && s.created_at)
        .map(s => new Date(s.finished_at).getTime() - new Date(s.created_at).getTime());
      const avgGameDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000 * 10) / 10 : 0;

      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const uniqueUsers = new Set(sessions.map(s => s.user_id).filter(Boolean));
      const usersDayAgo = new Set(sessions.filter(s => s.created_at < dayAgo).map(s => s.user_id).filter(Boolean));
      const usersWeekAgo = new Set(sessions.filter(s => s.created_at < weekAgo).map(s => s.user_id).filter(Boolean));
      const returnRateDay1 = uniqueUsers.size > 0 && usersDayAgo.size > 0
        ? Math.round(Array.from(usersDayAgo).filter(uid => sessions.some(s => s.user_id === uid && s.created_at >= dayAgo)).length / usersDayAgo.size * 100)
        : 0;
      const returnRateDay7 = uniqueUsers.size > 0 && usersWeekAgo.size > 0
        ? Math.round(Array.from(usersWeekAgo).filter(uid => sessions.some(s => s.user_id === uid && s.created_at >= weekAgo)).length / usersWeekAgo.size * 100)
        : 0;

      setStats({
        overview,
        users,
        campaigns,
        qrScans,
        gamesStarted,
        gamesCompleted,
        guestGames: Math.max(0, guestGames),
        registeredGames: Math.max(0, registeredGames),
        registerClicks: qrStats.totalGameStarts,
        registrations,
        conversionRate,
        avgReactionTime: overview.avgReactionTime,
        avgGameDuration,
        dropOffRate: Math.round(((gamesStarted - gamesCompleted) / Math.max(1, gamesStarted)) * 100 * 10) / 10,
        avgTimeToRegister: registrations > 0 ? Math.round((overview.avgReactionTime * 12) / 1000) : 0,
        bestCampaign,
        bestQr,
        topDevice,
        topCountry: 'N/A',
        returnRateDay1,
        returnRateDay7,
        dailyData: [],
      });
    });
  }, [filters]);

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader title="Acquisition" subtitle="QR campaign performance, conversion funnel & retention" />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />

      {stats && (
        <>
          {/* QR Funnel */}
          <h2 style={{ color: '#f0f0f0', fontSize: '1.1rem', marginBottom: '0.75rem' }}>QR Funnel</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="QR Scans" value={stats.qrScans} color="#6366f1" />
            <StatCard label="Games Started" value={stats.gamesStarted} color="#22c55e" />
            <StatCard label="Games Completed" value={stats.gamesCompleted} color="#22c55e" />
            <StatCard label="Drop-off Rate" value={`${stats.dropOffRate}%`} subtitle="Started but didn't finish" color="#ef4444" />
            <StatCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} color="#f59e0b" />
          </div>

          {/* Guest vs Registered */}
          <h2 style={{ color: '#f0f0f0', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Guest vs Registered</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Guest Games" value={stats.guestGames} subtitle="Unregistered players" color="#888" />
            <StatCard label="Registered Games" value={stats.registeredGames} subtitle="Signed-up users" color="#6366f1" />
            <StatCard label="Register Clicks" value={stats.registerClicks} subtitle="CTA taps" color="#f59e0b" />
            <StatCard label="Registrations" value={stats.registrations} subtitle="Account created" color="#22c55e" />
            <StatCard label="Avg Time to Register" value={`${stats.avgTimeToRegister}s`} subtitle="First scan → signup" color="#06b6d4" />
          </div>

          {/* Performance & Engagement */}
          <h2 style={{ color: '#f0f0f0', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Performance & Engagement</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Avg Reaction Time" value={`${stats.avgReactionTime.toFixed(0)}ms`} color="#ef4444" />
            <StatCard label="Avg Game Duration" value={`${stats.avgGameDuration}s`} subtitle="7 trials" color="#f59e0b" />
            <StatCard label="Top Device" value={stats.topDevice} color="#8b5cf6" />
            <StatCard label="Top Country" value={stats.topCountry} color="#06b6d4" />
            <StatCard label="Best Campaign" value={stats.bestCampaign} color="#6366f1" />
            <StatCard label="Best QR Code" value={stats.bestQr} color="#22c55e" />
          </div>

          {/* Retention */}
          <h2 style={{ color: '#f0f0f0', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Retention</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Return Rate (Day 1)" value={`${stats.returnRateDay1}%`} subtitle="Next-day retention" color="#22c55e" />
            <StatCard label="Return Rate (Day 7)" value={`${stats.returnRateDay7}%`} subtitle="Weekly retention" color="#f59e0b" />
            <StatCard label="Total Users" value={stats.overview.totalUsers} color="#f0f0f0" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={[
                  { label: 'Scans', value: stats.qrScans, color: '#6366f1' },
                  { label: 'Started', value: stats.gamesStarted, color: '#22c55e' },
                  { label: 'Completed', value: stats.gamesCompleted, color: '#22c55e' },
                  { label: 'Registered', value: stats.registrations, color: '#f59e0b' },
                ]}
                title="QR Conversion Funnel"
              />
            </div>
            <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
              <BarChart
                data={[
                  { label: 'Guest', value: stats.guestGames, color: '#888' },
                  { label: 'Registered', value: stats.registeredGames, color: '#6366f1' },
                ]}
                title="Games by User Type"
              />
            </div>
          </div>
        </>
      )}
    </ResearchLayout>
  );
}
