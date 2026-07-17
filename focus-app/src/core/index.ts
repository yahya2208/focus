export { CALIBRATION, INPUT_LAG, REACTION, CONSISTENCY, FATIGUE, SCORING, PLATFORM, VERSION, VALIDATION_STATUS } from './scientific/constants';

export { createDefaultCalibrationProfile, type CalibrationProfile, type CalibrationResult } from './calibration';

export { correctReactionTime, type MeasurementResult, type GameEvent, type StimulusEvent, type InputEvent, type RoundCompleteEvent, type SessionCompleteEvent } from './measurement';

export { processReactions, type ReactionResult } from './engine/reaction';

export { analyzeConsistency, type ConsistencyResult } from './engine/consistency';

export { detectFatigue, type FatigueResult } from './engine/fatigue';

export { calculateFocusScore, type ScoringInput, type ScoringResult } from './engine/scoring';

export type { SessionRepository, SessionFilter, SessionSort, SessionPage } from './repository';
export { createMemorySessionRepository, createLocalStorageSessionRepository } from './repository';

export { getSettings, updateSettings, subscribeSettings, type AppSettings } from './config/settings';

export {
  createSession,
  transitionSession,
  updateSessionMeasurements,
  canTransition,
  isSessionComplete,
  getSessionDuration,
  createSessionId,
  type Session,
  type SessionStatus,
  type SessionDraft,
  type SessionMeasurements,
  type SessionScientificResults,
  type SessionMetadata,
} from './session';

export {
  collectDeviceProfile,
  resetDeviceProfile,
  createDeviceProfileForTest,
  type DeviceProfile,
} from './device';

export {
  createEventPublisher,
  getGlobalEventPublisher,
  resetGlobalEventPublisher,
  type EventPublisher,
  type DomainEvent,
  type EventType,
  type EventHandler,
} from './events';

export {
  getDefaultPolicy,
  isCalibrationValid,
  createCacheEntry,
  createCalibrationCache,
  createInMemoryCalibrationCache,
  type CalibrationCacheEntry,
  type CalibrationPolicy,
  type CalibrationCache,
} from './calibration-cache';

export {
  createHistoryService,
  type HistoryService,
  type HistoryStats,
  type TrendPoint,
  type TrendPeriod,
  type HistorySearchResult,
} from './history';
