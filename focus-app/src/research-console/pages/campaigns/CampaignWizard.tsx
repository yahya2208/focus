import { useState } from 'react';
import { getSupabaseClient } from '../../../core/supabase/client';
import { getDataService } from '../../../core/supabase/data-service';
import QRCodeLib from 'qrcode';

const GOALS = ['brand_awareness', 'customer_acquisition', 'phone_sales', 'store_visitors', 'research', 'other'];
const TYPES = ['Poster', 'Sticker', 'Flyer', 'Business Card', 'Rollup', 'Social Media', 'NFC', 'Short Link', 'SMS', 'Email', 'Other'];
const CURRENCIES = ['USD', 'DA', 'SAR', 'EUR', 'TRY'];

const inputStyle: React.CSSProperties = { padding: '0.5rem', borderRadius: '8px', border: '1px solid #333', background: '#1e1e2e', color: '#f0f0f0', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { color: '#aaa', fontSize: '0.78rem', marginBottom: '0.25rem', display: 'block' };
const btnPrimary: React.CSSProperties = { padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' };
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto' as const };

interface Props { onClose: () => void; onCreated: () => void; }

export function CampaignWizard({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [country, setCountry] = useState('');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ name: string; qrImage: string; url: string; shortCode: string } | null>(null);

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const ds = getDataService(getSupabaseClient());
      const campaign = await ds.createCampaign({
        name: name.trim(),
        goal: goal || undefined,
        campaign_type: campaignType || undefined,
        country: country || undefined,
        state_name: stateName || undefined,
        city: city || undefined,
        district: district || undefined,
        venue: venue || undefined,
        description: description || undefined,
        notes: notes || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        budget_currency: budgetCurrency,
        is_active: true,
        status: 'active',
      });

      if (!campaign) { setSaving(false); return; }

      const basePath = import.meta.env.BASE_URL || '/';
      const shortCode = campaign.short_code || '';
      const campaignUrl = `${window.location.origin}${basePath}c/${shortCode}`;

      await ds.createQRCode({
        campaign_id: campaign.id!,
        code: shortCode,
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

      setResult({ name: campaign.name, qrImage, url: campaignUrl, shortCode });
      onCreated();
    } catch (err) {
      console.error('Campaign create failed:', err);
    }
    setSaving(false);
  };

  const copyUrl = () => { if (result) navigator.clipboard.writeText(result.url); };
  const downloadQR = () => {
    if (!result?.qrImage) return;
    const a = document.createElement('a');
    a.href = result.qrImage;
    a.download = `${result.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
    a.click();
  };

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal: React.CSSProperties = { background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', color: '#f0f0f0' };

  if (result) {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#22c55e' }}>Campaign Created!</h3>
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <p style={{ color: '#f0f0f0', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>اختبر تركيزك</p>
            {result.qrImage && <img src={result.qrImage} alt="QR" style={{ borderRadius: '12px', border: '1px solid #1e1e2e' }} />}
          </div>
          <p style={{ color: '#22c55e', fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.25rem', fontWeight: 600 }}>
            focus.app/c/{result.shortCode}
          </p>
          <p style={{ color: '#666', fontSize: '0.7rem', textAlign: 'center', wordBreak: 'break-all', marginBottom: '1rem' }}>{result.url}</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
            <button onClick={copyUrl} style={btnPrimary}>Copy Link</button>
            <button onClick={downloadQR} style={{ ...btnPrimary, background: '#22c55e' }} disabled={!result.qrImage}>Download PNG</button>
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
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>New Campaign</h3>
          <span style={{ color: '#6366f1', fontSize: '0.8rem' }}>Step {step} of 3</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? '#6366f1' : '#1e1e2e' }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Campaign Name *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. University Entrance, Mall July" autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Campaign Goal</label>
              <select style={selectStyle} value={goal} onChange={e => setGoal(e.target.value)}>
                <option value="">Select goal...</option>
                {GOALS.map(g => <option key={g} value={g}>{g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Campaign Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {TYPES.map(t => (
                  <button key={t} onClick={() => setCampaignType(t)} style={{
                    padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem',
                    background: campaignType === t ? '#6366f1' : '#1e1e2e',
                    color: campaignType === t ? '#fff' : '#888',
                    border: `1px solid ${campaignType === t ? '#6366f1' : '#333'}`,
                    cursor: 'pointer',
                  }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><label style={labelStyle}>Country</label><input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Algeria" /></div>
            <div><label style={labelStyle}>State / Province</label><input style={inputStyle} value={stateName} onChange={e => setStateName(e.target.value)} placeholder="e.g. Oran" /></div>
            <div><label style={labelStyle}>City</label><input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Es Senia" /></div>
            <div><label style={labelStyle}>District</label><input style={inputStyle} value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. University Gate" /></div>
            <div><label style={labelStyle}>Venue</label><input style={inputStyle} value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Gate A, 2nd Floor, by the cashier" /></div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><label style={labelStyle}>Description (optional)</label><textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Campaign description..." /></div>
            <div><label style={labelStyle}>Notes (optional)</label><textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes..." /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 2 }}><label style={labelStyle}>Budget (optional)</label><input style={inputStyle} type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Currency</label><select style={selectStyle} value={budgetCurrency} onChange={e => setBudgetCurrency(e.target.value)}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div style={{ padding: '0.75rem', background: '#1e1e2e', borderRadius: '8px', fontSize: '0.8rem' }}>
              <p style={{ margin: '0 0 0.3rem', color: '#f0f0f0', fontWeight: 600 }}>Review</p>
              <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Name:</strong> {name}</p>
              {goal && <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Goal:</strong> {goal.replace(/_/g, ' ')}</p>}
              {campaignType && <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Type:</strong> {campaignType}</p>}
              <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Location:</strong> {[venue, district, city, stateName, country].filter(Boolean).join(', ') || '-'}</p>
              {budget && <p style={{ margin: 0, color: '#888' }}><strong style={{ color: '#ccc' }}>Budget:</strong> {budget} {budgetCurrency}</p>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: '#1e1e2e', color: '#888', border: '1px solid #333', cursor: 'pointer' }}>Back</button>}
          {step < 3 ? (
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
