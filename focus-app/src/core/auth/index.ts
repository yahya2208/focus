import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase/client';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unauthenticated';

export interface AuthUser {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly role: 'guest' | 'user' | 'researcher' | 'admin' | 'super_admin';
  readonly isAnonymous: boolean;
  readonly createdAt: string;
}

export interface AuthState {
  readonly status: AuthStatus;
  readonly user: AuthUser | null;
  readonly error: string | null;
}

export type AuthStateChangeHandler = (state: AuthState) => void;

export interface AuthService {
  getState(): AuthState;
  onStateChange(handler: AuthStateChangeHandler): () => void;
  signInAsGuest(): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser>;
  signInWithMagicLink(email: string): Promise<void>;
  convertGuestToUser(email: string, password: string, displayName?: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
}

function mapUser(supaUser: User | null): AuthUser | null {
  if (!supaUser) return null;
  return {
    id: supaUser.id,
    email: supaUser.email ?? null,
    displayName: supaUser.user_metadata?.display_name ?? null,
    role: (supaUser.user_metadata?.role as AuthUser['role']) ?? 'guest',
    isAnonymous: supaUser.app_metadata?.provider === 'anonymous' || !supaUser.email,
    createdAt: supaUser.created_at,
  };
}


export function createAuthService(client?: SupabaseClient): AuthService {
  console.log('[AuthService] createAuthService called, client provided:', !!client);
  const supa = client ?? getSupabaseClient();
  console.log('[AuthService] Supabase client obtained, setting up auth state');
  let state: AuthState = { status: 'loading', user: null, error: null };
  const listeners = new Set<AuthStateChangeHandler>();

  function setState(patch: Partial<AuthState>) {
    state = { ...state, ...patch };
    console.log('[AuthService] State changed →', state.status, state.user?.id ?? 'no user');
    for (const handler of listeners) {
      try { handler(state); } catch (e) { console.error('[AuthService] Listener threw:', e); }
    }
  }

  console.log('[AuthService] Calling supa.auth.onAuthStateChange...');
  const { data } = supa.auth.onAuthStateChange((_event, session) => {
    console.log('[AuthService] onAuthStateChange fired, event has session:', !!session);
    if (session?.user) {
      const user = mapUser(session.user);
      setState({
        status: user?.isAnonymous ? 'anonymous' : 'authenticated',
        user,
        error: null,
      });
    } else {
      setState({ status: 'unauthenticated', user: null, error: null });
    }
  });
  console.log('[AuthService] onAuthStateChange registered, subscription:', !!data?.subscription);

  return {
    getState(): AuthState {
      return state;
    },

    onStateChange(handler: AuthStateChangeHandler): () => void {
      listeners.add(handler);
      return () => { listeners.delete(handler); };
    },

    async signInAsGuest(): Promise<AuthUser> {
      const { data, error } = await supa.auth.signInAnonymously();
      if (error) throw new Error(error.message);
      const user = mapUser(data.user);
      if (!user) throw new Error('Failed to create guest user');
      setState({ status: 'anonymous', user, error: null });
      return user;
    },

    async signInWithEmail(email: string, password: string): Promise<AuthUser> {
      const { data, error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const user = mapUser(data.user);
      if (!user) throw new Error('Failed to sign in');
      setState({ status: 'authenticated', user, error: null });
      return user;
    },

    async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser> {
      const { data, error } = await supa.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role: 'user' },
        },
      });
      if (error) throw new Error(error.message);
      const user = mapUser(data.user);
      if (!user) throw new Error('Failed to sign up');
      setState({ status: 'authenticated', user, error: null });
      return user;
    },

    async signInWithMagicLink(email: string): Promise<void> {
      const { error } = await supa.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw new Error(error.message);
    },

    async convertGuestToUser(email: string, password: string, displayName?: string): Promise<AuthUser> {
      const { data, error } = await supa.auth.updateUser({
        email,
        password,
        data: { display_name: displayName, role: 'user' },
      });
      if (error) throw new Error(error.message);
      const user = mapUser(data.user);
      if (!user) throw new Error('Failed to convert guest account');
      setState({ status: 'authenticated', user, error: null });
      return user;
    },

    async signOut(): Promise<void> {
      const { error } = await supa.auth.signOut();
      if (error) throw new Error(error.message);
      setState({ status: 'unauthenticated', user: null, error: null });
    },

    getCurrentUser(): AuthUser | null {
      return state.user;
    },
  };
}
