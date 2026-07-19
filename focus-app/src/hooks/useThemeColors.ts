import { useTheme } from '../design-system/use-theme';

interface ThemeColors {
  bg: string;
  bgCard: string;
  bgInput: string;
  bgHover: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentLight: string;
  success: string;
  successBg: string;
  successText: string;
  danger: string;
  dangerBg: string;
  dangerText: string;
  warning: string;
  warningBg: string;
  warningText: string;
  info: string;
  infoBg: string;
  infoText: string;
  progressBg: string;
  shadow: string;
}

const darkColors: ThemeColors = {
  bg: '#0a0a0f',
  bgCard: '#12121a',
  bgInput: '#1e1e2e',
  bgHover: '#252535',
  border: '#1e1e2e',
  borderLight: '#333',
  text: '#f0f0f0',
  textSecondary: '#aaa',
  textMuted: '#888',
  textFaint: '#666',
  accent: '#6366f1',
  accentLight: '#818cf8',
  success: '#22c55e',
  successBg: '#065f46',
  successText: '#6ee7b7',
  danger: '#ef4444',
  dangerBg: '#7f1d1d',
  dangerText: '#fca5a5',
  warning: '#fbbf24',
  warningBg: '#78350f',
  warningText: '#fbbf24',
  info: '#60a5fa',
  infoBg: '#1e3a5f',
  infoText: '#93c5fd',
  progressBg: '#1e1e2e',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const lightColors: ThemeColors = {
  bg: '#f5f5f7',
  bgCard: '#ffffff',
  bgInput: '#f0f0f2',
  bgHover: '#e8e8ec',
  border: '#e0e0e4',
  borderLight: '#d0d0d4',
  text: '#1a1a2e',
  textSecondary: '#555',
  textMuted: '#777',
  textFaint: '#999',
  accent: '#6366f1',
  accentLight: '#818cf8',
  success: '#16a34a',
  successBg: '#dcfce7',
  successText: '#166534',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerText: '#991b1b',
  warning: '#d97706',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  info: '#2563eb',
  infoBg: '#dbeafe',
  infoText: '#1e40af',
  progressBg: '#e5e7eb',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export function useThemeColors(): ThemeColors {
  const { theme } = useTheme();
  return theme === 'light' ? lightColors : darkColors;
}
