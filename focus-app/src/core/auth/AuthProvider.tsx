import { useState, useEffect, createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { createAuthService, type AuthService, type AuthState, type AuthUser } from './index';

export type ResearchRole = 'super_admin' | 'research_admin' | 'analyst' | 'viewer' | 'none';

interface AuthContextValue {
  state: AuthState;
  service: AuthService;
  researchRole: ResearchRole;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STUB_SERVICE: AuthService = {
  getState: () => ({ status: 'unauthenticated', user: null, error: null }),
  onStateChange: () => () => {},
  signInAsGuest: async () => { throw new Error('Supabase not configured'); },
  signInWithEmail: async () => { throw new Error('Supabase not configured'); },
  signUpWithEmail: async () => { throw new Error('Supabase not configured'); },
  signInWithMagicLink: async () => { throw new Error('Supabase not configured'); },
  convertGuestToUser: async () => { throw new Error('Supabase not configured'); },
  signOut: async () => { throw new Error('Supabase not configured'); },
  getCurrentUser: () => null,
};

function mapToResearchRole(role: AuthUser['role']): ResearchRole {
  switch (role) {
    case 'super_admin': return 'super_admin';
    case 'admin': return 'research_admin';
    case 'researcher': return 'analyst';
    case 'user': return 'viewer';
    case 'guest': return 'none';
    default: return 'none';
  }
}

function logAuth(phase: string, detail?: string) {
  console.log(`[AuthProvider] ${phase}`, detail ?? '');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  logAuth('render start');
  const [service, setService] = useState<AuthService>(STUB_SERVICE);
  const [state, setState] = useState<AuthState>(STUB_SERVICE.getState);
  const initRef = useRef(false);

  useEffect(() => {
    logAuth('useEffect fired');
    if (initRef.current) {
      logAuth('already initialized, skipping');
      return;
    }
    initRef.current = true;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    logAuth('env check', `URL=${supabaseUrl ? 'SET (' + supabaseUrl.substring(0, 30) + '...)' : 'EMPTY'} KEY=${supabaseKey ? 'SET' : 'EMPTY'}`);

    try {
      logAuth('calling createAuthService()...');
      const s = createAuthService();
      logAuth('createAuthService() succeeded');
      setService(s);
      setState(s.getState());
      logAuth('subscribing to onStateChange...');
      const unsub = s.onStateChange((newState) => {
        logAuth('state change', `status=${newState.status} user=${newState.user?.id ?? 'null'}`);
        setState(newState);
      });
      logAuth('AuthProvider initialized successfully');
      return unsub;
    } catch (err) {
      logAuth('createAuthService() FAILED', err instanceof Error ? err.message : String(err));
      // Stay with stub — no crash
    }
  }, []);

  const researchRole = useMemo(
    () => state.user ? mapToResearchRole(state.user.role) : 'none',
    [state.user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ state, service, researchRole }),
    [state, service, researchRole],
  );

  logAuth('render end', `status=${state.status}`);
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth(requiredRole?: AuthUser['role']): AuthContextValue {
  const ctx = useAuth();
  if (requiredRole && ctx.state.user?.role !== requiredRole) {
    throw new Error(`Authentication required: ${requiredRole}`);
  }
  return ctx;
}
