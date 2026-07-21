import { useState } from 'react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import type { ResearchFilters, FilterKey } from '../../core/research/filters';

export type DashboardId =
  | 'overview' | 'scientific' | 'users' | 'sessions'
  | 'devices' | 'surveys' | 'campaigns' | 'live' | 'system' | 'acquisition';

const DASHBOARDS: { id: DashboardId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'acquisition', label: 'Acquisition', icon: '🎯' },
  { id: 'scientific', label: 'Scientific', icon: '🔬' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'sessions', label: 'Sessions', icon: '⏱' },
  { id: 'devices', label: 'Devices', icon: '💻' },
  { id: 'surveys', label: 'Surveys', icon: '📋' },
  { id: 'campaigns', label: 'Campaigns', icon: '📣' },
  { id: 'live', label: 'Live', icon: '🟢' },
  { id: 'system', label: 'System', icon: '⚙' },
];

interface ResearchLayoutProps {
  activeDashboard: DashboardId;
  onNavigate: (dashboard: DashboardId) => void;
  children: React.ReactNode;
}

export function ResearchLayout({ activeDashboard, onNavigate, children }: ResearchLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0' }}>
      <aside
        style={{
          width: sidebarOpen ? '240px' : '60px',
          background: '#12121a',
          borderRight: '1px solid #1e1e2e',
          padding: '1rem 0',
          transition: 'width 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sidebarOpen && <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#6366f1' }}>FOCUS Research</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none', border: 'none', color: '#888', cursor: 'pointer',
              fontSize: '1.2rem', padding: '0.25rem',
            }}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav aria-label="Research console navigation">
          {DASHBOARDS.map((d) => (
            <button
              key={d.id}
              onClick={() => onNavigate(d.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: sidebarOpen ? '0.6rem 1rem' : '0.6rem 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: activeDashboard === d.id ? '#1e1e2e' : 'transparent',
                border: 'none', color: activeDashboard === d.id ? '#6366f1' : '#888',
                cursor: 'pointer', fontSize: '0.9rem', borderRadius: '0',
                transition: 'background 0.1s',
              }}
              aria-current={activeDashboard === d.id ? 'page' : undefined}
              title={d.label}
            >
              <span>{d.icon}</span>
              {sidebarOpen && <span>{d.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly subtitle?: string;
  readonly color?: string;
  readonly onClick?: () => void;
}

export function StatCard({ label, value, subtitle, color = '#f0f0f0', onClick }: StatCardProps) {
  return (
    <Card
      padding="1rem"
      style={{
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform 0.1s',
      }}
    >
      <div onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ color, fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</p>
        {subtitle && <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
    </Card>
  );
}

interface DashboardHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0' }}>{title}</h1>
        {subtitle && <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>}
    </div>
  );
}

interface FilterBarProps {
  readonly filters: ResearchFilters;
  readonly onFilterChange: (key: FilterKey, value: unknown) => void;
  readonly onReset: () => void;
}

export function FilterBar({ filters, onFilterChange, onReset }: FilterBarProps) {
  const activeCount = Object.values(filters).filter((v) => v !== null && v !== undefined).length;
  return (
    <Card padding="0.75rem" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ color: '#888', fontSize: '0.85rem' }}>Filters {activeCount > 0 ? `(${activeCount})` : ''}</span>
        <input
          type="date"
          aria-label="Date from"
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #333', background: '#1e1e2e', color: '#f0f0f0', fontSize: '0.85rem' }}
          onChange={(e) => onFilterChange('dateFrom', e.target.value ? new Date(e.target.value).getTime() : null)}
        />
        <input
          type="date"
          aria-label="Date to"
          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #333', background: '#1e1e2e', color: '#f0f0f0', fontSize: '0.85rem' }}
          onChange={(e) => onFilterChange('dateTo', e.target.value ? new Date(e.target.value).getTime() : null)}
        />
        {activeCount > 0 && (
          <Button variant="secondary" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
    </Card>
  );
}
