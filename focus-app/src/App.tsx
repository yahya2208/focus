import { useEffect } from 'react';
import { AppProvider, useAppState, useAppDispatch } from './store/navigation';
import { ThemeProvider } from './design-system/use-theme';
import { SettingsProvider } from './hooks/useSettings';
import { TranslationProvider, useTranslation } from './hooks/useTranslation';
import { AuthProvider } from './core/auth/AuthProvider';
import { PersistenceProvider } from './core/supabase/PersistenceProvider';
import { useThemeSync } from './hooks/useThemeSync';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { HomeScreen } from './screens/home/HomeScreen';
import { LibraryScreen } from './screens/library/LibraryScreen';
import { IntroScreen } from './screens/intro/IntroScreen';
import { CalibrationScreen } from './screens/calibration/CalibrationScreen';
import { CountdownScreen } from './screens/countdown/CountdownScreen';
import { GameScreen } from './screens/game/GameScreen';
import { GameIntroScreen } from './screens/game-intro/GameIntroScreen';
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
import { LoginScreen } from './screens/auth/LoginScreen';
import { AdminSetupScreen } from './screens/auth/AdminSetupScreen';
import { AccessDeniedScreen } from './screens/auth/AccessDeniedScreen';
import { PhoneServicesScreen } from './screens/phone-services/PhoneServicesScreen';
import { AchievementsScreen } from './screens/achievements/AchievementsScreen';
import type { ScreenName } from './store/navigation';
import { useThemeColors } from './hooks/useThemeColors';
import { parseDeepLinkFromCurrentUrl } from './core/qr/deeplink';
import { hasCampaign } from './core/qr/campaign';
import { getGlobalTelemetry } from './core/telemetry';
import { runSilentCalibration } from './core/calibration/silent';

const screens: Record<ScreenName, React.FC> = {
  home: HomeScreen,
  library: LibraryScreen,
  intro: IntroScreen,
  calibration: CalibrationScreen,
  countdown: CountdownScreen,
  game: GameScreen,
  'game-intro': GameIntroScreen,
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
  login: LoginScreen,
  'admin-setup': AdminSetupScreen,
  'access-denied': AccessDeniedScreen,
  'phone-services': PhoneServicesScreen,
  achievements: AchievementsScreen,
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

    const path = window.location.pathname;
    const search = window.location.search;
    const fullPath = path + search;

    console.log('[QR-ROUTE] InitialRoute fired', {
      pathname: path,
      search,
      fullPath,
      currentScreen,
    });

    const shortCodeMatch = fullPath.match(/\/c\/([a-zA-Z0-9]{6})/);
    if (shortCodeMatch) {
      const shortCode = shortCodeMatch[1]!;
      console.log('[QR-ROUTE] Short code found:', shortCode);

      import('./core/supabase/data-service').then(({ getDataService }) => {
        const ds = getDataService();
        ds.getCampaignByShortCode(shortCode).then((campaign) => {
          console.log('[QR-ROUTE] Campaign lookup result:', campaign ? { id: campaign.id, name: campaign.name, short_code: campaign.short_code } : null);
          if (campaign?.id) {
            console.log('[QR-ROUTE] Dispatching START_QR_FLOW with campaignId:', campaign.id);
            const telemetry = getGlobalTelemetry();
            telemetry.track('qr_scanned', { campaign_id: campaign.id });
            telemetry.flush();
            dispatch({ type: 'START_QR_FLOW', campaignId: campaign.id });
            import('./core/qr/campaign').then(({ createCampaignStore }) => {
              console.log('[QR-ROUTE] Calling recordScan for campaign:', campaign.id);
              createCampaignStore().recordScan(campaign.id!).then(() => {
                console.log('[QR-ROUTE] recordScan completed');
              }).catch((err: unknown) => {
                console.error('[QR-ROUTE] recordScan FAILED:', err);
              });
            });
          } else {
            console.error('[QR-ROUTE] Campaign not found for short_code:', shortCode);
          }
        }).catch((err: unknown) => {
          console.error('[QR-ROUTE] getCampaignByShortCode FAILED:', err);
        });
      }).catch((err: unknown) => {
        console.error('[QR-ROUTE] Failed to import data-service:', err);
      });
      return;
    }

    const deepLink = parseDeepLinkFromCurrentUrl();
    const telemetry = getGlobalTelemetry();
    const hasQrParams = hasCampaign(deepLink.campaign) || deepLink.referralCode;

    console.log('[QR-ROUTE] No short code found. Deep link:', { isValid: deepLink.isValid, hasQrParams, campaign: deepLink.campaign.campaign });

    if (deepLink.isValid && hasQrParams) {
      telemetry.track('qr_scanned', {
        source: deepLink.campaign.source,
        campaign: deepLink.campaign.campaign,
        referrer: deepLink.referralCode,
      });

      dispatch({ type: 'START_QR_FLOW' });
      return;
    }

    console.log('[QR-ROUTE] No QR params detected. Showing calibration or home.');
    runSilentCalibration().then((profile) => {
      if (profile) {
        dispatch({ type: 'SET_CALIBRATION', profile });
      }
    });
  }, [currentScreen, dispatch]);

  return null;
}

function ScreenRouter() {
  const { currentScreen } = useAppState();

  if (currentScreen === 'research') {
    return (
      <ProtectedRoute requiredRole="researcher">
        <ResearchConsole />
      </ProtectedRoute>
    );
  }

  const Screen = screens[currentScreen];
  return <Screen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <TranslationProvider>
            <AuthProvider>
              <AppProvider>
                <PersistenceProvider>
                  <HtmlSync />
                  <InitialRoute />
                  <ScreenRouter />
                </PersistenceProvider>
              </AppProvider>
            </AuthProvider>
          </TranslationProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
