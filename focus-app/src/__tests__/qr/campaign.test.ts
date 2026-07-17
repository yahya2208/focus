import { describe, it, expect } from 'vitest';
import {
  parseCampaignParams, parseCampaignFromQueryString, serializeCampaignParams,
  hasCampaign, createCampaignStore,
} from '../../core/qr/campaign';

describe('Campaign Params Parser', () => {
  it('should parse campaign params from URL', () => {
    const params = parseCampaignParams('https://focus.app?campaign=school2026&source=poster');
    expect(params.campaign).toBe('school2026');
    expect(params.source).toBe('poster');
    expect(params.school).toBeNull();
  });

  it('should parse all campaign keys', () => {
    const url = 'https://focus.app?campaign=test&location=riyadh&school=kau&company=acme&event=conference&version=2.0&language=ar&source=linkedin&referrer=friend';
    const params = parseCampaignParams(url);
    expect(params.campaign).toBe('test');
    expect(params.location).toBe('riyadh');
    expect(params.school).toBe('kau');
    expect(params.company).toBe('acme');
    expect(params.event).toBe('conference');
    expect(params.version).toBe('2.0');
    expect(params.language).toBe('ar');
    expect(params.source).toBe('linkedin');
    expect(params.referrer).toBe('friend');
  });

  it('should return null for missing params', () => {
    const params = parseCampaignParams('https://focus.app');
    expect(params.campaign).toBeNull();
    expect(params.location).toBeNull();
    expect(params.school).toBeNull();
  });

  it('should parse from query string', () => {
    const params = parseCampaignFromQueryString('campaign=test&source=poster');
    expect(params.campaign).toBe('test');
    expect(params.source).toBe('poster');
  });

  it('should parse from query string with leading ?', () => {
    const params = parseCampaignFromQueryString('?campaign=test');
    expect(params.campaign).toBe('test');
  });

  it('should handle invalid URL', () => {
    const params = parseCampaignParams('not-a-url');
    expect(params.campaign).toBeNull();
  });
});

describe('Campaign Serialization', () => {
  it('should serialize params to query string', () => {
    const qs = serializeCampaignParams({
      campaign: 'test', location: null, school: null,
      company: null, event: null, version: null,
      language: null, source: null, referrer: null,
    });
    expect(qs).toBe('campaign=test');
  });

  it('should serialize multiple params', () => {
    const qs = serializeCampaignParams({
      campaign: 'test', location: 'riyadh', school: null,
      company: null, event: null, version: null,
      language: 'ar', source: null, referrer: null,
    });
    expect(qs).toContain('campaign=test');
    expect(qs).toContain('location=riyadh');
    expect(qs).toContain('language=ar');
  });
});

describe('hasCampaign', () => {
  it('should return true when campaign exists', () => {
    expect(hasCampaign({
      campaign: 'test', location: null, school: null,
      company: null, event: null, version: null,
      language: null, source: null, referrer: null,
    })).toBe(true);
  });

  it('should return false when campaign is null', () => {
    expect(hasCampaign({
      campaign: null, location: null, school: null,
      company: null, event: null, version: null,
      language: null, source: null, referrer: null,
    })).toBe(false);
  });

  it('should return false when campaign is empty', () => {
    expect(hasCampaign({
      campaign: '', location: null, school: null,
      company: null, event: null, version: null,
      language: null, source: null, referrer: null,
    })).toBe(false);
  });
});

describe('Campaign Store', () => {
  it('should create a campaign', () => {
    const store = createCampaignStore();
    const campaign = store.create('School 2026', 'https://focus.app');
    expect(campaign.name).toBe('School 2026');
    expect(campaign.baseUrl).toBe('https://focus.app');
    expect(campaign.active).toBe(true);
    expect(campaign.scanCount).toBe(0);
    expect(campaign.conversionCount).toBe(0);
  });

  it('should create campaign with custom params', () => {
    const store = createCampaignStore();
    const campaign = store.create('Conference', 'https://focus.app', {
      location: 'riyadh',
      language: 'ar',
    });
    expect(campaign.params.location).toBe('riyadh');
    expect(campaign.params.language).toBe('ar');
    expect(campaign.params.campaign).toBe('conference');
  });

  it('should retrieve campaign by ID', () => {
    const store = createCampaignStore();
    const created = store.create('Test', 'https://focus.app');
    const retrieved = store.get(created.id);
    expect(retrieved?.id).toBe(created.id);
  });

  it('should return null for non-existent campaign', () => {
    const store = createCampaignStore();
    expect(store.get('nonexistent')).toBeNull();
  });

  it('should list all campaigns', () => {
    const store = createCampaignStore();
    store.create('Campaign A', 'https://focus.app');
    store.create('Campaign B', 'https://focus.app');
    expect(store.getAll()).toHaveLength(2);
  });

  it('should record scans', () => {
    const store = createCampaignStore();
    const campaign = store.create('Test', 'https://focus.app');
    store.recordScan(campaign.id);
    store.recordScan(campaign.id);
    const updated = store.get(campaign.id);
    expect(updated?.scanCount).toBe(2);
  });

  it('should record conversions', () => {
    const store = createCampaignStore();
    const campaign = store.create('Test', 'https://focus.app');
    store.recordScan(campaign.id);
    store.recordScan(campaign.id);
    store.recordConversion(campaign.id);
    const updated = store.get(campaign.id);
    expect(updated?.conversionCount).toBe(1);
  });

  it('should deactivate campaign', () => {
    const store = createCampaignStore();
    const campaign = store.create('Test', 'https://focus.app');
    store.deactivate(campaign.id);
    const updated = store.get(campaign.id);
    expect(updated?.active).toBe(false);
  });

  it('should compute stats', () => {
    const store = createCampaignStore();
    const campaign = store.create('Test', 'https://focus.app');
    store.recordScan(campaign.id);
    store.recordScan(campaign.id);
    store.recordScan(campaign.id);
    store.recordConversion(campaign.id);
    const stats = store.getStats(campaign.id);
    expect(stats?.scanCount).toBe(3);
    expect(stats?.conversionCount).toBe(1);
    expect(stats?.conversionRate).toBeCloseTo(1 / 3);
  });

  it('should return null stats for non-existent campaign', () => {
    const store = createCampaignStore();
    expect(store.getStats('nonexistent')).toBeNull();
  });

  it('should have zero conversion rate for zero scans', () => {
    const store = createCampaignStore();
    const campaign = store.create('Test', 'https://focus.app');
    const stats = store.getStats(campaign.id);
    expect(stats?.conversionRate).toBe(0);
  });
});
