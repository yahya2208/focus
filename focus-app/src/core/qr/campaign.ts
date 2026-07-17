export interface CampaignParams {
  readonly campaign: string | null;
  readonly location: string | null;
  readonly school: string | null;
  readonly company: string | null;
  readonly event: string | null;
  readonly version: string | null;
  readonly language: string | null;
  readonly source: string | null;
  readonly referrer: string | null;
}

const CAMPAIGN_KEYS: (keyof CampaignParams)[] = [
  'campaign', 'location', 'school', 'company', 'event', 'version', 'language', 'source', 'referrer',
];

export function parseCampaignParams(url: string): CampaignParams {
  let search: URLSearchParams;
  try {
    const parsed = new URL(url);
    search = parsed.searchParams;
  } catch {
    search = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  }

  const params: Record<string, string | null> = {};
  for (const key of CAMPAIGN_KEYS) {
    params[key] = search.get(key) ?? null;
  }
  return params as unknown as CampaignParams;
}

export function parseCampaignFromQueryString(queryString: string): CampaignParams {
  const search = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const params: Record<string, string | null> = {};
  for (const key of CAMPAIGN_KEYS) {
    params[key] = search.get(key) ?? null;
  }
  return params as unknown as CampaignParams;
}

export function serializeCampaignParams(params: CampaignParams): string {
  const search = new URLSearchParams();
  for (const key of CAMPAIGN_KEYS) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  return search.toString();
}

export function hasCampaign(params: CampaignParams): boolean {
  return params.campaign !== null && params.campaign.length > 0;
}

export interface CampaignRecord {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly baseUrl: string;
  readonly params: CampaignParams;
  readonly scanCount: number;
  readonly conversionCount: number;
  readonly active: boolean;
}

export interface CampaignStore {
  create(name: string, baseUrl: string, params?: Partial<CampaignParams>): CampaignRecord;
  get(id: string): CampaignRecord | null;
  getAll(): readonly CampaignRecord[];
  recordScan(id: string): void;
  recordConversion(id: string): void;
  deactivate(id: string): void;
  getStats(id: string): CampaignStats | null;
}

export interface CampaignStats {
  readonly id: string;
  readonly scanCount: number;
  readonly conversionCount: number;
  readonly conversionRate: number;
}

let campaignCounter = 0;

export function createCampaignStore(): CampaignStore {
  const campaigns = new Map<string, CampaignRecord>();

  return {
    create(name: string, baseUrl: string, params: Partial<CampaignParams> = {}): CampaignRecord {
      const id = `camp_${Date.now().toString(36)}_${(campaignCounter++).toString(36)}`;
      const record: CampaignRecord = {
        id,
        name,
        createdAt: Date.now(),
        baseUrl,
        params: {
          campaign: params.campaign ?? name.toLowerCase().replace(/\s+/g, '-'),
          location: params.location ?? null,
          school: params.school ?? null,
          company: params.company ?? null,
          event: params.event ?? null,
          version: params.version ?? null,
          language: params.language ?? null,
          source: params.source ?? null,
          referrer: params.referrer ?? null,
        },
        scanCount: 0,
        conversionCount: 0,
        active: true,
      };
      campaigns.set(id, record);
      return record;
    },

    get(id: string): CampaignRecord | null {
      return campaigns.get(id) ?? null;
    },

    getAll(): readonly CampaignRecord[] {
      return [...campaigns.values()];
    },

    recordScan(id: string): void {
      const c = campaigns.get(id);
      if (c) {
        campaigns.set(id, { ...c, scanCount: c.scanCount + 1 });
      }
    },

    recordConversion(id: string): void {
      const c = campaigns.get(id);
      if (c) {
        campaigns.set(id, { ...c, conversionCount: c.conversionCount + 1 });
      }
    },

    deactivate(id: string): void {
      const c = campaigns.get(id);
      if (c) {
        campaigns.set(id, { ...c, active: false });
      }
    },

    getStats(id: string): CampaignStats | null {
      const c = campaigns.get(id);
      if (!c) return null;
      return {
        id: c.id,
        scanCount: c.scanCount,
        conversionCount: c.conversionCount,
        conversionRate: c.scanCount > 0 ? c.conversionCount / c.scanCount : 0,
      };
    },
  };
}
