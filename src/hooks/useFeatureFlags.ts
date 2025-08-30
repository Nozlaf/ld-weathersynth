import { useLDClient } from 'launchdarkly-react-client-sdk';

// Simplified feature flags hook for weather-synth
export const useFeatureFlags = () => {
  const ldClient = useLDClient();

  // Get flag value with fallback
  const getFlag = (flagKey: string, fallbackValue: any = null): any => {
    if (ldClient) {
      return ldClient.variation(flagKey, fallbackValue);
    }
    return fallbackValue;
  };

  // Specific flag getters with typed returns
  const getTheme = (): string => getFlag('default-theme', 'dark-synth');
  const getTemperatureUnit = (): string => getFlag('default-temperature', 'c');
  const getDistanceUnit = (): string => getFlag('default-distance', 'm');
  const getWeatherRefreshInterval = (): number => getFlag('weather-refresh-interval', 5);
  const getAnimationsEnabled = (): boolean => getFlag('enable-animations', true);
  const getShowExtraWeatherInfo = (): boolean => getFlag('show-extra-weather-info', true);
  const getDebugMode = (): boolean => getFlag('debug-mode', false);
  const getShowMoonPhase = (): boolean => getFlag('show-moon-phase', true);
  const getSakuraThemeEnabled = (): boolean => getFlag('enable-sakura-theme', true);
  const getWeatherApiProvider = (): any => getFlag('weather-api-provider', '{"primary": "openweathermap", "fallback": "open-meteo"}');

  return {
    // Generic flag getter
    getFlag,
    
    // Specific typed getters
    getTheme,
    getTemperatureUnit,
    getDistanceUnit,
    getWeatherRefreshInterval,
    getAnimationsEnabled,
    getShowExtraWeatherInfo,
    getDebugMode,
    getShowMoonPhase,
    getSakuraThemeEnabled,
    getWeatherApiProvider,
    
    // LaunchDarkly client status
    isLDConnected: !!ldClient,
    ldClient
  };
};

export default useFeatureFlags;

