import { AppProvider, useAppState } from './store/navigation';
import { ThemeProvider } from './design-system/use-theme';
import { SettingsProvider } from './hooks/useSettings';
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
import { ResearchConsole } from './research-console/ResearchConsole';
import { CoachScreen } from './screens/coach/CoachScreen';
import type { ScreenName } from './store/navigation';

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
  research: ResearchConsole,
  coach: CoachScreen,
};

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
          <AppProvider>
            <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
              <ScreenRouter />
            </div>
          </AppProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
