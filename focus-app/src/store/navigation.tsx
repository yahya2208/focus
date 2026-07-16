import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { CalibrationProfile } from '../core/calibration';

export type ScreenName =
  | 'home'
  | 'library'
  | 'intro'
  | 'calibration'
  | 'countdown'
  | 'game'
  | 'results'
  | 'history'
  | 'settings'
  | 'about';

export interface AppState {
  screen: ScreenName;
  selectedGame: string | null;
  calibrationProfile: CalibrationProfile | null;
  sessionResults: unknown | null;
}

type NavigationAction =
  | { type: 'NAVIGATE'; screen: ScreenName }
  | { type: 'SELECT_GAME'; gameMode: string }
  | { type: 'SET_CALIBRATION'; profile: CalibrationProfile }
  | { type: 'SET_RESULTS'; results: unknown }
  | { type: 'RESET' };

const initialState: AppState = {
  screen: 'home',
  selectedGame: null,
  calibrationProfile: null,
  sessionResults: null,
};

function navigationReducer(state: AppState, action: NavigationAction): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen };
    case 'SELECT_GAME':
      return { ...state, selectedGame: action.gameMode };
    case 'SET_CALIBRATION':
      return { ...state, calibrationProfile: action.profile };
    case 'SET_RESULTS':
      return { ...state, sessionResults: action.results };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface NavigationContextValue {
  state: AppState;
  dispatch: React.Dispatch<NavigationAction>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);
  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppDispatch(): React.Dispatch<NavigationAction> {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx.dispatch;
}

export function useAppState(): AppState {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx.state;
}
