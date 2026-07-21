import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppState } from '../../store/navigation';
import { getSupabaseClient } from './client';

export function PersistenceProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { sessions } = useAppState();
  const lastSavedCountRef = useRef(0);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const saveSessionToSupabase = useCallback(async (session: {
    id: string;
    gameMode: string;
    timestamp: number;
    rawRts: readonly number[];
    correctedRts: readonly number[];
  }) => {
    try {
      const client = getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      const userId = user?.id ?? 'anonymous';

      const mean = session.correctedRts.length > 0
        ? session.correctedRts.reduce((a, b) => a + b, 0) / session.correctedRts.length
        : 0;
      
      const sorted = [...session.correctedRts].sort((a, b) => a - b);
      const median = session.correctedRts.length > 0
        ? session.correctedRts.length % 2 === 0
          ? ((sorted[session.correctedRts.length / 2 - 1] ?? 0) + (sorted[session.correctedRts.length / 2] ?? 0)) / 2
          : (sorted[Math.floor(session.correctedRts.length / 2)] ?? 0)
        : 0;

      const variance = session.correctedRts.length > 0
        ? session.correctedRts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / session.correctedRts.length
        : 0;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0;
      const consistencyScore = Math.max(0, 100 - cv * 100);

      const midpoint = Math.floor(session.correctedRts.length / 2);
      const firstHalf = session.correctedRts.slice(0, midpoint);
      const secondHalf = session.correctedRts.slice(midpoint);
      const firstMean = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : mean;
      const secondMean = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : mean;
      const fatigueIndex = firstMean > 0 ? (secondMean - firstMean) / firstMean : 0;
      const fatigueScore = Math.min(100, Math.max(0, fatigueIndex * 100));

      const speedScore = Math.max(0, 100 - (mean - 200) / 5);
      const focusScore = (speedScore * 0.4 + consistencyScore * 0.4 + (100 - fatigueScore) * 0.2);

      const grade = focusScore >= 90 ? 'A+' : focusScore >= 80 ? 'A' : focusScore >= 70 ? 'B'
        : focusScore >= 60 ? 'C' : focusScore >= 50 ? 'D' : 'F';

      const consistencyRating = consistencyScore >= 80 ? 'excellent' : consistencyScore >= 60 ? 'good'
        : consistencyScore >= 40 ? 'average' : 'poor';

      const { error } = await client.from('sessions').upsert({
        id: session.id,
        user_id: userId,
        device_id: 'web-browser',
        calibration_id: 'default',
        plugin_id: session.gameMode,
        status: 'completed',
        measurements: {
          raw_rts: [...session.rawRts],
          corrected_rts: [...session.correctedRts],
          total_rounds: 7,
          valid_rounds: session.correctedRts.filter(rt => rt >= 150).length,
          outlier_count: 0,
        },
        scientific_results: {
          mean_corrected_ms: mean,
          median_corrected_ms: median,
          consistency_score: consistencyScore,
          consistency_rating: consistencyRating,
          fatigue_index: fatigueIndex,
          fatigue_score: fatigueScore,
          focus_score: focusScore,
          grade,
        },
        metadata: { version: '2.0', source: 'web-app' },
        created_at: new Date(session.timestamp).toISOString(),
        updated_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        version: '2.0',
      });

      if (error) {
        console.error('[Persistence] Supabase save failed:', error.message);
        // Store in localStorage as fallback
        const fallbackKey = 'focus_pending_sessions';
        const existing = JSON.parse(localStorage.getItem(fallbackKey) ?? '[]');
        existing.push({ ...session, userId, savedAt: Date.now() });
        localStorage.setItem(fallbackKey, JSON.stringify(existing.slice(-50))); // Keep last 50
      } else {
        console.log('[Persistence] Session saved to Supabase:', session.id);
      }
    } catch (error) {
      console.error('[Persistence] Error:', error);
    }
  }, []);

  // Intercept SAVE_SESSION by watching sessions array length changes
  useEffect(() => {
    if (sessions.length > lastSavedCountRef.current && sessions.length > 0) {
      const newSession = sessions[sessions.length - 1];
      if (newSession) {
        saveSessionToSupabase(newSession);
      }
    }
    lastSavedCountRef.current = sessions.length;
  }, [sessions, saveSessionToSupabase]);

  // Sync pending localStorage sessions to Supabase on mount
  useEffect(() => {
    const syncPending = async () => {
      try {
        const pendingKey = 'focus_pending_sessions';
        const pending = JSON.parse(localStorage.getItem(pendingKey) ?? '[]');
        if (pending.length === 0) return;

        const client = getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;

        for (const session of pending) {
          await saveSessionToSupabase(session);
        }
        localStorage.removeItem(pendingKey);
        console.log('[Persistence] Synced', pending.length, 'pending sessions');
      } catch (error) {
        console.error('[Persistence] Failed to sync pending sessions:', error);
      }
    };

    // Delay sync to avoid blocking initial render
    const timer = setTimeout(syncPending, 2000);
    return () => clearTimeout(timer);
  }, [saveSessionToSupabase]);

  return <>{children}</>;
}
