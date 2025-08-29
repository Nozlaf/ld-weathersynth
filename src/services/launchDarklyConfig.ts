import { LDContext } from 'launchdarkly-react-client-sdk';

// Declare process for TypeScript
declare const process: {
  env: {
    REACT_APP_LAUNCHDARKLY_CLIENT_ID?: string;
    REACT_APP_VERSION?: string;
    REACT_APP_BUILD_TIME?: string;
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};

export const getSDKKey = (): string => {
  const sdkKey = process.env.REACT_APP_LAUNCHDARKLY_CLIENT_ID;
  if (!sdkKey) {
    // This warning should always show regardless of debug mode since it's a configuration issue
    console.warn('LaunchDarkly SDK key not found. Using demo key.');
    return 'demo-key-placeholder';
  }
  return sdkKey;
};

export interface LocationContext {
  city: string;
  country: string;
  fullLocation: string;
}

// Utility function to detect night time from weather icon code
export const isNightTimeFromIcon = (iconCode: string): boolean => {
  // OpenWeatherMap icon codes end with 'n' for night, 'd' for day
  return iconCode.endsWith('n');
};

// Generate a persistent random GUID for anonymous users
const generateGuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

// Get or create a persistent user ID
const getPersistentUserId = (): string => {
  const STORAGE_KEY = 'ld_user_id';
  
  try {
    let userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = generateGuid();
      localStorage.setItem(STORAGE_KEY, userId);
    }
    return userId;
  } catch (error) {
    // Fallback if localStorage is not available - this warning should always show
    console.warn('localStorage not available, using session-based ID');
    let userId = sessionStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = generateGuid();
      sessionStorage.setItem(STORAGE_KEY, userId);
    }
    return userId;
  }
};

// Following Rule 2: Context creation utility
export const createLDContext = (userId?: string, locationContext?: LocationContext, nightTime?: boolean): LDContext => {
  const context: LDContext = {
    kind: 'user',
    key: userId || getPersistentUserId(),
    // Following Rule 3: Include build version and session attributes
    custom: {
      buildVersion: process.env.REACT_APP_VERSION || '1.0.0',
      buildTime: process.env.REACT_APP_BUILD_TIME || 'unknown',
      sessionId: sessionStorage.getItem('sessionId') || Math.random().toString(36),
      environment: process.env.NODE_ENV || 'development',
      // Always include night_time, default to false if not determined
      night_time: nightTime !== undefined ? nightTime : false,
    }
  };

  // Add location context if available
  if (locationContext) {
    context.custom = {
      ...context.custom,
      city: locationContext.city,
      country: locationContext.country,
      location: locationContext.fullLocation,
    };
  }

  return context;
};

// Parse location string from weather API (e.g., "New York, US" or "London, GB")
export const parseLocationString = (locationString: string): LocationContext => {
  const parts = locationString.split(', ');
  const city = parts[0] || 'Unknown';
  const country = parts[1] || 'Unknown';
  
  return {
    city: city.trim(),
    country: country.trim(),
    fullLocation: locationString.trim(),
  };
};

// Re-identify with LaunchDarkly when location is available
export const reIdentifyWithLocation = (ldClient: any, locationString: string, weatherIcon?: string): void => {
  try {
    const locationContext = parseLocationString(locationString);
    const currentUserId = getPersistentUserId();
    
    // Detect night time from weather icon if available, default to false if no icon
    const nightTime = weatherIcon ? isNightTimeFromIcon(weatherIcon) : false;
    
    const newContext = createLDContext(currentUserId, locationContext, nightTime);
    
    console.log('🔍 DEBUG: Re-identifying with LaunchDarkly with location and night time context:', {
      city: locationContext.city,
      country: locationContext.country,
      fullLocation: locationContext.fullLocation,
      nightTime: nightTime,
      weatherIcon: weatherIcon
    });
    
    // Re-identify the user with the new context including location and night time
    ldClient.identify(newContext).then(() => {
      console.log('🔍 DEBUG: LaunchDarkly re-identification with location and night time successful');
    }).catch((error: any) => {
      console.error('🔍 DEBUG: LaunchDarkly re-identification failed:', error);
    });
  } catch (error) {
    console.error('🔍 DEBUG: Error in reIdentifyWithLocation:', error);
  }
};

// Note: Cleanup and client access is handled by withLDProvider in React apps
// Manual shutdown not needed when using React SDK's withLDProvider pattern 