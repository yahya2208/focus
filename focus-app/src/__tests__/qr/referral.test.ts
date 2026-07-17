import { describe, it, expect } from 'vitest';
import { createReferralEngine } from '../../core/qr/referral';

describe('Referral Engine', () => {
  it('should create a referral profile', () => {
    const engine = createReferralEngine();
    const profile = engine.createProfile('user-1');
    expect(profile.userId).toBe('user-1');
    expect(profile.referralCode).toHaveLength(8);
    expect(profile.totalScans).toBe(0);
    expect(profile.totalConversions).toBe(0);
  });

  it('should return existing profile on duplicate', () => {
    const engine = createReferralEngine();
    const p1 = engine.createProfile('user-1');
    const p2 = engine.createProfile('user-1');
    expect(p1.id).toBe(p2.id);
    expect(p1.referralCode).toBe(p2.referralCode);
  });

  it('should retrieve profile by user ID', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    const profile = engine.getProfile('user-1');
    expect(profile?.userId).toBe('user-1');
  });

  it('should retrieve profile by referral code', () => {
    const engine = createReferralEngine();
    const created = engine.createProfile('user-1');
    const retrieved = engine.getProfileByCode(created.referralCode);
    expect(retrieved?.userId).toBe('user-1');
  });

  it('should return null for non-existent code', () => {
    const engine = createReferralEngine();
    expect(engine.getProfileByCode('NONEXIST')).toBeNull();
  });

  it('should return null for non-existent user', () => {
    const engine = createReferralEngine();
    expect(engine.getProfile('nobody')).toBeNull();
  });

  it('should record scans', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    engine.recordScan('user-1', 'campaign-a');
    engine.recordScan('user-1');
    const profile = engine.getProfile('user-1');
    expect(profile?.totalScans).toBe(2);
  });

  it('should record conversions', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    engine.recordScan('user-1');
    engine.recordConversion('user-1');
    const profile = engine.getProfile('user-1');
    expect(profile?.totalConversions).toBe(1);
  });

  it('should compute stats', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    engine.recordScan('user-1', 'a');
    engine.recordScan('user-1', 'b');
    engine.recordScan('user-1', 'c');
    engine.recordConversion('user-1');
    const stats = engine.getStats('user-1');
    expect(stats?.totalScans).toBe(3);
    expect(stats?.totalConversions).toBe(1);
    expect(stats?.conversionRate).toBeCloseTo(1 / 3);
  });

  it('should return null stats for non-existent user', () => {
    const engine = createReferralEngine();
    expect(engine.getStats('nobody')).toBeNull();
  });

  it('should have zero conversion rate for zero scans', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    const stats = engine.getStats('user-1');
    expect(stats?.conversionRate).toBe(0);
  });

  it('should generate referral URL', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    const url = engine.generateReferralUrl('user-1', 'https://focus.app');
    expect(url).toContain('ref=');
    expect(url).toContain('focus.app');
  });

  it('should throw for non-existent user URL generation', () => {
    const engine = createReferralEngine();
    expect(() => engine.generateReferralUrl('nobody', 'https://focus.app')).toThrow();
  });

  it('should list all profiles', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    engine.createProfile('user-2');
    expect(engine.getAllProfiles()).toHaveLength(2);
  });

  it('should have unique codes', () => {
    const engine = createReferralEngine();
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const profile = engine.createProfile(`user-${i}`);
      codes.add(profile.referralCode);
    }
    expect(codes.size).toBe(50);
  });

  it('should track scan history', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    engine.recordScan('user-1', 'campaign-a');
    engine.recordScan('user-1', 'campaign-b');
    const stats = engine.getStats('user-1');
    expect(stats?.recentScans).toHaveLength(2);
    expect(stats?.recentScans[0]?.campaignId).toBe('campaign-a');
    expect(stats?.recentScans[1]?.campaignId).toBe('campaign-b');
  });

  it('should update scan to converted on conversion', () => {
    const engine = createReferralEngine();
    engine.createProfile('user-1');
    engine.recordScan('user-1');
    engine.recordConversion('user-1');
    const stats = engine.getStats('user-1');
    expect(stats?.recentScans[0]?.converted).toBe(true);
  });

  it('should ignore scan recording for non-existent user', () => {
    const engine = createReferralEngine();
    engine.recordScan('nobody');
    expect(engine.getProfile('nobody')).toBeNull();
  });

  it('should ignore conversion recording for non-existent user', () => {
    const engine = createReferralEngine();
    engine.recordConversion('nobody');
    expect(engine.getProfile('nobody')).toBeNull();
  });
});
