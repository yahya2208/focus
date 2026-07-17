export type TelemetryEventType =
  | 'app_opened'
  | 'calibration_started'
  | 'calibration_completed'
  | 'game_started'
  | 'game_completed'
  | 'game_abandoned'
  | 'results_viewed'
  | 'session_saved'
  | 'session_synced'
  | 'auth_guest_created'
  | 'auth_registered'
  | 'auth_converted'
  | 'settings_changed'
  | 'qr_scanned'
  | 'error_occurred';

export interface TelemetryEvent {
  readonly type: TelemetryEventType;
  readonly properties: Record<string, unknown>;
  readonly timestamp: number;
  readonly userId: string | null;
  readonly sessionId: string | null;
  readonly deviceId: string | null;
}

export interface TelemetryConfig {
  readonly enabled: boolean;
  readonly flushIntervalMs: number;
  readonly batchSize: number;
}

const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: true,
  flushIntervalMs: 30000,
  batchSize: 20,
};

export interface TelemetryService {
  track(type: TelemetryEventType, properties?: Record<string, unknown>): void;
  flush(): Promise<void>;
  getQueue(): readonly TelemetryEvent[];
  setConfig(config: Partial<TelemetryConfig>): void;
  getConfig(): TelemetryConfig;
  setContext(userId: string | null, sessionId: string | null, deviceId: string | null): void;
}

export function createTelemetryService(
  sendFn?: (events: readonly TelemetryEvent[]) => Promise<void>,
  config: Partial<TelemetryConfig> = {},
): TelemetryService {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let queue: TelemetryEvent[] = [];
  let context = { userId: null as string | null, sessionId: null as string | null, deviceId: null as string | null };

  async function flushInternal(): Promise<void> {
    if (queue.length === 0) return;
    const batch = [...queue];
    queue = [];
    if (sendFn) {
      try {
        await sendFn(batch);
      } catch {
        queue = [...batch, ...queue];
      }
    }
  }

  return {
    track(type: TelemetryEventType, properties: Record<string, unknown> = {}): void {
      if (!mergedConfig.enabled) return;
      const event: TelemetryEvent = {
        type,
        properties,
        timestamp: Date.now(),
        userId: context.userId,
        sessionId: context.sessionId,
        deviceId: context.deviceId,
      };
      queue.push(event);
      if (queue.length >= mergedConfig.batchSize) {
        flushInternal();
      }
    },

    async flush(): Promise<void> {
      await flushInternal();
    },

    getQueue(): readonly TelemetryEvent[] {
      return [...queue];
    },

    setConfig(config: Partial<TelemetryConfig>): void {
      Object.assign(mergedConfig, config);
    },

    getConfig(): TelemetryConfig {
      return { ...mergedConfig };
    },

    setContext(userId: string | null, sessionId: string | null, deviceId: string | null): void {
      context = { userId, sessionId, deviceId };
    },
  };
}

let globalTelemetry: TelemetryService | null = null;

export function getGlobalTelemetry(): TelemetryService {
  if (!globalTelemetry) {
    globalTelemetry = createTelemetryService();
  }
  return globalTelemetry;
}

export function resetGlobalTelemetry(): void {
  if (globalTelemetry) {
    globalTelemetry.flush();
  }
  globalTelemetry = null;
}
