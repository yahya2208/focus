import { useState, useEffect, useCallback } from 'react';
import { createResearchAPI, type CampaignAnalytics } from '../../../core/research/api-supabase';
import { ResearchLayout, StatCard, DashboardHeader, FilterBar } from '../../layout/ResearchLayout';
import { BarChart } from '../../components/charts/Charts';
import type { DashboardId } from '../../layout/ResearchLayout';
import type { ResearchFilters } from '../../../core/research/filters';
import { createEmptyFilters } from '../../../core/research/filters';
import { getSupabaseClient } from '../../../core/supabase/client';
import { getDataService, type Campaign, type QRCode } from '../../../core/supabase/data-service';
import QRCodeLib from 'qrcode';

const LOCATION_TYPES = ['University', 'School', 'Mall', 'Coffee Shop', 'Hospital', 'Event', 'Company', 'Outdoor', 'Other'];

const inputStyle: React.CSSProperties = { padding: '0.5rem', borderRadius: '8px', border: '1px solid #333', background: '#1e1e2e', color: '#f0f0f0', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { color: '#aaa', fontSize: '0.78rem', marginBottom: '0.25rem', display: 'block' };
const ROW_STYLE: React.CSSProperties = { padding: '0.65rem 0.75rem', borderBottom: '1px solid #1e1e2e', fontSize: '0.82rem', color: '#ccc', whiteSpace: 'nowrap' };
const TH_STYLE: React.CSSProperties = { padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid #1e1e2e', whiteSpace: 'nowrap' };
const btnPrimary: React.CSSProperties = { padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' };
const btnDanger: React.CSSProperties = { padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontSize: '0.78rem' };
const btnSmall: React.CSSProperties = { padding: '0.4rem 0.8rem', borderRadius: '6px', background: '#1e1e2e', color: '#ccc', border: '1px solid #333', cursor: 'pointer', fontSize: '0.78rem' };

interface CampaignRow extends Campaign {
  scan_count: number;
  game_complete_count: number;
  registration_count: number;
  qr_count: number;
}

export function CampaignsDashboard() {
  const [dashboard, setDashboard] = useState<DashboardId>('campaigns');
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [filters, setFilters] = useState<ResearchFilters>(createEmptyFilters());
  const [showWizard, setShowWizard] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const api = createResearchAPI();
      const client = getSupabaseClient();
      const ds = getDataService(client);
      const [analyticsData, campaignsResult, qrResult] = await Promise.all([
        api.getCampaignAnalytics(filters),
        ds.getCampaigns({ limit: 100 }),
        ds.getQRCodes({ limit: 500 }),
      ]);
      setAnalytics(analyticsData);

      const rows: CampaignRow[] = campaignsResult.data.map(c => {
        const campaignQrs = qrResult.data.filter(qr => qr.campaign_id === c.id);
        return {
          ...c,
          scan_count: campaignQrs.reduce((s, q) => s + q.scan_count, 0),
          game_complete_count: campaignQrs.reduce((s, q) => s + q.game_complete_count, 0),
          registration_count: campaignQrs.reduce((s, q) => s + q.registration_count, 0),
          qr_count: campaignQrs.length,
        };
      });
      setCampaigns(rows);
    } catch (err) {
      console.error('[Campaigns] load error:', err);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign permanently?')) return;
    const client = getSupabaseClient();
    const ds = getDataService(client);
    await ds.deleteCampaign(id);
    setSelectedId(null);
    loadData();
  };

  if (dashboard !== 'campaigns') return null;

  const selected = selectedId ? campaigns.find(c => c.id === selectedId) ?? null : null;

  return (
    <ResearchLayout activeDashboard={dashboard} onNavigate={setDashboard}>
      <DashboardHeader
        title="Campaigns"
        subtitle={`${campaigns.length} campaigns`}
        actions={
          <button onClick={() => setShowWizard(true)} style={btnPrimary}>
            + New QR Campaign
          </button>
        }
      />
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} onReset={() => setFilters(createEmptyFilters())} />

      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <StatCard label="Campaigns" value={campaigns.length} color="#6366f1" />
          <StatCard label="Scans" value={campaigns.reduce((s, c) => s + c.scan_count, 0)} color="#22c55e" />
          <StatCard label="Completed" value={campaigns.reduce((s, c) => s + c.game_complete_count, 0)} color="#3b82f6" />
          <StatCard label="Registered" value={campaigns.reduce((s, c) => s + c.registration_count, 0)} color="#f59e0b" />
        </div>
      )}

      {analytics && analytics.avgFocusByCampaign.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
            <BarChart data={analytics.sessionCompletionByCampaign.map(d => ({ label: d.campaign, value: d.rate, color: '#22c55e' }))} title="Completion %" />
          </div>
          <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '1rem' }}>
            <BarChart data={analytics.avgFocusByCampaign.map(d => ({ label: d.campaign, value: d.avgFocus, color: '#6366f1' }))} title="Avg Focus" />
          </div>
        </div>
      )}

      <div style={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Campaign</th>
                <th style={TH_STYLE}>Type</th>
                <th style={TH_STYLE}>Location</th>
                <th style={TH_STYLE}>Scans</th>
                <th style={TH_STYLE}>Completed</th>
                <th style={TH_STYLE}>Registered</th>
                <th style={TH_STYLE}>Conversion</th>
                <th style={TH_STYLE}>QRs</th>
                <th style={TH_STYLE}>Status</th>
                <th style={TH_STYLE}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const conversion = c.scan_count > 0 ? ((c.registration_count / c.scan_count) * 100).toFixed(1) : '0';
                return (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer', background: selectedId === c.id ? '#1a1a2e' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#16162a'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedId === c.id ? '#1a1a2e' : 'transparent'; }}
                  >
                    <td style={ROW_STYLE} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{c.name}</td>
                    <td style={ROW_STYLE} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{c.location_type ?? '-'}</td>
                    <td style={ROW_STYLE} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{[c.city, c.country].filter(Boolean).join(', ') || '-'}</td>
                    <td style={{ ...ROW_STYLE, fontVariantNumeric: 'tabular-nums' }} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{c.scan_count}</td>
                    <td style={{ ...ROW_STYLE, fontVariantNumeric: 'tabular-nums' }} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{c.game_complete_count}</td>
                    <td style={{ ...ROW_STYLE, fontVariantNumeric: 'tabular-nums' }} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{c.registration_count}</td>
                    <td style={{ ...ROW_STYLE, color: parseFloat(conversion) >= 20 ? '#22c55e' : parseFloat(conversion) >= 10 ? '#f59e0b' : '#888' }} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{conversion}%</td>
                    <td style={ROW_STYLE} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{c.qr_count}</td>
                    <td style={{ ...ROW_STYLE, color: c.is_active ? '#22c55e' : '#666' }} onClick={() => setSelectedId(selectedId === c.id ? null : c.id!)}>{c.is_active ? 'Active' : 'Off'}</td>
                    <td style={{ ...ROW_STYLE }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id!); }}
                        style={btnDanger}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>No campaigns yet. Click "+ New QR Campaign" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div style={{ marginTop: '1rem', background: '#12121a', border: '1px solid #6366f1', borderRadius: '12px', padding: '1.25rem' }}>
          <CampaignDetail campaign={selected} />
        </div>
      )}

      {showWizard && <CampaignWizard onClose={() => setShowWizard(false)} onCreated={loadData} />}
    </ResearchLayout>
  );
}

function CampaignDetail({ campaign: c }: { campaign: CampaignRow }) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const url = `${window.location.origin}/?campaign=${encodeURIComponent(c.name.toLowerCase().replace(/\s+/g, '-'))}`;

  useEffect(() => {
    QRCodeLib.toDataURL(url, { width: 200, margin: 2, color: { dark: '#f0f0f0', light: '#0a0a0f' } })
      .then(setQrImage)
      .catch(() => setQrImage(null));
  }, [url]);

  const completionRate = c.scan_count > 0 ? ((c.game_complete_count / c.scan_count) * 100).toFixed(1) : '0';
  const registrationRate = c.scan_count > 0 ? ((c.registration_count / c.scan_count) * 100).toFixed(1) : '0';

  const downloadPNG = () => {
    if (!qrImage) return;
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `${c.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
    a.click();
  };

  const downloadSVG = () => {
    QRCodeLib.toString(url, { type: 'svg', width: 300, margin: 2 }, (err, svg) => {
      if (err) return;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${c.name.toLowerCase().replace(/\s+/g, '-')}-qr.svg`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'start' }}>
      <div>
        <h4 style={{ color: '#f0f0f0', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{c.name}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            { label: 'Type', value: c.location_type ?? '-' },
            { label: 'Country', value: c.country ?? '-' },
            { label: 'State', value: c.state_name ?? '-' },
            { label: 'City', value: c.city ?? '-' },
            { label: 'District', value: c.district ?? '-' },
            { label: 'Description', value: c.description ?? '-' },
            { label: 'Created', value: c.created_at ? new Date(c.created_at).toLocaleDateString() : '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: '#666', fontSize: '0.65rem', margin: '0 0 0.1rem', textTransform: 'uppercase' }}>{label}</p>
              <p style={{ color: '#f0f0f0', fontSize: '0.8rem', margin: 0, wordBreak: 'break-all' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 style={{ color: '#f0f0f0', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Performance</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            { label: 'Scans', value: c.scan_count.toString() },
            { label: 'Completed', value: c.game_complete_count.toString() },
            { label: 'Registered', value: c.registration_count.toString() },
            { label: 'Completion %', value: `${completionRate}%` },
            { label: 'Conversion %', value: `${registrationRate}%` },
            { label: 'QR Codes', value: c.qr_count.toString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: '#666', fontSize: '0.65rem', margin: '0 0 0.1rem', textTransform: 'uppercase' }}>{label}</p>
              <p style={{ color: '#f0f0f0', fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#888', fontSize: '0.72rem', marginBottom: '0.5rem' }}>QR Code</p>
        {qrImage && <img src={qrImage} alt="QR Code" style={{ borderRadius: '8px', border: '1px solid #1e1e2e' }} />}
        <p style={{ color: '#555', fontSize: '0.6rem', marginTop: '0.4rem', maxWidth: '200px', wordBreak: 'break-all' }}>{url}</p>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={downloadPNG} style={btnSmall} disabled={!qrImage}>Download PNG</button>
          <button onClick={downloadSVG} style={btnSmall}>Download SVG</button>
        </div>
      </div>
    </div>
  );
}

function CampaignWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [locationType, setLocationType] = useState('');
  const [country, setCountry] = useState('');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ campaign: Campaign; qrUrl: string; qrImage: string } | null>(null);

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return locationType.length > 0;
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    const client = getSupabaseClient();
    const ds = getDataService(client);
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const campaignUrl = `${window.location.origin}/?campaign=${slug}`;

    const campaign = await ds.createCampaign({
      name: name.trim(),
      location_type: locationType,
      country: country || undefined,
      state_name: stateName || undefined,
      city: city || undefined,
      district: district || undefined,
      description: description || undefined,
      is_active: true,
    });

    if (!campaign) { setSaving(false); return; }

    await ds.createQRCode({
      campaign_id: campaign.id!,
      code: slug,
      url: campaignUrl,
      scan_count: 0,
      game_start_count: 0,
      game_complete_count: 0,
      registration_count: 0,
      is_active: true,
    });

    let qrImage = '';
    try {
      qrImage = await QRCodeLib.toDataURL(campaignUrl, { width: 280, margin: 2, color: { dark: '#1e1e2e', light: '#ffffff' } });
    } catch { /* ignore */ }

    setResult({ campaign, qrUrl: campaignUrl, qrImage });
    setSaving(false);
    onCreated();
  };

  const downloadQR = (format: 'png' | 'svg') => {
    if (!result) return;
    if (format === 'png' && result.qrImage) {
      const a = document.createElement('a');
      a.href = result.qrImage;
      a.download = `${result.campaign.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      a.click();
    }
    if (format === 'svg') {
      QRCodeLib.toString(result.qrUrl, { type: 'svg', width: 300, margin: 2 }, (err, svg) => {
        if (err) return;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${result.campaign.name.toLowerCase().replace(/\s+/g, '-')}-qr.svg`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
    }
  };

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal: React.CSSProperties = { background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', color: '#f0f0f0' };

  if (result) {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: '#22c55e' }}>Campaign Created!</h3>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            {result.qrImage && <img src={result.qrImage} alt="QR" style={{ borderRadius: '12px', border: '1px solid #1e1e2e' }} />}
          </div>
          <p style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', wordBreak: 'break-all', marginBottom: '1rem' }}>{result.qrUrl}</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
            <button onClick={() => downloadQR('png')} style={{ ...btnPrimary, background: '#22c55e' }}>Download PNG</button>
            <button onClick={() => downloadQR('svg')} style={btnSmall}>Download SVG</button>
          </div>
          <button onClick={onClose} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'transparent', color: '#888', border: '1px solid #333', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>New QR Campaign</h3>
          <span style={{ color: '#6366f1', fontSize: '0.8rem' }}>Step {step} of 4</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? '#6366f1' : '#1e1e2e' }} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <label style={labelStyle}>Campaign Name *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mall July, University Spring" autoFocus />
          </div>
        )}

        {step === 2 && (
          <div>
            <label style={labelStyle}>Place Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {LOCATION_TYPES.map(t => (
                <button key={t} onClick={() => setLocationType(t)} style={{
                  padding: '0.5rem', borderRadius: '8px',
                  background: locationType === t ? '#6366f1' : '#1e1e2e',
                  color: locationType === t ? '#fff' : '#888',
                  border: `1px solid ${locationType === t ? '#6366f1' : '#333'}`,
                  cursor: 'pointer', fontSize: '0.82rem',
                }}>{t}</button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><label style={labelStyle}>Country</label><input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Saudi Arabia" /></div>
            <div><label style={labelStyle}>State / Province</label><input style={inputStyle} value={stateName} onChange={e => setStateName(e.target.value)} placeholder="e.g. Riyadh" /></div>
            <div><label style={labelStyle}>City</label><input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Riyadh" /></div>
            <div><label style={labelStyle}>District (optional)</label><input style={inputStyle} value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Gate A, 2nd Floor" /></div>
          </div>
        )}

        {step === 4 && (
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Near entrance, by the cashier, Poster #3" />
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#1e1e2e', borderRadius: '8px', fontSize: '0.8rem' }}>
              <p style={{ margin: '0 0 0.3rem', color: '#f0f0f0', fontWeight: 600 }}>Review</p>
              <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Name:</strong> {name}</p>
              <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Type:</strong> {locationType}</p>
              <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Location:</strong> {[district, city, stateName, country].filter(Boolean).join(', ') || '-'}</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: '#1e1e2e', color: '#888', border: '1px solid #333', cursor: 'pointer' }}>Back</button>}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{
              flex: 1, padding: '0.6rem', borderRadius: '8px',
              background: canNext() ? '#6366f1' : '#333',
              color: canNext() ? '#fff' : '#666',
              border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed', fontWeight: 600,
            }}>Next</button>
          ) : (
            <button onClick={handleCreate} disabled={saving} style={{
              flex: 1, padding: '0.6rem', borderRadius: '8px',
              background: saving ? '#333' : '#22c55e',
              color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer', fontWeight: 600,
            }}>{saving ? 'Creating...' : 'Create Campaign'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
