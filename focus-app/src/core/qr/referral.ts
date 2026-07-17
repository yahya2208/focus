export interface ReferralProfile {
  readonly id: string;
  readonly userId: string;
  readonly referralCode: string;
  readonly createdAt: number;
  readonly totalScans: number;
  readonly totalConversions: number;
}

export interface ReferralStats {
  readonly code: string;
  readonly totalScans: number;
  readonly totalConversions: number;
  readonly conversionRate: number;
  readonly recentScans: readonly ReferralScan[];
}

export interface ReferralScan {
  readonly timestamp: number;
  readonly campaignId: string | null;
  readonly converted: boolean;
}

export interface ReferralEngine {
  createProfile(userId: string): ReferralProfile;
  getProfile(userId: string): ReferralProfile | null;
  getProfileByCode(code: string): ReferralProfile | null;
  recordScan(userId: string, campaignId?: string): void;
  recordConversion(userId: string): void;
  getStats(userId: string): ReferralStats | null;
  generateReferralUrl(userId: string, baseUrl: string): string;
  generateReferralQrData(userId: string, baseUrl: string): string;
  getAllProfiles(): readonly ReferralProfile[];
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

let referralCounter = 0;

export function createReferralEngine(): ReferralEngine {
  const profiles = new Map<string, ReferralProfile>();
  const scansByUser = new Map<string, ReferralScan[]>();
  const codeToUser = new Map<string, string>();

  return {
    createProfile(userId: string): ReferralProfile {
      const existing = profiles.get(userId);
      if (existing) return existing;

      let code = generateReferralCode();
      while (codeToUser.has(code)) {
        code = generateReferralCode();
      }

      const profile: ReferralProfile = {
        id: `ref_${Date.now().toString(36)}_${(referralCounter++).toString(36)}`,
        userId,
        referralCode: code,
        createdAt: Date.now(),
        totalScans: 0,
        totalConversions: 0,
      };
      profiles.set(userId, profile);
      scansByUser.set(userId, []);
      codeToUser.set(code, userId);
      return profile;
    },

    getProfile(userId: string): ReferralProfile | null {
      return profiles.get(userId) ?? null;
    },

    getProfileByCode(code: string): ReferralProfile | null {
      const userId = codeToUser.get(code);
      if (!userId) return null;
      return profiles.get(userId) ?? null;
    },

    recordScan(userId: string, campaignId?: string): void {
      const profile = profiles.get(userId);
      if (!profile) return;
      profiles.set(userId, { ...profile, totalScans: profile.totalScans + 1 });
      const scans = scansByUser.get(userId) ?? [];
      scans.push({
        timestamp: Date.now(),
        campaignId: campaignId ?? null,
        converted: false,
      });
      scansByUser.set(userId, scans);
    },

    recordConversion(userId: string): void {
      const profile = profiles.get(userId);
      if (!profile) return;
      profiles.set(userId, {
        ...profile,
        totalConversions: profile.totalConversions + 1,
      });
      const scans = scansByUser.get(userId);
      if (scans && scans.length > 0) {
        const lastScan = scans[scans.length - 1];
        if (lastScan && !lastScan.converted) {
          scans[scans.length - 1] = { ...lastScan, converted: true };
          scansByUser.set(userId, scans);
        }
      }
    },

    getStats(userId: string): ReferralStats | null {
      const profile = profiles.get(userId);
      if (!profile) return null;
      const scans = scansByUser.get(userId) ?? [];
      return {
        code: profile.referralCode,
        totalScans: profile.totalScans,
        totalConversions: profile.totalConversions,
        conversionRate: profile.totalScans > 0
          ? profile.totalConversions / profile.totalScans
          : 0,
        recentScans: scans.slice(-50),
      };
    },

    generateReferralUrl(userId: string, baseUrl: string): string {
      const profile = profiles.get(userId);
      if (!profile) throw new Error(`No referral profile for user ${userId}`);
      const url = new URL(baseUrl);
      url.searchParams.set('ref', profile.referralCode);
      return url.toString();
    },

    generateReferralQrData(userId: string, baseUrl: string): string {
      return this.generateReferralUrl(userId, baseUrl);
    },

    getAllProfiles(): readonly ReferralProfile[] {
      return [...profiles.values()];
    },
  };
}
