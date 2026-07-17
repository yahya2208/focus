import { useState, useMemo } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import {
  createCoachEngine,
  buildCognitiveInput,
  type CoachState,
  type ReportPeriod,
  type SessionSnapshot,
} from '../../ai/coach';

type Tab = 'overview' | 'trends' | 'goals' | 'insights' | 'passport';

const tabs: readonly { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'goals', label: 'Goals' },
  { id: 'insights', label: 'Insights' },
  { id: 'passport', label: 'Passport' },
];

function toSnapshot(s: { id: string; timestamp: number; rawRts: readonly number[]; correctedRts: readonly number[]; gameMode: string }): SessionSnapshot {
  const rts = s.correctedRts.length > 0 ? s.correctedRts : s.rawRts;
  const sorted = [...rts].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = n > 0 ? rts.reduce((a, b) => a + b, 0) / n : 0;
  const median = n > 0 ? (sorted[Math.floor(n / 2)] ?? 0) : 0;
  const variance = n > 0 ? rts.reduce((a, v) => a + (v - mean) ** 2, 0) / n : 0;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const consistencyScore = Math.max(0, Math.min(1, 1 - cv));
  const fatigueIndex = n > 5 ? Math.min(1, cv * 0.5) : 0;
  const focusScore = n > 0 ? Math.min(100, Math.round(consistencyScore * 70 + (1 - fatigueIndex) * 30)) : 0;

  return {
    id: s.id,
    timestamp: s.timestamp,
    duration: n * 2000,
    meanRT: mean,
    medianRT: median,
    consistencyScore,
    fatigueIndex,
    fatigueScore: fatigueIndex * 100,
    focusScore,
    accuracy: 1 - (n > 0 ? rts.filter((r) => r < 150 || r > 2000).length / n : 0),
    calibrationConfidence: 0.8,
    grade: focusScore >= 80 ? 'A' : focusScore >= 60 ? 'B' : focusScore >= 40 ? 'C' : 'D',
    roundCount: n,
  };
}

function ConfidenceBadge({ level }: { level: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    high: { bg: '#065f46', text: '#6ee7b7' },
    medium: { bg: '#78350f', text: '#fbbf24' },
    low: { bg: '#7f1d1d', text: '#fca5a5' },
  };
  const colors = colorMap[level] ?? colorMap['medium']!;
  return (
    <span style={{ background: colors.bg, color: colors.text, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
      {level}
    </span>
  );
}

function TrendArrow({ direction }: { direction: string }) {
  const arrows: Record<string, string> = {
    improving: '↑', regressing: '↓', plateau: '→', unstable: '↕', recovering: '↗', accelerating: '↑↑', decelerating: '↓',
  };
  const colors: Record<string, string> = {
    improving: '#34d399', regressing: '#f87171', plateau: '#9ca3af', unstable: '#fbbf24', recovering: '#60a5fa', accelerating: '#34d399', decelerating: '#f87171',
  };
  return <span style={{ color: colors[direction] ?? '#9ca3af', fontSize: '1.25rem' }}>{arrows[direction] ?? '?'}</span>;
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div style={{ background: '#1e1e2e', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
      <div style={{ background: '#6366f1', height: '100%', width: `${pct}%`, transition: 'width 0.3s', borderRadius: '9999px' }} />
    </div>
  );
}

function OverviewTab({ state }: { state: CoachState }) {
  const { performance, confidence, recommendations, goals } = state;
  const dims = ['reactionTime', 'consistency', 'fatigue', 'calibration', 'focusScore', 'accuracy'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: '#f0f0f0', margin: 0 }}>Confidence Level</h3>
          <ConfidenceBadge level={confidence.level} />
        </div>
        <p style={{ color: '#888', margin: 0, fontSize: '0.875rem' }}>{confidence.explanation}</p>
        <div style={{ marginTop: '0.75rem' }}>
          <ProgressBar value={confidence.score} />
          <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>{Math.round(confidence.score)}%</p>
        </div>
      </Card>

      <Card>
        <h3 style={{ color: '#f0f0f0', margin: '0 0 1rem 0' }}>Performance Dimensions</h3>
        {dims.map((d) => {
          const dim = performance[d];
          return (
            <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #1e1e2e' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#f0f0f0', margin: 0, fontSize: '0.875rem', textTransform: 'capitalize' }}>{d.replace(/([A-Z])/g, ' $1')}</p>
                <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>{dim.rating}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: '#f0f0f0', fontWeight: 600 }}>{typeof dim.current === 'number' ? dim.current.toFixed(2) : String(dim.current)}</span>
                <TrendArrow direction={dim.trend} />
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <h3 style={{ color: '#f0f0f0', margin: '0 0 1rem 0' }}>Top Recommendations</h3>
        {recommendations.slice(0, 3).map((r) => (
          <div key={r.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #1e1e2e' }}>
            <p style={{ color: '#f0f0f0', margin: 0, fontSize: '0.875rem' }}>{r.message}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ color: '#6366f1', fontSize: '0.75rem' }}>{r.category}</span>
              <span style={{ color: '#666', fontSize: '0.75rem' }}>{r.researchTag}</span>
            </div>
          </div>
        ))}
        {recommendations.length === 0 && <p style={{ color: '#888' }}>No recommendations yet.</p>}
      </Card>

      <Card>
        <h3 style={{ color: '#f0f0f0', margin: '0 0 1rem 0' }}>Active Goals</h3>
        {goals.filter((g) => g.status === 'active').map((g) => (
          <div key={g.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #1e1e2e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#f0f0f0', margin: 0, fontSize: '0.875rem' }}>{g.title}</p>
              <span style={{ color: '#6366f1', fontSize: '0.875rem' }}>{Math.round(g.progress)}%</span>
            </div>
            <ProgressBar value={g.progress} />
            <p style={{ color: '#666', margin: 0, fontSize: '0.75rem', marginTop: '0.25rem' }}>{g.currentValue} / {g.targetValue} {g.unit}</p>
          </div>
        ))}
        {goals.filter((g) => g.status === 'active').length === 0 && <p style={{ color: '#888' }}>No active goals.</p>}
      </Card>
    </div>
  );
}

function TrendsTab({ state }: { state: CoachState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {state.trends.map((t) => (
        <Card key={t.dimension}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#f0f0f0', margin: 0, fontSize: '1rem', textTransform: 'capitalize' }}>{t.dimension}</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>Magnitude: {t.magnitude.toFixed(3)} · p={t.statisticalSignificance.toFixed(3)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendArrow direction={t.direction} />
              <span style={{ color: '#f0f0f0', textTransform: 'capitalize', fontSize: '0.875rem' }}>{t.direction}</span>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '48px' }}>
            {t.dataPoints.slice(-20).map((dp, i) => (
              <div
                key={i}
                title={`${dp.date}: ${dp.value.toFixed(2)}`}
                style={{ flex: 1, background: '#6366f1', height: `${Math.max(4, (dp.value / 500) * 100)}%`, borderRadius: '2px', minWidth: '4px' }}
              />
            ))}
          </div>
          {t.dataPoints.length === 0 && <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>No data points available.</p>}
        </Card>
      ))}
      {state.trends.length === 0 && <Card><p style={{ color: '#888' }}>No trend data available.</p></Card>}
    </div>
  );
}

function GoalsTab({ state }: { state: CoachState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {state.goals.length === 0 && <Card><p style={{ color: '#888' }}>No goals defined. Complete more sessions to generate adaptive goals.</p></Card>}
      {state.goals.map((g) => (
        <Card key={g.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ color: '#f0f0f0', margin: 0, fontSize: '0.9375rem' }}>{g.title}</h3>
            <span style={{
              color: g.status === 'completed' ? '#34d399' : g.status === 'overdue' ? '#f87171' : g.status === 'adapted' ? '#fbbf24' : '#6366f1',
              fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600,
            }}>{g.status}</span>
          </div>
          <p style={{ color: '#888', margin: '0 0 0.75rem 0', fontSize: '0.8125rem' }}>{g.description}</p>
          <ProgressBar value={g.progress} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>{g.currentValue} / {g.targetValue} {g.unit}</span>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>{Math.round(g.progress)}%</span>
          </div>
          <p style={{ color: '#555', fontSize: '0.6875rem', marginTop: '0.5rem' }}>Due: {new Date(g.deadline).toLocaleDateString()} · {g.researchTag}</p>
        </Card>
      ))}
    </div>
  );
}

function InsightsTab({ state }: { state: CoachState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {state.insights.length === 0 && <Card><p style={{ color: '#888' }}>Insufficient data for insights. Keep training!</p></Card>}
      {state.insights.map((ins) => (
        <Card key={ins.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h3 style={{ color: '#f0f0f0', margin: 0, fontSize: '0.9375rem', flex: 1 }}>{ins.text}</h3>
            <ConfidenceBadge level={ins.confidence.level} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#6366f1', fontSize: '0.75rem' }}>{ins.category}</span>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>{ins.researchTag}</span>
          </div>
          {ins.evidence.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              {ins.evidence.map((e, i) => (
                <p key={i} style={{ color: '#555', fontSize: '0.75rem', margin: '0.125rem 0' }}>
                  {e.metric}: {e.previous.toFixed(1)} → {e.current.toFixed(1)} ({e.direction === 'up' ? '+' : e.direction === 'down' ? '' : ''}{e.changePercent.toFixed(1)}%)
                </p>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function PassportTab({ state }: { state: CoachState }) {
  const { passport } = state;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card>
        <h3 style={{ color: '#f0f0f0', margin: '0 0 0.75rem 0' }}>Cognitive Profile</h3>
        <p style={{ color: '#f0f0f0', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{passport.profile.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>Overall Score</p>
            <p style={{ color: '#6366f1', margin: 0, fontWeight: 700 }}>{passport.profile.overallScore.toFixed(1)}</p>
          </div>
          <div>
            <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>Reliability</p>
            <p style={{ color: '#6366f1', margin: 0, fontWeight: 700 }}>{(passport.reliabilityIndex * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>Dominant Strength</p>
            <p style={{ color: '#34d399', margin: 0, fontWeight: 600 }}>{passport.profile.dominantStrength}</p>
          </div>
          <div>
            <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>Primary Focus</p>
            <p style={{ color: '#fbbf24', margin: 0, fontWeight: 600 }}>{passport.profile.primaryFocus}</p>
          </div>
        </div>
      </Card>

      {passport.strengths.length > 0 && (
        <Card>
          <h3 style={{ color: '#f0f0f0', margin: '0 0 0.75rem 0' }}>Strengths</h3>
          {passport.strengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid #1e1e2e' }}>
              <span style={{ color: '#f0f0f0', fontSize: '0.875rem', textTransform: 'capitalize' }}>{s.dimension}</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{s.score.toFixed(1)}</span>
            </div>
          ))}
        </Card>
      )}

      {passport.areasToImprove.length > 0 && (
        <Card>
          <h3 style={{ color: '#f0f0f0', margin: '0 0 0.75rem 0' }}>Areas to Improve</h3>
          {passport.areasToImprove.map((a, i) => (
            <div key={i} style={{ padding: '0.375rem 0', borderBottom: '1px solid #1e1e2e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f0f0f0', fontSize: '0.875rem', textTransform: 'capitalize' }}>{a.dimension}</span>
                <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>{a.currentScore.toFixed(1)} → {a.targetScore.toFixed(1)}</span>
              </div>
              <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>{a.suggestion}</p>
            </div>
          ))}
        </Card>
      )}

      {passport.milestones.length > 0 && (
        <Card>
          <h3 style={{ color: '#f0f0f0', margin: '0 0 0.75rem 0' }}>Milestones</h3>
          {passport.milestones.map((m) => (
            <div key={m.id} style={{ padding: '0.375rem 0', borderBottom: '1px solid #1e1e2e' }}>
              <p style={{ color: '#f0f0f0', margin: 0, fontSize: '0.875rem' }}>{m.title}</p>
              <p style={{ color: '#666', margin: 0, fontSize: '0.75rem' }}>{m.description} · {new Date(m.achievedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export function CoachScreen() {
  const dispatch = useAppDispatch();
  const { sessions } = useAppState();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('weekly');

  const snapshots = useMemo(() => sessions.map(toSnapshot), [sessions]);
  const engine = useMemo(() => createCoachEngine(), []);

  const state: CoachState | null = useMemo(() => {
    if (snapshots.length === 0) return null;
    const input = buildCognitiveInput(snapshots);
    return engine.analyze(input);
  }, [snapshots, engine]);

  const reportText = useMemo(() => {
    if (!state) return '';
    const report = engine.generateReport(reportPeriod, state);
    return engine.formatReport(report);
  }, [state, reportPeriod, engine]);

  const handleExport = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-coach-report-${reportPeriod}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (sessions.length === 0 || !state) {
    return (
      <nav aria-label="AI Coach" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0f0f0', marginBottom: '1.5rem' }}>
          AI Coach
        </h1>
        <Card>
          <p style={{ color: '#888', textAlign: 'center' }}>Complete at least one session to unlock AI coaching insights.</p>
        </Card>
        <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })} style={{ marginTop: '1rem', width: '100%' }}>
          Back to Home
        </Button>
      </nav>
    );
  }

  return (
    <nav aria-label="AI Coach" style={{ padding: '1.5rem', maxWidth: '560px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 'bold', color: '#f0f0f0', margin: 0 }}>AI Coach</h1>
        <span style={{ color: '#666', fontSize: '0.75rem' }}>{sessions.length} sessions</span>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', overflowX: 'auto' }} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === t.id ? '#6366f1' : '#1e1e2e',
              color: activeTab === t.id ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: activeTab === t.id ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === 'overview' && <OverviewTab state={state} />}
        {activeTab === 'trends' && <TrendsTab state={state} />}
        {activeTab === 'goals' && <GoalsTab state={state} />}
        {activeTab === 'insights' && <InsightsTab state={state} />}
        {activeTab === 'passport' && <PassportTab state={state} />}
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          aria-label="Report period"
          value={reportPeriod}
          onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #333', background: '#12121a', color: '#e0e0e0', fontSize: '0.8125rem' }}
        >
          <option value="daily">Daily Report</option>
          <option value="weekly">Weekly Report</option>
          <option value="monthly">Monthly Report</option>
          <option value="longitudinal">Longitudinal Report</option>
        </select>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={!reportText}>
          Export
        </Button>
      </div>

      <Button variant="secondary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })} style={{ marginTop: '1rem', width: '100%' }}>
        Back to Home
      </Button>
    </nav>
  );
}
