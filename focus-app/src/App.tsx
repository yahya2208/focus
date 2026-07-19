import { useEffect } from 'react';
import { AppProvider, useAppState, useAppDispatch } from './store/navigation';
import { ThemeProvider } from './design-system/use-theme';
import { SettingsProvider } from './hooks/useSettings';
import { TranslationProvider, useTranslation } from './hooks/useTranslation';
import { useThemeSync } from './hooks/useThemeSync';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { HomeScreen } from './screens/home/HomeScreen';
import { LibraryScreen } from './screens/library/LibraryScreen';
import { IntroScreen } from './screens/intro/IntroScreen';
import { CalibrationScreen } from './screens/calibration/CalibrationScreen';
import { CountdownScreen } from './screens/countdown/CountdownScreen';
import { GameScreen } from './screens/game/GameScreen';
import { ResultsScreen } from './screens/results/ResultsScreen';
import { HistoryScreen } from './screens/history/HistoryScreen';
import { SettingsScreen } from './screens/settings/SettingsScreen';
import { AboutScreen } from './screens/about/AboutScreen';
import { LandingScreen } from './screens/landing/LandingScreen';
import { ShareScreen } from './screens/share/ShareScreen';
import { RegisterScreen } from './screens/register/RegisterScreen';
import { ConsentScreen } from './screens/consent/ConsentScreen';
import { PreGameMessageScreen } from './screens/message/PreGameMessageScreen';
import { ResearchConsole } from './research-console/ResearchConsole';
import { CoachScreen } from './screens/coach/CoachScreen';
import type { ScreenName } from './store/navigation';
import { useThemeColors } from './hooks/useThemeColors';
import { parseDeepLinkFromCurrentUrl } from './core/qr/deeplink';

const screens: Record<ScreenName, React.FC> = {
  home: HomeScreen,
  library: LibraryScreen,
  intro: IntroScreen,
  calibration: CalibrationScreen,
  countdown: CountdownScreen,
  game: GameScreen,
  results: ResultsScreen,
  history: HistoryScreen,
  settings: SettingsScreen,
  about: AboutScreen,
  landing: LandingScreen,
  share: ShareScreen,
  register: RegisterScreen,
  consent: ConsentScreen,
  message: PreGameMessageScreen,
  research: ResearchConsole,
  coach: CoachScreen,
};

function HtmlSync() {
  const { locale, dir } = useTranslation();
  const colors = useThemeColors();
  useThemeSync();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.bg);
  }, [locale, dir, colors.bg]);

  return null;
}

function InitialRoute() {
  const dispatch = useAppDispatch();
  const { currentScreen } = useAppState();

  useEffect(() => {
    if (currentScreen !== 'home') return;
    const deepLink = parseDeepLinkFromCurrentUrl();
    if (deepLink) {
      dispatch({ type: 'NAVIGATE', screen: 'landing' });
    }
  }, [currentScreen, dispatch]);

  return null;
}

function ScreenRouter() {
  const { currentScreen } = useAppState();
  const Screen = screens[currentScreen];
  return <Screen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <TranslationProvider>
            <AppProvider>
              <HtmlSync />
              <InitialRoute />
              <ScreenRouter />
            </AppProvider>
          </TranslationProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
